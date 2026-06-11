import { useState, FormEvent, MouseEvent } from "react";
import { ParsedMinutes, ActionItem, DiscussionPillar } from "../parser";
import { exportMinutesToPDF } from "../utils/pdfGenerator";
import { 
  Users, 
  Clock, 
  Calendar,
  CheckSquare, 
  Square, 
  AlertTriangle, 
  Compass, 
  Filter, 
  Plus, 
  CheckCircle2, 
  TrendingUp, 
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Sparkles,
  Info,
  Download,
  Copy,
  Check,
  BookOpen,
  MessageSquare,
  Target,
  Activity,
  Award,
  BookmarkCheck,
  Trash2
} from "lucide-react";

interface DashboardOutputProps {
  data: ParsedMinutes;
  onUpdateActionItems: (items: ActionItem[]) => void;
  isLoading: boolean;
  isOfflineFallback?: boolean;
}

export default function DashboardOutput({
  data,
  onUpdateActionItems,
  isLoading,
  isOfflineFallback = false,
}: DashboardOutputProps) {
  const [selectedOwnerFilter, setSelectedOwnerFilter] = useState<string | null>(null);
  const [newActionOwner, setNewActionOwner] = useState("");
  const [newActionTask, setNewActionTask] = useState("");
  const [activePillarTab, setActivePillarTab] = useState<number>(0);
  const [showCopied, setShowCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[450px] gap-6 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-805 rounded-2xl shadow-sm">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 border-4 border-indigo-100 dark:border-indigo-950/40 border-t-indigo-600 rounded-full animate-spin"></div>
          <Sparkles className="absolute h-6 w-6 text-indigo-500 animate-pulse" />
        </div>
        <div className="text-center flex flex-col gap-1.5 max-w-sm">
          <p className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50 animate-pulse">
            Extracting Strategic Intelligence...
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Our AI models are filtering transcript noise, mapping discussion pillars, and structuring target deliverables.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono py-1 px-2.5 rounded-full uppercase tracking-wider">
            ⚡ Aligning Pillars
          </span>
          <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-mono py-1 px-2.5 rounded-full uppercase tracking-wider">
            ✅ Extracting actionables
          </span>
        </div>
      </div>
    );
  }

  // Get unique list of owners for filters
  const owners = Array.from(
    new Set(data.actionItems.map((item) => item.owner || "Team/Unassigned"))
  );

  // Toggle checklist item
  const handleToggleAction = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    const updated = data.actionItems.map((item) => {
      if (item.id === id) {
        return { ...item, completed: !item.completed };
      }
      return item;
    });
    onUpdateActionItems(updated);
  };

  // Delete checklist item
  const handleDeleteAction = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    const updated = data.actionItems.filter((item) => item.id !== id);
    onUpdateActionItems(updated);
  };

  // Add customized action item on the fly
  const handleAddActionItem = (e: FormEvent) => {
    e.preventDefault();
    if (!newActionTask.trim()) return;

    const newItem: ActionItem = {
      id: `action-added-${Date.now()}`,
      owner: newActionOwner.trim() || "Team/Unassigned",
      task: newActionTask.trim(),
      completed: false,
    };

    onUpdateActionItems([...data.actionItems, newItem]);
    setNewActionTask("");
    setNewActionOwner("");
  };

  // Copy entire output as readable markdown to clipboard
  const handleCopyToClipboard = () => {
    let text = `# ${data.metadata.topic}\n`;
    text += `**Date/Time:** ${data.metadata.dateTime}\n`;
    text += `**Participants:** ${data.metadata.attendees.join(", ")}\n\n`;
    text += `## Executive Summary\n${data.summary}\n\n`;
    
    text += `## Key Discussion Pillars\n`;
    data.pillars.forEach((p) => {
      text += `### Pillar ${p.index}: ${p.title}\n`;
      text += `- **Context:** ${p.context}\n`;
      text += `- **Perspectives:** ${p.perspectives}\n`;
      text += `- **Resolution:** ${p.resolution}\n\n`;
    });

    text += `## Concluded Decisions\n`;
    data.decisionsRisks.decisions.forEach((d) => {
      text += `- ${d}\n`;
    });
    text += `\n## Blockers & Risks Identified\n`;
    data.decisionsRisks.risks.forEach((r) => {
      text += `- ${r}\n`;
    });

    text += `\n## Action Items & Ownership\n`;
    data.actionItems.forEach((item) => {
      text += `- [${item.completed ? "x" : " "}] **${item.owner}**: ${item.task}\n`;
    });

    navigator.clipboard.writeText(text);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  // Filter checklist items
  const filteredActions = selectedOwnerFilter
    ? data.actionItems.filter((i) => i.owner === selectedOwnerFilter)
    : data.actionItems;

  const completedCount = data.actionItems.filter((i) => i.completed).length;
  const totalCount = data.actionItems.length;
  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Determine sentiment indicator based on meeting contents
  const getTopicInsights = () => {
    const text = (data.summary + " " + data.metadata.topic).toLowerCase();
    if (text.includes("incident") || text.includes("leak") || text.includes("crisis") || text.includes("severe")) {
      return { label: "Incident Response", color: "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/30", emoji: "🚨" };
    }
    if (text.includes("kickoff") || text.includes("introduction") || text.includes("start") || text.includes("launch")) {
      return { label: "Session Alignment", color: "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-405 dark:border-indigo-900/30", emoji: "💡" };
    }
    if (text.includes("sales") || text.includes("revenue") || text.includes("forecast") || text.includes("quarter")) {
      return { label: "Revenue Steering", color: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-405 dark:border-emerald-900/30", emoji: "📈" };
    }
    return { label: "Strategy Core", color: "bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-950/20 dark:text-amber-405 dark:border-amber-900/30", emoji: "💎" };
  };

  const sentiment = getTopicInsights();

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-zinc-900 dark:text-zinc-100">
      
      {isOfflineFallback && (
        <div className="flex items-start gap-3 p-4 bg-amber-50/70 dark:bg-amber-955/20 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs text-amber-900 dark:text-amber-250 animate-fade-in shadow-xs transition-colors duration-200">
          <Info className="h-4.5 w-4.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div className="space-y-1">
            <span className="font-bold block tracking-wider uppercase text-[10px] text-amber-800 dark:text-amber-450">Local Analysis Engine Active</span>
            <p className="leading-relaxed text-zinc-600 dark:text-zinc-400 font-medium">
              The Gemini API daily free quota limits have been exceeded. TranscriptAI has safely initialized its server-side syntax intelligence to structures your deliverables locally without interface interruption.
            </p>
          </div>
        </div>
      )}

      {/* 1. Header Hero Card */}
      <div className="relative overflow-hidden flex flex-col gap-5 bg-gradient-to-br from-zinc-50/60 to-zinc-50 dark:from-zinc-950 dark:to-zinc-900/70 p-6 md:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-md transition-all">
        {/* Decorative subtle background mesh */}
        <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/5 dark:bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-wrap items-center justify-between gap-3 z-10">
          <div className="flex items-center gap-2">
            <span className="text-2xl filter drop-shadow-sm select-none">{sentiment.emoji}</span>
            <div className={`py-1 px-3 text-xs font-semibold rounded-full border ${sentiment.color}`}>
              {sentiment.label}
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-zinc-500 dark:text-zinc-400">
            {data.metadata.dateTime !== "N/A" && (
              <div className="flex items-center gap-1.5 bg-white dark:bg-black py-1 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                <span className="font-semibold">{data.metadata.dateTime}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 z-10">
          <div className="flex-1 space-y-1.5">
            <span className="text-[10px] font-bold font-mono tracking-widest text-indigo-600 dark:text-indigo-400 uppercase select-none">Structured Intelligence Suite</span>
            <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50 leading-tight">
              {data.metadata.topic !== "N/A" ? data.metadata.topic : "Untitled Intelligence Session"}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0 select-none">
            <button
              onClick={handleCopyToClipboard}
              className="flex items-center justify-center gap-1.5 py-2 px-4 bg-white hover:bg-zinc-50 dark:bg-black dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-xl shadow-xs transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
              title="Copy minutes as robust Markdown text"
            >
              {showCopied ? (
                <>
                  <Check className="h-4 w-4 text-green-500 animate-pulse" />
                  <span className="text-green-600 dark:text-green-400 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>

            <button
              onClick={() => exportMinutesToPDF(data)}
              className="flex items-center justify-center gap-1.5 py-2 px-4.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
          </div>
        </div>

        {/* Executive Summary Quote Callout */}
        {data.summary !== "N/A" && (
          <div className="relative pl-5 border-l-3 border-indigo-500 py-1 bg-white/40 dark:bg-black/20 p-4 rounded-r-xl border-y border-r border-zinc-100 dark:border-zinc-900 shadow-2xs">
            <span className="absolute top-2 left-2 text-indigo-500/20 dark:text-indigo-400/20 font-serif text-3xl font-black select-none pointer-events-none">“</span>
            <p className="text-zinc-800 dark:text-zinc-200 text-sm md:text-[14.5px] leading-relaxed font-sans italic relative z-10 pl-2">
              {data.summary.replace(/Executive Summary /gi, "").trim()}
            </p>
          </div>
        )}

        {/* Dynamic Overview KPI Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/70 dark:bg-black/50 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 select-none">
          <div className="flex flex-col gap-0.5 px-3 py-1 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-lg">
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Pillars</span>
            <div className="flex items-center gap-1.5">
              <Compass className="h-4 w-4 text-indigo-500" />
              <span className="text-sm font-extrabold text-zinc-950 dark:text-zinc-100">{data.pillars.length} Core Themes</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-0.5 px-3 py-1 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-lg">
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Deliverables</span>
            <div className="flex items-center gap-1.5">
              <CheckSquare className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-extrabold text-zinc-950 dark:text-zinc-100">
                {completedCount} <span className="text-xs text-zinc-400 font-medium">/ {totalCount} completed</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-0.5 px-3 py-1 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-lg">
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Decisions</span>
            <div className="flex items-center gap-1.5">
              <Award className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-extrabold text-zinc-950 dark:text-zinc-100">{data.decisionsRisks.decisions.length} Concluded</span>
            </div>
          </div>

          <div className="flex flex-col gap-0.5 px-3 py-1 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-lg">
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Blocked/Risks</span>
            <div className="flex items-center gap-1.5">
              <ShieldAlert className={`h-4 w-4 ${data.decisionsRisks.risks.length > 0 ? "text-rose-500" : "text-emerald-500"}`} />
              <span className="text-sm font-extrabold text-zinc-950 dark:text-zinc-100">
                {data.decisionsRisks.risks.length === 0 ? "None" : `${data.decisionsRisks.risks.length} Flagged`}
              </span>
            </div>
          </div>
        </div>

        {/* Active Participants Group */}
        {data.metadata.attendees.length > 0 && (
          <div className="border-t border-zinc-200/50 dark:border-zinc-800/80 pt-4 mt-1">
            <div className="flex items-center gap-2 mb-2.5 select-none">
              <Users className="h-4 w-4 text-zinc-400" />
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 tracking-wider uppercase">Session Participants ({data.metadata.attendees.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.metadata.attendees.map((person, idx) => {
                const initials = person.split(" ")[0].slice(0, 2);
                // Cycle colored rings for visual richness
                const ringColors = [
                  "ring-indigo-300 dark:ring-indigo-900/60",
                  "ring-amber-300 dark:ring-amber-900/60",
                  "ring-emerald-300 dark:ring-emerald-900/60",
                  "ring-rose-300 dark:ring-rose-900/60",
                ];
                const ringCol = ringColors[idx % ringColors.length];
                return (
                  <div 
                    key={idx}
                    className={`flex items-center gap-2 py-1 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/85 rounded-full text-xs text-zinc-800 dark:text-zinc-200 font-semibold hover:scale-[1.02] shadow-xs hover:shadow-sm transition-all ring-1 ${ringCol}`}
                  >
                    <div className="h-5.5 w-5.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-full flex items-center justify-center font-mono text-[9.5px] font-bold select-none">
                      {initials}
                    </div>
                    <span>{person}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Key Discussion Pillars */}
      {data.pillars.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between pb-1">
            <h3 className="font-display text-base font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2 select-none">
              <Compass className="h-4.5 w-4.5 text-indigo-500" />
              Discussion Themes & Pillars
            </h3>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono font-medium">Select a tab below to expand detailed breakdowns</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {/* Left Nav Elements */}
            <div className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 shrink-0 select-none">
              {data.pillars.map((pillar, idx) => {
                const isActive = activePillarTab === idx;
                return (
                  <button
                    key={pillar.index}
                    onClick={() => setActivePillarTab(idx)}
                    className={`py-3 px-4 text-left text-xs font-semibold rounded-xl shrink-0 transition-all border outline-hidden ${
                      isActive
                        ? "bg-indigo-600 border-indigo-700 text-white shadow-md shadow-indigo-600/10 scale-[1.02]"
                        : "bg-white dark:bg-black border-zinc-150 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-350 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`font-mono font-extrabold text-[10px] w-5 h-5 rounded-md flex items-center justify-center transition-all ${isActive ? "bg-indigo-800 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"}`}>
                        {pillar.index}
                      </span>
                      <span className="truncate max-w-[145px] font-sans font-bold">{pillar.title}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Expanded Center Container (3 Column Deep Structure Content) */}
            <div className="md:col-span-3 bg-gradient-to-hb from-white to-zinc-50/50 dark:from-black dark:to-zinc-950/20 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-6 shadow-sm min-h-[240px] transition-colors relative">
              {data.pillars[activePillarTab] && (
                <div className="flex flex-col gap-5 animate-fade-in">
                  
                  {/* Active Pillar Lead Section */}
                  <div className="border-b border-zinc-100 dark:border-zinc-850 pb-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Active Focus Area</span>
                      <h4 className="font-display text-lg font-bold text-zinc-950 dark:text-zinc-50 md:-mt-0.5">
                        {data.pillars[activePillarTab].index}. {data.pillars[activePillarTab].title}
                      </h4>
                    </div>
                    <BookOpen className="h-5 w-5 text-indigo-500/60 dark:text-indigo-455/50 hidden sm:block" />
                  </div>

                  {/* High Fidelity Content Blocks Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* Block A: Context */}
                    <div className="flex flex-col gap-2 p-4 bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-150 dark:border-zinc-850 rounded-xl transition-all hover:bg-zinc-100/30 dark:hover:bg-zinc-900/75">
                      <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                        <Compass className="h-4 w-4 shrink-0" />
                        <span className="text-[10px] font-bold uppercase tracking-wider font-display">Ground Context</span>
                      </div>
                      <p 
                        className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans font-medium" 
                        dangerouslySetInnerHTML={{ __html: data.pillars[activePillarTab].context.replace(/\*\*/g, "") }} 
                      />
                    </div>

                    {/* Block B: Perspectives */}
                    <div className="flex flex-col gap-2 p-4 bg-amber-50/20 dark:bg-amber-950/10 border border-amber-100/70 dark:border-amber-900/20 rounded-xl transition-all hover:bg-amber-50/40 dark:hover:bg-amber-950/20">
                      <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                        <MessageSquare className="h-4 w-4 shrink-0" />
                        <span className="text-[10px] font-bold uppercase tracking-wider font-display font-semibold">Shared Perspectives</span>
                      </div>
                      <p 
                        className="text-xs text-zinc-705 dark:text-zinc-305 leading-relaxed font-sans font-medium" 
                        dangerouslySetInnerHTML={{ __html: data.pillars[activePillarTab].perspectives.replace(/\*\*/g, "") }} 
                      />
                    </div>

                    {/* Block C: Resolution */}
                    <div className="flex flex-col gap-2 p-4 bg-emerald-50/25 dark:bg-emerald-950/10 border border-emerald-100/70 dark:border-emerald-950/20 rounded-xl transition-all hover:bg-emerald-50/45 dark:hover:bg-emerald-950/20">
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <Target className="h-4 w-4 shrink-0" />
                        <span className="text-[10px] font-bold uppercase tracking-wider font-display font-semibold">Consolidated Resolution</span>
                      </div>
                      <p 
                        className="text-xs text-zinc-705 dark:text-zinc-305 leading-relaxed font-sans font-medium" 
                        dangerouslySetInnerHTML={{ __html: data.pillars[activePillarTab].resolution.replace(/\*\*/g, "") }} 
                      />
                    </div>

                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Action Items Checklist Deck */}
      {data.actionItems.length > 0 && (
        <div className="flex flex-col gap-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-150 dark:border-zinc-800 pb-2.5">
            <div className="flex items-center gap-2.5">
              <CheckSquare className="h-4.5 w-4.5 text-indigo-500" />
              <h3 className="font-display text-base font-extrabold text-zinc-950 dark:text-zinc-50">
                Action Items & Ownership Matrix
              </h3>
              <div className="bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900 text-[10.5px] font-mono font-bold text-indigo-705 dark:text-indigo-300">
                {percentComplete}% Completed
              </div>
            </div>

            {/* Filtering tools */}
            <div className="flex items-center gap-2 select-none">
              <Filter className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-550" />
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Filter by Assignee:</span>
              <select
                className="text-[11px] bg-white dark:bg-black text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-lg py-1 px-2.5 font-semibold focus:outline-hidden focus:border-indigo-550 cursor-pointer"
                value={selectedOwnerFilter || ""}
                onChange={(e) => setSelectedOwnerFilter(e.target.value || null)}
              >
                <option value="">All Participators</option>
                {owners.map((owner) => (
                  <option key={owner} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Checklist progress flow */}
          <div className="w-full bg-zinc-100 dark:bg-zinc-800/80 h-2 rounded-full overflow-hidden select-none shadow-inner">
            <div
              className="bg-indigo-600 dark:bg-indigo-505 h-full rounded-full transition-all duration-500 shadow-md"
              style={{ width: `${percentComplete}%` }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Grid checklist list */}
            <div className="lg:col-span-2 flex flex-col gap-2.5 max-h-[340px] overflow-y-auto pr-1">
              {filteredActions.length > 0 ? (
                filteredActions.map((item) => (
                  <div
                    key={item.id}
                    onClick={(e) => handleToggleAction(item.id, e)}
                    className={`flex items-start gap-4 p-3.5 border rounded-xl cursor-pointer transition-all select-none group ${
                      item.completed
                        ? "bg-zinc-50/50 dark:bg-zinc-900/20 border-zinc-200 dark:border-zinc-800/80 text-zinc-400 dark:text-zinc-500 line-through opacity-80"
                        : "bg-white dark:bg-black border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-indigo-200 dark:hover:border-indigo-900 hover:shadow-xs"
                    }`}
                  >
                    <button className="shrink-0 mt-0.5 focus:outline-none">
                      {item.completed ? (
                        <CheckCircle2 className="h-4.5 w-4.5 text-green-500 fill-green-50 dark:fill-green-950" />
                      ) : (
                        <div className="h-4.5 w-4.5 border-2 border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950 group-hover:border-indigo-500 transition-colors" />
                      )}
                    </button>
                    
                    <div className="flex-1 flex flex-col gap-1.5">
                      <span className="text-[13px] leading-relaxed font-semibold text-zinc-800 dark:text-zinc-200 font-sans">
                        {item.task}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9.5px] font-bold font-mono py-0.5 px-2 rounded-lg self-start ${
                          item.completed 
                            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500" 
                            : "bg-indigo-50 dark:bg-indigo-950/65 text-indigo-700 dark:text-indigo-300 border border-indigo-100/50 dark:border-indigo-900/30"
                        }`}>
                          @{item.owner}
                        </span>
                      </div>
                    </div>

                    {/* Delete Action Item Button */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteAction(item.id, e)}
                      className="shrink-0 text-zinc-400 hover:text-red-500 dark:hover:text-red-405 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none cursor-pointer"
                      title="Remove task from matrix"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 p-4 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/10 text-center">
                  <p className="text-xs text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider">No tasks found</p>
                  <p className="text-[11px] text-zinc-400">Clear filter or append a deliverable using the adjacent widget.</p>
                </div>
              )}
            </div>

            {/* Quick add action item widget */}
            <form
              onSubmit={handleAddActionItem}
              className="p-5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/80 dark:bg-zinc-950/40 flex flex-col gap-4 shrink-0 h-fit"
            >
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-bold font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                  Quick-Append Task
                </span>
                <Activity className="h-3.5 w-3.5 text-zinc-450" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider">Task Specification</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Deploy NexaRoute stack filters"
                  value={newActionTask}
                  onChange={(e) => setNewActionTask(e.target.value)}
                  className="text-xs leading-loose border border-zinc-200 dark:border-zinc-800 rounded-lg py-1.5 px-3 bg-white dark:bg-black text-zinc-800 dark:text-zinc-100 max-w-full focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider">Owner / Delegate</label>
                <input
                  type="text"
                  placeholder="e.g., Mark, Amanda, Team"
                  value={newActionOwner}
                  onChange={(e) => setNewActionOwner(e.target.value)}
                  className="text-xs leading-loose border border-zinc-200 dark:border-zinc-800 rounded-lg py-1.5 px-3 bg-white dark:bg-black text-zinc-800 dark:text-zinc-100 max-w-full focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-indigo-500/20"
              >
                <Plus className="h-4 w-4" /> Inline Append Task
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. Bento Decisions & Risks Registry */}
      {(data.decisionsRisks.decisions.length > 0 || data.decisionsRisks.risks.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Decisions Made Bento Col */}
          <div className="flex flex-col gap-3 p-5 border border-emerald-100/70 dark:border-emerald-900/35 rounded-2xl bg-emerald-50/15 dark:bg-emerald-950/10 shadow-2xs">
            <h4 className="text-sm font-extrabold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2 select-none">
              <span className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-450" />
              </span>
              Concluded Alignment
            </h4>
            <ul className="flex flex-col gap-2.5">
              {data.decisionsRisks.decisions.length > 0 ? (
                data.decisionsRisks.decisions.map((item, idx) => (
                  <li 
                    key={idx} 
                    className="text-xs md:text-[12.5px] leading-relaxed text-zinc-750 dark:text-zinc-300 font-sans font-medium flex items-start gap-2.5 py-1 px-2.5 bg-white/40 dark:bg-zinc-900/20 border border-emerald-100/30 dark:border-zinc-800 rounded-lg transition-colors hover:bg-white/70 dark:hover:bg-zinc-900/40"
                  >
                    <ArrowRight className="h-3.5 w-3.5 text-emerald-555 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))
              ) : (
                <span className="text-xs text-zinc-400 dark:text-zinc-550">N/A</span>
              )}
            </ul>
          </div>

          {/* Risks & Blockers Bento Col */}
          <div className={`flex flex-col gap-3 p-5 border rounded-2xl shadow-2xs transition-colors ${
            data.decisionsRisks.risks.length > 0 
              ? "border-rose-100/70 dark:border-rose-900/35 bg-rose-50/15 dark:bg-rose-950/10" 
              : "border-emerald-100/40 dark:border-emerald-900/15 bg-emerald-50/10 dark:bg-emerald-950/5"
          }`}>
            <h4 className={`text-sm font-extrabold uppercase tracking-widest flex items-center gap-2 select-none ${
              data.decisionsRisks.risks.length > 0 ? "text-rose-800 dark:text-rose-400" : "text-emerald-800 dark:text-emerald-400"
            }`}>
              <span className={`p-1 rounded-lg ${
                data.decisionsRisks.risks.length > 0 ? "bg-rose-50 dark:bg-rose-950/30" : "bg-emerald-50 dark:bg-emerald-950/30"
              }`}>
                <ShieldAlert className={`h-4 w-4 ${
                  data.decisionsRisks.risks.length > 0 ? "text-rose-650 dark:text-rose-455" : "text-emerald-600 dark:text-emerald-450"
                }`} />
              </span>
              Blockers & Vulnerabilities
            </h4>
            <ul className="flex flex-col gap-2.5">
              {data.decisionsRisks.risks.length > 0 ? (
                data.decisionsRisks.risks.map((item, idx) => (
                  <li 
                    key={idx} 
                    className="text-xs md:text-[12.5px] leading-relaxed text-rose-950 dark:text-rose-250 font-sans font-medium flex items-start gap-2.5 py-1 px-2.5 bg-white/40 dark:bg-zinc-900/20 border border-rose-100/35 dark:border-zinc-800 rounded-lg transition-colors hover:bg-white/70 dark:hover:bg-zinc-900/40"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
                    <span>{item}</span>
                  </li>
                ))
              ) : (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-sans font-medium italic">
                  🎉 No blockers or risks flagged. Excellent meeting alignment!
                </span>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* 5. Precise Timeline Shifts Flow */}
      {data.timeline.length > 0 && (
        <div className="flex flex-col gap-4 select-none">
          <h3 className="font-display text-base font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
            <Clock className="h-4.5 w-4.5 text-indigo-500" />
            Tactical Reference Timeline
          </h3>

          <div className="relative pl-6 border-l-2 border-indigo-200 dark:border-indigo-900/60 py-3 ml-2.5 flex flex-col gap-6">
            {data.timeline.map((event, idx) => (
              <div key={idx} className="relative group/timeline">
                {/* Visual Node Marker */}
                <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-indigo-600 bg-white dark:bg-black group-hover/timeline:bg-indigo-600 group-hover/timeline:scale-125 transition-all shadow-xs" />
                
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
                  <div className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/85 border border-indigo-100/50 dark:border-indigo-900/30 py-0.5 px-2 rounded-md tracking-wider shrink-0 w-fit">
                    {event.time}
                  </div>
                  <p className="text-xs md:text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-200 font-semibold font-sans group-hover/timeline:text-zinc-950 dark:group-hover/timeline:text-zinc-50 transition-colors">
                    {event.event}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
