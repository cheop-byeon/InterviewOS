"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Database,
  FileSearch,
  Layers,
  MessageSquareCode,
  Network,
  Sparkles
} from "lucide-react";
import AtsResumeLab from "../components/AtsResumeLab";
import JobTrackerCrm from "../components/JobTrackerCrm";
import MockInterviewStudio from "../components/MockInterviewStudio";
import Navbar from "../components/Navbar";
import QuestionBank from "../components/QuestionBank";
import SystemDesignPractice from "../components/SystemDesignPractice";
import VisualLibrary from "../components/VisualLibrary";
import {
  INITIAL_SESSION_HISTORY,
  RESUME_JD_PRESETS
} from "../lib/data/mockInterviewData";
import { SYSTEM_DESIGN_PROBLEMS } from "../lib/data/systemDesignProblems";
import { analyzeResumeAgainstJD } from "../lib/engines/atsEngine";
import {
  ActiveTab,
  DatabaseTelemetry,
  LLMConfig,
  PracticeSessionRecord,
  ResumeScanRecord,
  TargetLevel
} from "../lib/types";

const STORAGE_KEY = "interview_os_state_v2";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [targetLevel, setTargetLevel] = useState<TargetLevel>("L5");
  const [llmConfig, setLlmConfig] = useState<LLMConfig>({
    mode: "hybrid_local",
    apiKey: "",
    model: "gemini-2.5-flash"
  });

  const [resumeText, setResumeText] = useState<string>(
    RESUME_JD_PRESETS[0].resumeText
  );
  const [jdText, setJdText] = useState<string>(RESUME_JD_PRESETS[0].jdText);
  const [selectedProblemId, setSelectedProblemId] = useState<string>(
    SYSTEM_DESIGN_PROBLEMS[0].id
  );
  const [mockTopicId, setMockTopicId] = useState<string | undefined>(undefined);
  const [sessionHistory, setSessionHistory] = useState<PracticeSessionRecord[]>(
    INITIAL_SESSION_HISTORY
  );
  const [resumeScans, setResumeScans] = useState<ResumeScanRecord[]>([]);
  const [dbTelemetry, setDbTelemetry] = useState<DatabaseTelemetry | null>(null);

  const refreshDatabaseState = useCallback(() => {
    fetch("/api/db")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.sessionHistory) && data.sessionHistory.length > 0) {
          setSessionHistory(data.sessionHistory);
        }
        if (Array.isArray(data.resumeScans)) {
          setResumeScans(data.resumeScans);
        }
        if (data.telemetry) {
          setDbTelemetry(data.telemetry);
        }
      })
      .catch(() => {
        // Fallback to localStorage if offline
      });
  }, []);

  // Hydrate persisted state from SQLite + localStorage on mount
  useEffect(() => {
    refreshDatabaseState();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.resumeText) setResumeText(parsed.resumeText);
        if (parsed.jdText) setJdText(parsed.jdText);
        if (parsed.targetLevel) setTargetLevel(parsed.targetLevel);
      }
    } catch {
      // Ignore storage errors
    }
  }, [refreshDatabaseState]);

  // Persist changes automatically
  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          resumeText,
          jdText,
          targetLevel,
          sessionHistory
        })
      );
    } catch {
      // Ignore storage errors
    }
  }, [resumeText, jdText, targetLevel, sessionHistory]);

  const liveAtsScan = useMemo(
    () => analyzeResumeAgainstJD(resumeText, jdText),
    [resumeText, jdText]
  );

  const handleRecordSession = (rec: PracticeSessionRecord) => {
    setSessionHistory((prev) => [rec, ...prev.slice(0, 14)]);
    fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "record_session", session: rec })
    })
      .then(() => refreshDatabaseState())
      .catch(() => {});
  };

  const handleNavigateToModule = (tab: ActiveTab, topicId?: string) => {
    if (tab === "system_design" && topicId) {
      setSelectedProblemId(topicId);
    }
    if (tab === "mock_interview" && topicId) {
      setMockTopicId(topicId);
    }
    setActiveTab(tab);
  };

  const avgPracticeScore = useMemo(() => {
    if (sessionHistory.length === 0) return 82;
    return Math.round(
      sessionHistory.reduce((acc, s) => acc + s.scorePct, 0) /
        sessionHistory.length
    );
  }, [sessionHistory]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#090d16]">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        targetLevel={targetLevel}
        setTargetLevel={setTargetLevel}
        llmConfig={llmConfig}
        setLlmConfig={setLlmConfig}
        atsScore={liveAtsScan.overallScore}
        telemetry={dbTelemetry}
        resumeScans={resumeScans}
        onRefreshDatabase={refreshDatabaseState}
      />

      <main className="flex-1 overflow-y-auto px-5 sm:px-8 py-8">
        {activeTab === "dashboard" && (
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Clean Minimalist Welcome Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  Candidate Workspace • {targetLevel} Calibration
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                  Your Interview & Career Loop
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3.5 py-2 rounded-xl bg-slate-900/70 border border-slate-800 text-xs">
                  <span className="text-slate-400 mr-2">ATS Match:</span>
                  <strong className="text-emerald-400">{liveAtsScan.overallScore}%</strong>
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-slate-900/70 border border-slate-800 text-xs">
                  <span className="text-slate-400 mr-2">Avg Practice:</span>
                  <strong className="text-indigo-400">{avgPracticeScore}%</strong>
                </div>
              </div>
            </div>

            {/* Primary Focused Action Card ("Up Next") */}
            <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/50 via-slate-900/80 to-slate-900/80 p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Recommended Next Step</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Tailor your resume bullets & practice Ticketmaster System Design
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Upload a PDF/DOCX resume or apply 1-click Google XYZ bullet rewrites, then practice on the drag-and-drop architecture whiteboard or run real Python/JS code in the sandbox.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 shrink-0">
                <button
                  onClick={() => setActiveTab("ats_lab")}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
                >
                  <span>Open ATS Lab</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveTab("system_design")}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Practice System Design
                </button>
              </div>
            </div>

            {/* Clean Modules Grid */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Core Modules
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div
                  onClick={() => setActiveTab("ats_lab")}
                  className="group p-5 rounded-2xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/40 transition-all cursor-pointer flex flex-col justify-between gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                      <FileSearch className="w-4 h-4" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-300">
                      ATS & Resume PDF Lab
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Upload .PDF/.DOCX resumes, apply XYZ rewrites, and export clean single-column PDFs.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("system_design")}
                  className="group p-5 rounded-2xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 hover:border-cyan-500/40 transition-all cursor-pointer flex flex-col justify-between gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                      <Network className="w-4 h-4" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-cyan-300">
                      Drag & Drop System Design
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      5-step Delivery Framework with mouse drag-and-drop canvas, Bezier flows, and SPOF linter.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("mock_interview")}
                  className="group p-5 rounded-2xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 hover:border-emerald-500/40 transition-all cursor-pointer flex flex-col justify-between gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                      <MessageSquareCode className="w-4 h-4" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-emerald-300">
                      AI Mock & Live Code Runner
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Voice/text mock interviews + real Python 3 & JS/TS sandboxed test execution.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("question_bank")}
                  className="group p-5 rounded-2xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 hover:border-rose-500/40 transition-all cursor-pointer flex flex-col justify-between gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-rose-300">
                      Company Question Bank
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Recently asked onsite questions from OpenAI, Stripe, Uber, Anthropic, Meta, and Google.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("visual_library")}
                  className="group p-5 rounded-2xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 hover:border-amber-500/40 transition-all cursor-pointer flex flex-col justify-between gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-amber-300">
                      Visual Concept Library
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Interactive 0 → 10M user scaling slider and step-by-step coding pattern visualizers.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("job_crm")}
                  className="group p-5 rounded-2xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 hover:border-violet-500/40 transition-all cursor-pointer flex flex-col justify-between gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-violet-300">
                      Job CRM & STAR Matrix
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Track applications from Wishlist to Offer alongside your behavioral leadership stories.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Persisted Recent Practice History */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Recent Practice Sessions (SQLite Persisted)
                </h3>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-cyan-400 font-medium">
                  <Database className="w-3 h-3" />
                  <span>
                    SQLite 3 (WAL) •{" "}
                    {dbTelemetry
                      ? `${Object.values(dbTelemetry.tableCounts).reduce((a, b) => a + b, 0)} rows across 8 tables`
                      : "data/interview_os.sqlite"}
                  </span>
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {sessionHistory.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between gap-2"
                  >
                    <div className="truncate">
                      <div className="text-xs font-bold text-white truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>
                          {item.verdict} • {item.date}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-extrabold text-indigo-300 shrink-0">
                      {item.scorePct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "ats_lab" && (
          <AtsResumeLab
            resumeText={resumeText}
            setResumeText={setResumeText}
            jdText={jdText}
            setJdText={setJdText}
            onNavigateToModule={handleNavigateToModule}
            onScanRecorded={refreshDatabaseState}
          />
        )}

        {activeTab === "system_design" && (
          <SystemDesignPractice
            selectedProblemId={selectedProblemId}
            setSelectedProblemId={setSelectedProblemId}
            targetLevel={targetLevel}
            llmConfig={llmConfig}
            onRecordSession={handleRecordSession}
          />
        )}

        {activeTab === "mock_interview" && (
          <MockInterviewStudio
            targetLevel={targetLevel}
            llmConfig={llmConfig}
            resumeText={resumeText}
            jdText={jdText}
            initialTopicId={mockTopicId}
            onRecordSession={handleRecordSession}
          />
        )}

        {activeTab === "visual_library" && <VisualLibrary />}

        {activeTab === "question_bank" && (
          <QuestionBank
            onNavigateToModule={handleNavigateToModule}
            onDatabaseMutated={refreshDatabaseState}
          />
        )}

        {activeTab === "job_crm" && (
          <JobTrackerCrm
            onNavigateToModule={handleNavigateToModule}
            resumeText={resumeText}
            onDatabaseMutated={refreshDatabaseState}
          />
        )}
      </main>
    </div>
  );
}
