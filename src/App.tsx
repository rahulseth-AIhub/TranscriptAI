import { useState, useEffect } from "react";
import SidebarInputs from "./components/SidebarInputs";
import DashboardOutput from "./components/DashboardOutput";
import MarkdownOutput from "./components/MarkdownOutput";
import { parseMeetingMarkdown, ParsedMinutes, ActionItem } from "./parser";
import { 
  Sparkles, 
  BrainCircuit,
  Flame,
  CornerRightDown,
  CheckSquare,
  Layout,
  Code
} from "lucide-react";
import ActiveMeetingRoom from "./components/ActiveMeetingRoom";
import { CalendarEvent } from "./firebase_client";

export default function App() {
  const [markdownOutput, setMarkdownOutput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<"interactive" | "raw">("interactive");
  const [activeMeeting, setActiveMeeting] = useState<CalendarEvent | null>(null);

  // Load state from localStorage if exists
  useEffect(() => {
    const savedMarkdown = localStorage.getItem("transcript_ai_markdown");
    if (savedMarkdown) {
      setMarkdownOutput(savedMarkdown);
    }
  }, []);

  // Update localStorage when markdown changes
  const saveMarkdown = (md: string) => {
    setMarkdownOutput(md);
    if (md) {
      localStorage.setItem("transcript_ai_markdown", md);
    } else {
      localStorage.removeItem("transcript_ai_markdown");
    }
  };

  // Compute parsed minutes representation on the fly from the active markdown
  const parsedData: ParsedMinutes = parseMeetingMarkdown(markdownOutput);

  // Sync state modifications from checklist or added actions back into the markdown text representation
  const handleUpdateActionItems = (newActions: ActionItem[]) => {
    // Reconstruct the Checklist section text starting under ## ✅ Action Items & Ownership
    const lines = markdownOutput.split("\n");
    let startIndex = -1;
    let endIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("## ✅ Action Items & Ownership")) {
        startIndex = i + 1;
        break;
      }
    }

    if (startIndex !== -1) {
      // Find where next main section starts or end of lines
      for (let j = startIndex; j < lines.length; j++) {
        if (lines[j].startsWith("## ")) {
          endIndex = j;
          break;
        }
      }
      if (endIndex === -1) endIndex = lines.length;

      // Build new action list text block
      const replacementLines = newActions.map(
        (item) => `* [${item.completed ? "x" : " "}] **${item.owner}**: ${item.task}`
      );

      // Replace actions
      const beforeStr = lines.slice(0, startIndex).join("\n");
      const afterStr = lines.slice(endIndex).join("\n");
      const updatedMarkdown = `${beforeStr}\n${replacementLines.join("\n")}\n\n${afterStr}`.replace(/\n\n\n+/g, "\n\n");
      
      saveMarkdown(updatedMarkdown);
    }
  };

  // Submit Text Transcript API
  const handleAnalyzeText = async (text: string, titleHint: string) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const resp = await fetch("/api/summarize-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, titleSuggestion: titleHint }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status: ${resp.status}`);
      }

      const data = await resp.json();
      if (data.markdown) {
        saveMarkdown(data.markdown);
        setActiveViewMode("interactive");
      } else {
        throw new Error("Empty response returned from summarizing engine.");
      }
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || "Failed to process text transcript.");
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Audio Transcript API
  const handleAnalyzeAudio = async (
    base64Data: string,
    mimeType: string,
    filename: string,
    titleHint: string
  ) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const resp = await fetch("/api/summarize-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Data, mimeType, filename, titleSuggestion: titleHint }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status: ${resp.status}`);
      }

      const data = await resp.json();
      if (data.markdown) {
        saveMarkdown(data.markdown);
        setActiveViewMode("interactive");
      } else {
        throw new Error("Empty response returned from audio processing engine.");
      }
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || "Failed to analyze meeting audio.");
    } finally {
      setIsLoading(false);
    }
  };

  // Clear current document session
  const handleClearSession = () => {
    saveMarkdown("");
    setApiError(null);
  };

  const renderRightColumn = () => {
    if (activeMeeting) {
      return (
        <ActiveMeetingRoom
          event={activeMeeting}
          onConclude={async (transcript, title) => {
            await handleAnalyzeText(transcript, title);
            setActiveMeeting(null);
          }}
          onCancel={() => setActiveMeeting(null)}
          isLoading={isLoading}
        />
      );
    }

    return (
      <div className="flex flex-col gap-5">
        {/* Header layout toggles */}
        {markdownOutput && (
          <div className="flex justify-between items-center bg-white border border-zinc-150 rounded-xl p-3 shadow-xs">
            <span className="text-xs font-semibold text-zinc-500">Output Interface Views:</span>
            <div className="flex gap-1 bg-zinc-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveViewMode("interactive")}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-bold transition-all ${
                  activeViewMode === "interactive"
                    ? "bg-white text-zinc-950 shadow-xs"
                    : "text-zinc-655 hover:text-zinc-900"
                }`}
              >
                <Layout className="h-3.5 w-3.5 text-indigo-500" />
                Interactive Dashboard
              </button>
              <button
                onClick={() => setActiveViewMode("raw")}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-bold transition-all ${
                  activeViewMode === "raw"
                    ? "bg-white text-zinc-950 shadow-xs"
                    : "text-zinc-655 hover:text-zinc-900"
                }`}
              >
                <Code className="h-3.5 w-3.5 text-indigo-500" />
                Structured Markdown
              </button>
            </div>
          </div>
        )}

        {/* Core content switch */}
        {markdownOutput ? (
          activeViewMode === "interactive" ? (
            <div className="bg-white border border-zinc-150 rounded-2xl p-6 shadow-xs">
              <DashboardOutput
                data={parsedData}
                onUpdateActionItems={handleUpdateActionItems}
                isLoading={isLoading}
              />
            </div>
          ) : (
            <MarkdownOutput
              markdown={markdownOutput}
              onUpdateMarkdown={saveMarkdown}
            />
          )
        ) : (
          /* Elegant empty or landing welcome view */
          <div className="flex-1 bg-white border border-zinc-150 rounded-2xl p-8 shadow-xs flex flex-col items-center justify-center text-center gap-6 min-h-[450px]">
            <div className="h-16 w-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner mb-2 animate-bounce">
              <BrainCircuit className="h-8 w-8" />
            </div>

            <div className="max-w-md flex flex-col gap-2">
              <h2 className="font-display text-xl font-bold text-zinc-950 tracking-tight">
                Your Minutes Intelligence Suite
              </h2>
              <p className="text-sm text-zinc-500 leading-relaxed">
                TranscriptAI extracts critical software context, technical metrics, and aligns disagreements neutrally, keeping people accountable.
              </p>
            </div>

            {/* Functional Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg mt-2">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 flex flex-col items-center text-center gap-1">
                <Flame className="h-4 w-4 text-rose-500" />
                <span className="text-[11px] font-bold text-zinc-900 leading-normal">Neutral Reports</span>
                <p className="text-[9px] text-zinc-400">Reports emotionally charged debates completely neutrally</p>
              </div>
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 flex flex-col items-center text-center gap-1">
                <CornerRightDown className="h-4 w-4 text-emerald-500" />
                <span className="text-[11px] font-bold text-zinc-900 leading-normal">Factual Metric</span>
                <p className="text-[9px] text-zinc-400">Preserves precise technical metrics and industry names</p>
              </div>
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 flex flex-col items-center text-center gap-1">
                <CheckSquare className="h-4 w-4 text-indigo-500" />
                <span className="text-[11px] font-bold text-zinc-900 leading-normal">Interactive Actions</span>
                <p className="text-[9px] text-zinc-400">Assigns action ownership and tracks lists interactive</p>
              </div>
            </div>

            {/* Predefined Callouts */}
            <div className="text-[11px] text-zinc-400 font-mono tracking-wider text-center mt-3">
              LOAD A TEST SCENARIO ON THE LEFT TO BEGIN INSTANTLY
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans flex flex-col transition-colors duration-200 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* 1. Global Navigation Top Header */}
      <header className="border-b border-zinc-150 bg-white sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-display font-bold text-lg shadow-sm">
            T
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-semibold text-zinc-900 tracking-tight text-md">
                TranscriptAI
              </span>
              <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                Intelligence
              </span>
            </div>
            <p className="text-[10px] text-zinc-400">Elite Meeting Documentation Suite</p>
          </div>
        </div>

        {/* Global summary stats or reset actions */}
        {markdownOutput && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleClearSession}
              className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Reset Session
            </button>
          </div>
        )}
      </header>

      {/* 2. Main Workstation Frame */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* Left Column Controls: Inputs & Record */}
        <div className="lg:col-span-5 flex flex-col h-fit lg:sticky lg:top-24 max-h-[calc(100vh-140px)]">
          <SidebarInputs
            onAnalyzeText={handleAnalyzeText}
            onAnalyzeAudio={handleAnalyzeAudio}
            isLoading={isLoading}
            error={apiError}
            onJoinMeeting={setActiveMeeting}
          />
        </div>

        {/* Right Column Canvas: Outputs / Dashboard */}
        <div className="lg:col-span-7 flex flex-col gap-5 min-h-0">
          {renderRightColumn()}
        </div>
      </main>
    </div>
  );
}
