"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Database,
  Filter,
  MessageSquareQuote,
  Plus,
  Sparkles,
  ThumbsUp,
  Users
} from "lucide-react";
import { COMPANY_QUESTION_BANK } from "../lib/data/mockInterviewData";
import { ActiveTab, CompanyQuestionItem, TargetLevel } from "../lib/types";

interface QuestionBankProps {
  onNavigateToModule: (tab: ActiveTab, topicId?: string) => void;
  onDatabaseMutated?: () => void;
}

const WALKTHROUGH_DECKS: Record<
  "revolut" | "finn_vg" | "spotify" | "wolt" | "stripe",
  {
    title: string;
    subtitle: string;
    steps: {
      timestamp: string;
      speaker: string;
      transcript: string;
      committeeAnnotation: string;
      badge: string;
    }[];
  }
> = {
  revolut: {
    title: "Revolut (Europe/Nordics L5/L6 Loop) — Live TDD Load Balancer & Double-Entry FX Ledger",
    subtitle:
      "Europe's largest private tech company ($45B–$115B valuation) runs one of the most distinctive engineering loops in Europe: strict TDD without frameworks + Double-Entry FinTech Architecture:",
    steps: [
      {
        timestamp: "01:45",
        speaker: "Revolut Interviewer (Core Payments — London / Stockholm / Vilnius)",
        transcript:
          "Welcome to the Live Coding round. Build an in-memory LoadBalancer that registers up to 10 backend instances, rejects duplicates, and routes traffic via Round-Robin. Please share your screen—we expect strict TDD in pure Java 21 / Kotlin / Python without Spring Boot.",
        committeeAnnotation:
          "Revolut Live Coding Rule #1: Jumping straight into implementation without writing a failing unit test first is the #1 reason strong engineers fail this round.",
        badge: "Strict TDD Gate"
      },
      {
        timestamp: "03:10",
        speaker: "Candidate (L5 Senior Backend — Offer Accepted)",
        transcript:
          "I'll start in `LoadBalancerTest` by writing our first failing test: `shouldRejectRegistrationWhenCapacityExceeded()` and `shouldRejectDuplicateAddress()`. For O(1) registration and O(1) removal, I'll pair an ArrayList with a HashMap mapping each address to its array index, and guard `register/unregister` with a `ReentrantReadWriteLock` while using `AtomicInteger` for lock-free Round-Robin cursor increments.",
        committeeAnnotation:
          "Strong Hire Signal: Writes unit tests first, avoids O(N) list removal by swapping with the tail element, and separates read concurrency from write locks.",
        badge: "Exceeds Bar"
      },
      {
        timestamp: "34:20",
        speaker: "Candidate (System Design Round — Multi-Currency FX Transfer)",
        transcript:
          "For a 10,000 SEK -> EUR conversion, we never run `UPDATE accounts SET balance = balance - X` with floats. First, we atomically consume the 30-second Redis `quote_id` lock. Second, inside PostgreSQL via jOOQ, we acquire `SELECT ... FOR UPDATE` locks sorted deterministically by `account_id` (to make bidirectional A<->B deadlocks impossible) and append two immutable Double-Entry Ledger rows (`DEBIT` SEK, `CREDIT` EUR) in integer minor units.",
        committeeAnnotation:
          "Strong Hire Verdict: Hits all three Revolut non-negotiables: Double-Entry immutability, integer minor units, and deterministic lock ordering.",
        badge: "Strong Hire Signal"
      }
    ]
  },
  finn_vg: {
    title: "FINN.no / Vend & VG.no (Oslo/Stockholm L5 Loop) — Varnish Edge & Fiks Ferdig Escrow",
    subtitle:
      "How FINN.no / Vend Marketplaces (Blocket, Tori, DBA) and Schibsted Media (VG.no, Aftonbladet) evaluate pragmatic architecture and edge resilience:",
    steps: [
      {
        timestamp: "03:20",
        speaker: "Interviewer (FINN.no Torget / Vend Recommerce — Oslo)",
        transcript:
          "On FINN 'Fiks ferdig' (and Blocket/Tori transactional shipping), a popular vintage camera is listed for 2,500 NOK. Three buyers tap 'Buy Now' with Vipps within the same 150ms window. How do you ensure exactly one buyer gets the reservation while Vespa search immediately reflects 'Reserved'?",
        committeeAnnotation:
          "FINN/Vend Core Marketplace Probe: Tests atomic inventory locking + avoidance of fragile dual-writes between PostgreSQL and Vespa/OpenSearch.",
        badge: "Concurrency & Search"
      },
      {
        timestamp: "04:10",
        speaker: "Candidate (L5 Senior Backend — Offer Accepted)",
        transcript:
          "We never dual-write from the HTTP handler. Inside a single PostgreSQL transaction, we execute `UPDATE listings SET status='RESERVED', version=version+1 WHERE ad_id=$1 AND status='ACTIVE'` and insert an `AdReserved` event into our `outbox_events` table. Only one buyer gets `rows_affected = 1`; the other two immediately get HTTP 409 Conflict. Debezium/CDC streams the outbox event to Kafka, updating the Vespa document attribute in <300ms.",
        committeeAnnotation:
          "Strong Hire Signal: Combines optimistic concurrency control with the Transactional Outbox pattern—exact pattern used across FINN, Blocket, and Tori.",
        badge: "Exceeds Bar"
      },
      {
        timestamp: "19:45",
        speaker: "Interviewer (Schibsted Media / VG.no Platform — Oslo/Stockholm)",
        transcript:
          "Now imagine breaking news hits VG.no and Aftonbladet—traffic jumps 50x to 300,000 requests/sec while the newsroom republishes the front page every 5 seconds. What happens when the Varnish cache TTL expires?",
        committeeAnnotation:
          "Schibsted/VG Signature Probe: Varnish Cache was originally born at VG! Interviewers expect you to know request coalescing and grace mode.",
        badge: "VG Edge Spike"
      },
      {
        timestamp: "20:30",
        speaker: "Candidate (L5 Senior Backend — Offer Accepted)",
        transcript:
          "Without protection, a cache miss at 300k QPS causes a thundering herd that melts the CMS origin. In Varnish we configure `beresp.ttl = 5s` with `beresp.grace = 60s` (`stale-while-revalidate`) and request coalescing. When the 5s TTL expires, all 300k concurrent readers are immediately served the slightly stale cached HTML in <5ms while a single background thread coalesces the backend fetch to refresh the cache.",
        committeeAnnotation:
          "Strong Hire Verdict: Demonstrates deep mastery of Varnish grace mode + single-flight request coalescing.",
        badge: "Strong Hire Signal"
      }
    ]
  },
  spotify: {
    title: "Spotify (Stockholm L5 Loop) — Production Case Study & Band Manifesto",
    subtitle:
      "Spotify includes a unique 'Production Incident Case Study' round alongside System Design and the 'Band Manifesto' cultural alignment round:",
    steps: [
      {
        timestamp: "02:10",
        speaker: "Spotify Interviewer (Core Playback Squad — Stockholm)",
        transcript:
          "A top global artist just dropped a surprise album at midnight CET. Playlist service P99 latency spiked from 40ms to 2.4s, and Discover Weekly recommendations are timing out. How do you triage this live?",
        committeeAnnotation:
          "Spotify Case Study Probe: Tests real-world operational instincts, observability (Grafana/OpenTelemetry), and graceful degradation rather than textbook theory.",
        badge: "Incident Scenario"
      },
      {
        timestamp: "03:05",
        speaker: "Candidate (L5 Senior Backend — Offer Accepted)",
        transcript:
          "First, I'd protect the core audio streaming path by shedding load on non-critical personalization: trip the circuit breaker on dynamic ML recommendations and serve a static cached fallback from CDN/Redis so playback never fails. Second, I'd inspect Bigtable/Redis hot-key telemetry for the new album URI—millions of concurrent fetches on a single partition key require local in-memory edge caching (5s TTL) on the API pods.",
        committeeAnnotation:
          "Strong Hire Signal: Candidate prioritizes user playback continuity (graceful degradation) and immediately diagnoses the hot-partition thundering herd.",
        badge: "Exceeds Bar"
      },
      {
        timestamp: "28:40",
        speaker: "Candidate (Band Manifesto / Squad Autonomy Round)",
        transcript:
          "When our Squad's schema migration broke a downstream data pipeline, I led a blameless post-mortem with the Data Chapter, added contract tests in our Backstage CI template, and shared the learnings across the Tribe.",
        committeeAnnotation:
          "Nordic Culture Fit (+1.0): Demonstrates low-ego accountability, psychological safety, and autonomous Squad collaboration without blaming others.",
        badge: "Band Manifesto Fit"
      }
    ]
  },
  wolt: {
    title: "Wolt (Helsinki L5 Loop) — Take-Home Assignment Live Refactoring Defense",
    subtitle:
      "Wolt is famous in the Nordics for its production-grade Take-Home API assignment followed by a live 60-minute technical defense & requirement mutation:",
    steps: [
      {
        timestamp: "04:15",
        speaker: "Wolt Interviewer (Courier Logistics — Helsinki)",
        transcript:
          "Your take-home delivery fee service is super clean and Dockerized. Now suppose during a Helsinki Friday snowstorm we need to add a dynamic 'winter surge tier' based on real-time courier supply in that H3 hexagon. How would you refactor your pricing engine right now without breaking existing unit tests?",
        committeeAnnotation:
          "Wolt Take-Home Defense Probe: Verifies that you actually wrote your take-home code yourself and designed extensible, decoupled domain logic.",
        badge: "Live Refactoring"
      },
      {
        timestamp: "05:00",
        speaker: "Candidate (L5 Backend — Offer Accepted)",
        transcript:
          "Because I structured the fee rules using the Strategy/Chain-of-Responsibility pattern (`FeeRule` interface), we don't need to touch the existing distance or small-order surcharge classes. I'll inject a `WeatherSurgeRule` that reads the cached H3 supply ratio from Redis with a 50ms fallback default if Redis is unreachable, and add a parameterized unit test for the surge boundaries.",
        committeeAnnotation:
          "Strong Hire Verdict: Pragmatic, clean domain boundaries (not over-engineered, easy to extend live) + defensive fallback for external state.",
        badge: "Strong Hire Signal"
      }
    ]
  },
  stripe: {
    title: "Stripe (L6 Staff Loop) — Distributed Payment Ledger Idempotency",
    subtitle:
      "See exact Hiring Committee annotations at each timestamp of a Staff Backend architecture round:",
    steps: [
      {
        timestamp: "00:45",
        speaker: "Candidate (L6 Staff Loop — Stripe)",
        transcript:
          "Before choosing a database for the payment ledger, let's lock down our invariants: we need strict serializability on balance debits, zero double-charges under client network retries, and 15,000 peak write QPS.",
        committeeAnnotation:
          "Strong L6 Signal (+1.0): Candidate immediately defines correctness invariants (idempotency + serializability) before naming technologies.",
        badge: "Exceeds Bar"
      },
      {
        timestamp: "06:20",
        speaker: "Interviewer Pushback",
        transcript:
          "If the client retries a POST /charge request after a TCP timeout, how do you guarantee the downstream payment gateway isn't billed twice if your first worker crashed mid-flight?",
        committeeAnnotation:
          "Crucial Distributed Systems Probe: Tests whether the candidate understands atomic state transitions vs. naive cache checks.",
        badge: "Probe"
      },
      {
        timestamp: "07:05",
        speaker: "Candidate (L6 Staff Loop — Stripe)",
        transcript:
          "We require a client-generated UUID `Idempotency-Key` header. We insert that key into PostgreSQL with state `STARTED` and a 60s lease lock inside the same ACID transaction as the ledger intent row. If a worker crashes before committing `COMPLETED`, the recovery worker queries the payment gateway using the deterministic idempotency token before re-executing.",
        committeeAnnotation:
          "Strong Hire Verdict: Explains the exact two-phase recovery state machine (`STARTED` -> `COMPLETED` with lease expiration) used in Stripe's real production architecture.",
        badge: "Strong Hire Signal"
      }
    ]
  }
};

