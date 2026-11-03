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

const ANNOTATED_WALKTHROUGH = [
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

  const companies = [
    "All",
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
    const matchCompany = selectedCompany === "All" || q.company === selectedCompany;
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

      {/* TAB 2: ACED.IO ANNOTATED WALKTHROUGH + PRAMP PEER INTERVIEWER RUBRIC */}
      {subTab === "peer_annotated" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Cols: Annotated Expert Mock Transcript */}
          <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquareQuote className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">
                Annotated L6 Staff Interview Walkthrough (Aced.io Format)
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              See exact Hiring Committee annotations at each timestamp of a real Staff Backend interview:
            </p>

            <div className="space-y-3.5">
              {ANNOTATED_WALKTHROUGH.map((step, i) => (
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
