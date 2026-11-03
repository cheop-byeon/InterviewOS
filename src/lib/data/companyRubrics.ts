import { TargetLevel } from "../types";

export interface CompanyRubricProfile {
  id: string;
  company: string;
  loopStyleName: string;
  badgeColor: string;
  corePhilosophy: string;
  interviewerPersonaPrompt: string;
  mustHitSignals: string[];
  autoFailRedFlags: string[];
  followUpProbes: string[];
  levelBarDiff: Record<TargetLevel, string>;
}

export interface AtsVendorProfile {
  id: "workday" | "greenhouse" | "lever" | "taleo_icims" | "teamtailor";
  name: string;
  marketShare: string;
  usedByCompanies: string[];
  parsingBehavior: string;
  weights: {
    hardSkillWeight: number;
    architectureWeight: number;
    impactWeight: number;
    parsabilityWeight: number;
  };
  strictChecks: {
    requireAcronymExpansion: boolean;
    penalizeMultiColumn: boolean;
    requireStandardDateHeaders: boolean;
  };
  recruiterTip: string;
}

export const COMPANY_INSIDER_RUBRICS: CompanyRubricProfile[] = [
  {
    id: "stripe",
    company: "Stripe",
    loopStyleName: "Production Pragmatism, Idempotency & Working Code",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    corePhilosophy:
      "Stripe interviewers do not care about obscure dynamic programming tricks. They grade heavily on clean, extensible code, defensive error handling, API backward compatibility, and ledger correctness under network retries.",
    interviewerPersonaPrompt:
      "You are a Staff Engineer on Stripe's Core Payments & Ledger team. Push the candidate on idempotency keys, partial failure recovery, double-entry ledger invariants, and webhook retry storms.",
    mustHitSignals: [
      "Client-generated Idempotency-Key persisted atomically with ledger state",
      "Two-phase state machine (PENDING -> SUCCEEDED / FAILED) with lease recovery",
      "Defensive edge-case handling (timeouts, duplicate webhooks, clock skew)",
      "Pragmatic relational data modeling (PostgreSQL ACID before premature NoSQL)"
    ],
    autoFailRedFlags: [
      "Assuming external HTTP payment gateway calls are atomic or never time out",
      "Using floating-point numbers (float/double) instead of integer cents/minor units",
      "Ignoring split-brain lock expiration when a worker pauses for GC"
    ],
    followUpProbes: [
      "What happens if your worker crashes right after calling the downstream card network, before committing `COMPLETED` to PostgreSQL?",
      "How do you prevent a hot merchant account receiving 5,000 TPS from locking out all other ledger writes?"
    ],
    levelBarDiff: {
      L4: "Writes clean, modular code and identifies basic retry/duplicate request edge cases.",
      L5: "Designs end-to-end idempotent APIs with atomic database locking and clear failure recovery.",
      L6: "Addresses multi-region ledger reconciliation, hot-account sharding (sub-ledgers), and zero-downtime schema evolution."
    }
  },
  {
    id: "openai_anthropic",
    company: "OpenAI / Anthropic",
    loopStyleName: "Frontier AI Systems, GPU Roofline & Safe Agentic Infra",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    corePhilosophy:
      "Evaluates deep systems-level understanding of modern AI infrastructure: GPU HBM memory bandwidth bottlenecks, KV-cache management, asynchronous token streaming, and strict sandboxing for tool-use agents.",
    interviewerPersonaPrompt:
      "You are a Member of Technical Staff on the Inference & Distributed Systems team. Probe on compute-bound prefill vs. memory-bandwidth-bound decode, KV-cache eviction, and fault-tolerant distributed execution.",
    mustHitSignals: [
      "Distinguishing compute-bound Prefill from memory-bandwidth-bound Decode phases",
      "PagedAttention / non-contiguous KV-cache block allocation and prefix caching",
      "Token-aware rate limiting (TPM + RPM) and backpressure over SSE/gRPC streams",
      "MicroVM (Firecracker/gVisor) + egress firewall isolation for untrusted code/tool execution"
    ],
    autoFailRedFlags: [
      "Treating LLM inference like a standard 10ms stateless REST microservice",
      "Running untrusted LLM-generated Python/Bash inside a shared host container without syscall/network isolation"
    ],
    followUpProbes: [
      "A 128k-token prompt arrives in the same batch as twenty 200-token decode requests. How do you prevent head-of-line blocking on Time-To-First-Token (TTFT)?",
      "How do you route multi-turn chat traffic so a 50k-token system prompt stays warm in GPU HBM?"
    ],
    levelBarDiff: {
      L4: "Explains continuous batching, SSE token streaming, and basic vector/RAG indexing.",
      L5: "Quantifies KV-cache HBM footprint in GB and designs prefix-aware routing + disaggregated prefill/decode.",
      L6: "Architects cross-cluster GPU scheduling, speculative decoding trade-offs, and graceful degradation under HBM OOM."
    }
  },
  {
    id: "amazon",
    company: "Amazon",
    loopStyleName: "Bar Raiser Loop (16 Leadership Principles + High-Scale SOA)",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    corePhilosophy:
      "Every round evaluates both technical depth and Amazon Leadership Principles (Customer Obsession, Ownership, Dive Deep, Disagree and Commit, Frugality). Interviewers drill down 3–4 layers until they find the boundary of what YOU personally built.",
    interviewerPersonaPrompt:
      "You are an Amazon Principal Bar Raiser. Challenge any vague 'we' statements—ask 'What was YOUR specific technical decision?' Probe on operational excellence, p99 latency SLAs, DynamoDB partition key hot-spots, and cost frugality.",
    mustHitSignals: [
      "First-person ownership ('I architected / I debugged') backed by hard before/after metrics",
      "Explicit trade-off defense showing 'Disagree and Commit' or 'Bias for Action'",
      "Cellular architecture / bulkhead isolation to cap blast radius",
      "Mitigating hot partitions in DynamoDB/Kinesis (write sharding / jitter)"
    ],
    autoFailRedFlags: [
      "Saying 'We did X' without being able to explain the low-level implementation details when probed",
      "Blaming teammates or product managers during failure/conflict stories without owning corrective action"
    ],
    followUpProbes: [
      "You said your team migrated to Kafka—what specific alternative did YOU evaluate in the RFC, and who pushed back?",
      "If one celebrity merchant causes a 100x traffic spike on a single partition key, how do you prevent throttling across the table?"
    ],
    levelBarDiff: {
      L4: "SDE I: Delivers well-scoped components reliably and demonstrates Bias for Action & Learn and Be Curious.",
      L5: "SDE II: Owns end-to-end service architecture, resolves operational incidents, and influences team engineering bar.",
      L6: "SDE III (Principal track): Drives multi-team architecture, simplifies complex legacy systems, and raises organizational SLAs."
    }
  },
  {
    id: "meta",
    company: "Meta",
    loopStyleName: "Speed Coding (2 Problems / 35m) & Planet-Scale Fanout",
    badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    corePhilosophy:
      "Meta coding rounds require solving TWO medium/hard problems in 35 minutes with optimal time/space complexity and dry-running test cases mentally. System design focuses on multi-billion user fanout, TAO social graph caching, and eventual consistency.",
    interviewerPersonaPrompt:
      "You are an IC6 Staff Engineer at Meta. Keep a brisk pace. In coding, ask for time/space complexity before and after coding, and require a manual dry-run on edge cases. In design, probe on hybrid push/pull fanout and cache invalidation storms.",
    mustHitSignals: [
      "Immediate identification of optimal Big-O time and space complexity before writing code",
      "Proactive dry-run walkthrough with empty/single-element/skewed edge cases",
      "Hybrid fanout-on-write (normal users) vs. fanout-on-read (celebrities >100k followers)",
      "Lease-based cache invalidation to prevent thundering herds on Memcached/Redis"
    ],
    autoFailRedFlags: [
      "Spending 25 minutes on Problem 1 or relying on trial-and-error code execution instead of dry-running",
      "Pushing synchronous fanout writes to 50 million followers on a single post publish"
    ],
    followUpProbes: [
      "Can we eliminate the O(N) auxiliary hash map space if the input array is already sorted or bounded?",
      "When a regional cache cluster cold-boots after a power outage, how do you prevent 2 million QPS from melting the underlying MySQL shards?"
    ],
    levelBarDiff: {
      L4: "IC4: Solves both coding problems cleanly with minimal hints; covers core functional system design.",
      L5: "IC5: Finishes both coding problems in <30m with bug-free dry runs; drives system design capacity & bottleneck deep dives proactively.",
      L6: "IC6: Defines multi-region consistency trade-offs, tail-latency amplification, and operational degradation modes without prompting."
    }
  },
  {
    id: "google",
    company: "Google",
    loopStyleName: "GCA (General Cognitive Ability), Constraint Mutation & Scale",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    corePhilosophy:
      "Google interviewers start with an intentionally deceptively simple prompt and progressively mutate constraints ('Now the data doesn't fit in RAM', 'Now we need strong global consistency') to test first-principles algorithmic and systems reasoning.",
    interviewerPersonaPrompt:
      "You are a Staff SWE at Google. Start with a clean problem, then progressively tighten constraints (streaming input, bounded memory, straggler nodes, Byzantine/corrupted chunks) to see how the candidate adapts from first principles.",
    mustHitSignals: [
      "Clarifying input scale, distribution skew, and memory bounds before proposing an algorithm",
      "Smoothly adapting data structures when problem constraints change (e.g., Hash Map -> Min-Heap -> External Merge Sort / Count-Min Sketch)",
      "Understanding consensus (Raft/Paxos), TrueTime/lease locks, and content-addressable chunking"
    ],
    autoFailRedFlags: [
      "Memorizing a canned architecture without being able to derive why a component is needed when QPS changes by 100x",
      "Missing off-by-one or graph cycle termination conditions"
    ],
    followUpProbes: [
      "Now suppose the key space has 10 billion unique items and you only have 64MB of RAM per worker. How do you approximate Top-K within 0.1% error?",
      "If a chunk server reports slow disk I/O (tail latency straggler), how do hedged requests reduce P99 latency?"
    ],
    levelBarDiff: {
      L4: "L4 (SWE III): Translates ambiguous prompts into optimal algorithms and handles 1–2 constraint mutations.",
      L5: "L5 (Senior SWE): Anticipates scaling bottlenecks early, proves complexity bounds, and designs fault-tolerant distributed state.",
      L6: "L6 (Staff SWE): Balances global consistency vs. availability, hardware failure domains, and multi-tenant resource isolation."
    }
  },
  {
    id: "spotify_nordic",
    company: "Spotify (Nordic)",
    loopStyleName: "Squad Autonomy, Collaborative Architecture & Planet-Scale Audio",
    badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    corePhilosophy:
      "Nordic engineering loops (Spotify in Stockholm, Supercell/Oura in Helsinki) reject adversarial 'gotcha' puzzle interviews. They treat the round as a collaborative whiteboard session between two Squad engineers, evaluating pragmatic GCP/Java/Go/Backstage architecture, cross-device state synchronization, and low-ego psychological safety.",
    interviewerPersonaPrompt:
      "You are a Staff Backend Engineer in a Spotify Core Playback & Personalization Squad in Stockholm. Collaborate warmly, probe on edge-caching (CDN byte-range), GCP PubSub/Bigtable data pipelines, Backstage microservice ownership, and how the candidate navigates autonomous Squad alignment without top-down hierarchy.",
    mustHitSignals: [
      "Collaborative 'Squad peer' communication—inviting trade-off feedback rather than lecturing",
      "Decoupling hot playback/streaming paths (CDN + Redis) from async royalty & ML personalization streams (Pub/Sub)",
      "Handling offline/flaky mobile client synchronization with idempotent sequence numbers",
      "Blameless post-mortem mindset and cross-discipline collaboration (Product, Design, Data Science)"
    ],
    autoFailRedFlags: [
      "Hero/rockstar ego or dismissing interviewer suggestions ('That won't work')",
      "Over-engineering custom infrastructure when managed GCP (Bigtable/PubSub/Spanner) or standard patterns solve the problem"
    ],
    followUpProbes: [
      "If Discover Weekly's batch recommendation pipeline fails or lags by 6 hours, how does the client home-screen gracefully degrade without blocking playback?",
      "In a flat Nordic organization without strict top-down mandates, how did you align two autonomous Squads when their API priorities conflicted?"
    ],
    levelBarDiff: {
      L4: "Engineer II: Writes clean, well-tested Java/Python/TS services, collaborates openly, and understands service SLAs.",
      L5: "Senior Engineer: Owns Squad-level architecture end-to-end, mentors peers, and drives pragmatic reliability improvements.",
      L6: "Staff Engineer (Tribe/Alliance scope): Shapes technical strategy across multiple Squads via RFCs and Golden Path tooling (Backstage)."
    }
  },
  {
    id: "klarna_wolt_nordic",
    company: "Klarna / Wolt (Nordic)",
    loopStyleName: "Pragmatic FinTech/Logistics, EU GDPR & Real-Time Dispatch",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    corePhilosophy:
      "Klarna (Stockholm), Wolt (Helsinki), Vipps (Oslo), and Cognite emphasize clean domain-driven code (Kotlin/TypeScript/Go/Python), event-driven Kafka state machines, strict EU GDPR data privacy ('crypto-shredding' PII), and sub-100ms checkout/courier decisioning.",
    interviewerPersonaPrompt:
      "You are a Principal Engineer at Klarna (Stockholm) / Wolt (Helsinki). Probe the candidate on real-time Kafka event streaming, double-entry financial ledger invariants, EU GDPR Right-to-Erasure on immutable logs, and dynamic courier/checkout SLA degradation during Nordic winter peak surges.",
    mustHitSignals: [
      "Event-driven architecture with transactional Outbox / Change Data Capture (CDC) to avoid dual-write bugs",
      "EU GDPR & PSD2 awareness: isolating PII from immutable financial/telemetry event streams (crypto-shredding)",
      "Pragmatic domain modeling, clean testable code, and explicit circuit-breaker timeouts on third-party APIs"
    ],
    autoFailRedFlags: [
      "Storing unencrypted customer SSN/Personnummer or raw PII directly inside immutable Kafka topics",
      "Performing synchronous blocking calls to slow external banking APIs without a timeout or fallback"
    ],
    followUpProbes: [
      "Under EU GDPR, a customer in Sweden exercises Right-to-Erasure, but financial regulations require keeping the payment ledger for 7 years. How do you design the schema?",
      "During a Friday evening snowstorm in Helsinki, courier supply drops 40% while restaurant orders spike 3x. How does your dispatch engine prevent cascading queue backpressure?"
    ],
    levelBarDiff: {
      L4: "Mid-Level: Delivers production-ready Kotlin/TS/Python code with unit tests and clear domain boundaries.",
      L5: "Senior Engineer: Designs resilient Kafka/PostgreSQL event flows, handles GDPR/idempotency edge cases, and leads incident recovery.",
      L6: "Staff / Principal: Architects multi-country EU payment/logistics platforms, regulatory compliance by design, and cross-domain SLAs."
    }
  },
  {
    id: "finn_vend_schibsted",
    company: "FINN.no / Vend & Schibsted",
    loopStyleName: "Federated Marketplaces (Blocket/Tori/DBA), Vespa Search & VG Edge",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    corePhilosophy:
      "Vend Marketplaces (FINN.no in Oslo, Blocket in Stockholm, Tori/Oikotie in Helsinki, DBA/Bilbasen in Denmark) and Schibsted Media (VG.no, Aftonbladet, Aftenposten, SvD) value pragmatic TDD pair-programming, Kafka Data Mesh contracts, Vespa/OpenSearch faceted search, and Varnish edge caching for breaking-news spikes.",
    interviewerPersonaPrompt:
      "You are a Staff Platform & Marketplace Engineer at FINN.no / Vend & Schibsted in Oslo/Stockholm. Probe the candidate on Kafka schema evolution (Data Contracts across FINN/Blocket/Tori), Vespa/Elasticsearch faceted geo-search, 'Fiks Ferdig' transactional escrow locking, and Varnish stale-while-revalidate request coalescing on VG.no.",
    mustHitSignals: [
      "Transactional Outbox -> Kafka -> Vespa/OpenSearch indexing instead of brittle dual-writes",
      "Data Mesh governance: Avro/Protobuf backward-compatible Data Contracts across federated Nordic brands",
      "Varnish edge caching (`stale-while-revalidate` + single-flight request coalescing) for VG/Aftonbladet traffic spikes",
      "Pragmatic, user-centric Nordic engineering culture (trust, sustainable velocity, TDD, low hierarchy)"
    ],
    autoFailRedFlags: [
      "Synchronous dual-writes to PostgreSQL and Elasticsearch/Vespa inside the HTTP request thread",
      "Breaking downstream Data Mesh consumers by mutating Kafka event schemas without backward compatibility",
      "Letting 300k QPS breaking-news traffic bypass Varnish/CDN and hit the origin database directly"
    ],
    followUpProbes: [
      "When a seller publishes or updates a listing on FINN.no / Blocket, how do you guarantee the Vespa search index updates within 1 second without dual-write race conditions?",
      "Major breaking news hits VG.no and traffic jumps 50x in 15 seconds. What happens at the Varnish layer when a cached front-page object expires while 10,000 requests are in flight?"
    ],
    levelBarDiff: {
      L4: "Developer: Writes clean, well-tested Kotlin/Java/Go/TS code, practices TDD, and understands REST/Kafka basics.",
      L5: "Senior Engineer: Owns end-to-end domain services (Search, Fiks Ferdig Escrow, Schibsted Account SSO) and defends caching/consistency trade-offs.",
      L6: "Staff / Principal Architect: Aligns cross-country platform architecture across FINN, Blocket, Tori, and DBA using Data Mesh contracts and Golden Paths."
    }
  }
];