const APPLICANT_FEEDBACK_REPORTS = [
  {
    company: "Revolut (Nordics Branch — Stockholm / London / Remote Europe)",
    role: "Senior Backend Engineer (Java 21 / Kotlin / Python)",
    outcome: "Offer Accepted (€155k + Equity — Europe's #1 Private Tech Co)",
    loopSummary:
      "Recruiter Screen -> 60m Live TDD Pair Coding (Load Balancer / Money Transfer in pure Java/Kotlin/Python — NO Spring Boot!) -> 60m System Design (Multi-Currency FX Quote Lock & Double-Entry Ledger) -> Bar Raiser ('Never Settle' Execution Round).",
    whatWorked:
      "Writing unit tests BEFORE writing a single line of business logic in the Live Coding round, using `ReentrantReadWriteLock` + `AtomicInteger` for thread-safety, and explaining deterministic lock ordering (`min(accA, accB)`) + Double-Entry Ledger rows in System Design.",
    watchOutFor:
      "Do NOT use `float`/`double` for money, do NOT rely on Spring `@Autowired` magic in the coding round, and do NOT write implementation code before writing unit tests—Revolut grades strict TDD discipline."
  },
  {
    company: "FINN.no / Vend (Blocket, Tori) & Schibsted (VG, Aftonbladet)",
    role: "Senior Backend / Platform Engineer (Kotlin, Go, TypeScript)",
    outcome: "Offer Accepted (1.12M NOK + Bonus + 7% Pension — Oslo / Stockholm)",
    loopSummary:
      "Recruiter Screen (via Jobylon ATS) -> 60m Pragmatic Pair-Programming / Case Study Review (TDD, clean domain boundaries) -> System Design (Vespa search, Kafka Data Contracts, Fiks Ferdig escrow, or VG Varnish caching) -> Squad Values & Autonomous Culture Fit.",
    whatWorked:
      "Understanding the 2024–2025 split between Vend Marketplaces (FINN.no, Blocket, Tori.fi, Oikotie, DBA, Bilbasen) and Schibsted Media (VG, Aftonbladet, Aftenposten, SvD). Talking about Kafka Data Contracts, Vespa search, and Varnish `stale-while-revalidate` resonated immediately.",
    watchOutFor:
      "FINN and Schibsted engineers strongly dislike ego and over-complicated 'resume-driven architecture'. Write clean, testable code in the pairing round, explain your trade-offs simply, and emphasize user trust and team autonomy."
  },
  {
    company: "Spotify (Stockholm HQ)",
    role: "Senior Backend Engineer (L5)",
    outcome: "Offer Accepted (1.08M SEK + RSU + Relocation)",
    loopSummary:
      "4 Rounds: 1) CoderPad Practical API/DSA (60m), 2) Distributed System Design (CDN + Pub/Sub), 3) Production Incident Case Study, 4) Band Manifesto Culture Round.",
    whatWorked:
      "Treating the interviewers like fellow Squad peers rather than an exam panel. Knowing how Spotify uses GCP (Bigtable, Pub/Sub) and Backstage, and emphasizing autonomous collaboration.",
    watchOutFor:
      "Don't expect LeetCode Hard DP puzzles—they care much more about readable Java/Kotlin/Python code, testability, and how you debug production bottlenecks."
  },
  {
    company: "Wolt (Helsinki HQ / Stockholm)",
    role: "Senior Backend Engineer (Kotlin / Python)",
    outcome: "Offer Accepted (€108k + DoorDash RSU)",
    loopSummary:
      "Recruiter Screen -> Production Take-Home Assignment -> 60m Take-Home Code Defense & Live Refactoring -> System Design (Real-time Courier Geo Dispatch) -> Values Round.",
    whatWorked:
      "Treating the Take-Home assignment like a real production PR: integer minor units for currency, 95% unit/edge-case test coverage, clean `docker compose up`, and a concise trade-offs section in the README.",
    watchOutFor:
      "In the Take-Home review, they WILL ask you to add a new feature live. Keep your classes decoupled so you can add a new rule in 10 minutes."
  },
  {
    company: "Klarna (Stockholm HQ)",
    role: "Senior Software Engineer — Core FinTech",
    outcome: "Offer Extended",
    loopSummary:
      "Recruiter Screen (includes AI workflow questions) -> Domain Coding Test (State machines & safe money math) -> System Design (Idempotent BNPL Checkout & GDPR) -> Behavioral.",
    whatWorked:
      "Using integer cents/öre (never floats!) in the coding test, modeling state transitions explicitly (`AUTHORIZED -> CAPTURED`), and discussing GDPR crypto-shredding in the Kafka design round.",
    watchOutFor:
      "Never use `float` or `double` for currency in Klarna's coding assessment—it is an automatic rejection."
  },
  {
    company: "Supercell / Oura / Sana Labs (Helsinki & Stockholm)",
    role: "Senior Full-Stack / AI Systems Engineer",
    outcome: "Onsite Completed",
    loopSummary:
      "High-autonomy product engineering loops: Live repo/code hygiene walkthrough + Domain System Design (BLE Ring Sync / Enterprise RAG / Game Server Matchmaking) + Founder/Cell Fit.",
    whatWorked:
      "High product empathy. At Supercell they ask 'What game are you playing and how would you improve it?'; at Oura and Sana they probe deeply on battery/latency trade-offs and code craftsmanship.",
    watchOutFor:
      "Generic mass-application answers fail quickly in Nordic scale-ups—show genuine curiosity for their specific product domain."
  }
];

