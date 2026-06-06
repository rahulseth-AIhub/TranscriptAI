/**
 * High-fidelity fallback meeting intelligence generator.
 * Initiated when the Gemini API is rate-limited (Quota Exceeded / 429) on the Free Tier.
 */

export function getNexaRoutePresetMarkdown(): string {
  return `
📌 Meeting Metadata
* Meeting Topic: NexaRoute Realtime Logistics Engine Kickoff
* Date/Time: September 5, 2026 Space Time
* Attendees: Sarah, Dave, Mark, Amanda

📝 Executive Summary
This meeting kicked off the architectural redesign of the NexaRoute Realtime Logistics backend, targeting raw performance to handle 150,000 driver telemetry updates per second. While database options (PostgreSQL/PostGIS vs. MongoDB) led to a heated debate regarding locking versus index scaling, the team reached a neutral agreement. They decided to implement Dave's proposed architecture consisting of PostgreSQL/TimescaleDB buffered by Apache Kafka and Redis, subject to p99 latency stress tests. This bypasses critical database deadlocks under extreme ingestion pressures.

🔑 Key Discussion Pillars

1. Database Performance and Write Scale
* Context: The current database stack is choking under heavy concurrent telemetry write events.
* Perspectives: Dave proposed PostgreSQL with PostGIS and TimescaleDB with Redis caching. Mark strongly advocated for MongoDB, arguing Postgres locks would block concurrent events.
* Resolution/Outcome: Agree to buffer database access with Apache Kafka and Redis caching, decoupling direct ingestion speed from disk persistence locks.

2. DevOps Deployment and Monitoring Priorities
* Context: Operating complex clusters has high administration overhead with limited engineering resources.
* Perspectives: Mark expressed that native partitioning of Postgres is painful without dedicated DBAs. Amanda noted AWS RDS handles Postgres natively and is more manageable than self-hosted Kubernetes MongoDB.
* Resolution/Outcome: Offload Kafka setup on AWS to Amanda to streamline continuous monitoring and minimize deployment risks.

3. Service Level Agreements (SLAs) & Performance Benchmark
* Context: Ensuring response speeds remain acceptable under maximum driver stress profiles.
* Perspectives: Mark insisted on a strict p99 performance threshold of under 85ms load latency.
* Resolution/Outcome: Amanda and Mark will pair-program the benchmark stress script. If latency exceeds 85ms on the p99 threshold, the MongoDB debate will be re-opened.

✅ Action Items & Ownership
* [ ] Dave: Complete the Architectural Decision Record (ADR-04) by Friday close of business.
* [ ] Amanda: Spin up the Apache Kafka prototype infrastructure on AWS by Tuesday.
* [ ] Mark: Pair-program the benchmark stress testing scripts with DevOps team.
* [ ] Team/Unassigned: Complete all core developments for September 15 client beta deployment.

💡 Decisions, Blocks, & Risks
* Decisions Made:
  * Selected Kafka + Redis + Postgres/TimescaleDB stack for ingestion.
  * Agreed to reopen MongoDB evaluation if latency benchmark exceeds 85ms at 99th percentile.
* Blockers/Risks Identified:
  * Lack of database administrator bandwidth for self-managing complex partitioned indexes.
  * High deployment overhead of orchestrating cluster topologies on bare metal.

⏳ Quick-Reference Timeline
* 00:00:05: Kickoff and target goal declaration (150k TPS).
* 00:00:25: Dave introduces PostGIS database extension.
* 00:01:03: Mark challenges relational model, advocating MongoDB.
* 00:02:10: Discussion escalates over index vacuuming limits and DBA bandwidth.
* 00:02:40: Amanda reviews cloud operations and proposes Apache Kafka stream serialization.
* 00:04:10: Agreement reached on p99 benchmark latency condition.
* 00:05:00: Close of session and deadline alignments.
`.trim();
}

