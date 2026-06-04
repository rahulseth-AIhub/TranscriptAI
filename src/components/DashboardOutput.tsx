import { useState, FormEvent } from "react";
import { ParsedMinutes, ActionItem, DiscussionPillar } from "../parser";
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
  Info
} from "lucide-react";

interface DashboardOutputProps {
  data: ParsedMinutes;
  onUpdateActionItems: (items: ActionItem[]) => void;
  isLoading: boolean;
}

export default function DashboardOutput({
  data,
  onUpdateActionItems,
  isLoading,
}: DashboardOutputProps) {
  const [selectedOwnerFilter, setSelectedOwnerFilter] = useState<string | null>(null);
  const [newActionOwner, setNewActionOwner] = useState("");
  const [newActionTask, setNewActionTask] = useState("");
  const [activePillarTab, setActivePillarTab] = useState<number>(0);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px] gap-4">
        <div className="relative flex items-center justify-center">
          <div className="h-12 w-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
          <Sparkles className="absolute h-5 w-5 text-indigo-500 animate-pulse" />
        </div>
        <p className="font-display text-sm font-semibold text-zinc-800 animate-pulse">
          TranscriptAI is processing & structuring minutes...
        </p>
        <span className="text-[11px] text-zinc-400 font-mono tracking-wider uppercase">
          Aligning Pillars • Extracting Deliverables
        </span>
      </div>
    );
  }

  // Get unique list of owners for filters
  const owners = Array.from(
    new Set(data.actionItems.map((item) => item.owner || "Team/Unassigned"))
  );

  // Toggle checklist item
  const handleToggleAction = (id: string) => {
    const updated = data.actionItems.map((item) => {
      if (item.id === id) {
        return { ...item, completed: !item.completed };
      }
      return item;
    });
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
    if (text.includes("incident") || text.includes("leak") || text.includes("crisis")) {
      return { label: "Incident Containment", color: "bg-rose-50 text-rose-700 border-rose-100", emoji: "🚨" };
    }
    if (text.includes("kickoff") || text.includes("launch")) {
      return { label: "Project Alignment", color: "bg-indigo-50 text-indigo-700 border-indigo-100", emoji: "💡" };
    }
    if (text.includes("sales") || text.includes("net arr") || text.includes("forecast")) {
      return { label: "Strategic Review", color: "bg-emerald-50 text-emerald-700 border-emerald-100", emoji: "📊" };
    }
    return { label: "Operational Core", color: "bg-zinc-50 text-zinc-700 border-zinc-100", emoji: "⚡" };
  };

  const sentiment = getTopicInsights();

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-zinc-900">
      
      {/* 1. Header Hero Card */}
      <div className="flex flex-col gap-4 bg-zinc-50 dark:bg-zinc-850 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-805">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{sentiment.emoji}</span>
            <div className={`py-1 px-3 text-xs font-semibold rounded-full border ${sentiment.color}`}>
              {sentiment.label}
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
            {data.metadata.dateTime !== "N/A" && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>{data.metadata.dateTime}</span>
              </div>
            )}
          </div>
        </div>

        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-zinc-950 leading-tight">
          {data.metadata.topic !== "N/A" ? data.metadata.topic : "Untitled Intelligence Session"}
        </h1>

        {/* Executive Summary Paragraph with elegant Display quotation */}
        {data.summary !== "N/A" && (
          <div className="relative pl-4 border-l-2 border-indigo-500 py-1">
            <p className="text-zinc-700 dark:text-zinc-300 text-sm md:text-[15px] leading-relaxed font-sans italic">
              "{data.summary.replace(/Executive Summary /gi, "").trim()}"
            </p>
          </div>
        )}

        {/* 2. Attendees list */}
        {data.metadata.attendees.length > 0 && (
          <div className="border-t border-zinc-200/60 pt-3 mt-1">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-zinc-400" />
              <span className="text-xs font-bold text-zinc-500 tracking-wide uppercase">Active Participants ({data.metadata.attendees.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {data.metadata.attendees.map((person, idx) => {
                const initials = person.split(" ")[0].slice(0, 2);
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 py-1 px-2.5 bg-white border border-zinc-200/70 rounded-full text-xs text-zinc-700 font-medium"
                  >
                    <div className="h-5 w-5 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-mono text-[9px] font-bold">
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

      {/* 3. Discussion Pillars (Dynamic Side-by-Side Accordion) */}
      {data.pillars.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-md font-bold text-zinc-900 flex items-center gap-2">
              <Compass className="h-4 w-4 text-indigo-500" />
              Key Discussion Pillars
            </h3>
            <span className="text-xs text-zinc-400 font-mono font-medium">Click themes below to explore details</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Quick theme tabs */}
            <div className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 shrink-0 select-none">
              {data.pillars.map((pillar, idx) => (
                <button
                  key={pillar.index}
                  onClick={() => setActivePillarTab(idx)}
                  className={`py-2 px-3 text-left text-xs font-semibold rounded-lg shrink-0 transition-all ${
                    activePillarTab === idx
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border border-zinc-150"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center ${activePillarTab === idx ? "bg-indigo-800 text-white" : "bg-zinc-200 text-zinc-700"}`}>
                      {pillar.index}
                    </span>
                    <span className="truncate max-w-[130px]">{pillar.title}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Pillar detailed body columns */}
            <div className="md:col-span-3 bg-white border border-zinc-100 rounded-xl p-5 shadow-sm min-h-[220px]">
              {data.pillars[activePillarTab] && (
                <div className="flex flex-col gap-4 animate-fade-in">
                  <div className="border-b border-zinc-105 pb-2">
                    <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-widest">Pillar {data.pillars[activePillarTab].index} Detail</span>
                    <h4 className="font-display text-base font-bold text-zinc-901">
                      {data.pillars[activePillarTab].title}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Context Column */}
                    <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-lg">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Context</span>
                      <p className="text-xs text-zinc-700 leading-relaxed font-sans font-medium" dangerouslySetInnerHTML={{ __html: data.pillars[activePillarTab].context.replace(/\*\*/g, "") }} />
                    </div>

                    {/* Perspectives Column */}
                    <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-lg">
                      <span className="text-[9px] font-bold text-amber-600/80 uppercase tracking-widest block mb-1">Perspectives</span>
                      <p className="text-xs text-zinc-700 leading-relaxed font-sans font-medium" dangerouslySetInnerHTML={{ __html: data.pillars[activePillarTab].perspectives.replace(/\*\*/g, "") }} />
                    </div>

                    {/* Resolution Column */}
                    <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg">
                      <span className="text-[9px] font-bold text-emerald-600/80 uppercase tracking-widest block mb-1">Resolution</span>
                      <p className="text-xs text-zinc-700 leading-relaxed font-sans font-medium hover:text-black transition-colors" dangerouslySetInnerHTML={{ __html: data.pillars[activePillarTab].resolution.replace(/\*\*/g, "") }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Action Items Checklist Grid */}
      {data.actionItems.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-2">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-indigo-500" />
              <h3 className="font-display text-md font-bold text-zinc-900">
                Action Items & Ownership matrix
              </h3>
              <span className="text-xs font-mono text-zinc-405 font-bold">
                ({percentComplete}% Done)
              </span>
            </div>

            {/* Filtering by active owner */}
            <div className="flex items-center gap-1.5 select-none">
              <Filter className="h-3 w-3 text-zinc-400" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Owner:</span>
              <select
                className="text-[10px] bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md py-0.5 px-2 font-medium"
                value={selectedOwnerFilter || ""}
                onChange={(e) => setSelectedOwnerFilter(e.target.value || null)}
              >
                <option value="">All Owners</option>
                {owners.map((owner) => (
                  <option key={owner} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action progress bar */}
          <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden select-none">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${percentComplete}%` }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Checklist lists */}
            <div className="md:col-span-2 flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1">
              {filteredActions.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleAction(item.id)}
                  className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                    item.completed
                      ? "bg-zinc-50 border-zinc-150 text-zinc-400 line-through opacity-85"
                      : "bg-white border-zinc-100 shadow-xs hover:border-indigo-150"
                  }`}
                >
                  <button className="shrink-0 mt-0.5">
                    {item.completed ? (
                      <CheckCircle2 className="h-4w-4 text-green-500" />
                    ) : (
                      <div className="h-4 w-4 border border-zinc-350 rounded-md bg-white hover:border-indigo-500" />
                    )}
                  </button>
                  <div className="flex-1 flex flex-col gap-0.5">
                    <span className="text-xs leading-relaxed font-semibold">
                      {item.task}
                    </span>
                    <span className={`text-[9px] font-bold font-mono py-0.5 px-1.5 rounded-full self-start ${
                      item.completed 
                        ? "bg-zinc-100 text-zinc-400" 
                        : "bg-indigo-50 text-indigo-700"
                    }`}>
                      {item.owner}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick add action item right widget */}
            <form
              onSubmit={handleAddActionItem}
              className="p-4 border border-zinc-150 rounded-xl bg-zinc-50 flex flex-col gap-3 shrink-0 h-fit"
            >
              <span className="text-[10px] font-bold text-zinc-505 uppercase tracking-widest block border-b border-zinc-200 pb-1">
                Refine Deliverables
              </span>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-zinc-500 uppercase">Task Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Deploy access filters script"
                  value={newActionTask}
                  onChange={(e) => setNewActionTask(e.target.value)}
                  className="text-xs leading-loose border border-zinc-200 rounded-md py-1 px-2.5 bg-white max-w-full"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-zinc-500 uppercase">Assign Owner</label>
                <input
                  type="text"
                  placeholder="e.g., Mark, Amanda, Team"
                  value={newActionOwner}
                  onChange={(e) => setNewActionOwner(e.target.value)}
                  className="text-xs leading-loose border border-zinc-200 rounded-md py-1 px-2.5 bg-white max-w-full"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold rounded-md shadow-xs transition-all"
              >
                <Plus className="h-3.5 w-3.5" /> Append Deliverable
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. Bento Decisions & Risks Registry */}
      {(data.decisionsRisks.decisions.length > 0 || data.decisionsRisks.risks.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Decisions Made Column */}
          <div className="flex flex-col gap-2.5 p-4 border border-emerald-100 rounded-xl bg-emerald-50/20 shadow-xs">
            <h4 className="text-xs font-bold text-emerald-850 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Decisions Concluded
            </h4>
            <ul className="flex flex-col gap-2 custom-list">
              {data.decisionsRisks.decisions.length > 0 ? (
                data.decisionsRisks.decisions.map((item, idx) => (
                  <li key={idx} className="text-xs leading-relaxed text-zinc-700 font-sans font-medium flex items-start gap-2">
                    <ArrowRight className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))
              ) : (
                <span className="text-xs text-zinc-400">N/A</span>
              )}
            </ul>
          </div>

          {/* Risks & Blockers Column */}
          <div className="flex flex-col gap-2.5 p-4 border border-rose-100 rounded-xl bg-rose-50/20 shadow-xs">
            <h4 className="text-xs font-bold text-rose-850 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-rose-600" />
              Blockers & Risks Flagged
            </h4>
            <ul className="flex flex-col gap-2 custom-list">
              {data.decisionsRisks.risks.length > 0 ? (
                data.decisionsRisks.risks.map((item, idx) => (
                  <li key={idx} className="text-xs leading-relaxed text-zinc-700 font-sans font-medium flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))
              ) : (
                <span className="text-xs text-zinc-400">N/A</span>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* 6. Timeline Shifts Flow */}
      {data.timeline.length > 0 && (
        <div className="flex flex-col gap-3 select-none">
          <h3 className="font-display text-md font-bold text-zinc-900 flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-500" />
            Quick-Reference Timeline
          </h3>

          <div className="relative pl-4 border-l-2 border-zinc-150 py-2 ml-1 flex flex-col gap-4">
            {data.timeline.map((event, idx) => (
              <div key={idx} className="relative group">
                {/* Visual Timeline Node */}
                <div className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full border border-indigo-600 bg-white group-hover:bg-indigo-605 shadow-xs transition-colors" />

                <div className="flex flex-wrap items-baseline gap-2.5">
                  <span className="font-mono text-[10px] font-bold text-indigo-650 tracking-wider">
                    {event.time}
                  </span>
                  <p className="text-xs leading-relaxed text-zinc-700 font-medium font-sans">
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
