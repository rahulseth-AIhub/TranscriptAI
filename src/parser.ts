export interface MeetingMetadata {
  topic: string;
  dateTime: string;
  attendees: string[];
}

export interface DiscussionPillar {
  index: number;
  title: string;
  context: string;
  perspectives: string;
  resolution: string;
}

export interface ActionItem {
  id: string;
  owner: string;
  task: string;
  completed: boolean;
}

export interface DecisionsRisks {
  decisions: string[];
  risks: string[];
}

export interface TimelineEvent {
  time: string;
  event: string;
}

export interface ParsedMinutes {
  metadata: MeetingMetadata;
  summary: string;
  pillars: DiscussionPillar[];
  actionItems: ActionItem[];
  decisionsRisks: DecisionsRisks;
  timeline: TimelineEvent[];
  rawMarkdown: string;
}

/**
 * Robustly parses strict-schema markdown into data structures.
 */
export function parseMeetingMarkdown(markdown: string): ParsedMinutes {
  const result: ParsedMinutes = {
    metadata: { topic: "N/A", dateTime: "N/A", attendees: [] },
    summary: "N/A",
    pillars: [],
    actionItems: [],
    decisionsRisks: { decisions: [], risks: [] },
    timeline: [],
    rawMarkdown: markdown,
  };

  if (!markdown) return result;

  // Split section content by '## ' headings
  const sections = markdown.split(/\n##\s+/);

  sections.forEach((sect) => {
    // Trim and normalize headings
    const lines = sect.split("\n");
    const headingLine = lines[0].trim();
    const contentBody = lines.slice(1).join("\n").trim();

    // Check headings (resilient to exact icons/emojis/capitalization)
    if (headingLine.includes("Metadata") || headingLine.includes("📌")) {
      // Parse metadata lines
      const topicMatch = contentBody.match(/\*\*Meeting Topic:\*\*\s*(.*)/i);
      const dateMatch = contentBody.match(/\*\*Date\/Time:\*\*\s*(.*)/i);
      const attendeeMatch = contentBody.match(/\*\*Attendees:\*\*\s*(.*)/i);

      if (topicMatch) result.metadata.topic = topicMatch[1].trim();
      if (dateMatch) result.metadata.dateTime = dateMatch[1].trim();
      if (attendeeMatch) {
         const rawList = attendeeMatch[1].trim();
         // split by comma or list items
         result.metadata.attendees = rawList
           .split(/[,;]/)
           .map((x) => x.replace(/^\*|\*$/g, "").trim())
           .filter(Boolean);
      }
    } else if (headingLine.includes("Summary") || headingLine.includes("📝")) {
      result.summary = contentBody.replace(/\*/g, "").trim();
    } else if (headingLine.includes("Pillars") || headingLine.includes("🔑")) {
      // Split by '### ' for each pillar
      const pillarBlocks = contentBody.split(/\n###\s+/);
      pillarBlocks.forEach((block) => {
        const blLines = block.split("\n");
        let title = blLines[0].trim();
        // Skip header lines that aren't titles
        if (!title || title.startsWith("*")) return;

        // Strip index prefix e.g., "1. NexaRoute Stack" to "NexaRoute Stack"
        const indexMatch = title.match(/^(\d+)[.\s]+(.*)/);
        let index = result.pillars.length + 1;
        if (indexMatch) {
          index = parseInt(indexMatch[1]);
          title = indexMatch[2].trim();
        }

        const remainingContent = blLines.slice(1).join("\n");

        const contextMatch = remainingContent.match(/\*\*Context:\*\*\s*(.*)/i);
        const permMatch = remainingContent.match(/\*\*Perspectives:\*\*\s*(.*)/i);
        const resMatch = remainingContent.match(/\*\*(?:Resolution\/Outcome|Outcome):\*\*\s*(.*)/i);

        result.pillars.push({
          index,
          title,
          context: contextMatch ? contextMatch[1].trim() : "N/A",
          perspectives: permMatch ? permMatch[1].trim() : "N/A",
          resolution: resMatch ? resMatch[1].trim() : "N/A",
        });
      });
    } else if (headingLine.includes("Action Items") || headingLine.includes("✅")) {
      // Parse checkboxes: * [ ] **Owner**: Task details
      const itemLines = contentBody.split("\n");
      itemLines.forEach((l, idx) => {
        const trimmed = l.trim();
        if (!trimmed) return;

        // Try Owner pattern: * [ ] **Owner**: task description
        const ownerTaskMatch = trimmed.match(/^\*?\s*\[\s*[x ]\s*\]\s*\*\*([^*]+)\*\*:\s*(.*)/i);
        if (ownerTaskMatch) {
          result.actionItems.push({
            id: `action-${idx}`,
            owner: ownerTaskMatch[1].trim(),
            task: ownerTaskMatch[2].trim(),
            completed: trimmed.toLowerCase().includes("[x]"),
          });
        } else {
          // Broad checkbox fallback
          const broadMatch = trimmed.match(/^\*?\s*\[\s*[x ]\s*\]\s*(.*)/i);
          if (broadMatch) {
            const splitColon = broadMatch[1].split(":");
            if (splitColon.length > 1 && splitColon[0].startsWith("**") && splitColon[0].endsWith("**")) {
              const owner = splitColon[0].replace(/\*/g, "").trim();
              const task = splitColon.slice(1).join(":").trim();
              result.actionItems.push({
                id: `action-${idx}`,
                owner,
                task,
                completed: trimmed.toLowerCase().includes("[x]"),
              });
            } else {
              result.actionItems.push({
                id: `action-${idx}`,
                owner: "Team/Unassigned",
                task: broadMatch[1].trim(),
                completed: trimmed.toLowerCase().includes("[x]"),
              });
            }
          }
        }
      });
    } else if (headingLine.includes("Decisions") || headingLine.includes("💡")) {
      // Look for bullets under Decisions Made and Blockers/Risks Identified
      const lines = contentBody.split("\n");
      let activeList: "decisions" | "risks" | null = null;

      lines.forEach((l) => {
        const tr = l.trim();
        if (!tr) return;

        if (tr.toLowerCase().includes("decisions made")) {
          activeList = "decisions";
          return;
        } else if (tr.toLowerCase().includes("blockers") || tr.toLowerCase().includes("risks")) {
          activeList = "risks";
          return;
        }

        // Parse bullet points
        const bulletMatch = tr.match(/^[-*+]\s+(.*)/);
        if (bulletMatch) {
          const content = bulletMatch[1].trim();
          if (activeList === "decisions") {
            result.decisionsRisks.decisions.push(content);
          } else if (activeList === "risks") {
            result.decisionsRisks.risks.push(content);
          }
        } else if (tr.startsWith("1.") || tr.startsWith("2.") || tr.startsWith("3.")) {
          const content = tr.replace(/^\d+\.\s*/, "").trim();
          if (activeList === "decisions") {
            result.decisionsRisks.decisions.push(content);
          } else if (activeList === "risks") {
            result.decisionsRisks.risks.push(content);
          }
        }
      });
    } else if (headingLine.includes("Timeline") || headingLine.includes("⏳")) {
      const timeLines = contentBody.split("\n");
      timeLines.forEach((l) => {
        const tr = l.trim();
        if (!tr) return;

        // Try extracting timestamps from lines e.g., '* [00:01:25] Triage started' or '* **00:01:25**: Event details'
        const timeMatch = tr.match(/^[-*+]\s+\[?([\d:]+)\]?\s*(?:-?\s*)(.*)/);
        const boldTimeMatch = tr.match(/^[-*+]\s+\*\*([\d:]+)\*\*:\s*(.*)/);

        if (boldTimeMatch) {
          result.timeline.push({
            time: boldTimeMatch[1].trim(),
            event: boldTimeMatch[2].trim(),
          });
        } else if (timeMatch) {
          result.timeline.push({
            time: timeMatch[1].trim(),
            event: timeMatch[2].trim(),
          });
        } else {
          // General line fallback if bullet list exists
          const bullet = tr.match(/^[-*+]\s+(.*)/);
          if (bullet) {
            result.timeline.push({
              time: "N/A",
              event: bullet[1].trim(),
            });
          }
        }
      });
    }
  });

  // If we ended up with nothing because formatting differed, provide default fallbacks
  if (result.metadata.topic === "N/A" && result.pillars.length === 0) {
    // Attempt relaxed parsing or pre-fill raw view
  }

  return result;
}
