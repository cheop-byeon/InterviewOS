"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Award,
  Code2,
  Lightbulb,
  Mic,
  MicOff,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Video,
  Volume2,
  VolumeX
} from "lucide-react";
import AiInterviewerStage, {
  INTERVIEWER_PERSONAS
} from "./AiInterviewerStage";
import { CODING_PROBLEMS } from "../lib/data/mockInterviewData";
import { COMPANY_INSIDER_RUBRICS } from "../lib/data/companyRubrics";
import { SYSTEM_DESIGN_PROBLEMS } from "../lib/data/systemDesignProblems";
import {
  generateInterviewScorecard,
  generateMockInterviewerTurn
} from "../lib/engines/aiEvaluationEngine";
import {
  InterviewMessage,
  InterviewMode,
  InterviewScorecard,
  LLMConfig,
  PracticeSessionRecord,
  TargetLevel
} from "../lib/types";

interface MockInterviewStudioProps {
  targetLevel: TargetLevel;
  llmConfig: LLMConfig;
  resumeText: string;
  jdText: string;
  initialTopicId?: string;
  onRecordSession?: (rec: PracticeSessionRecord) => void;
}

interface RealTestResult {
  id: string;
  label: string;
  expected: string;
  actual: string;
  passed: boolean;
  runtimeMs: number;
  error?: string | null;
}

