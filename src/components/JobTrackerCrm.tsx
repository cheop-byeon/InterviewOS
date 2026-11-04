"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Calculator,
  CheckCircle2,
  ClipboardPaste,
  Database,
  Plus,
  Sparkles
} from "lucide-react";
import NordicOfferComparator from "./NordicOfferComparator";
import {
  INITIAL_JOB_CARDS,
  INITIAL_STAR_STORIES
} from "../lib/data/mockInterviewData";
import { analyzeResumeAgainstJD } from "../lib/engines/atsEngine";
import {
  ActiveTab,
  JobApplicationCard,
  JobStage,
  StarStory,
  TargetLevel
} from "../lib/types";

interface JobTrackerCrmProps {
  onNavigateToModule: (tab: ActiveTab, topicId?: string) => void;
  resumeText?: string;
  onDatabaseMutated?: () => void;
}

const STAGES: { id: JobStage; label: string; badgeColor: string }[] = [
  { id: "wishlist", label: "Wishlist", badgeColor: "bg-slate-800 text-slate-300" },
  { id: "applied", label: "Applied", badgeColor: "bg-sky-500/20 text-sky-300" },
  { id: "oa_screen", label: "OA / Screen", badgeColor: "bg-amber-500/20 text-amber-300" },
  { id: "onsite", label: "Onsite Loop", badgeColor: "bg-indigo-500/20 text-indigo-300" },
  { id: "offer", label: "Offer", badgeColor: "bg-emerald-500/20 text-emerald-300" }
];

