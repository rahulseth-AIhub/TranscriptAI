import React, { useState, useEffect, useRef } from "react";
import { CalendarEvent } from "../firebase_client";
import { 
  Users, 
  Clock, 
  Mic, 
  Square, 
  FileText, 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  ArrowLeft,
  XCircle,
  Volume2,
  CheckSquare,
  Activity,
  Send
} from "lucide-react";

interface ActiveMeetingRoomProps {
  event: CalendarEvent;
  onConclude: (transcript: string, titleHint: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export default function ActiveMeetingRoom({
  event,
  onConclude,
  onCancel,
  isLoading,
}: ActiveMeetingRoomProps) {
  const [conferencingTime, setConferencingTime] = useState(0);
  const [isCapturing, setIsCapturing] = useState(true);
  const [transcriptLines, setTranscriptLines] = useState<string[]>([]);
  const [customLine, setCustomLine] = useState("");
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const isSpeechActiveRef = useRef(false);
  const timeRef = useRef(conferencingTime);

  // Sync conferencing time with ref to keep callback synchronized without restarts
  useEffect(() => {
    timeRef.current = conferencingTime;
  }, [conferencingTime]);

  // 1. Core Timer Setup
  useEffect(() => {
    timerIntervalRef.current = setInterval(() => {
      setConferencingTime((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Initialize transcript list with a starting guide line
  useEffect(() => {
    setTranscriptLines([
      `[00:00:01] System: Bridge connected. Speak clearly or type manual lines below.`
    ]);
  }, []);

  // 2. Speech-to-Text Recognition Setup
  useEffect(() => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      setIsSpeechSupported(true);
      const rec = new SpeechRecognitionClass();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onresult = (event: any) => {
        const result = event.results[event.results.length - 1];
        if (result.isFinal) {
          const text = result[0].transcript.trim();
          if (text) {
            const timestamp = formatSeconds(timeRef.current);
            setTranscriptLines((prev) => [
              ...prev,
              `[${timestamp}] User: ${text}`
            ]);
          }
        }
      };

      rec.onend = () => {
        if (isSpeechActiveRef.current) {
          try {
            rec.start();
          } catch (e) {
            console.warn("Speech recognition restart failed:", e);
          }
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // 3. Keep speech recognition active while isCapturing is true
  useEffect(() => {
    if (!recognitionRef.current) return;
    if (isCapturing) {
      isSpeechActiveRef.current = true;
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Failed to start speech recognition:", e);
      }
    } else {
      isSpeechActiveRef.current = false;
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn("Failed to stop speech recognition:", e);
      }
    }
  }, [isCapturing]);

  const formatSeconds = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60).toString().padStart(2, "0");
    const secs = (totalSecs % 60).toString().padStart(2, "0");
    return `00:${mins}:${secs}`;
  };

  const handleSendCustomLine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLine.trim()) return;

    const timestamp = formatSeconds(conferencingTime);
    setTranscriptLines((prev) => [
      ...prev,
      `[${timestamp}] Me: ${customLine.trim()}`
    ]);
    setCustomLine("");
  };

  const handleConcludeMeeting = () => {
    if (transcriptLines.length === 0) {
      alert("No transcript dialog captured yet. Record or type some speech to proceed.");
      return;
    }
    const fullTranscript = transcriptLines.join("\n");
    onConclude(fullTranscript, event.summary || "Joined Live Schedule");
  };

  const attendeesList = event.attendees?.map((a) => a.displayName || a.email.split("@")[0]) || ["Me", "Sarah"];

  return (
    <div className="flex flex-col gap-5 text-zinc-900 duration-200">
      
      {/* HUD Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-150 pb-4 gap-3">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 py-1.5 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg shadow-inner transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Schedules
        </button>

        <div className="flex items-center gap-1.5 py-1 px-2.5 bg-indigo-50 text-indigo-700 rounded-full font-mono text-[11px] font-bold border border-indigo-100 animate-pulse">
          <Activity className="h-3.5 w-3.5" />
          TranscriptAI connected to Google Meet
        </div>
      </div>

      {/* Hero Meeting Status */}
      <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-2xl p-5 shadow-md flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono tracking-widest text-indigo-300 font-bold uppercase">Active Conference Bridge</span>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
            <span className="font-mono text-sm font-semibold text-red-100">{formatSeconds(conferencingTime)}</span>
          </div>
        </div>

        <div>
          <h2 className="font-display text-xl md:text-2xl font-bold tracking-tight text-white">
            {event.summary || "Google Calendar Session"}
          </h2>
          {event.location && (
            <p className="text-xs text-indigo-200 mt-1 truncate">Location: {event.location}</p>
          )}
        </div>

        {/* Live Participants visualization */}
        <div className="border-t border-indigo-800 pt-3">
          <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest block mb-2">Live Participants on Call</span>
          <div className="flex flex-wrap gap-2">
            {attendeesList.map((attendee, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-1.5 py-1 px-2.5 bg-indigo-800/60 border border-indigo-700/50 rounded-full text-[11px] font-medium"
              >
                <div className="h-2 w-2 rounded-full bg-emerald-450 animate-pulse" />
                <span>{attendee}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Track Controls */}
      <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <span className="text-xs font-bold text-zinc-805 block mb-1">Bridge Audio Tracking</span>
          <p className="text-[11px] text-zinc-500 leading-normal mb-2">
            {isSpeechSupported 
              ? "TranscriptAI will transcribe your microphone audio in real-time. Use the capture toggle to start/pause tracking."
              : "Microphone recording is ready. Type manual dialog lines below to construct meeting minutes."}
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setIsCapturing(!isCapturing)}
              className={`flex items-center gap-1.5 py-1.5 px-3 text-xs font-bold rounded-lg border transition-all ${
                isCapturing 
                  ? "bg-indigo-50 border-indigo-150 text-indigo-700 hover:bg-indigo-100" 
                  : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {isCapturing ? (
                <>
                  <Pause className="h-3.5 w-3.5 shrink-0" /> Pause Capture
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 shrink-0 fill-current" /> Resume Capture
                </>
              )}
            </button>

            <span className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
              isSpeechSupported ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100"
            }`}>
              {isSpeechSupported ? "🎙️ Real-time STT" : "✍️ Manual Feed Only"}
            </span>
          </div>
        </div>

        {/* Live Audio Visualizer bar indicator */}
        <div className="border-t md:border-t-0 md:border-l border-zinc-250 pt-3 md:pt-0 md:pl-4 flex flex-col justify-center gap-2">
          <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500">
            <span>MIC INTENSITY:</span>
            <span>{isCapturing ? "CAPTURING LIVE AUDIO" : "PAUSED"}</span>
          </div>
          <div className="flex gap-1 h-8 items-end justify-between px-1">
            {[2, 5, 8, 4, 3, 7, 9, 10, 6, 8, 4, 5, 2, 7, 9, 3, 5, 8, 4, 6, 2].map((val, idx) => {
              // animate height if capturing
              const multiplier = isCapturing ? 4 : 1;
              const normalizedHeight = Math.min(val * multiplier, 32);
              return (
                <div
                  key={idx}
                  className={`w-1 rounded-full transition-all duration-300 ${isCapturing ? "bg-indigo-600 animate-pulse" : "bg-zinc-300"}`}
                  style={{ height: `${normalizedHeight}px`, animationDelay: `${idx * 0.05}s` }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Real-Time Dialogue Feed Stream */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
          <Volume2 className="h-4 w-4 text-indigo-500" /> Real-time Speech-to-Text Stream
        </span>

        <div className="border border-zinc-150 rounded-xl p-4 bg-zinc-950 text-emerald-400 font-mono text-[11px] leading-relaxed h-[240px] overflow-y-auto flex flex-col gap-2">
          {transcriptLines.length === 0 ? (
            <span className="text-zinc-500 animate-pulse">Initializing conference stream feeds...</span>
          ) : (
            transcriptLines.map((line, idx) => (
              <div key={idx} className="border-l border-zinc-800 pl-2">
                {line}
              </div>
            ))
          )}
        </div>

        {/* Add manual diallines */}
        <form onSubmit={handleSendCustomLine} className="flex gap-2">
          <input
            type="text"
            placeholder="Type dialog line on behalf of active attendees..."
            value={customLine}
            onChange={(e) => setCustomLine(e.target.value)}
            className="flex-1 text-xs py-2 px-3 border border-zinc-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
          />
          <button
            type="submit"
            className="py-2 px-3 bg-zinc-900 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 shrink-0 flex items-center gap-1"
          >
            <Send className="h-3.5 w-3.5" /> Inject Voice
          </button>
        </form>
      </div>

      {/* CTA Conclude and Docs Generation */}
      <button
        onClick={handleConcludeMeeting}
        disabled={isLoading || transcriptLines.length === 0}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all active:scale-[0.99]"
      >
        {isLoading ? (
          <>
            <Activity className="h-4 w-4 animate-spin" /> Preparing Executive Documentation...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" /> Conclude Bridge & Generate Minutes 🚀
          </>
        )}
      </button>

    </div>
  );
}
