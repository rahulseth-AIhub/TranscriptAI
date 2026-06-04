export interface PresetTranscript {
  id: string;
  name: string;
  description: string;
  titleSuggestion: string;
  transcript: string;
}

export const PRESET_TRANSCRIPTS: PresetTranscript[] = [
  {
    id: "product-kickoff",
    name: "🎯 NexaRoute Live Kickoff",
    description: "Highly technical debate between database tech stacks. Energetic alignment with heated opinions and concrete deadlines.",
    titleSuggestion: "NexaRoute Realtime Logistics Engine Kickoff",
    transcript: `[00:00:05] Sarah (PM): Alright everyone, let's jump in. Today we are kicking off the NexaRoute Realtime Logistics backend redesign. Our goal is to handle over 150,000 concurrent driver telemetry events per second.
[00:00:25] Dave (Principal Architect): Thanks Sarah. Yes, our current stack is choking. We need high-availability, low latency, and efficient geospatial querying. I am proposed PostgreSQL with the PostGIS extension, combined with Redis for quick location caching.
[00:01:03] Mark (Lead Engineer): Whoa, hold on Dave. PostGIS is great for relational data, but at 150k events per second, scale is going to be a massive blocker. I strongly advocate for MongoDB with its fully integrated geospatial indexes, or even Couchbase. Spitting flat telemetry JSON packets into MongoDB will be way faster than handling structured tables under heavy Postgres locks.
[00:01:35] Dave: Mark, we've discussed this before. MongoDB's consistency model under heavy parallel write operations causes duplicate indexes. PostGIS has reliable spatial indices (GIST) and we can partition Postgres tables natively using timescaledb.
[00:02:10] Mark (increasingly passionate): But Dave! Native Postgres partitioning is incredibly painful to manage. We'd need an entire team dedicated to vacuuming indexes and managing storage buffers. We are a team of index-starved engineers, we don't have DBA bandwidth! MongoDB gives us dynamic scaling out of the box. 
[00:02:40] Amanda (DevOps): Let's remain calm here. Speaking from the deployment side: Postgres on Amazon RDS is much easier for us to monitor than running an enterprise MongoDB cluster on self-hosted Kubernetes, which is a massive risk for our Q3 timeline. Mark, your concern about database locks is valid, but we can offload ingestion to Apache Kafka to serialize database writes.
[00:03:15] Dave: Exactly, Amanda. Kafka sits in front of Postgres. That buffers the 150k writes, decoupling the ingestion speed from the storage model. This completely mitigates the locking problem Mark is worried about.
[00:03:35] Mark: Okay, wait, if we put Apache Kafka in front, that does change things. But it introduces an extra hop. Who is going to configure the Kafka connectors?
[00:03:52] Sarah: I need this resolved today. Can we agree that Dave's architecture of Kafka + Redis cache + PG/TimescaleDB is the final decision, provided Mark signs off on the Kafka latency metrics?
[00:04:10] Mark: Fine. Under the condition that we run a stress test next week. If latency exceeds 85ms on the 99th percentile (p99), we immediately reopen the MongoDB debate.
[00:04:30] Dave: Agreeable. I'll write the architectural design doc (ADR-04) by Friday close of business.
[00:04:45] Amanda: Great, and I will spin up the Kafka prototype on AWS by Tuesday. Mark, you and I can pair-program the benchmark script.
[00:05:00] Sarah: Excellent, that's what I like to hear. Let's make sure the beta is ready for client review on September 15. Meeting adjourned!`
  },
  {
    id: "qbr-sales",
    name: "📊 Q2 Business Review & Forecasting",
    description: "A business-heavy review featuring critical revenue accomplishments, conversion metrics, expansion risks, and marketing alignment.",
    titleSuggestion: "Q2 Enterprise Expansion Status & Q3 Forecast",
    transcript: `[00:00:10] Elena (VP of Sales): Welcome everyone to the Q2 SaaS sales review. We finished the quarter at $4.2M in New Net ARR, meaning we hit 108% of our ambitious $3.9M plan.
[00:00:34] Jared (Director of Growth): That's phenomenal, Elena! The major catalyst of that growth was the conversion rate lift on our Enterprise self-serve funnel. Our conversion rates spiked from 1.8% to 2.45% thanks to the new quick-checkout system.
[00:01:05] Elena: Yes, credit to the engineering team for streamlining those checkout flows. However, we have a massive risk heading into Q3. The core issue is customer churn inside our Mid-Market segment. Specifically, Acme Corp and Globex have both signaled they might downscale their licenses.
[00:01:30] Chloe (Customer Success Lead): I can elaborate on that. Globex is complaining that our API lacks advanced webhook retries and is occasionally rate-limiting them at 500 requests per minute. They want a dedicated SLA of 99.99% uptime and custom rate limits of 10,000 requests per minute.
[00:02:00] Elena: Acme and Globex represent $650k of recurring revenue. If they churn, our Q3 forecast drops below the safety threshold. We must prioritize resolving their issues immediately.
[00:02:22] Jared: Chloe, can we assign a dedicated Customer Success Engineer to Globex temporary? Also, we need Product to prioritize custom rate limits for premium enterprise customers.
[00:02:45] Chloe: I will schedule a call with the Globex Technical Director tomorrow to walk them through a custom onboarding patch. 
[00:03:10] Elena: Perfect. Jared, I need you to lead the sales team in preparing the Q3 Enterprise pipeline report by August 5th. We need to secure at least five new accounts to buffer any attrition risks.
[00:03:35] Chloe: Understood. I will also check with our tech support team to document Acme's complaints by Friday.`
  },
  {
    id: "crisis-management",
    name: "🚨 Security Incident Root Cause Analysis",
    description: "Critical discussion during an active response event. High stakes, technical triage of an AWS IAM permission leak, and concrete resolutions.",
    titleSuggestion: "Inc-402 Database Permission Over-allocation Incident Review",
    transcript: `[00:00:02] Robert (CISO): Let's start. We need to dissect INC-402, which occurred last night at 23:45 UTC. An engineer accidentally left an AWS IAM role with wildcard permissions (*:*) exposed on an active developer sandbox, which was scanned by automated web scrapers.
[00:00:27] Lisa (SecOps Engineer): To clarify, the credential leak was detected via AWS GuardDuty within 4 minutes. The team moved swiftly to revoke the compromised IAM key pair. However, during those 4 minutes, the scrapper successfully read a dry-run staging database backup in S3, containing anonymous test emails.
[00:00:58] Ken (Engineering Manager): This is a nightmare. Our policy is clear: no wildcard permissions on non-isolated development subnets, ever. Why was this bucket not restricted with an S3 Bucket Policy blocks?
[00:01:25] Lisa: It was a temporary test bucket used for testing the migration to Terraform v1.5. The automated cloud custodian rules didn't flag it because of a timing hole in the cron sweep.
[00:02:00] Robert: Let's focus on containment and remediation. What are the key steps to guarantee this doesn't recur?
[00:02:18] Ken: First, I will have all sandbox developer accounts audited today. We must remove all manual IAM role generation. All cloud infrastructure adjustments must proceed exclusively through Terraform pipeline templates starting immediately.
[00:02:46] Lisa: I will set up AWS IAM Access Analyzer for active monitoring with automated blocking rules-so if any IAM policy with broad wildcard actions is created, it gets deleted immediately. I'll write the script for this tomorrow.
[00:03:15] Robert: Good. What about communications? Do we have a legal obligation to disclose this?
[00:03:30] Ken: Since the database backup only contained fake mock data representing anonymous test emails, there was zero personally identifiable information (PII) leaked. Legally, we does not need to declare a breach, but we should inform the executive team.
[00:03:52] Robert: I will draft the formal INC-402 security incident executive summary by 5:00 PM today. Let's make sure our access analyzer guards are active before Monday morning. Thanks everyone.`
  }
];