export default function JobTrackerCrm({
  onNavigateToModule,
  resumeText = "",
  onDatabaseMutated
}: JobTrackerCrmProps) {
  const [subView, setSubView] = useState<"kanban" | "star" | "offer_calc">("kanban");
  const [jobs, setJobs] = useState<JobApplicationCard[]>(INITIAL_JOB_CARDS);
  const [stories, setStories] = useState<StarStory[]>(INITIAL_STAR_STORIES);
  const [dbSynced, setDbSynced] = useState(false);

  const [newCompany, setNewCompany] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newLevel, setNewLevel] = useState<TargetLevel>("L5");
  const [showClipper, setShowClipper] = useState(false);
  const [clippedJdText, setClippedJdText] = useState("");

  const [newStoryTitle, setNewStoryTitle] = useState("");
  const [newStoryResult, setNewStoryResult] = useState("");

  useEffect(() => {
    fetch("/api/db")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.jobCards) && data.jobCards.length > 0) {
          setJobs(data.jobCards);
        }
        if (Array.isArray(data.starStories) && data.starStories.length > 0) {
          setStories(data.starStories);
        }
        setDbSynced(true);
      })
      .catch(() => {});
  }, []);

  const persistJobsToSqlite = (nextJobs: JobApplicationCard[]) => {
    setJobs(nextJobs);
    fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobCards: nextJobs })
    })
      .then(() => onDatabaseMutated?.())
      .catch(() => {});
  };

  const persistStoriesToSqlite = (nextStories: StarStory[]) => {
    setStories(nextStories);
    fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ starStories: nextStories })
    })
      .then(() => onDatabaseMutated?.())
      .catch(() => {});
  };

  const handleAdvanceJobStage = (jobId: string) => {
    const order: JobStage[] = ["wishlist", "applied", "oa_screen", "onsite", "offer"];
    const nextJobs = jobs.map((j) => {
      if (j.id !== jobId) return j;
      const idx = order.indexOf(j.stage);
      const nextStage = order[Math.min(order.length - 1, idx + 1)];
      return { ...j, stage: nextStage, updatedAt: "Just now" };
    });
    persistJobsToSqlite(nextJobs);
  };

  const handleAddJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.trim() || !newRole.trim()) return;
    const created: JobApplicationCard = {
      id: `job_${Date.now()}`,
      company: newCompany.trim(),
      role: newRole.trim(),
      level: newLevel,
      compensation: "$250k – $340k",
      stage: "applied",
      atsMatchScore: 81,
      mockReadinessScore: 78,
      nextAction: "Run ATS Scan & System Design Prep",
      updatedAt: "Just now",
      linkedProblemId: "ticketmaster",
      notes: "Added via Job Pipeline CRM."
    };
    persistJobsToSqlite([created, ...jobs]);
    setNewCompany("");
    setNewRole("");
  };

  // Simplify.jobs / Huntr Style Smart JD Clipper
  const handleSmartClipJob = () => {
    if (!clippedJdText.trim()) return;
    const scan = analyzeResumeAgainstJD(resumeText, clippedJdText);
    const lower = clippedJdText.toLowerCase();
    const detectedCompany = lower.includes("openai")
      ? "OpenAI"
      : lower.includes("stripe")
      ? "Stripe"
      : lower.includes("anthropic")
      ? "Anthropic"
      : lower.includes("databricks")
      ? "Databricks"
      : newCompany.trim() || "Tech Co";

    const linkedId =
      lower.includes("rag") || lower.includes("vector")
        ? "rag_enterprise"
        : lower.includes("geo") || lower.includes("dispatch")
        ? "uber"
        : "ticketmaster";

    const clippedCard: JobApplicationCard = {
      id: `clip_${Date.now()}`,
      company: detectedCompany,
      role: scan.detectedRole,
      level: scan.detectedLevel,
      compensation: scan.detectedLevel === "L6" ? "$380k – $520k" : "$260k – $340k",
      stage: "wishlist",
      atsMatchScore: scan.overallScore,
      mockReadinessScore: 80,
      nextAction: "Tailor Resume & Practice Linked System Design",
      updatedAt: "Clipped just now",
      linkedProblemId: linkedId,
      notes: `Auto-clipped from JD with ${scan.overallScore}% ATS match.`
    };

    persistJobsToSqlite([clippedCard, ...jobs]);
    setClippedJdText("");
    setShowClipper(false);
  };

  const handleAddStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoryTitle.trim() || !newStoryResult.trim()) return;
    const story: StarStory = {
      id: `story_${Date.now()}`,
      title: newStoryTitle.trim(),
      projectContext: "Custom Candidate STAR Story",
      competencies: ["Leadership", "Technical Complexity"],
      situation: "Production service faced scaling and cross-team alignment bottlenecks.",
      task: "Own the architecture redesign and deliver measurable SLA improvements.",
      action: "Led RFC review, built prototype, and executed phased rollout.",
      resultQuantified: newStoryResult.trim(),
      levelImpactNote: "Strong ownership and quantified engineering outcome."
    };
    persistStoriesToSqlite([story, ...stories]);
    setNewStoryTitle("");
    setNewStoryResult("");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Compact Header & Sub-View Switcher */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-white">Career Pipeline & STAR Stories</h1>
            {dbSynced && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-semibold text-emerald-300">
                <Database className="w-2.5 h-2.5" />
                SQLite Live
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage active applications, auto-clip Job Descriptions (Simplify style), and map STAR stories.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setSubView("kanban")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
              subView === "kanban"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Job Board ({jobs.length})</span>
          </button>
          <button
            onClick={() => setSubView("star")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
              subView === "star"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>STAR Story Bank ({stories.length})</span>
          </button>
          <button
            onClick={() => setSubView("offer_calc")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
              subView === "offer_calc"
                ? "bg-emerald-600 text-white"
                : "text-emerald-300 hover:text-white"
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Nordic & EU Offer Comparator</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: KANBAN BOARD + SMART JD CLIPPER */}
      {subView === "kanban" && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-3.5">
            <form onSubmit={handleAddJob} className="flex flex-wrap items-center gap-2 flex-1">
              <input
                type="text"
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                placeholder="Company (e.g., Anthropic)"
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                placeholder="Role Title..."
                className="flex-1 min-w-[160px] px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <select
                value={newLevel}
                onChange={(e) => setNewLevel(e.target.value as TargetLevel)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              >
                <option value="L4">L4</option>
                <option value="L5">L5</option>
                <option value="L6">L6</option>
              </select>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Role
              </button>
            </form>

            <button
              onClick={() => setShowClipper(!showClipper)}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>1-Click JD Clipper (Simplify Mode)</span>
            </button>
          </div>

          {showClipper && (
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/40 space-y-3">
              <div className="text-xs font-bold text-cyan-300">
                Paste Any Job Posting to Auto-Extract Role, Level, ATS Score & Linked Prep:
              </div>
              <textarea
                value={clippedJdText}
                onChange={(e) => setClippedJdText(e.target.value)}
                rows={3}
                placeholder="Paste raw LinkedIn / Greenhouse / Lever job description text here..."
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowClipper(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSmartClipJob}
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white cursor-pointer"
                >
                  Auto-Parse & Add to Board
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {STAGES.map((stage) => {
              const stageJobs = jobs.filter((j) => j.stage === stage.id);
              return (
                <div
                  key={stage.id}
                  className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col gap-3 min-h-[300px]"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-white">{stage.label}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stage.badgeColor}`}
                    >
                      {stageJobs.length}
                    </span>
                  </div>

                  <div className="space-y-2.5 flex-1">
                    {stageJobs.map((job) => (
                      <div
                        key={job.id}
                        className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <div className="text-xs font-bold text-white">{job.company}</div>
                            <div className="text-[11px] text-slate-400 leading-snug">
                              {job.role}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300">
                            {job.level}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-emerald-300 font-medium">
                            {job.compensation}
                          </span>
                          <span className="text-slate-400">ATS: {job.atsMatchScore}%</span>
                        </div>

                        <div className="pt-1 flex flex-col gap-1.5">
                          {job.linkedProblemId && (
                            <button
                              onClick={() =>
                                onNavigateToModule("system_design", job.linkedProblemId)
                              }
                              className="w-full py-1.5 px-2 rounded-lg bg-indigo-600/15 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Practice Design</span>
                            </button>
                          )}

                          {job.stage !== "offer" && (
                            <button
                              onClick={() => handleAdvanceJobStage(job.id)}
                              className="w-full py-1 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span>Move Forward</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: STAR STORY BANK */}
      {subView === "star" && (
        <div className="space-y-5">
          <form
            onSubmit={handleAddStory}
            className="flex flex-wrap gap-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-3.5"
          >
            <input
              type="text"
              value={newStoryTitle}
              onChange={(e) => setNewStoryTitle(e.target.value)}
              placeholder="Story title (e.g., Zero-Downtime Ledger Migration)"
              className="flex-1 min-w-[200px] px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
            />
            <input
              type="text"
              value={newStoryResult}
              onChange={(e) => setNewStoryResult(e.target.value)}
              placeholder="Quantified Outcome (e.g., -60% P99 latency at 18k QPS)"
              className="flex-1 min-w-[200px] px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Save Story
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stories.map((st) => (
              <div
                key={st.id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white">{st.title}</h3>
                    <p className="text-[11px] text-indigo-300">{st.projectContext}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {st.competencies.map((comp) => (
                      <span
                        key={comp}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 font-semibold"
                      >
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 leading-relaxed">
                  <div>
                    <strong className="text-slate-400">Situation:</strong> {st.situation}
                  </div>
                  <div>
                    <strong className="text-slate-400">Action:</strong> {st.action}
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-200">
                    <strong>Outcome:</strong> {st.resultQuantified}
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>{st.levelImpactNote}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: NORDIC & EUROPEAN OFFER & TAX COMPARATOR */}
      {subView === "offer_calc" && <NordicOfferComparator />}
    </div>
  );
}