export default function QuestionBank({
  onNavigateToModule,
  onDatabaseMutated
}: QuestionBankProps) {
  const [subTab, setSubTab] = useState<
    "questions" | "peer_annotated" | "data_pipeline"
  >("questions");
  const [selectedCompany, setSelectedCompany] = useState<string>("All");
  const [selectedRound, setSelectedRound] = useState<string>("All");
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [upvotes, setUpvotes] = useState<Record<string, number>>({
    q_openai_1: 48,
    q_stripe_1: 62,
    q_uber_1: 39,
    q_anthropic_1: 54,
    q_meta_1: 41,
    q_google_1: 33
  });
  const [questions, setQuestions] = useState<CompanyQuestionItem[]>(COMPANY_QUESTION_BANK);
  const [dbSynced, setDbSynced] = useState(false);
  const [ingestingFeed, setIngestingFeed] = useState(false);
  const [ingestStatus, setIngestStatus] = useState<string | null>(null);
  const [rawPostText, setRawPostText] = useState(
    "Just finished my Databricks L6 Staff System Design round yesterday.\nPrompt: Design a multi-tenant Delta Lake serverless query scheduler and small-file compaction service handling 50k concurrent SQL queries without S3 optimistic lock starvation."
  );
  const [extSimStatus, setExtSimStatus] = useState<string | null>(null);
  const [selectedWalkthrough, setSelectedWalkthrough] = useState<
    "revolut" | "finn_vg" | "spotify" | "wolt" | "stripe"
  >("revolut");

  // Hydrate from SQLite question_bank table
  useEffect(() => {
    fetch("/api/questions")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(data.questions);
          const map: Record<string, number> = {};
          data.questions.forEach((q: CompanyQuestionItem) => {
            map[q.id] = q.upvotes ?? 25;
          });
          setUpvotes(map);
          setDbSynced(true);
        }
      })
      .catch(() => {
        // Fallback to static catalog
      });
  }, []);

  // New Community Report Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCompany, setNewCompany] = useState("OpenAI");
  const [newTitle, setNewTitle] = useState("");
  const [newDetails, setNewDetails] = useState("");
  const [newSignal, setNewSignal] = useState("");
  const [newLevel, setNewLevel] = useState<TargetLevel>("L5");

  // Peer Mock Rubric Checklist State (Pramp / Aced Practice Mode)
  const [peerChecklist, setPeerChecklist] = useState<Record<string, boolean>>({
    clarified_scope: true,
    quantified_qps: false,
    api_idempotency: false,
    defended_tradeoffs: false
  });

  const nordicSet = new Set([
    "Revolut",
    "FINN.no / Vend",
    "Blocket / Tori (Vend)",
    "VG / Schibsted",
    "Spotify",
    "Klarna",
    "Wolt",
    "Sana Labs",
    "Cognite",
    "Oura"
  ]);
  const companies = [
    "All",
    "Nordic Hub (All)",
    "Revolut",
    "FINN.no / Vend",
    "Blocket / Tori (Vend)",
    "VG / Schibsted",
    "Spotify",
    "Klarna",
    "Wolt",
    "Sana Labs",
    "Cognite",
    "Oura",
    "OpenAI",
    "Stripe",
    "Uber",
    "Anthropic",
    "Meta",
    "Google",
    "Databricks",
    "Netflix",
    "Airbnb",
    "Apple"
  ];
  const rounds = ["All", "System Design", "Coding", "AI Architecture"];

  const filtered = questions.filter((q) => {
    const matchCompany =
      selectedCompany === "All"
        ? true
        : selectedCompany === "Nordic Hub (All)"
        ? nordicSet.has(q.company)
        : q.company === selectedCompany;
    const matchRound = selectedRound === "All" || q.roundType === selectedRound;
    return matchCompany && matchRound;
  });

  const handleSyncLiveFeed = async () => {
    setIngestingFeed(true);
    setIngestStatus("Syncing public HN / Reddit / LeetCode Discuss onsite feed...");
    try {
      const res = await fetch("/api/ingest-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "live_feed" })
      });
      const data = await res.json();
      if (data.ok && Array.isArray(data.questions)) {
        setQuestions(data.questions);
        const map: Record<string, number> = {};
        data.questions.forEach((q: CompanyQuestionItem) => {
          map[q.id] = q.upvotes ?? 25;
        });
        setUpvotes(map);
        setIngestStatus(
          data.ingestedCount > 0
            ? `✓ Ingested ${data.ingestedCount} new verified onsite reports into SQLite!`
            : "✓ Feed up to date — all latest community questions already in SQLite."
        );
        onDatabaseMutated?.();
      }
    } catch {
      setIngestStatus("Could not reach ingestion endpoint.");
    } finally {
      setIngestingFeed(false);
    }
  };

  const handleExtractRawPost = async () => {
    if (!rawPostText.trim()) return;
    setIngestingFeed(true);
    try {
      const res = await fetch("/api/ingest-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "extract_raw", rawText: rawPostText })
      });
      const data = await res.json();
      if (data.ok && Array.isArray(data.questions)) {
        setQuestions(data.questions);
        setIngestStatus(
          `✓ Extracted & saved "${data.newQuestions?.[0]?.questionTitle}" to SQLite!`
        );
        onDatabaseMutated?.();
      }
    } catch {
      setIngestStatus("Extraction failed.");
    } finally {
      setIngestingFeed(false);
    }
  };

  const handleSimulateExtensionClip = async () => {
    setExtSimStatus("Sending POST /api/extension/clip...");
    try {
      const res = await fetch("/api/extension/clip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "job_clip",
          company: "Anthropic",
          title: "Staff Distributed Inference Systems Engineer",
          url: "https://boards.greenhouse.io/anthropic/jobs/inference-systems",
          jdText:
            "Anthropic is hiring a Staff Distributed Systems Engineer (L6) to scale our multi-tenant GPU inference clusters, KV-cache routing, Redis token-bucket rate limiting, Rust/Python services, and Kubernetes observability."
        })
      });
      const data = await res.json();
      if (data.ok) {
        setExtSimStatus(
          `✓ Clipped "${data.jobCard.company} — ${data.jobCard.role}" to SQLite Kanban CRM with ${data.atsScore}% ATS Match!`
        );
        onDatabaseMutated?.();
      }
    } catch {
      setExtSimStatus("Extension simulation failed.");
    }
  };

  const handleUpvote = async (questionId: string) => {
    setUpvotes((prev) => ({
      ...prev,
      [questionId]: (prev[questionId] || 20) + 1
    }));
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upvote", questionId, delta: 1 })
      });
      const data = await res.json();
      if (typeof data.upvotes === "number") {
        setUpvotes((prev) => ({ ...prev, [questionId]: data.upvotes }));
      }
      onDatabaseMutated?.();
    } catch {
      // Ignore offline error
    }
  };

  const handleAddReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDetails.trim()) return;
    const item: CompanyQuestionItem = {
      id: `q_custom_${Date.now()}`,
      company: newCompany,
      role: "Backend / Distributed Systems",
      level: newLevel,
      roundType: "System Design",
      questionTitle: newTitle.trim(),
      details: newDetails.trim(),
      askedAgo: "Reported just now",
      frequency: "Verified Onsite",
      keyRubricSignal:
        newSignal.trim() ||
        "Clearly separate control plane from data plane and defend CAP theorem trade-offs.",
      linkedModule: "system_design",
      linkedTopicId: "ticketmaster",
      upvotes: 1
    };
    const updated = [item, ...questions];
    setQuestions(updated);
    setUpvotes((prev) => ({ ...prev, [item.id]: 1 }));
    setShowAddForm(false);
    setNewTitle("");
    setNewDetails("");
    setNewSignal("");

    try {
      await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: item })
      });
      onDatabaseMutated?.();
    } catch {
      // Ignore offline
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header & Mode Switcher */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Aced.io & Pramp Community Ecosystem
            </span>
            {dbSynced && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-semibold text-emerald-300">
                <Database className="w-2.5 h-2.5" />
                SQLite Live
              </span>
            )}
          </div>
          <h1 className="text-lg font-bold text-white mt-0.5">
            Crowdsourced Question Bank & Peer Walkthroughs
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setSubTab("questions")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
              subTab === "questions"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            1. Verified Questions ({questions.length})
          </button>
          <button
            onClick={() => setSubTab("peer_annotated")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
              subTab === "peer_annotated"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>2. Annotated Walkthrough & Peer Mode</span>
          </button>
          <button
            onClick={() => setSubTab("data_pipeline")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
              subTab === "data_pipeline"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>3. Live Scraper & Chrome Clipper</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CROWDSOURCED COMPANY QUESTIONS */}
      {subTab === "questions" && (
        <div className="space-y-5">
          {ingestStatus && (
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-emerald-200 flex items-center justify-between">
              <span>{ingestStatus}</span>
              <button
                onClick={() => setIngestStatus(null)}
                className="text-slate-400 hover:text-white text-[11px] cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-white focus:outline-none"
                >
                  {companies.map((c) => (
                    <option key={c} value={c} className="bg-slate-900">
                      {c === "All" ? "All Companies" : c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                <Filter className="w-3.5 h-3.5 text-cyan-400" />
                <select
                  value={selectedRound}
                  onChange={(e) => setSelectedRound(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-white focus:outline-none"
                >
                  {rounds.map((r) => (
                    <option key={r} value={r} className="bg-slate-900">
                      {r === "All" ? "All Round Types" : r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSyncLiveFeed}
                disabled={ingestingFeed}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {ingestingFeed ? "Syncing Feed..." : "Sync Live Onsite Feed"}
                </span>
              </button>

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Submit Question</span>
              </button>
            </div>
          </div>

          {showAddForm && (
            <form
              onSubmit={handleAddReport}
              className="p-5 rounded-2xl bg-slate-900/90 border border-indigo-500/40 space-y-3"
            >
              <div className="text-xs font-bold text-indigo-300 uppercase">
                Share a Recent Onsite or Phone Screen Question
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                >
                  {companies.slice(1).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value as TargetLevel)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                >
                  <option value="L4">L4 (Mid-Level)</option>
                  <option value="L5">L5 (Senior)</option>
                  <option value="L6">L6 (Staff+)</option>
                </select>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Question title..."
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>
              <textarea
                value={newDetails}
                onChange={(e) => setNewDetails(e.target.value)}
                rows={2}
                placeholder="Describe the prompt and follow-up constraints asked by the interviewer..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 text-xs font-semibold text-white cursor-pointer"
                >
                  Publish to Question Bank
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3.5">
            {filtered.map((q) => {
              const isRevealed = !!revealedIds[q.id];
              return (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/90 hover:border-slate-700 transition-all space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
                        {q.company}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-xs font-medium">
                        {q.level} • {q.roundType}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-semibold">
                        {q.frequency}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <button
                        onClick={() => handleUpvote(q.id)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 hover:border-indigo-500/40 text-slate-300 cursor-pointer"
                      >
                        <ThumbsUp className="w-3 h-3 text-indigo-400" />
                        <span>{upvotes[q.id] ?? q.upvotes ?? 25} Verified</span>
                      </button>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {q.askedAgo}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">{q.questionTitle}</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {q.details}
                    </p>
                  </div>

                  {isRevealed && (
                    <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-200 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong>Committee Hiring Signal:</strong> {q.keyRubricSignal}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() =>
                        setRevealedIds((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
                      }
                      className="text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
                    >
                      {isRevealed
                        ? "Hide Committee Signal"
                        : "Peek Committee Rubric Signal"}
                    </button>

                    <button
                      onClick={() => onNavigateToModule(q.linkedModule, q.linkedTopicId)}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Practice in Simulator</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: APPLICANT FEEDBACK, ANNOTATED WALKTHROUGHS & PEER RUBRIC */}
      {subTab === "peer_annotated" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Annotated Expert Mock Transcript (Nordic + US Switcher) */}
            <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MessageSquareQuote className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">
                    Annotated Onsite Walkthroughs (Nordics & US)
                  </h3>
                </div>
                <div className="flex gap-1.5">
                  {(
                    [
                      { id: "revolut", label: "Revolut (EU/Nordics)" },
                      { id: "finn_vg", label: "FINN / Vend & VG" },
                      { id: "spotify", label: "Spotify (Stockholm)" },
                      { id: "wolt", label: "Wolt (Helsinki)" },
                      { id: "stripe", label: "Stripe (US)" }
                    ] as const
                  ).map((w) => (
                    <button
                      key={w.id}
                      onClick={() => setSelectedWalkthrough(w.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                        selectedWalkthrough === w.id
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-indigo-300">
                  {WALKTHROUGH_DECKS[selectedWalkthrough].title}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {WALKTHROUGH_DECKS[selectedWalkthrough].subtitle}
                </p>
              </div>

              <div className="space-y-3.5">
                {WALKTHROUGH_DECKS[selectedWalkthrough].steps.map((step, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">
                        [{step.timestamp}] {step.speaker}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                        {step.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 italic leading-relaxed">
                      &ldquo;{step.transcript}&rdquo;
                    </p>
                    <div className="p-2.5 rounded-lg bg-emerald-950/25 border border-emerald-500/30 text-[11px] text-emerald-200">
                      <strong>Committee Note:</strong> {step.committeeAnnotation}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 5 Cols: Pramp / Aced Practice Peer Interviewer Mode */}
            <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  Peer Interviewer Grading Checklist (Pramp Mode)
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Acting as the interviewer sharpens your own mental rubric. Use this live scorecard when conducting a 30-minute reciprocal peer mock:
              </p>

              <div className="space-y-2.5">
                {[
                  {
                    id: "clarified_scope",
                    label: "1. Scoped Functional & Non-Functional SLAs in <5 mins"
                  },
                  {
                    id: "quantified_qps",
                    label: "2. Calculated Peak Read/Write QPS & Storage footprint"
                  },
                  {
                    id: "api_idempotency",
                    label: "3. Defined Idempotency-Key & Partition Key on Schema"
                  },
                  {
                    id: "defended_tradeoffs",
                    label: "4. Defended Redis failover & split-brain edge cases"
                  }
                ].map((item) => (
                  <label
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={!!peerChecklist[item.id]}
                      onChange={() =>
                        setPeerChecklist((prev) => ({
                          ...prev,
                          [item.id]: !prev[item.id]
                        }))
                      }
                      className="rounded border-slate-700"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-950/25 border border-indigo-500/30 text-xs text-indigo-200">
                <strong>Peer Calibration Score:</strong>{" "}
                {Object.values(peerChecklist).filter(Boolean).length * 25}% (
                {Object.values(peerChecklist).filter(Boolean).length >= 3
                  ? "Hire / Strong Hire"
                  : "Needs Deeper Trade-off Defense"}
                )
              </div>
            </div>
          </div>

          {/* Verified Nordic Applicant Feedback, Loop Breakdowns & Take-Home Guides */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
                Verified Candidate Post-Mortems & Take-Home Guides
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Nordic Applicant Feedback (Spotify, Wolt, Klarna, Supercell, Oura, Sana)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {APPLICANT_FEEDBACK_REPORTS.map((rep) => (
                <div
                  key={rep.company}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white text-sm">{rep.company}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold">
                      {rep.outcome}
                    </span>
                  </div>
                  <div className="text-indigo-300 font-semibold">{rep.role}</div>
                  <p className="text-slate-400 leading-relaxed">
                    <strong className="text-slate-200">Loop Structure:</strong> {rep.loopSummary}
                  </p>
                  <p className="text-emerald-200/90 leading-relaxed">
                    <strong className="text-emerald-300">What Got the Offer:</strong>{" "}
                    {rep.whatWorked}
                  </p>
                  <p className="text-amber-200/90 leading-relaxed">
                    <strong className="text-amber-300">Applicant Warning:</strong>{" "}
                    {rep.watchOutFor}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE DATA INGESTION PIPELINE & CHROME EXTENSION CLIPPER */}
      {subTab === "data_pipeline" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left 7 Cols: Live Scraper & Unstructured Post Extractor */}
          <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Proprietary Data Moat #1
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Automated Interview Experience Scraper & Extractor
                </h3>
              </div>
              <button
                onClick={handleSyncLiveFeed}
                disabled={ingestingFeed}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{ingestingFeed ? "Ingesting..." : "Run Live Feed Sync"}</span>
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Commercial platforms stay ahead by continuously ingesting fresh onsite reports from{" "}
              <strong className="text-slate-200">
                Hacker News Algolia API, r/ExperiencedDevs, r/leetcode, and Blind
              </strong>{" "}
              and converting raw unstructured threads into calibrated SQLite rows.
            </p>

            {ingestStatus && (
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-emerald-200">
                {ingestStatus}
              </div>
            )}

            <div className="space-y-2.5 pt-2 border-t border-slate-800">
              <label className="block text-xs font-bold text-indigo-300">
                Paste Unstructured Reddit / Blind / LeetCode Discuss Post:
              </label>
              <textarea
                value={rawPostText}
                onChange={(e) => setRawPostText(e.target.value)}
                rows={4}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-indigo-500"
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500">
                  Auto-detects company, L4–L6 level, round type, and committee rubric signal.
                </span>
                <button
                  onClick={handleExtractRawPost}
                  disabled={ingestingFeed}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white cursor-pointer"
                >
                  Extract & Insert into SQLite
                </button>
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Chrome Extension Clipper & API Simulator */}
          <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                  Proprietary Workflow Moat #2
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  1-Click Chrome Extension Clipper
                </h3>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                A Manifest V3 browser extension is included in your repository at{" "}
                <code className="text-cyan-300">chrome-extension/</code>. Highlight any Job Description on{" "}
                <strong className="text-slate-200">
                  LinkedIn, Greenhouse, Workday, or Lever
                </strong>{" "}
                to clip it straight into your SQLite Kanban CRM with a live ATS match score.
              </p>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-300">
                <div className="font-bold text-white">How to Load in Chrome / Brave / Edge:</div>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>
                    Open <code className="text-indigo-300">chrome://extensions</code> and enable{" "}
                    <strong className="text-slate-200">Developer mode</strong>.
                  </li>
                  <li>
                    Click <strong className="text-slate-200">Load unpacked</strong> and select the{" "}
                    <code className="text-cyan-300">chrome-extension/</code> folder.
                  </li>
                  <li>
                    Highlight any JD or onsite post and click{" "}
                    <strong className="text-slate-200">Clip to InterviewOS SQLite DB</strong>.
                  </li>
                </ol>
              </div>
            </div>

            <div className="space-y-2.5 pt-3 border-t border-slate-800">
              {extSimStatus && (
                <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/40 text-xs text-cyan-200">
                  {extSimStatus}
                </div>
              )}
              <button
                onClick={handleSimulateExtensionClip}
                className="w-full py-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-xs font-semibold text-cyan-200 cursor-pointer"
              >
                Simulate 1-Click Extension Clip (/api/extension/clip)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
