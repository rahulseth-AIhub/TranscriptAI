import { useState, useRef, useEffect, ChangeEvent, DragEvent } from "react";
import { 
  FileText, 
  Upload, 
  Mic, 
  Square, 
  Play, 
  Sparkles, 
  RefreshCw, 
  ChevronRight,
  Info,
  CheckCircle,
  AlertCircle,
  Calendar
} from "lucide-react";
import CalendarScheduler from "./CalendarScheduler";
import { CalendarEvent } from "../firebase_client";

interface SidebarInputsProps {
  onAnalyzeText: (text: string, titleHint: string) => void;
  onAnalyzeAudio: (base64Data: string, mimeType: string, filename: string, titleHint: string) => void;
  isLoading: boolean;
  error: string | null;
  onJoinMeeting: (event: CalendarEvent) => void;
}

export default function SidebarInputs({
  onAnalyzeText,
  onAnalyzeAudio,
  isLoading,
  error,
  onJoinMeeting,
}: SidebarInputsProps) {
  const [activeTab, setActiveTab] = useState<"paste" | "record-upload" | "calendar">("calendar");
  
  // Paste states
  const [pasteText, setPasteText] = useState("");
  const [titleHint, setTitleHint] = useState("");

  // Record / Upload states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileMime, setFileMime] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);



  // Drag and drop states
  const [dragActive, setDragActive] = useState(false);

  // Character & word count
  const wordCount = pasteText.trim() ? pasteText.trim().split(/\s+/).length : 0;
  const charCount = pasteText.length;

  // Start recording mic
  const startRecording = async () => {
    audioChunksRef.current = [];
    setAudioBlob(null);
    setAudioUrl(null);
    setUploadedFile(null);
    setFileBase64(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));

        // Read blob as base64 for transmission
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            const base64 = reader.result.split(",")[1];
            setFileBase64(base64);
            setFileMime(mimeType);
          }
        };
        reader.readAsDataURL(blob);

        // Turn off tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to access microphone:", err);
      alert("Microphone access denied or unsupported format. Please enable permission.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  // Handle local text file load
  const loadTextFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        setPasteText(text);
        setTitleHint(file.name.replace(/\.[^/.]+$/, ""));
        setActiveTab("paste");
      }
    };
    reader.readAsText(file);
  };

  // Handle local audio file load
  const loadAudioFile = (file: File) => {
    setUploadedFile(file);
    setAudioBlob(null);
    setAudioUrl(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        const base64 = reader.result.split(",")[1];
        setFileBase64(base64);
        setFileMime(file.type || "audio/mp3");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith("text/") || file.name.endsWith(".md") || file.name.endsWith(".txt")) {
        loadTextFile(file);
      } else if (file.type.startsWith("audio/")) {
        loadAudioFile(file);
      } else {
        alert("Unsupported file type. Please upload a .txt, .md, or standard audio file.");
      }
    }
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("text/") || file.name.endsWith(".md") || file.name.endsWith(".txt")) {
        loadTextFile(file);
      } else if (file.type.startsWith("audio/")) {
        loadAudioFile(file);
      } else {
        alert("Unsupported file type. Please upload .txt, .md, or standard audio.");
      }
    }
  };

  const handleTriggerAnalysis = () => {
    if (activeTab === "paste") {
      if (!pasteText.trim()) return;
      onAnalyzeText(pasteText, titleHint);
    } else if (activeTab === "record-upload") {
      if (!fileBase64 || !fileMime) return;
      const displayFilename = uploadedFile ? uploadedFile.name : `recorded_session_${new Date().toISOString()}.webm`;
      onAnalyzeAudio(fileBase64, fileMime, displayFilename, titleHint);
    }
  };

  // Format time (MM:SS)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col gap-5 h-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm p-6 overflow-hidden">
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
          Input Control Center
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Load a sample conversation, paste raw text, drop a meeting recording file, or record directly from your mic.
        </p>
      </div>

      {/* Tabs list */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
        <button
          onClick={() => setActiveTab("calendar")}
          className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all duration-200 ${
            activeTab === "calendar"
              ? "bg-white dark:bg-zinc-700 text-zinc-950 dark:text-zinc-50 shadow-sm"
              : "text-zinc-600 dark:text-zinc-455 hover:text-zinc-955"
          }`}
        >
          Schedules 📅
        </button>
        <button
          onClick={() => setActiveTab("paste")}
          className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all duration-200 ${
            activeTab === "paste"
              ? "bg-white dark:bg-zinc-700 text-zinc-950 dark:text-zinc-50 shadow-sm"
              : "text-zinc-600 dark:text-zinc-455 hover:text-zinc-955"
          }`}
        >
          Paste Raw
        </button>
        <button
          onClick={() => setActiveTab("record-upload")}
          className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all duration-200 ${
            activeTab === "record-upload"
              ? "bg-white dark:bg-zinc-700 text-zinc-950 dark:text-zinc-50 shadow-sm"
              : "text-zinc-600 dark:text-zinc-455 hover:text-zinc-955"
          }`}
        >
          Voice Mic
        </button>
      </div>

      {/* Inputs container */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {activeTab === "calendar" && (
          <CalendarScheduler onJoinMeeting={onJoinMeeting} />
        )}

        {activeTab === "paste" && (
          <div className="flex flex-col gap-4 animate-fade-in h-full min-h-0">
            {/* Title hint input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Meeting Topic (Optional Hint)
              </label>
              <input
                type="text"
                placeholder="e.g., Q3 Planning Session, Database RFC review"
                value={titleHint}
                onChange={(e) => setTitleHint(e.target.value)}
                className="w-full text-sm py-1.5 px-3 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:border-indigo-500 dark:bg-zinc-850 text-zinc-905"
              />
            </div>

            {/* Paste Textarea */}
            <div className="flex-1 flex flex-col gap-1.5 min-h-[220px]">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-zinc-400" />
                  Meeting Transcript Text
                </label>
                <div className="font-mono text-[10px] text-zinc-400 space-x-2">
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span>{charCount} chars</span>
                </div>
              </div>
              <textarea
                placeholder="Paste your raw transcript here... You can write dialogues using the format:
[00:01:25] Alice: We need custom API SLA.
[00:02:10] Bob: I'll handle that index."
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                className="w-full flex-1 p-3 text-xs leading-relaxed border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono focus:outline-hidden focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 resize-none min-h-0"
              />
            </div>
          </div>
        )}

        {activeTab === "record-upload" && (
          <div className="flex flex-col gap-4 animate-fade-in">
            {/* Topic Hint */}
            <div className="flex flex-col gap-1.55">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Meeting Topic (Optional Hint)
              </label>
              <input
                type="text"
                placeholder="e.g., Live Sync Meeting"
                value={titleHint}
                onChange={(e) => setTitleHint(e.target.value)}
                className="w-full text-sm py-1.5 px-3 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:border-indigo-500 dark:bg-zinc-850 text-zinc-905"
              />
            </div>

            {/* Option A: Microphone Recording */}
            <div className="p-4 border border-zinc-150 rounded-xl flex flex-col items-center justify-center gap-3 bg-zinc-50">
              <span className="text-xs font-semibold text-zinc-750">Option A: Live Voice Recorder</span>
              
              {isRecording ? (
                <div className="flex flex-col items-center gap-2">
                  {/* Glowing record indicator */}
                  <div className="flex items-center gap-2 py-1 px-3 bg-red-50 text-red-600 rounded-full text-xs font-mono animate-pulse border border-red-150">
                    <div className="h-2 w-2 rounded-full bg-red-650"></div>
                    RECORDING LIVE • {formatTime(recordingDuration)}
                  </div>
                  
                  {/* Recording wave visual representation */}
                  <div className="flex items-center gap-1.5 h-8 py-1.5">
                    <div className="w-1 bg-red-500 rounded-full animate-bounce h-5" style={{ animationDelay: "0.1s" }} />
                    <div className="w-1 bg-red-500 rounded-full animate-bounce h-8" style={{ animationDelay: "0.2s" }} />
                    <div className="w-1 bg-red-500 rounded-full animate-bounce h-4" style={{ animationDelay: "0.4s" }} />
                    <div className="w-1 bg-red-500 rounded-full animate-bounce h-6" style={{ animationDelay: "0.3s" }} />
                    <div className="w-1 bg-red-500 rounded-full animate-bounce h-3" style={{ animationDelay: "0.1s" }} />
                  </div>

                  <button
                    onClick={stopRecording}
                    className="flex items-center gap-1.5 py-2 px-4 bg-zinc-900 text-white hover:bg-zinc-805 text-xs font-semibold rounded-lg shadow-sm transition-all"
                  >
                    <Square className="h-4 w-4" /> Stop Recording
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={startRecording}
                    className="h-12 w-12 rounded-full bg-indigo-605 text-white flex items-center justify-center hover:bg-indigo-700 shadow-md transform hover:scale-105 active:scale-95 transition-all"
                  >
                    <Mic className="h-5 w-5" />
                  </button>
                  <span className="text-[10px] text-zinc-500 font-medium">Click to capture browser audio</span>
                </div>
              )}

              {/* Recorded playback element */}
              {audioUrl && !isRecording && (
                <div className="w-full flex flex-col gap-2 mt-2 bg-white rounded-lg p-2.5 border border-zinc-150">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-zinc-800 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500" /> Action Ready: Recorded clip
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {formatTime(recordingDuration)}
                    </span>
                  </div>
                  <audio src={audioUrl} controls className="w-full h-8" />
                </div>
              )}
            </div>

            {/* Split lines */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-zinc-150"></div>
              <span className="flex-shrink mx-3 text-[10px] font-bold text-zinc-400 uppercase">OR</span>
              <div className="flex-grow border-t border-zinc-150"></div>
            </div>

            {/* Option B: Direct Document/Audio Upload */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`p-5 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 text-center transition-all ${
                dragActive 
                  ? "border-indigo-500 bg-indigo-50/20" 
                  : "border-zinc-200 hover:border-zinc-300 bg-zinc-50"
              }`}
            >
              <Upload className="h-6 w-6 text-zinc-400" />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-zinc-800">
                  Drag & Drop Document / Audio
                </span>
                <span className="text-[10px] text-zinc-400 leading-relaxed max-w-[200px] mx-auto">
                  Supports .txt, .md, or typical voice formats e.g., mp3, wav. Max size: 10MB
                </span>
              </div>
              
              <label className="mt-1 cursor-pointer py-1 px-3 bg-white border border-zinc-200 rounded-lg text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 shadow-xs transition-colors">
                Browse Files
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".txt,.md,audio/*"
                  className="hidden"
                />
              </label>

              {/* Uploaded file status */}
              {uploadedFile && (
                <div className="w-full mt-2 bg-indigo-50 border border-indigo-100 rounded-lg p-2 flex items-center justify-between text-left">
                  <div className="flex items-center gap-2 shrink-0 min-w-0">
                    <FileText className="h-4 w-4 text-indigo-500" />
                    <div className="shrink min-w-0">
                      <p className="text-[11px] font-semibold text-indigo-950 truncate max-w-[140px]">
                        {uploadedFile.name}
                      </p>
                      <p className="text-[9px] text-indigo-400 font-mono">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] bg-indigo-200/55 text-indigo-800 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                    Loaded
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Trigger Button container */}
      {activeTab !== "calendar" && (
        <div className="mt-auto border-t border-zinc-100 dark:border-zinc-800 pt-4 flex flex-col gap-3">
          {error && (
            <div className="p-3 bg-red-50 border border-red-150 rounded-lg text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-650" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <button
            onClick={handleTriggerAnalysis}
            disabled={
              isLoading || 
              (activeTab === "paste" && !pasteText.trim()) ||
              (activeTab === "record-upload" && !fileBase64)
            }
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-md active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 text-white bg-indigo-600 hover:bg-indigo-720 dark:bg-indigo-500 dark:hover:bg-indigo-620 shadow-indigo-100 dark:shadow-none"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Intelligence Engine active...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analyze with TranscriptAI ⚡
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