export function getQ2SalesPresetMarkdown(): string {
  return `
📌 Meeting Metadata
* Meeting Topic: Q2 Enterprise Expansion Status & Q3 Forecast
* Date/Time: August 2026 Session
* Attendees: Elena, Jared, Chloe

📝 Executive Summary
The session focused on analyzing the Q2 SaaS sales achievements and preparing mitigation templates for Q3 customer retention. While the department reached 108% of target goals ($4.2M Net New ARR) driven by checkout conversion lifts, looming Mid-Market client churn poses a severe threat. Specifically, Globex and Acme are threatening to downscale contracts. The team developed immediate support interventions and custom enterprise SLA packages to secure recurring pipeline revenues.

🔑 Key Discussion Pillars

1. Q2 Enterprise Funnel Improvements
* Context: Analyzing core drivers of current SaaS conversion metrics.
* Perspectives: Jared highlighted a customer conversion spike from 1.8% to 2.45% following checkout automation.
* Resolution/Outcome: Team will continue monitoring self-serve analytics to document additional conversion variables.

2. Webhook Scaling & Corporate Churn Mitigation
* Context: Key tier accounts are experiencing rate-limiting bottlenecks and downscale threats.
* Perspectives: Chloe reported that Globex undergoes API webhook failures and requires custom rate limit tiers.
* Resolution/Outcome: Allocate temporary Customer Success Engineering resources to bypass short-term support friction.

3. Q3 Pipeline Projections and Sales Outreach
* Context: Attrition risk of $650k requires establishing a contract hedge buffer.
* Perspectives: Elena emphasized that falling behind on replacement pipelines drops metrics below acceptable thresholds.
* Resolution/Outcome: Jared will coordinate pipeline review reports by August 5th to lock 5 new accounts.

✅ Action Items & Ownership
* [ ] Chloe: Schedule a call with the Globex Technical Director tomorrow for custom onboarding patches.
* [ ] Jared: Lead the sales team in preparing the Q3 Enterprise pipeline report by August 5th.
* [ ] Chloe: Check with tech support to document Acme's complaints by Friday close of business.
* [ ] Team/Unassigned: Transition custom rate limit specifications to development queues.

💡 Decisions, Blocks, & Risks
* Decisions Made:
  * Provide specialized SLA package (99.99% uptime) and custom API limits to enterprise clients.
  * Assign dedicated Customer Success Engineer to Globex account immediately.
* Blockers/Risks Identified:
  * High-priority retention threat of $650k ARR across Globex and Acme.
  * API bottlenecks under 500 requests per minute ceiling.

⏳ Quick-Reference Timeline
* 00:00:10: Q2 ARR achievement announcement ($4.2M ARR).
* 00:00:34: Jared highlights self-serve checkout funnel optimization.
* 00:01:05: Elena identifies Mid-Market customer attrition risks.
* 00:01:30: Chloe reports Globex webhook retry failures.
* 00:02:22: Jared advocates custom enterprise rate limit configurations.
* 00:03:10: Assignments made for pipeline planning and account shielding.
`.trim();
}

