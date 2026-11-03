"use client";

import React, { useState } from "react";
import {
  Briefcase,
  Building2,
  Cpu,
  Database,
  Download,
  FileSearch,
  Layers,
  LayoutDashboard,
  MessageSquareCode,
  Network,
  RefreshCw,
  Settings,
  Sparkles,
  X
} from "lucide-react";
import {
  ActiveTab,
  DatabaseTelemetry,
  LLMConfig,
  ResumeScanRecord,
  TargetLevel
} from "../lib/types";

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  targetLevel: TargetLevel;
  setTargetLevel: (level: TargetLevel) => void;
  llmConfig: LLMConfig;
  setLlmConfig: (cfg: LLMConfig) => void;
  atsScore: number;
  telemetry?: DatabaseTelemetry | null;
  resumeScans?: ResumeScanRecord[];
  onRefreshDatabase?: () => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  targetLevel,
  setTargetLevel,
  llmConfig,
  setLlmConfig,
  atsScore,
  telemetry,
  resumeScans = [],
  onRefreshDatabase
}: NavbarProps) {
  const [showAiModal, setShowAiModal] = useState(false);
  const [showDbModal, setShowDbModal] = useState(false);
  const [resettingDb, setResettingDb] = useState(false);

  const navGroups: {
    groupLabel: string;
    items: { id: ActiveTab; label: string; badge?: string; icon: React.ReactNode }[];
  }[] = [
    {
      groupLabel: "Overview",
      items: [
        { id: "dashboard", label: "Home", icon: <LayoutDashboard className="w-4 h-4" /> }
      ]
    },
    {
      groupLabel: "Prepare & Optimize",
      items: [
        {
          id: "ats_lab",
          label: "ATS & Resume Lab",
          badge: `${atsScore}%`,
          icon: <FileSearch className="w-4 h-4" />
        },
        {
          id: "visual_library",
          label: "Visual Concepts",
          icon: <Layers className="w-4 h-4" />
        },
        {
          id: "question_bank",
          label: "Company Questions",
          badge: "SQLite",
          icon: <Building2 className="w-4 h-4" />
        }
      ]
    },
    {
      groupLabel: "Interactive Practice",
      items: [
        {
          id: "system_design",
          label: "System Design",
          icon: <Network className="w-4 h-4" />
        },
        {
          id: "mock_interview",
          label: "AI Mock Studio",
          icon: <MessageSquareCode className="w-4 h-4" />
        }
      ]
    },
    {
      groupLabel: "Career Pipeline",
      items: [
        {
          id: "job_crm",
          label: "Job CRM & STAR",
          icon: <Briefcase className="w-4 h-4" />
        }
      ]
    }
  ];

  const levelDescriptions: Record<TargetLevel, string> = {
    L4: "Mid-Level (IC4)",
    L5: "Senior (IC5)",
    L6: "Staff+ (IC6)"
  };

  const totalDbRows = telemetry
    ? Object.values(telemetry.tableCounts).reduce((a, b) => a + b, 0)
    : 34;

  const handleResetDatabase = async () => {
    setResettingDb(true);
    try {
      await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_db" })
      });
      onRefreshDatabase?.();
    } catch {
      // Ignore error
    } finally {
      setResettingDb(false);
    }
  };

  const handleExportDatabaseJson = async () => {
    try {
      const res = await fetch("/api/db");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json"
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `interviewos-sqlite-dump-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Ignore error
    }
  };

  return (
    <>
      <aside className="w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-[#0b101b] flex flex-col justify-between">
        <div className="p-5">
          {/* Brand Header */}
          <div
            onClick={() => setActiveTab("dashboard")}
            className="flex items-center gap-3 cursor-pointer mb-8"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white">
                Interview<span className="text-indigo-400">OS</span>
              </span>
              <span className="block text-[11px] text-slate-400">
                Career & Prep Workspace
              </span>
            </div>
          </div>

          {/* Grouped Sidebar Navigation */}
          <div className="flex lg:flex-col gap-2 lg:gap-6 overflow-x-auto pb-2 lg:pb-0">
            {navGroups.map((group) => (
              <div key={group.groupLabel} className="flex lg:flex-col gap-1 shrink-0">
                <div className="hidden lg:block text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-3 mb-1">
                  {group.groupLabel}
                </div>
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                        isActive
                          ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 font-semibold"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={isActive ? "text-indigo-400" : "text-slate-400"}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                            isActive
                              ? "bg-indigo-500/25 text-indigo-200"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Sidebar Controls: Target Level, SQLite Backend & AI Settings */}
        <div className="hidden lg:flex flex-col gap-2.5 p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
              <span>Target Bar</span>
              <span className="text-indigo-300 font-medium">
                {levelDescriptions[targetLevel]}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {(["L4", "L5", "L6"] as TargetLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setTargetLevel(lvl)}
                  className={`py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    targetLevel === lvl
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              onRefreshDatabase?.();
              setShowDbModal(true);
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>SQLite Relational DB</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-semibold">
              {totalDbRows} rows
            </span>
          </button>

          <button
            onClick={() => setShowAiModal(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {llmConfig.mode === "hybrid_local"
                  ? "Smart Rubric Engine"
                  : `Live LLM (${llmConfig.mode})`}
              </span>
            </div>
            <Settings className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </aside>

      {/* SQLite Relational Database & Telemetry Modal */}
      {showDbModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    SQLite 3 Relational Backend Inspector
                  </h3>
                  <p className="text-xs text-slate-400">
                    {telemetry?.engine || "SQLite 3 (node:sqlite)"} •{" "}
                    <code className="text-cyan-300">{telemetry?.dbPath || "data/interview_os.sqlite"}</code>{" "}
                    ({telemetry ? `${Math.round(telemetry.fileSizeBytes / 1024)} KB` : "WAL Mode"})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDbModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Table Row Counts Grid */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Normalized SQL Tables (8 Active Tables)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  {
                    table: "system_design_problems",
                    count: telemetry?.tableCounts.system_design_problems ?? 7,
                    desc: "Full 5-Step Blueprints"
                  },
                  {
                    table: "coding_problems",
                    count: telemetry?.tableCounts.coding_problems ?? 5,
                    desc: "Runnable JS/Py Suites"
                  },
                  {
                    table: "question_bank",
                    count: telemetry?.tableCounts.question_bank ?? 11,
                    desc: "Onsite Questions"
                  },
                  {
                    table: "job_applications",
                    count: telemetry?.tableCounts.job_applications ?? 4,
                    desc: "Kanban CRM Cards"
                  },
                  {
                    table: "star_stories",
                    count: telemetry?.tableCounts.star_stories ?? 2,
                    desc: "Behavioral Stories"
                  },
                  {
                    table: "practice_sessions",
                    count: telemetry?.tableCounts.practice_sessions ?? 3,
                    desc: "Scored Sessions"
                  },
                  {
                    table: "resume_scans",
                    count: telemetry?.tableCounts.resume_scans ?? 2,
                    desc: "ATS Scan Logs"
                  },
                  {
                    table: "users",
                    count: telemetry?.tableCounts.users ?? 1,
                    desc: "Candidate Profile"
                  }
                ].map((item) => (
                  <div
                    key={item.table}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/90 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <code className="text-[11px] font-bold text-cyan-300 truncate">
                        {item.table}
                      </code>
                      <span className="text-xs font-extrabold text-white bg-slate-800 px-1.5 py-0.5 rounded">
                        {item.count}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SQLite Aggregated Readiness Metrics */}
            {telemetry && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-indigo-950/25 border border-indigo-500/30">
                  <div className="text-[10px] text-indigo-300 uppercase font-semibold">
                    SQL AVG(ats_score)
                  </div>
                  <div className="text-base font-extrabold text-white mt-0.5">
                    {telemetry.aggregates.avgAtsScore}%
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-950/25 border border-emerald-500/30">
                  <div className="text-[10px] text-emerald-300 uppercase font-semibold">
                    SQL AVG(session_score)
                  </div>
                  <div className="text-base font-extrabold text-white mt-0.5">
                    {telemetry.aggregates.avgPracticeScore}%
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-amber-950/25 border border-amber-500/30">
                  <div className="text-[10px] text-amber-300 uppercase font-semibold">
                    SQL SUM(upvotes)
                  </div>
                  <div className="text-base font-extrabold text-white mt-0.5">
                    {telemetry.aggregates.totalUpvotes}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-violet-950/25 border border-violet-500/30">
                  <div className="text-[10px] text-violet-300 uppercase font-semibold">
                    Active CRM Loops
                  </div>
                  <div className="text-base font-extrabold text-white mt-0.5">
                    {telemetry.aggregates.activePipelineCount}
                  </div>
                </div>
              </div>
            )}

            {/* Historical ATS Resume Scans Table */}
            {resumeScans.length > 0 && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Recent <code className="text-cyan-300">resume_scans</code> Rows
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {resumeScans.slice(0, 5).map((scan) => (
                    <div
                      key={scan.id}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-white">{scan.roleTitle}</span>
                        <span className="text-slate-500 ml-2">
                          ({scan.targetLevel} • {scan.matchedCount} matched / {scan.missingCount} gaps)
                        </span>
                      </div>
                      <span className="font-bold text-emerald-400">{scan.overallScore}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Database Actions Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportDatabaseJson}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Export SQLite Dump (.JSON)</span>
                </button>
                <button
                  onClick={handleResetDatabase}
                  disabled={resettingDb}
                  className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 text-xs font-semibold text-rose-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resettingDb ? "animate-spin" : ""}`} />
                  <span>{resettingDb ? "Re-seeding..." : "Reset & Re-Seed Default Data"}</span>
                </button>
              </div>
              <button
                onClick={() => setShowDbModal(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Engine Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-400" />
                <h3 className="font-semibold text-white text-base">
                  AI & Rubric Evaluation Settings
                </h3>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              InterviewOS works out-of-the-box with its built-in rubric engine. Optionally connect your own API key for live LLM generation.
            </p>

            <div className="space-y-3 mb-5">
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: "hybrid_local", label: "Built-in Rubric (Default)" },
                    { id: "gemini", label: "Google Gemini API" },
                    { id: "openai", label: "OpenAI GPT-4o API" },
                    { id: "anthropic", label: "Anthropic Claude API" }
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setLlmConfig({ ...llmConfig, mode: opt.id })}
                    className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${
                      llmConfig.mode === opt.id
                        ? "bg-indigo-600/20 border-indigo-500 text-white"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {llmConfig.mode !== "hybrid_local" && (
                <div className="pt-2 space-y-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    {llmConfig.mode.toUpperCase()} API Key
                  </label>
                  <input
                    type="password"
                    value={llmConfig.apiKey}
                    onChange={(e) => setLlmConfig({ ...llmConfig, apiKey: e.target.value })}
                    placeholder="Paste API key..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
