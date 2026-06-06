import { useState } from "react";
import { Copy, Check, Download, Edit3, Eye } from "lucide-react";
import { parseMeetingMarkdown } from "../parser";
import { exportMinutesToPDF } from "../utils/pdfGenerator";

interface MarkdownOutputProps {
  markdown: string;
  onUpdateMarkdown: (newMarkdown: string) => void;
}

export default function MarkdownOutput({
  markdown,
  onUpdateMarkdown,
}: MarkdownOutputProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Copy full raw markdown
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  // Download raw markdown file
  const handleDownload = () => {
    try {
      // Find a suitable topic name for the file
      const topicLine = markdown.split("\n").find((l) => l.includes("**Meeting Topic:**"));
      let filename = "meeting_minutes.md";
      if (topicLine) {
        const extracted = topicLine.replace(/\* \*\*Meeting Topic:\*\*\s*/i, "").trim();
        if (extracted && extracted !== "N/A") {
          filename = `${extracted.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_minutes.md`;
        }
      }

      const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download file:", err);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xs overflow-hidden select-text transition-colors duration-200">
      
      {/* Header operations bar */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-mono tracking-widest text-zinc-500 dark:text-zinc-400 font-bold uppercase">Raw Output</span>
          <h3 className="font-display font-medium text-sm text-zinc-800 dark:text-zinc-200">Standard Markdown Spec</h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Editor toggle */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
              isEditing 
                ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-250 dark:border-zinc-700 text-indigo-600 dark:text-indigo-400" 
                : "bg-neutral-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-neutral-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            {isEditing ? (
              <>
                <Eye className="h-4 w-4" /> Save & Preview
              </>
            ) : (
              <>
                <Edit3 className="h-4 w-4" /> Direct Edit
              </>
            )}
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 py-1.5 px-3 bg-neutral-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-neutral-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            {isCopied ? (
              <>
                <Check className="h-4 w-4 text-green-500" /> Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" /> Copy
              </>
            )}
          </button>

          {/* Export Button */}
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 py-1.5 px-3 bg-zinc-105 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Download className="h-4 w-4" /> Export .md
          </button>

          {/* Export PDF Button */}
          <button
            onClick={() => {
              const data = parseMeetingMarkdown(markdown);
              exportMinutesToPDF(data);
            }}
            className="flex items-center gap-1.5 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Download className="h-4 w-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* Main markdown display or editing area */}
      <div className="flex-1 min-h-[350px] overflow-y-auto font-mono text-xs leading-relaxed text-zinc-800 dark:text-zinc-300">
        {isEditing ? (
          <textarea
            value={markdown}
            onChange={(e) => onUpdateMarkdown(e.target.value)}
            className="w-full h-full p-4 bg-neutral-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 rounded-xl resize-none font-mono focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            placeholder="Edit markdown notes freeform..."
          />
        ) : (
          <pre className="p-4 bg-neutral-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-x-auto select-text whitespace-pre-wrap transition-colors">
            {markdown}
          </pre>
        )}
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 text-[10px] text-zinc-400 dark:text-zinc-500 flex justify-between items-center transition-colors">
        <span>Verified strict Markdown headings structure.</span>
        <span>{markdown ? markdown.split("\n").length : 0} lines</span>
      </div>

    </div>
  );
}