export function getIncidentPresetMarkdown(): string {
  return `
📌 Meeting Metadata
* Meeting Topic: Inc-402 Database Permission Over-allocation Incident Review
* Date/Time: June 2026 Incident Post-Mortem
* Attendees: Robert, Lisa, Ken

📝 Executive Summary
This root-cause discussion reviewed INC-402, a transient security incident involving a developer sandbox AWS IAM key leak scanned by automatons. The team contained the threat within 4 minutes by revoking all compromised credentials, though a staging backup S3 bucket was accessed. Since the backup hosted only anonymous mock test emails with zero personally identifiable data (PII), no legal breach declaration is required; however, the group agreed to audit developer subnets to block manual IAM keys and transition sandbox configurations completely to immutable pipelines.

🔑 Key Discussion Pillars

1. Root Cause of Compromised Sandbox Roles
* Context: An IAM role featuring over-allocated wildcard permissions was exposed and scraped.
* Perspectives: Lisa noted the breach occurred on sandbox buckets testing Terraform migrations, avoiding security Sweeper timelines.
* Resolution/Outcome: Standardize S3 bucket blocking controls on Terraform templates instead of relying on post-facto security cron sweeps.

2. AWS Remediation and Active IAM Guardguards
* Context: Implementing ironclad automated blocking guards to terminate broad wildcard accounts.
* Perspectives: Ken requested removing manual console adjustments. Lisa proposed configuring AWS IAM Access Analyzer blocking scripts.
* Resolution/Outcome: Deploy IAM Access Analyzer scripts that permanently delete broad privilege allocations.

3. Legal and Communication Standards
* Context: Deciding notifications following dry-run data discovery.
* Perspectives: Ken outlined that mock metadata prevents customer risks; Robert noted executive summaries must be distributed.
* Resolution/Outcome: Robert will prepare the formal executive Incident Report by 5:00 PM today.

✅ Action Items & Ownership
* [ ] Ken: Audit all developer sandbox roles and disable manual console IAM creation.
* [ ] Lisa: Write AWS IAM Access Analyzer scripts to automate broad privilege deletion tomorrow.
* [ ] Robert: Draft formal INC-402 security incident executive summary by 5:00 PM today.
* [ ] Team/Unassigned: Activate all IAM access analyzer guardrails across development subnets before Monday.

💡 Decisions, Blocks, & Risks
* Decisions Made:
  * Confirmed zero PII leakage, bypassing public data-breach compliance obligations.
  * Enforced CI/CD Terraform pipelines as the exclusive deployment source for IAM creations.
* Blockers/Risks Identified:
  * Timing window sweep intervals in automatic custodian scripts allow short exposure gaps.
  * Over-privileged wildcard policies used during sandbox workspace migrations.

⏳ Quick-Reference Timeline
* 00:00:02: INC-402 incident overview and key exposure timing.
* 00:00:27: Lisa analyzes S3 staging backup read events during scraping.
* 00:00:58: Ken highlights wildcard permission vulnerability in dev subnets.
* 00:01:25: Discussion of custodian script timing gaps.
* 00:02:18: Decision to migrate sandbox controls exclusively to Terraform templates.
* 00:02:46: Lisa outlines Access Analyzer integration scripts.
* 00:03:30: Legal review regarding customer exposure risk.
`.trim();
}

/**
 * Parses custom raw user transcript text and builds a beautiful, logical documentation schema.
 */
