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

// Dialog mock generators to simulate real-time discussions dynamically based on meeting topic
const DEV_DIALOGS = [
  "Sarah (PM): Hi team, thanks for dialing in. Let's review our roadmap for the database engine migration.",
  "Dave (Principal Architect): Yes, our primary bottleneck is query scaling. We need to evaluate Redis vs. PostgreSQL caching.",
  "Mark (Lead Engineer): Honestly, at 150k operations per second, relational schemas are a massive bottleneck.",
  "Amanda (DevOps): Speaking from deployment, Amazon RDS handles our scaling nicely but the indexing spikes are real.",
  "Dave: If we offload the writes using Kafka buffering, that mitigates the locking concerns.",
  "Mark: Kafka connectors will look complex, who will configure the stress testers?",
  "Amanda: I can spin up the Kafka containers in sandbox by next Tuesday."
];

const SALES_DIALOGS = [
  "Elena (VP Sales): Welcome everyone. Today we are looking at our business forecasting and conversion metrics.",
  "Jared (Director Growth): Checkout conversion rose from 1.8% to 2.45% thanks to the quick checkout feature.",
  "Elena: That is superb. However we have mid-market churn. Acme and Globex want to downscale licenses.",
  "Chloe (CS Lead): Globex is demanding custom SLAs and webhook retries because of rate limits.",
  "Jared: Let's assign an engineer directly to onboard their support patch.",
  "Chloe: I will schedule a deep-dive call with their technical manager tomorrow to restore alignment."
];

const SECURITY_DIALOGS = [
  "Robert (CISO): Let's start the RCA for INC-402 database permissions over-allocation.",
  "Lisa (SecOps): AWS GuardDuty flagged wildcard permissions on dev sandbox at 23:45 UTC. We revoked the key pair within 4 minutes.",
  "Ken (Engineering Manager): Our policies explicitly forbid manual wildcard generation on non-isolated targets.",
  "Lisa: The automated cloud sweeps had a timing hole because of Terraform tests.",
  "Robert: Do we have personal data leak risks?",
  "Ken: The staging backup only contained anonymous random strings, so zero PII exposure."
];

const GENERAL_DIALOGS = [
  "Alice (Meeting Chair): Welcome everyone. Let's align on current project timelines and deliverables.",
  "Bob (Tech Lead): Mostly green on the sprint schedule except for the payment webhook regression.",
  "Charlie (Product Owner): What's our timeline on resolving the gatekeeper bugs?",
  "Bob: We have a fix ready for QA review. I will deploy it by Tuesday morning.",
  "Alice: Excellent. Let's make sure our release notes get published on time."
];

export default function ActiveMeetingRoom({
  event,
  onConclude,
  onCancel,
  isLoading,
}: ActiveMeetingRoomProps) {
  const [conferencingTime, setConferencingTime] = useState(0);
  const [isCapturing, setIsCapturing] = useState(true);
  const [useSimulation, setUseSimulation] = useState(true);
  const [transcriptLines, setTranscriptLines] = useState<string[]>([]);
  const [customLine, setCustomLine] = useState("");

  const simulationIndexRef = useRef(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const feedIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Determine which dialogue array to use based on meeting topic
  const getSimulatedDialogues = () => {
    const title = (event.summary || "").toLowerCase();
    if (title.includes("route") || title.includes("tech") || title.includes("db") || title.includes("database")) {
      return DEV_DIALOGS;
    }
    if (title.includes("sales") || title.includes("qbr") || title.includes("arr") || title.includes("business")) {
      return SALES_DIALOGS;
    }
    if (title.includes("inc") || title.includes("security") || title.includes("breach") || title.includes("leak") || title.includes("aws")) {
      return SECURITY_DIALOGS;
    }
    return GENERAL_DIALOGS;
  };

  const dialogues = getSimulatedDialogues();

  // 1. Core Timer Setup
  useEffect(() => {
    timerIntervalRef.current = setInterval(() => {
      setConferencingTime((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // 2. Automated Dialogue Simulation Setup
  useEffect(() => {
    if (isCapturing && useSimulation) {
      // First line immediately
      if (transcriptLines.length === 0) {
        setTranscriptLines([
          `[00:00:01] ${dialogues[0] || "Organizer: Meeting session started."}`
        ]);
        simulationIndexRef.current = 1;
      }

      feedIntervalRef.current = setInterval(() => {
        const nextIdx = simulationIndexRef.current;
        if (nextIdx < dialogues.length) {
          const timestamp = formatSeconds(conferencingTime);
          setTranscriptLines((prev) => [
            ...prev,
            `[${timestamp}] ${dialogues[nextIdx]}`
          ]);
          simulationIndexRef.current = nextIdx + 1;
        } else {
          // Loop with variation
          const timestamp = formatSeconds(conferencingTime);
          const randPerson = ["Sarah", "Dave", "Alice", "Mark", "Chloe", "Amanda"][Math.floor(Math.random() * 6)];
          const genericComments = [
            "Let's confirm and assign this item properly.",
            "I agree with that resolution strategy.",
            "Let's write a concrete roadmap item for Q3.",
            "Any other perspectives on this before we wrap up?",
            "Uptime looks correct, let's deploy the check is complete."
          ];
          const comment = genericComments[Math.floor(Math.random() * genericComments.length)];
          setTranscriptLines((prev) => [
            ...prev,
            `[${timestamp}] ${randPerson}: ${comment}`
          ]);
        }
      }, 5000); // dialogue line every 5 seconds
    }

    return () => {
      if (feedIntervalRef.current) clearInterval(feedIntervalRef.current);
    };
  }, [isCapturing, useSimulation, conferencingTime]);

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

      {/* Simulator Control Center */}
      <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <span className="text-xs font-bold text-zinc-800 block mb-1">Bridge Audio Tracking</span>
          <p className="text-[11px] text-zinc-500 leading-normal mb-2">
            TranscriptAI automatically captures browser meeting dialogues. Toggle feed controls below:
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setIsCapturing(!isCapturing)}
              className={`flex items-center gap-1.5 py-1.5 px-3 text-xs font-bold rounded-lg border transition-all ${
                isCapturing 
                  ? "bg-indigo-50 border-indigo-105 text-indigo-700 hover:bg-indigo-100" 
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

            <button
              onClick={() => setUseSimulation(!useSimulation)}
              className={`flex items-center gap-1.5 py-1.5 px-3 text-xs font-bold rounded-lg border transition-all ${
                useSimulation 
                  ? "bg-amber-50 border-amber-105 text-amber-700 hover:bg-amber-100" 
                  : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {useSimulation ? "Switch to Manual Captions" : "Enable AI Auto-Voice"}
            </button>
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