export default function MockInterviewStudio({
  targetLevel,
  llmConfig,
  resumeText,
  jdText,
  initialTopicId,
  onRecordSession
}: MockInterviewStudioProps) {
  const [mode, setMode] = useState<InterviewMode>("system_design");
  const [selectedCodingId, setSelectedCodingId] = useState<string>(
    CODING_PROBLEMS[0].id
  );
  const [selectedSysId, setSelectedSysId] = useState<string>(
    SYSTEM_DESIGN_PROBLEMS[0].id
  );
  const [codeLanguage, setCodeLanguage] = useState<"javascript" | "python">(
    "javascript"
  );
  const [selectedCompanyLoopId, setSelectedCompanyLoopId] =
    useState<string>("stripe");
  const [showInsiderRubric, setShowInsiderRubric] = useState<boolean>(false);

  const activeCompanyRubric =
    COMPANY_INSIDER_RUBRICS.find((r) => r.id === selectedCompanyLoopId) ||
    COMPANY_INSIDER_RUBRICS[0];

  useEffect(() => {
    if (!initialTopicId) return;
    if (CODING_PROBLEMS.some((c) => c.id === initialTopicId)) {
      setMode("coding");
      setSelectedCodingId(initialTopicId);
    } else if (SYSTEM_DESIGN_PROBLEMS.some((s) => s.id === initialTopicId)) {
      setMode("system_design");
      setSelectedSysId(initialTopicId);
    }
  }, [initialTopicId]);

  const currentCoding =
    CODING_PROBLEMS.find((c) => c.id === selectedCodingId) || CODING_PROBLEMS[0];
  const currentSys =
    SYSTEM_DESIGN_PROBLEMS.find((s) => s.id === selectedSysId) ||
    SYSTEM_DESIGN_PROBLEMS[0];

  const [codeValue, setCodeValue] = useState<string>(currentCoding.starterCode);
  const [testRunResults, setTestRunResults] = useState<RealTestResult[] | null>(
    null
  );
  const [isRunningCode, setIsRunningCode] = useState<boolean>(false);

  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [candidateInput, setCandidateInput] = useState<string>("");
  const [turnCount, setTurnCount] = useState<number>(1);
  const [showCoachHint, setShowCoachHint] = useState<boolean>(false);
  const [liveSignal, setLiveSignal] = useState<{
    clarity: number;
    depth: number;
    coachHint: string;
  }>({
    clarity: 84,
    depth: 80,
    coachHint:
      "Start by clarifying functional vs. non-functional constraints and stating your core assumptions out loud."
  });
  const [scorecard, setScorecard] = useState<InterviewScorecard | null>(null);
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(true);
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [handsFreeMode, setHandsFreeMode] = useState<boolean>(false);
  const [showVideoAvatar, setShowVideoAvatar] = useState<boolean>(true);
  const [liveTranscriptPreview, setLiveTranscriptPreview] =
    useState<string>("");
  const speechTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCodeValue(
      codeLanguage === "python"
        ? currentCoding.starterCodePy
        : currentCoding.starterCode
    );
    setTestRunResults(null);
  }, [currentCoding, codeLanguage]);

  useEffect(() => {
    setScorecard(null);
    setTurnCount(1);
    setShowCoachHint(false);

    let openingPrompt = "";
    if (mode === "system_design") {
      openingPrompt = `Welcome to your **${targetLevel} System Design Interview** for **${currentSys.title}**.\n\n"${currentSys.promptSummary}"\n\nHow would you like to scope the **Functional & Non-Functional Requirements** first?`;
    } else if (mode === "coding") {
      openingPrompt = `Welcome to your **${targetLevel} Coding Round**: **${currentCoding.title}**.\n\nWalk me through the data structures you'll combine to achieve optimal time complexity, then implement and run your code in the sandboxed runner on the right.`;
    } else if (mode === "behavioral") {
      openingPrompt = `Welcome to your **${targetLevel} Behavioral Round**. Tell me about a contentious technical decision or high-stakes architecture migration you led recently using the **STAR method**.`;
    } else {
      openingPrompt = `Welcome to your **${targetLevel} Resume + JD Deep Dive**. Looking at your experience and the target job description, walk me through the highest-concurrency bottleneck you personally diagnosed and resolved in production.`;
    }

    setMessages([
      {
        id: "msg_init",
        role: "interviewer",
        content: openingPrompt,
        timestamp: "Just now",
        stageTag: "Problem Framing"
      }
    ]);
  }, [mode, selectedCodingId, selectedSysId, targetLevel, currentCoding, currentSys]);

  const speakText = (text: string, forceSpeak = false) => {
    const cleanText = text.replace(/[*`_#]/g, "").trim();
    const words = cleanText.split(/\s+/).length;
    const estimatedMs = Math.min(14000, Math.max(2400, words * 310));

    if (speechTimerRef.current) {
      clearTimeout(speechTimerRef.current);
    }

    // Always animate the AI Interviewer figure lip-sync & waveform when replying
    setIsAiSpeaking(true);
    speechTimerRef.current = setTimeout(() => {
      setIsAiSpeaking(false);
    }, estimatedMs);

    if (
      (!ttsEnabled && !forceSpeak) ||
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      return;
    }

    const persona =
      INTERVIEWER_PERSONAS[selectedCompanyLoopId] ||
      INTERVIEWER_PERSONAS.finn_vend_schibsted;

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(cleanText);
    utter.rate = persona.voiceRate;
    utter.pitch = persona.voicePitch;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        v.lang.includes(persona.voiceLangHint) &&
        (v.name.includes("Natural") ||
          v.name.includes("Google") ||
          v.name.includes("Daniel") ||
          v.name.includes("Samantha"))
    );
    if (preferredVoice) {
      utter.voice = preferredVoice;
    }

    utter.onstart = () => setIsAiSpeaking(true);
    utter.onend = () => {
      if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
      setIsAiSpeaking(false);
    };
    utter.onerror = () => {
      setIsAiSpeaking(false);
    };
    window.speechSynthesis.speak(utter);
  };

  const handleToggleVoiceMic = () => {
    if (typeof window === "undefined") return;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsAiSpeaking(false);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      const sampleSpoken =
        "We require strict ACID consistency for booking so no two users double-book an item, paired with <50ms P99 read latency using Vespa/Redis caching and a transactional Kafka outbox.";
      setCandidateInput(sampleSpoken);
      if (handsFreeMode) {
        void submitCandidateText(sampleSpoken);
      }
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRec();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    setIsListening(true);
    setLiveTranscriptPreview("Listening...");
    let finalSpoken = "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0]?.transcript || "";
        if (event.results[i].isFinal) {
          finalSpoken += `${chunk} `;
        } else {
          interim += chunk;
        }
      }
      const combined = `${finalSpoken}${interim}`.trim();
      setLiveTranscriptPreview(combined);
      if (finalSpoken.trim()) {
        setCandidateInput((prev) => `${prev ? prev + " " : ""}${finalSpoken.trim()}`);
      }
    };
    recognition.onerror = () => {
      setIsListening(false);
      setLiveTranscriptPreview("");
    };
    recognition.onend = () => {
      setIsListening(false);
      setLiveTranscriptPreview("");
      if (handsFreeMode && finalSpoken.trim()) {
        void submitCandidateText(finalSpoken.trim());
      }
    };
    recognition.start();
  };

  const submitCandidateText = async (overrideText?: string) => {
    const rawText = overrideText ?? candidateInput;
    if (!rawText.trim()) return;
    setIsSending(true);
    const userText = rawText.trim();
    setCandidateInput("");

    const candidateMsg: InterviewMessage = {
      id: `cand_${Date.now()}`,
      role: "candidate",
      content: userText,
      timestamp: "Now"
    };

    const contextTitle =
      mode === "system_design"
        ? currentSys.title
        : mode === "coding"
        ? currentCoding.title
        : mode === "behavioral"
        ? "STAR Leadership Loop"
        : "Resume + JD Alignment";

    const localTurn = generateMockInterviewerTurn(
      mode,
      targetLevel,
      turnCount,
      userText,
      contextTitle
    );

    const companyProbe =
      activeCompanyRubric.followUpProbes[
        (turnCount - 1) % activeCompanyRubric.followUpProbes.length
      ];

    let aiReplyText = `${localTurn.reply}\n\n**[${activeCompanyRubric.company} ${targetLevel} Bar Probe]:** ${companyProbe}`;

    if (llmConfig.mode !== "hybrid_local" && llmConfig.apiKey.trim()) {
      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: llmConfig.mode,
            apiKey: llmConfig.apiKey,
            systemPrompt: `${activeCompanyRubric.interviewerPersonaPrompt} Conducting a ${targetLevel} ${mode} interview on "${contextTitle}". Must-hit rubric signals: ${activeCompanyRubric.mustHitSignals.join(
              "; "
            )}. Resume context: ${resumeText.slice(0, 350)}. JD context: ${jdText.slice(
              0,
              350
            )}. Acknowledge the candidate's point in 1 sentence, then ask 1 sharp company-calibrated follow-up question.`,
            userPrompt: userText
          })
        });
        const data = await res.json();
        if (res.ok && data.text) {
          aiReplyText = data.text;
        }
      } catch {
        // Fallback smoothly
      }
    }

    const interviewerMsg: InterviewMessage = {
      id: `int_${Date.now() + 1}`,
      role: "interviewer",
      content: aiReplyText,
      timestamp: "Now",
      stageTag: localTurn.stageTag
    };

    setMessages((prev) => [...prev, candidateMsg, interviewerMsg]);
    setLiveSignal({
      clarity: localTurn.clarity,
      depth: localTurn.depth,
      coachHint: localTurn.coachHint
    });
    setTurnCount((prev) => prev + 1);
    setIsSending(false);
    speakText(aiReplyText);
  };

  const handleSendCandidateReply = () => {
    void submitCandidateText();
  };

  // Real Sandboxed Code Execution via /api/execute
  const handleRunCodingTests = async () => {
    setIsRunningCode(true);
    try {
      const payload = {
        language: codeLanguage,
        userCode: codeValue,
        testCases: currentCoding.testCases.map((tc, idx) => ({
          id: `tc_${idx}`,
          label: tc.input,
          runnerCodeJs: tc.runnerCodeJs,
          runnerCodePy: tc.runnerCodePy,
          expectedOutput: tc.expected
        }))
      };
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.results)) {
        setTestRunResults(data.results);
      }
    } catch {
      // Fallback
    }
    setIsRunningCode(false);
  };

  const handleFinishAndGrade = () => {
    const candidateTexts = messages
      .filter((m) => m.role === "candidate")
      .map((m) => m.content);
    if (mode === "coding") candidateTexts.push(codeValue);
    const sc = generateInterviewScorecard(mode, targetLevel, candidateTexts);
    setScorecard(sc);
    if (onRecordSession) {
      onRecordSession({
        id: `mock_${Date.now()}`,
        date: "Just now",
        type: "mock_interview",
        title: `Mock (${mode.replace("_", " ")}): ${
          mode === "system_design"
            ? currentSys.title.split(" (")[0]
            : mode === "coding"
            ? currentCoding.title
            : "Leadership & JD Loop"
        }`,
        level: targetLevel,
        scorePct: sc.overallScorePct,
        verdict: sc.overallHireSignal
      });
    }
  };

  const handleInsertStrongReply = () => {
    if (mode === "system_design") {
      setCandidateInput(
        "We need strict ACID consistency on seat reservation (zero double-booking) and <100ms P99 seat map reads at 150k QPS. I'll use Redis Cluster `SET seat:{id} {user} NX EX 600` for atomic 10-minute locks backed by PostgreSQL optimistic concurrency control (`version` column) and a virtual waiting room at the edge."
      );
    } else if (mode === "coding") {
      setCandidateInput(
        "To guarantee O(1) time complexity for both `get` and `put`, I combine a HashMap mapping keys to nodes with a Doubly Linked List maintaining recency order, evicting the oldest node in O(1) when capacity is reached."
      );
    } else {
      setCandidateInput(
        "When our settlement database hit 85% CPU saturation during peak traffic, I authored an RFC comparing dual-writes against a transactional Kafka outbox pattern, aligned 3 teams on idempotency keys, and cut P99 latency from 420ms to 85ms at 18,000 QPS."
      );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Compact Header & Track Selector */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-white">Live AI Mock Interview Studio</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Calibrated to{" "}
            <strong className="text-indigo-300">
              {activeCompanyRubric.company} ({targetLevel})
            </strong>{" "}
            — {activeCompanyRubric.loopStyleName}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          {(
            [
              { id: "system_design", label: "System Design" },
              { id: "coding", label: "Coding (Live Sandbox)" },
              { id: "behavioral", label: "Behavioral" },
              { id: "resume_jd", label: "Resume + JD" }
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === m.id
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Company-Specific Insider Rubric Bar (Hello Interview / Bar Raiser Moat) */}
      <div className="bg-slate-900/50 border border-slate-800/90 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
              Company Loop Persona:
            </span>
            {COMPANY_INSIDER_RUBRICS.map((rubric) => (
              <button
                key={rubric.id}
                onClick={() => setSelectedCompanyLoopId(rubric.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  selectedCompanyLoopId === rubric.id
                    ? rubric.badgeColor
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {rubric.company}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowInsiderRubric(!showInsiderRubric)}
            className="px-3 py-1 rounded-xl bg-slate-950 border border-indigo-500/30 text-xs font-semibold text-indigo-300 hover:bg-indigo-950/30 cursor-pointer"
          >
            {showInsiderRubric
              ? "Hide Insider Grading Rubric"
              : `Inspect ${activeCompanyRubric.company} ${targetLevel} Rubric & Red Flags`}
          </button>
        </div>

        {showInsiderRubric && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
            <p className="text-slate-300 leading-relaxed">
              <strong className="text-white">{activeCompanyRubric.company} Philosophy:</strong>{" "}
              {activeCompanyRubric.corePhilosophy}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5">
                <div className="font-bold text-emerald-300 uppercase text-[10px]">
                  Must-Hit Hiring Signals ({targetLevel})
                </div>
                <ul className="space-y-1 text-slate-300 list-disc list-inside">
                  {activeCompanyRubric.mustHitSignals.map((sig) => (
                    <li key={sig}>{sig}</li>
                  ))}
                </ul>
              </div>
              <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1.5">
                <div className="font-bold text-rose-300 uppercase text-[10px]">
                  Auto-Downgrade / No-Hire Red Flags
                </div>
                <ul className="space-y-1 text-slate-300 list-disc list-inside">
                  {activeCompanyRubric.autoFailRedFlags.map((flag) => (
                    <li key={flag}>{flag}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-indigo-950/25 border border-indigo-500/30 text-indigo-200">
              <strong>{targetLevel} Calibration Bar:</strong>{" "}
              {activeCompanyRubric.levelBarDiff[targetLevel]}
            </div>
          </div>
        )}
      </div>

      {/* IF SCORECARD IS GENERATED: SHOW FOCUSED SCORECARD VIEW */}
      {scorecard ? (
        <div className="bg-slate-900/70 border border-indigo-500/40 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                {scorecard.calibratedLevel} Committee Evaluation (Saved to History)
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-0.5">
                {scorecard.overallHireSignal} ({scorecard.overallScorePct}%)
              </h2>
            </div>
            <button
              onClick={() => setScorecard(null)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Return to Interview
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scorecard.dimensions.map((d) => (
              <div
                key={d.dimension}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{d.dimension}</span>
                  <span className="font-bold text-indigo-300">
                    {d.score} / {d.maxScore} ({d.verdict})
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{d.feedback}</p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
            <div className="text-xs font-bold text-emerald-300">
              Sample Stronger {targetLevel} Answer:
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              {scorecard.sampleStrongerAnswer}
            </p>
          </div>
        </div>
      ) : (
        /* FOCUSED INTERVIEW ROOM */
        <div className={`grid grid-cols-1 ${mode === "coding" ? "lg:grid-cols-12" : ""} gap-6`}>
          <div
            className={`${
              mode === "coding" ? "lg:col-span-6" : ""
            } bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between min-h-[520px]`}
          >
            {/* Top Controls inside Interview Room */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                {mode === "system_design" && (
                  <select
                    value={selectedSysId}
                    onChange={(e) => setSelectedSysId(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-medium"
                  >
                    {SYSTEM_DESIGN_PROBLEMS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title.split(" (")[0]}
                      </option>
                    ))}
                  </select>
                )}
                {mode === "coding" && (
                  <select
                    value={selectedCodingId}
                    onChange={(e) => setSelectedCodingId(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-medium"
                  >
                    {CODING_PROBLEMS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                )}
                <span className="text-xs text-slate-400">
                  Clarity: <strong className="text-indigo-300">{liveSignal.clarity}%</strong> • Depth:{" "}
                  <strong className="text-emerald-300">{liveSignal.depth}%</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowVideoAvatar(!showVideoAvatar)}
                  className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 border cursor-pointer ${
                    showVideoAvatar
                      ? "bg-cyan-600/20 border-cyan-500/40 text-cyan-200"
                      : "bg-slate-950 border-slate-800 text-slate-400"
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>{showVideoAvatar ? "AI Figure: ON" : "AI Figure: OFF"}</span>
                </button>
                <button
                  onClick={() => setShowCoachHint(!showCoachHint)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-amber-300 flex items-center gap-1 cursor-pointer"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>{showCoachHint ? "Hide Hint" : "Hint"}</span>
                </button>
                <button
                  onClick={() => {
                    const next = !ttsEnabled;
                    setTtsEnabled(next);
                    if (!next && typeof window !== "undefined" && "speechSynthesis" in window) {
                      window.speechSynthesis.cancel();
                      setIsAiSpeaking(false);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 border cursor-pointer ${
                    ttsEnabled
                      ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300"
                      : "bg-slate-950 border-slate-800 text-slate-400"
                  }`}
                >
                  {ttsEnabled ? (
                    <Volume2 className="w-3.5 h-3.5" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5" />
                  )}
                  <span>TTS</span>
                </button>
                <button
                  onClick={handleFinishAndGrade}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Finish & Grade</span>
                </button>
              </div>
            </div>

            {showCoachHint && (
              <div className="mt-3 p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200">
                <strong>Coach Whisper:</strong> {liveSignal.coachHint}
              </div>
            )}

            {/* LIVE AI INTERVIEWER FIGURE & VOICE CALL STAGE */}
            {showVideoAvatar && (
              <div className="mt-3">
                <AiInterviewerStage
                  companyLoopId={selectedCompanyLoopId}
                  companyName={activeCompanyRubric.company}
                  targetLevel={targetLevel}
                  isAiSpeaking={isAiSpeaking}
                  isListening={isListening}
                  isThinking={isSending}
                  ttsEnabled={ttsEnabled}
                  handsFreeMode={handsFreeMode}
                  latestInterviewerText={
                    [...messages].reverse().find((m) => m.role === "interviewer")
                      ?.content || ""
                  }
                  liveTranscriptPreview={liveTranscriptPreview}
                  clarityScore={liveSignal.clarity}
                  depthScore={liveSignal.depth}
                  onToggleTts={() => {
                    const next = !ttsEnabled;
                    setTtsEnabled(next);
                    if (!next && typeof window !== "undefined" && "speechSynthesis" in window) {
                      window.speechSynthesis.cancel();
                      setIsAiSpeaking(false);
                    }
                  }}
                  onToggleMic={handleToggleVoiceMic}
                  onToggleHandsFree={() => {
                    const next = !handsFreeMode;
                    setHandsFreeMode(next);
                    if (next) {
                      setTtsEnabled(true);
                      const lastMsg = [...messages]
                        .reverse()
                        .find((m) => m.role === "interviewer");
                      if (lastMsg) {
                        speakText(lastMsg.content, true);
                      }
                    }
                  }}
                  onReplayLastPrompt={() => {
                    setTtsEnabled(true);
                    const lastMsg = [...messages]
                      .reverse()
                      .find((m) => m.role === "interviewer");
                    if (lastMsg) {
                      speakText(lastMsg.content, true);
                    }
                  }}
                />
              </div>
            )}

            {/* Chat Stream */}
            <div className="flex-1 my-4 space-y-3 overflow-y-auto max-h-[340px] pr-1">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-4 rounded-2xl text-xs leading-relaxed ${
                    m.role === "interviewer"
                      ? "bg-slate-950 border border-slate-800 text-slate-200 mr-6"
                      : "bg-indigo-600/20 border border-indigo-500/30 text-white ml-6"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[11px] text-indigo-300">
                      {m.role === "interviewer" ? `AI Interviewer (${targetLevel})` : "You"}
                    </span>
                    {m.stageTag && (
                      <span className="text-[10px] text-slate-400">{m.stageTag}</span>
                    )}
                  </div>
                  <div className="whitespace-pre-line">{m.content}</div>
                </div>
              ))}
            </div>

            {/* Reply Area */}
            <div className="space-y-2 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleInsertStrongReply}
                  className="text-[11px] text-indigo-300 hover:text-indigo-200 flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Insert Sample Answer</span>
                </button>
                <span className="text-[11px] text-slate-500">Turn {turnCount}</span>
              </div>

              <div className="flex gap-2">
                <textarea
                  value={candidateInput}
                  onChange={(e) => setCandidateInput(e.target.value)}
                  rows={3}
                  placeholder="Speak or type your response..."
                  className="flex-1 rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleToggleVoiceMic}
                    className={`p-3 rounded-xl border flex items-center justify-center cursor-pointer ${
                      isListening
                        ? "bg-rose-600 text-white border-rose-500 animate-pulse"
                        : "bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800"
                    }`}
                  >
                    {isListening ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={handleSendCandidateReply}
                    disabled={isSending}
                    className="flex-1 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Real Multi-Language Code Sandbox (Shown in Coding Mode) */}
          {mode === "coding" && (
            <div className="lg:col-span-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-cyan-400" />
                    {currentCoding.title}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {currentCoding.timeComplexity} • {currentCoding.spaceComplexity}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button
                      onClick={() => setCodeLanguage("javascript")}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                        codeLanguage === "javascript"
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      JS / TS
                    </button>
                    <button
                      onClick={() => setCodeLanguage("python")}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                        codeLanguage === "python"
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Python 3
                    </button>
                  </div>

                  <button
                    onClick={handleRunCodingTests}
                    disabled={isRunningCode}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isRunningCode ? "Executing..." : "Run Sandbox"}</span>
                  </button>
                </div>
              </div>

              <textarea
                value={codeValue}
                onChange={(e) => setCodeValue(e.target.value)}
                rows={14}
                spellCheck={false}
                className="w-full flex-1 rounded-xl bg-slate-950 border border-slate-800 p-3.5 text-xs font-mono text-emerald-200 leading-relaxed focus:outline-none focus:border-cyan-500"
              />

              {testRunResults && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Live Execution Output ({codeLanguage === "python" ? "Python 3" : "Node VM"}):
                  </div>
                  {testRunResults.map((tr) => (
                    <div
                      key={tr.id}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-slate-300">{tr.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-500">
                            {tr.runtimeMs} ms
                          </span>
                          <span
                            className={`font-bold ${
                              tr.passed ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {tr.passed ? `✓ Passed` : `✗ Failed`}
                          </span>
                        </div>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        Expected: <span className="text-emerald-300">{tr.expected}</span> | Actual:{" "}
                        <span className={tr.passed ? "text-emerald-300" : "text-rose-300"}>
                          {tr.actual}
                        </span>
                      </div>
                      {tr.error && (
                        <div className="text-[11px] font-mono text-rose-400 bg-rose-950/30 p-1.5 rounded">
                          {tr.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