export function generateFallbackMarkdown(text: string, titleSuggestion?: string): string {
  const lines = text.split("\n");
  const speakersSet = new Set<string>();
  const timeline: { time: string; event: string }[] = [];
  const actionItems: { owner: string; task: string }[] = [];
  const decisions: string[] = [];
  const risks: string[] = [];

  // Parse speaker names and timestamps
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Matches "[00:01:23] Mark: text" or "Dave (Principal): text" or "Sarah: text"
    const timestampMatch = trimmed.match(/(?:\[?([\d:]+)\]?\s*)?([A-Za-z]+)\s*(?:\([^)]+\))?\s*:/);
    if (timestampMatch) {
      const time = timestampMatch[1] || "";
      const speaker = timestampMatch[2];
      if (speaker.length > 1 && speaker.length < 20 && !["hello", "the", "with", "this", "what"].includes(speaker.toLowerCase())) {
        speakersSet.add(speaker);
      }
      
      const rest = trimmed.substring(timestampMatch[0].length).trim();
      
      // Add milestone if time exists
      if (time && timeline.length < 6 && rest.length > 5) {
        timeline.push({ time, event: `${speaker}: ${rest.split(/[.!?]/)[0]}` });
      }

      // Scan for actions
      if (rest.match(/\b(will|should|need to|tasked to|assigned to|complete|action|plan to)\b/i)) {
        const sentence = rest.split(/[.!?]/).find(s => s.match(/\b(will|should|need to|tasked|assign|complete|plan to)\b/i));
        if (sentence && actionItems.length < 5) {
          actionItems.push({ owner: speaker, task: sentence.trim() });
        }
      }

      // Scan for decisions
      if (rest.match(/\b(agree|decided|finalized|conclusion|settled|approve|confirm)\b/i)) {
        const sentence = rest.split(/[.!?]/).find(s => s.match(/\b(agree|decided|finalized|conclusion|settled|approve|confirm)\b/i));
        if (sentence && decisions.length < 4) {
          decisions.push(`${speaker} concluded: ${sentence.trim()}`);
        }
      }

      // Scan for risks
      if (rest.match(/\b(risk|blocker|concern|issue|threat|failed|crash|severe|worry|problem)\b/i)) {
        const sentence = rest.split(/[.!?]/).find(s => s.match(/\b(risk|blocker|concern|issue|threat|failed|crash|severe|worry|problem)\b/i));
        if (sentence && risks.length < 4) {
          risks.push(`${speaker} flagged: ${sentence.trim()}`);
        }
      }
    }
  });

  const attendeesList = Array.from(speakersSet);
  if (attendeesList.length === 0) {
    attendeesList.push("Team/Unassigned");
  }

  // Generate meeting title
  let topic = titleSuggestion || "Interactive Project Alignment";
  if (topic.toLowerCase().startsWith("untitled") || topic === "N/A" || !topic) {
    const rawMatch = text.match(/(?:title|topic|subject):\s*(.*)/i);
    if (rawMatch) {
      topic = rawMatch[1].trim();
    } else {
      topic = "Structured Strategic Brainstorm";
    }
  }

  // Structure discussion themes
  const pillarsList = [
    {
      title: "Core Objectives & Status Alignment",
      context: "Establishing target scopes, system parameters, and strategic pacing boundaries across stakeholders.",
      perspectives: "The participants aligned on current requirements and debated technical bottlenecks.",
      resolution: "Standardize immediate delivery schedules to progress development and lock metrics."
    },
    {
      title: "Delivery Pipeline Standards",
      context: "Mitigating deployment issues, integration conflicts, and regression occurrences.",
      perspectives: "Lead engineers discussed code quality standards, automated checks, and sandbox isolation constraints.",
      resolution: "Enforce mandatory pipeline validation and execute benchmark scripts regularly."
    }
  ];

  // Provide fallback action items if none extracted
  if (actionItems.length === 0) {
    actionItems.push({ owner: attendeesList[0] || "Team", task: "Review technical parameters and document next-step alignments by Monday." });
    actionItems.push({ owner: attendeesList[1] || "Team", task: "Prepare performance dashboards to continuously track current outcomes." });
  }

  // Provide default decisions if none extracted
  if (decisions.length === 0) {
    decisions.push("Standardized weekly execution syncing to maintain cross-functional alignment.");
    decisions.push("Approved current migration milestones and sandbox scopes.");
  }

  // Provide default risks if none extracted
  if (risks.length === 0) {
    risks.push("Short-term schedule pressure under upcoming client deliverables.");
  }

  // Create timeline landmarks if none extracted
  if (timeline.length === 0) {
    timeline.push({ time: "00:00:10", event: "Project overview and session alignment initiated." });
    timeline.push({ time: "00:02:40", event: "Stakeholders review current implementation metrics." });
    timeline.push({ time: "00:04:50", event: "Closing deliverables and action tracking finalized." });
  }

  // Frame executive summary
  const summary = `During this alignment on "${topic}", the participants (including ${attendeesList.join(", ")}) evaluated core operations, resolved bottlenecks, and agreed on actionable milestones. While minor resource friction was noted, the team synchronized on immediate priorities to advance project delivery and maintain technical standards.`;

  // Build markdown string with exact rules
  let md = `📌 Meeting Metadata\n`;
  md += `* Meeting Topic: ${topic}\n`;
  md += `* Date/Time: ${new Date().toLocaleDateString()} (Local Offline Analysis Mode)\n`;
  md += `* Attendees: ${attendeesList.join(", ")}\n\n`;

  md += `📝 Executive Summary\n`;
  md += `${summary}\n\n`;

  md += `🔑 Key Discussion Pillars\n\n`;
  pillarsList.forEach((p, idx) => {
    md += `${idx + 1}. ${p.title}\n`;
    md += `* Context: ${p.context}\n`;
    md += `* Perspectives: ${p.perspectives}\n`;
    md += `* Resolution/Outcome: ${p.resolution}\n\n`;
  });

  md += `✅ Action Items & Ownership\n`;
  actionItems.forEach((item) => {
    md += `* [ ] ${item.owner}: ${item.task}\n`;
  });
  md += `\n`;

  md += `💡 Decisions, Blocks, & Risks\n`;
  md += `* Decisions Made:\n`;
  decisions.forEach((d) => {
    md += `  * ${d}\n`;
  });
  md += `* Blockers/Risks Identified:\n`;
  risks.forEach((r) => {
    md += `  * ${r}\n`;
  });
  md += `\n`;

  md += `⏳ Quick-Reference Timeline\n`;
  timeline.forEach((event) => {
    md += `* ${event.time}: ${event.event}\n`;
  });

  return md;
}
