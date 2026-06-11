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
  Code,
  Sun,
  Moon,
  Key,
  Eye,
  EyeOff
} from "lucide-react";
import ActiveMeetingRoom from "./components/ActiveMeetingRoom";
import { CalendarEvent } from "./firebase_client";

export const PROVIDER_MODELS = {
  google: [
    { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash", desc: "Balanced intelligence & speed (Recommended)" },
    { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro (Preview)", desc: "High reasoning, complex terminology" },
    { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash-Lite", desc: "Basic tracking, ultra fast" }
  ],
  openai: [
    { id: "gpt-4o", name: "GPT-4o", desc: "Premium intelligence & summary structure" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini", desc: "Lightning fast, concise bullet points" },
    { id: "o1-mini", name: "o1-mini", desc: "Expert logical mapping for long transcripts" }
  ],
  anthropic: [
    { id: "claude-3-5-sonnet-latest", name: "Claude 3.5 Sonnet", desc: "Elite articulation, human-like alignment" },
    { id: "claude-3-5-haiku-latest", name: "Claude 3.5 Haiku", desc: "Rapid processing, outstanding action logs" }
  ]
};

export default function App() {
  const [markdownOutput, setMarkdownOutput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<"interactive" | "raw">("interactive");
  const [activeMeeting, setActiveMeeting] = useState<CalendarEvent | null>(null);
  const [isOfflineFallback, setIsOfflineFallback] = useState<boolean>(false);

  // Model Selection & Key config
  const [selectedProvider, setSelectedProvider] = useState<"google" | "openai" | "anthropic">(() => {
    return (localStorage.getItem("transcribe_selected_provider") as any) || "google";
  });
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem("transcribe_selected_model") || "gemini-3.5-flash";
  });

  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem("user_gemini_api_key") || "";
  });
  const [openaiApiKey, setOpenaiApiKey] = useState<string>(() => {
    return localStorage.getItem("user_openai_api_key") || "";
  });
  const [anthropicApiKey, setAnthropicApiKey] = useState<string>(() => {
    return localStorage.getItem("user_anthropic_api_key") || "";
  });

  const [isApiKeyOpen, setIsApiKeyOpen] = useState<boolean>(false);
  const [showKeyText, setShowKeyText] = useState<boolean>(false);

  // Backward compatibility alias
  const customApiKey = geminiApiKey;

  const handleSaveGeminiKey = (key: string) => {
    const trimmed = key.trim();
    setGeminiApiKey(trimmed);
    if (trimmed) localStorage.setItem("user_gemini_api_key", trimmed);
    else localStorage.removeItem("user_gemini_api_key");
  };

  const handleSaveOpenaiKey = (key: string) => {
    const trimmed = key.trim();
    setOpenaiApiKey(trimmed);
    if (trimmed) localStorage.setItem("user_openai_api_key", trimmed);
    else localStorage.removeItem("user_openai_api_key");
  };

  const handleSaveAnthropicKey = (key: string) => {
    const trimmed = key.trim();
    setAnthropicApiKey(trimmed);
    if (trimmed) localStorage.setItem("user_anthropic_api_key", trimmed);
    else localStorage.removeItem("user_anthropic_api_key");
  };

  const handleProviderChange = (provider: "google" | "openai" | "anthropic") => {
    setSelectedProvider(provider);
    localStorage.setItem("transcribe_selected_provider", provider);
    
    const defaultModel = PROVIDER_MODELS[provider][0].id;
    setSelectedModel(defaultModel);
    localStorage.setItem("transcribe_selected_model", defaultModel);
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    localStorage.setItem("transcribe_selected_model", model);
  };

  const hasActiveKey = () => {
    if (selectedProvider === "google") return !!geminiApiKey;
    if (selectedProvider === "openai") return !!openaiApiKey;
    if (selectedProvider === "anthropic") return !!anthropicApiKey;
    return false;
  };

  // Load initial theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("transcript_ai_theme");
    if (saved) {
      return saved === "dark";
    }
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("transcript_ai_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("transcript_ai_theme", "light");
    }
  }, [darkMode]);

  // Load state from sessionStorage if exists
  useEffect(() => {
    const savedMarkdown = sessionStorage.getItem("transcript_ai_markdown");
    if (savedMarkdown) {
      setMarkdownOutput(savedMarkdown);
    }
    const savedFallback = sessionStorage.getItem("transcript_ai_offline_fallback");
    if (savedFallback) {
      setIsOfflineFallback(savedFallback === "true");
    }
  }, []);

  // Update sessionStorage when markdown changes
  const saveMarkdown = (md: string, offlineFlag: boolean = false) => {
    setMarkdownOutput(md);
    setIsOfflineFallback(offlineFlag);
    if (md) {
      sessionStorage.setItem("transcript_ai_markdown", md);
      sessionStorage.setItem("transcript_ai_offline_fallback", String(offlineFlag));
    } else {
      sessionStorage.removeItem("transcript_ai_markdown");
      sessionStorage.removeItem("transcript_ai_offline_fallback");
    }
  };

  // Compute parsed minutes representation on the fly from the active markdown
  const parsedData: ParsedMinutes = parseMeetingMarkdown(markdownOutput);

  // Sync state modifications from checklist or added actions back into the markdown text representation
  const handleUpdateActionItems = (newActions: ActionItem[]) => {
    // Reconstruct the Checklist section text starting under Action Items & Ownership
    const lines = markdownOutput.split("\n");
    let startIndex = -1;
    let endIndex = -1;

    // Robust heading check logic matching any level of markdown header and optional symbols
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase().trim();
      if (
        (line.includes("action items") && line.includes("ownership")) ||
        (line.includes("✅") && line.includes("action") && line.includes("item"))
      ) {
        startIndex = i + 1;
        break;
      }
    }

    // Helper to identify where the next major section block starts
    const isNextSectionHeader = (lineText: string): boolean => {
      const clean = lineText.trim();
      if (clean.startsWith("#")) return true;
      if (
        clean.startsWith("📌") ||
        clean.startsWith("📝") ||
        clean.startsWith("🔑") ||
        clean.startsWith("✅") ||
        clean.startsWith("💡") ||
        clean.startsWith("⏳")
      ) {
        return true;
      }
      const upper = clean.toUpperCase();
      return (
        upper.includes("MEETING METADATA") ||
        upper.includes("EXECUTIVE SUMMARY") ||
        upper.includes("KEY DISCUSSION PILLARS") ||
        upper.includes("ACTION ITEMS") ||
        upper.includes("DECISIONS, BLOCKS") ||
        upper.includes("DECISIONS, BOXES") ||
        upper.includes("DECISIONS AND RISKS") ||
        upper.includes("QUICK-REFERENCE TIMELINE") ||
        upper.includes("TIMELINE")
      );
    };

    if (startIndex !== -1) {
      // Find where next main section starts or end of lines
      for (let j = startIndex; j < lines.length; j++) {
        if (isNextSectionHeader(lines[j])) {
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
      
      saveMarkdown(updatedMarkdown, isOfflineFallback);
    } else {
      // Fallback: If no Actions section header was found, append a new header and the list to the end
      const replacementLines = newActions.map(
        (item) => `* [${item.completed ? "x" : " "}] **${item.owner}**: ${item.task}`
      );
      const newSection = `\n\n✅ Action Items & Ownership\n${replacementLines.join("\n")}\n`;
      saveMarkdown(markdownOutput + newSection, isOfflineFallback);
    }
  };

  // Submit Text Transcript API
  const handleAnalyzeText = async (text: string, titleHint: string) => {
    if (!hasActiveKey()) {
      const providerName = selectedProvider === "google" ? "Google Gemini" : selectedProvider === "openai" ? "OpenAI" : "Anthropic Claude";
      setApiError(`A personal ${providerName} API Key is required. Please click the pulsating model settings button at the top-right to configure your key.`);
      setIsApiKeyOpen(true);
      return;
    }
    setIsLoading(true);
    setApiError(null);
    try {
      const headers: Record<string, string> = { 
        "Content-Type": "application/json",
        "x-provider": selectedProvider,
        "x-model": selectedModel,
        "x-gemini-api-key": geminiApiKey || "",
        "x-openai-api-key": openaiApiKey || "",
        "x-anthropic-api-key": anthropicApiKey || ""
      };

      const resp = await fetch("/api/summarize-text", {
        method: "POST",
        headers,
        body: JSON.stringify({ text, titleSuggestion: titleHint }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status: ${resp.status}`);
      }

      const data = await resp.json();
      if (data.markdown) {
        saveMarkdown(data.markdown, !!data.isOfflineFallback);
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
    if (!hasActiveKey()) {
      const providerName = selectedProvider === "google" ? "Google Gemini" : selectedProvider === "openai" ? "OpenAI" : "Anthropic Claude";
      setApiError(`A personal ${providerName} API Key is required. Please click the pulsating model settings button at the top-right to configure your key.`);
      setIsApiKeyOpen(true);
      return;
    }
    setIsLoading(true);
    setApiError(null);
    try {
      const headers: Record<string, string> = { 
        "Content-Type": "application/json",
        "x-provider": selectedProvider,
        "x-model": selectedModel,
        "x-gemini-api-key": geminiApiKey || "",
        "x-openai-api-key": openaiApiKey || "",
        "x-anthropic-api-key": anthropicApiKey || ""
      };

      const resp = await fetch("/api/summarize-audio", {
        method: "POST",
        headers,
        body: JSON.stringify({ base64Data, mimeType, filename, titleSuggestion: titleHint }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status: ${resp.status}`);
      }

      const data = await resp.json();
      if (data.markdown) {
        saveMarkdown(data.markdown, !!data.isOfflineFallback);
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
    saveMarkdown("", false);
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
          <div className="flex justify-between items-center bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 shadow-xs transition-colors duration-200">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Output Interface Views:</span>
            <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
              <button
                onClick={() => setActiveViewMode("interactive")}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-bold transition-all ${
                  activeViewMode === "interactive"
                    ? "bg-white dark:bg-zinc-700 text-zinc-950 dark:text-zinc-50 shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <Layout className="h-3.5 w-3.5 text-indigo-500" />
                Interactive Dashboard
              </button>
              <button
                onClick={() => setActiveViewMode("raw")}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-bold transition-all ${
                  activeViewMode === "raw"
                    ? "bg-white dark:bg-zinc-700 text-zinc-950 dark:text-zinc-50 shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
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
            <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs transition-colors duration-200">
              <DashboardOutput
                data={parsedData}
                onUpdateActionItems={handleUpdateActionItems}
                isLoading={isLoading}
                isOfflineFallback={isOfflineFallback}
              />
            </div>
          ) : (
            <MarkdownOutput
              markdown={markdownOutput}
              onUpdateMarkdown={(md) => saveMarkdown(md, isOfflineFallback)}
            />
          )
        ) : (
          /* Elegant empty or landing welcome view */
          <div className="flex-1 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-xs flex flex-col items-center justify-center text-center gap-6 min-h-[450px] transition-colors duration-200">
            <div className="h-16 w-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner mb-2 animate-bounce">
              <BrainCircuit className="h-8 w-8" />
            </div>

            <div className="max-w-md flex flex-col gap-2">
              <h2 className="font-display text-xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">
                Your Minutes Intelligence Suite
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                TranscriptAI extracts critical software context, technical metrics, and aligns disagreements neutrally, keeping people accountable.
              </p>
            </div>

            {/* Functional Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg mt-2">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center text-center gap-1 transition-colors">
                <Flame className="h-4 w-4 text-rose-500" />
                <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-50 leading-normal">Neutral Reports</span>
                <p className="text-[9px] text-zinc-400 dark:text-zinc-500">Reports emotionally charged debates completely neutrally</p>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center text-center gap-1 transition-colors">
                <CornerRightDown className="h-4 w-4 text-emerald-500" />
                <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-50 leading-normal">Factual Metric</span>
                <p className="text-[9px] text-zinc-400 dark:text-zinc-500">Preserves precise technical metrics and industry names</p>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center text-center gap-1 transition-colors">
                <CheckSquare className="h-4 w-4 text-indigo-500" />
                <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-50 leading-normal">Interactive Actions</span>
                <p className="text-[9px] text-zinc-400 dark:text-zinc-500">Assigns action ownership and tracks lists interactive</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans flex flex-col transition-colors duration-200 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* 1. Global Navigation Top Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black sticky top-0 z-40 px-6 py-4 flex items-center justify-between transition-colors duration-200">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-display font-bold text-lg shadow-sm">
            T
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight text-md">
                TranscriptAI
              </span>
              <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                Intelligence
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Elite Meeting Documentation Suite</p>
          </div>
        </div>
 
        {/* Action bar featuring Theme Switcher & System Reset */}
        <div className="flex items-center gap-3">
          {/* Multi-Model and API Key Config Popover */}
          <div className="relative">
            <button
              onClick={() => setIsApiKeyOpen(!isApiKeyOpen)}
              className={`flex items-center gap-1.5 h-9 px-3 border rounded-xl font-semibold text-xs transition-all shadow-xs ${
                hasActiveKey()
                  ? "border-emerald-200 bg-emerald-50/50 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/25 dark:text-emerald-400"
                  : "border-amber-300 bg-amber-50/50 text-amber-800 hover:bg-amber-100 dark:border-amber-800/60 dark:bg-amber-950/20 dark:text-amber-300 dark:hover:bg-amber-950/40 animate-pulse"
              }`}
              title="Configure Models and personal API Keys"
              id="model-config-panel-btn"
            >
              <Sparkles className="h-4 w-4 text-indigo-500 animate-spin-slow" />
              <span className="hidden sm:inline">
                {PROVIDER_MODELS[selectedProvider].find(m => m.id === selectedModel)?.name || "Select Model"}
              </span>
              {hasActiveKey() && (
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
              )}
            </button>

            {isApiKeyOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xl z-50 animate-fade-in transition-colors duration-200">
                <div className="flex flex-col gap-4">
                  {/* Popover Header */}
                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-2">
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-indigo-500" />
                      Model Configuration
                    </h3>
                    <button
                      onClick={() => setIsApiKeyOpen(false)}
                      className="text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Provider Tabs selector */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">AI PROVIDER</label>
                    <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl">
                      {(["google", "openai", "anthropic"] as const).map((prov) => (
                        <button
                          key={prov}
                          onClick={() => handleProviderChange(prov)}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold capitalize transition-all ${
                            selectedProvider === prov
                              ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 shadow-xs border border-zinc-200/50 dark:border-zinc-700/50"
                              : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                          }`}
                        >
                          {prov === "google" ? "Gemini" : prov === "openai" ? "OpenAI" : "Claude"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Model Selector dropdown */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">SELECT MODEL</label>
                    <select
                      value={selectedModel}
                      onChange={(e) => handleModelChange(e.target.value)}
                      className="w-full text-xs py-2 px-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-indigo-500 font-medium transition-all"
                    >
                      {PROVIDER_MODELS[selectedProvider].map((mod) => (
                        <option key={mod.id} value={mod.id}>
                          {mod.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-normal italic bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded-lg border border-zinc-100 dark:border-zinc-900/40">
                      {PROVIDER_MODELS[selectedProvider].find(m => m.id === selectedModel)?.desc}
                    </p>
                  </div>

                  {/* API Key management panel for selected Provider */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      {selectedProvider === "google" ? "GEMINI API KEY" : selectedProvider === "openai" ? "OPENAI API KEY" : "CLAUDE API KEY"}
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type={showKeyText ? "text" : "password"}
                        placeholder={
                          selectedProvider === "google"
                            ? "AIzaSy..."
                            : selectedProvider === "openai"
                            ? "sk-..."
                            : "sk-ant-..."
                        }
                        value={
                          selectedProvider === "google"
                            ? geminiApiKey
                            : selectedProvider === "openai"
                            ? openaiApiKey
                            : anthropicApiKey
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          if (selectedProvider === "google") handleSaveGeminiKey(val);
                          else if (selectedProvider === "openai") handleSaveOpenaiKey(val);
                          else handleSaveAnthropicKey(val);
                        }}
                        className="w-full text-xs py-2 pl-3 pr-10 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-lg focus:outline-hidden focus:border-indigo-500 text-zinc-900 dark:text-zinc-100 font-mono transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKeyText(!showKeyText)}
                        className="absolute right-2 text-zinc-400 hover:text-zinc-655"
                      >
                        {showKeyText ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <span className="text-[9px] text-zinc-400 dark:text-zinc-500 leading-normal">
                      Keys are stored securely in browser local storage and never leave your client context.
                    </span>
                  </div>

                  {/* Close panel action */}
                  <div className="flex gap-2 justify-end border-t border-zinc-100 dark:border-zinc-900 pt-3">
                    <button
                      onClick={() => setIsApiKeyOpen(false)}
                      className="py-1.5 px-4 bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg text-xs font-semibold transition-colors shadow-xs"
                    >
                      Done Config
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center justify-center w-9 h-9 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-black text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all shadow-xs"
            title={darkMode ? "Switch to light theme" : "Switch to dark theme"}
            id="theme-toggle-btn"
          >
            {darkMode ? (
              <Sun className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
            ) : (
              <Moon className="h-4.5 w-4.5 text-zinc-600" />
            )}
          </button>

          {markdownOutput && (
            <button
              onClick={handleClearSession}
              className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 py-1.5 px-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              id="reset-session-btn"
            >
              Reset Session
            </button>
          )}
        </div>
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