export const ATS_VENDOR_PROFILES: AtsVendorProfile[] = [
  {
    id: "workday",
    name: "Workday Enterprise ATS",
    marketShare: "38% of Fortune 500 (Amazon, Netflix, Nvidia, Target, Banks)",
    usedByCompanies: ["Amazon", "Nvidia", "Netflix", "Salesforce", "Citigroup"],
    parsingBehavior:
      "Strict XML/block layout parser. Frequently scrambles multi-column PDFs, floating text boxes, and non-standard section headers. Heavily weights exact hard-skill noun phrases.",
    weights: {
      hardSkillWeight: 0.45,
      architectureWeight: 0.25,
      impactWeight: 0.15,
      parsabilityWeight: 0.15
    },
    strictChecks: {
      requireAcronymExpansion: true,
      penalizeMultiColumn: true,
      requireStandardDateHeaders: true
    },
    recruiterTip:
      "Workday's parser strips tables and right-hand sidebars first. Always use single-column layouts and include both acronyms and full terms (e.g., 'gRPC', 'PostgreSQL')."
  },
  {
    id: "greenhouse",
    name: "Greenhouse Recruiting",
    marketShare: "Top High-Growth Tech (Stripe, OpenAI, Anthropic, Uber, Airbnb)",
    usedByCompanies: ["Stripe", "OpenAI", "Anthropic", "Uber", "Airbnb", "Databricks"],
    parsingBehavior:
      "Modern full-text indexer paired with structured Recruiter Scorecard rubrics. Recruiters filter candidates using boolean keyword queries (`PostgreSQL AND Kafka AND (L5 OR Senior)`) alongside quantified impact.",
    weights: {
      hardSkillWeight: 0.35,
      architectureWeight: 0.30,
      impactWeight: 0.25,
      parsabilityWeight: 0.10
    },
    strictChecks: {
      requireAcronymExpansion: false,
      penalizeMultiColumn: false,
      requireStandardDateHeaders: true
    },
    recruiterTip:
      "Greenhouse highlights matched JD keywords directly in the recruiter preview pane and maps your bullets to structured 'Scorecard Attributes' (e.g., Distributed Systems, Technical Leadership)."
  },
  {
    id: "lever",
    name: "Lever Talent Suite",
    marketShare: "Mid-Market & Series B–D AI Startups",
    usedByCompanies: ["Scale AI", "Figma", "Plaid", "Linear", "Vercel"],
    parsingBehavior:
      "Contextual resume parser that emphasizes recent role velocity, strong ownership verbs, and quantified engineering outcomes (Google XYZ bullet density).",
    weights: {
      hardSkillWeight: 0.30,
      architectureWeight: 0.25,
      impactWeight: 0.35,
      parsabilityWeight: 0.10
    },
    strictChecks: {
      requireAcronymExpansion: false,
      penalizeMultiColumn: false,
      requireStandardDateHeaders: false
    },
    recruiterTip:
      "Engineering managers reviewing in Lever scan the top 3 bullets of your most recent role in <8 seconds—front-load your hardest latency/QPS/revenue metrics."
  },
  {
    id: "taleo_icims",
    name: "iCIMS / Oracle Taleo Legacy",
    marketShare: "Legacy Enterprise, Defense & Global Telecom",
    usedByCompanies: ["Oracle", "JPMorgan", "Lockheed Martin", "IBM", "Cisco"],
    parsingBehavior:
      "Literal token-matching engine with minimal synonym expansion. If the JD says 'Kubernetes' and your resume only says 'K8s', literal matchers score it as 0.",
    weights: {
      hardSkillWeight: 0.50,
      architectureWeight: 0.20,
      impactWeight: 0.10,
      parsabilityWeight: 0.20
    },
    strictChecks: {
      requireAcronymExpansion: true,
      penalizeMultiColumn: true,
      requireStandardDateHeaders: true
    },
    recruiterTip:
      "Mirror exact phrasing from the Job Description and avoid creative section titles like 'My Journey'—use 'EXPERIENCE', 'EDUCATION', and 'SKILLS'."
  },
  {
    id: "teamtailor",
    name: "Teamtailor & Jobylon Nordic ATS",
    marketShare: "#1 in Sweden, Norway, Finland & Denmark (8,000+ Nordic Employers incl. FINN/Vend & Schibsted)",
    usedByCompanies: ["FINN.no / Vend", "Schibsted / VG", "Sana Labs", "Epidemic Sound", "Einride", "Oura"],
    parsingBehavior:
      "Modern AI-assisted Nordic ATS platforms (headquartered in Stockholm). Parses clean PDF layouts well, auto-tags core stack skills (Kotlin, Java, TypeScript, Go, Python, Kafka, Vespa, GCP/AWS), and surfaces collaborative ownership, EU/EEA work-permit status, and product impact.",
    weights: {
      hardSkillWeight: 0.35,
      architectureWeight: 0.30,
      impactWeight: 0.25,
      parsabilityWeight: 0.10
    },
    strictChecks: {
      requireAcronymExpansion: false,
      penalizeMultiColumn: false,
      requireStandardDateHeaders: true
    },
    recruiterTip:
      "Nordic hiring managers using Teamtailor and Jobylon (used by Schibsted/Vend) value low-ego team impact alongside individual metrics—highlight both quantified system outcomes AND cross-functional Squad/Tribe collaboration."
  }
];
