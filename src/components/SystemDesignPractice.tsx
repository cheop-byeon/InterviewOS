"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Database,
  Eye,
  GitCommitHorizontal,
  HelpCircle,
  Layers,
  Move,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Zap
} from "lucide-react";
import { SYSTEM_DESIGN_PROBLEMS } from "../lib/data/systemDesignProblems";
import { evaluateGuidedStep } from "../lib/engines/aiEvaluationEngine";
import {
  CanvasEdge,
  CanvasNode,
  DeliveryStageId,
  LLMConfig,
  NodeCategory,
  PracticeSessionRecord,
  StepEvaluationResult,
  TargetLevel
} from "../lib/types";

interface SystemDesignPracticeProps {
  selectedProblemId: string;
  setSelectedProblemId: (id: string) => void;
  targetLevel: TargetLevel;
  llmConfig: LLMConfig;
  onRecordSession?: (rec: PracticeSessionRecord) => void;
}

const DELIVERY_STAGES: {
  id: DeliveryStageId;
  stepNum: number;
  label: string;
  timeBox: string;
  coachTip: string;
}[] = [
  {
    id: "requirements",
    stepNum: 1,
    label: "1. Requirements",
    timeBox: "5m",
    coachTip:
      "Scope 3–4 Functional actions and 3 Non-Functional SLAs (CAP theorem stance, P99 latency, peak scale)."
  },
  {
    id: "estimation",
    stepNum: 2,
    label: "2. Estimations",
    timeBox: "5m",
    coachTip:
      "Calculate Read/Write QPS and Storage only where they drive an architectural decision (e.g., sharding or Redis RAM)."
  },
  {
    id: "api_data",
    stepNum: 3,
    label: "3. API & Schema",
    timeBox: "7m",
    coachTip:
      "Define core endpoints, database engine per entity, Primary/Partition keys, and idempotency tokens."
  },
  {
    id: "high_level_design",
    stepNum: 4,
    label: "4. Architecture Canvas",
    timeBox: "13m",
    coachTip:
      "Drag and wire your end-to-end topology on the interactive whiteboard and trace the Read and Write paths."
  },
  {
    id: "deep_dives",
    stepNum: 5,
    label: "5. Deep Dives",
    timeBox: "15m",
    coachTip:
      "Defend concurrency bottlenecks, failover edge cases, and Option A vs. Option B trade-offs."
  }
];

const PALETTE_COMPONENTS: { label: string; sublabel: string; category: NodeCategory }[] = [
  { label: "CDN & Waiting Room", sublabel: "Edge Cache / Queue", category: "edge" },
  { label: "API / WS Gateway", sublabel: "Auth & Rate Limit", category: "edge" },
  { label: "Stateless Service", sublabel: "Go / Node / Rust Worker", category: "compute" },
  { label: "Redis Cluster", sublabel: "SET NX Locks / H3 Cache", category: "cache" },
  { label: "PostgreSQL Shards", sublabel: "ACID Source of Truth", category: "database" },
  { label: "Cassandra / DynamoDB", sublabel: "Wide-Column High-Write", category: "database" },
  { label: "Kafka Event Bus", sublabel: "Async Stream & Outbox", category: "queue" },
  { label: "Vector + BM25 Index", sublabel: "HNSW + Reranker", category: "search_ai" }
];

export default function SystemDesignPractice({
  selectedProblemId,
  setSelectedProblemId,
  targetLevel,
  llmConfig,
  onRecordSession
}: SystemDesignPracticeProps) {
  const problem =
    SYSTEM_DESIGN_PROBLEMS.find((p) => p.id === selectedProblemId) ||
    SYSTEM_DESIGN_PROBLEMS[0];

  const [activeStage, setActiveStage] = useState<DeliveryStageId>("requirements");
  const [stageInputs, setStageInputs] = useState<Record<DeliveryStageId, string>>({
    requirements: "",
    estimation: "",
    api_data: "",
    high_level_design: "",
    deep_dives: ""
  });
  const [evaluations, setEvaluations] = useState<
    Partial<Record<DeliveryStageId, StepEvaluationResult>>
  >({});
  const [canvasNodes, setCanvasNodes] = useState<CanvasNode[]>(problem.starterNodes);
  const [canvasEdges, setCanvasEdges] = useState<CanvasEdge[]>(problem.starterEdges);
  const [connectingFromId, setConnectingFromId] = useState<string | null>(null);
  const [edgeProtocol, setEdgeProtocol] = useState<string>("gRPC");
  const [showReferenceHint, setShowReferenceHint] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Live 45-min Interview Timer
  const [secondsLeft, setSecondsLeft] = useState<number>(45 * 60);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);

  // Pointer Drag-and-Drop State
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  // Live Traffic & Chaos Monkey Simulator State
  const [trafficMultiplier, setTrafficMultiplier] = useState<1 | 10 | 50>(1);
  const [chaosKilledNodeId, setChaosKilledNodeId] = useState<string | null>(null);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  useEffect(() => {
    setCanvasNodes(problem.starterNodes);
    setCanvasEdges(problem.starterEdges);
    setEvaluations({});
    setShowReferenceHint(false);
    setConnectingFromId(null);
    setTrafficMultiplier(1);
    setChaosKilledNodeId(null);
    setSecondsLeft(45 * 60);
    setStageInputs({
      requirements: "",
      estimation: "",
      api_data: "",
      high_level_design: "",
      deep_dives: ""
    });
  }, [problem]);

  // Pointer Drag Handlers
  const handleNodePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    node: CanvasNode
  ) => {
    e.stopPropagation();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setDraggingNodeId(node.id);
    setDragOffset({
      dx: e.clientX - rect.left - node.x,
      dy: e.clientY - rect.top - node.y
    });
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingNodeId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(12, Math.min(rect.width - 190, e.clientX - rect.left - dragOffset.dx));
    const newY = Math.max(12, Math.min(rect.height - 85, e.clientY - rect.top - dragOffset.dy));
    setCanvasNodes((prev) =>
      prev.map((n) => (n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n))
    );
  };

  const handleCanvasPointerUp = () => {
    setDraggingNodeId(null);
  };

  const handlePortClick = (nodeId: string) => {
    if (!connectingFromId) {
      setConnectingFromId(nodeId);
      return;
    }
    if (connectingFromId === nodeId) {
      setConnectingFromId(null);
      return;
    }
    const exists = canvasEdges.some(
      (e) => e.from === connectingFromId && e.to === nodeId
    );
    if (!exists) {
      setCanvasEdges((prev) => [
        ...prev,
        {
          id: `edge_${Date.now()}`,
          from: connectingFromId,
          to: nodeId,
          protocol: edgeProtocol || "gRPC"
        }
      ]);
    }
    setConnectingFromId(null);
  };

  // Live Architecture Topology Linter (SPOF & Anti-Pattern Check)
  const runTopologyDiagnostics = (): { passed: boolean; warnings: string[] } => {
    const warnings: string[] = [];
    const hasEdge = canvasNodes.some((n) => n.category === "edge");
    const hasCache = canvasNodes.some((n) => n.category === "cache");
    const hasCompute = canvasNodes.some((n) => n.category === "compute");

    if (!hasEdge) {
      warnings.push("Missing Edge / API Gateway tier (no TLS termination or rate limiting).");
    }
    if (!hasCache) {
      warnings.push("No in-memory Cache/Coordination layer (Redis) — database faces raw read/lock load.");
    }
    if (!hasCompute) {
      warnings.push("Missing Stateless Compute tier between Edge and Storage.");
    }

    // Check if client connects directly to database
    for (const edge of canvasEdges) {
      const from = canvasNodes.find((n) => n.id === edge.from);
      const to = canvasNodes.find((n) => n.id === edge.to);
      if (from?.category === "client" && to?.category === "database") {
        warnings.push("Security Anti-Pattern: Client connects directly to Database bypassing API Gateway & Service tier!");
      }
    }

    return { passed: warnings.length === 0, warnings };
  };

  const topologyDiagnostics = runTopologyDiagnostics();

  // Compute Live Traffic & Chaos Monkey Telemetry across Canvas Nodes
  const activeAliveNodes = canvasNodes.filter((n) => n.id !== chaosKilledNodeId);
  const hasAliveEdge = activeAliveNodes.some((n) => n.category === "edge");
  const hasAliveCache = activeAliveNodes.some((n) => n.category === "cache");
  const hasAliveQueue = activeAliveNodes.some((n) => n.category === "queue");

  const getNodeLoadPct = (node: CanvasNode): number => {
    if (node.id === chaosKilledNodeId) return 0;
    const base =
      node.category === "client"
        ? 18
        : node.category === "edge"
        ? 24
        : node.category === "cache"
        ? 28
        : node.category === "queue"
        ? 22
        : node.category === "compute"
        ? 34
        : 38;

    const spikeFactor =
      trafficMultiplier === 1 ? 1 : trafficMultiplier === 10 ? 1.85 : 3.1;

    let raw = base * spikeFactor;

    // If database/compute lacks Edge Shield or Redis Cache during 10x/50x spike, it saturates!
    if (node.category === "database") {
      if (hasAliveCache && hasAliveEdge) {
        raw = raw * 0.42; // 90%+ cache hit ratio shields DB
      } else if (hasAliveCache || hasAliveEdge) {
        raw = raw * 0.72;
      } else {
        raw = raw * 1.35; // Unshielded origin meltdown!
      }
      if (hasAliveQueue) {
        raw = raw * 0.82; // Kafka outbox smooths write bursts
      }
    }

    if (node.category === "compute" && !hasAliveEdge && trafficMultiplier > 1) {
      raw = raw * 1.25;
    }

    return Math.min(100, Math.round(raw));
  };

  const maxDbLoad = Math.max(
    0,
    ...activeAliveNodes
      .filter((n) => n.category === "database" || n.category === "compute")
      .map(getNodeLoadPct)
  );
  const simulatedQps = 6000 * trafficMultiplier;
  const simulatedP99Ms =
    maxDbLoad >= 95
      ? 2850
      : maxDbLoad >= 80
      ? 420
      : hasAliveCache && hasAliveEdge
      ? 24 + trafficMultiplier
      : 95 + trafficMultiplier * 4;
  const simulatedDropPct =
    maxDbLoad >= 98 ? 34.5 : maxDbLoad >= 90 ? 6.2 : 0;

  const handleInsertSampleAnswer = () => {
    let sample = "";
    if (activeStage === "requirements") {
      sample = `Functional Requirements:\n- ${problem.functionalRequirements.join("\n- ")}\n\nNon-Functional Requirements & CAP Stance:\n- ${problem.nonFunctionalRequirements.join("\n- ")}`;
    } else if (activeStage === "estimation") {
      sample = `Capacity & Back-of-the-Envelope Sizing:\n- DAU & Concurrency: ${problem.capacityDefaults.dau}\n- Read Throughput: ${problem.capacityDefaults.readQps}\n- Write Throughput: ${problem.capacityDefaults.writeQps}\n- Storage & Memory: ${problem.capacityDefaults.storagePerYear}\n- Network Bandwidth: ${problem.capacityDefaults.bandwidth}`;
    } else if (activeStage === "api_data") {
      sample = `API Endpoints:\n${problem.apiEndpoints
        .map((e) => `- ${e.method} ${e.path}: ${e.description} (${e.payload})`)
        .join("\n")}\n\nCore Entities & Partitioning:\n${problem.coreEntities
        .map((c) => `- ${c.table} [${c.dbType}]: ${c.schema} (Partition Key: ${c.partitionKey})`)
        .join("\n")}`;
    } else if (activeStage === "high_level_design") {
      sample = `High-Level Architecture Flow:\n1. Edge / Gateway handles TLS termination, JWT auth, and Token Bucket rate limiting.\n2. Read Path hits CDN/Redis Cluster first (<10ms P99) before falling back to read replicas.\n3. Write Path uses Redis atomic coordination / locks and commits durable state to partitioned DB shards, publishing async events to Kafka.`;
      setCanvasNodes(problem.referenceNodes);
      setCanvasEdges(problem.referenceEdges);
    } else {
      sample = problem.deepDiveQuestions
        .map((q) => `[${q.level} Trade-off] ${q.question}\n-> Solution: ${q.idealTradeoff}`)
        .join("\n\n");
    }
    setStageInputs((prev) => ({ ...prev, [activeStage]: sample }));
  };

  const handleEvaluateStage = async () => {
    setIsEvaluating(true);
    const currentText = stageInputs[activeStage] || "";
    const localEval = evaluateGuidedStep(
      problem,
      activeStage,
      currentText,
      canvasNodes,
      canvasEdges,
      targetLevel
    );

    if (llmConfig.mode !== "hybrid_local" && llmConfig.apiKey.trim()) {
      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: llmConfig.mode,
            apiKey: llmConfig.apiKey,
            systemPrompt: `You are a Staff FAANG System Design Interviewer grading a candidate at level ${targetLevel} on problem "${problem.title}" during stage "${activeStage}". Give concise, actionable 3-sentence feedback.`,
            userPrompt: `Candidate answer: ${currentText}\nCanvas Nodes: ${canvasNodes
              .map((n) => n.label)
              .join(", ")}`
          })
        });
        const data = await res.json();
        if (res.ok && data.text) {
          localEval.interviewerFeedback = data.text;
        }
      } catch {
        // Fallback smoothly
      }
    }

    setEvaluations((prev) => ({ ...prev, [activeStage]: localEval }));
    if (onRecordSession) {
      onRecordSession({
        id: `sys_${Date.now()}`,
        date: "Just now",
        type: "system_design_step",
        title: `${problem.title.split(" (")[0]} — ${activeStage}`,
        level: targetLevel,
        scorePct: localEval.score,
        verdict: localEval.status === "strong" ? "Strong Hire" : "Hire"
      });
    }
    setIsEvaluating(false);
  };

  const handleAddNode = (item: { label: string; sublabel: string; category: NodeCategory }) => {
    const id = `node_${Date.now()}`;
    const col = canvasNodes.length % 3;
    const row = Math.floor(canvasNodes.length / 3);
    setCanvasNodes((prev) => [
      ...prev,
      {
        id,
        label: item.label,
        sublabel: item.sublabel,
        category: item.category,
        x: 140 + col * 230,
        y: 70 + row * 120
      }
    ]);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const currentEval = evaluations[activeStage];
  const currentStageMeta = DELIVERY_STAGES.find((s) => s.id === activeStage)!;
  const currentStageIndex = DELIVERY_STAGES.findIndex((s) => s.id === activeStage);

  const getCategoryStyles = (cat: NodeCategory) => {
    switch (cat) {
      case "client":
        return "border-sky-500/50 bg-sky-950/75 text-sky-200";
      case "edge":
        return "border-indigo-500/50 bg-indigo-950/75 text-indigo-200";
      case "compute":
        return "border-violet-500/50 bg-violet-950/75 text-violet-200";
      case "cache":
        return "border-amber-500/50 bg-amber-950/75 text-amber-200";
      case "database":
        return "border-emerald-500/50 bg-emerald-950/75 text-emerald-200";
      case "queue":
        return "border-rose-500/50 bg-rose-950/75 text-rose-200";
      case "search_ai":
        return "border-cyan-500/50 bg-cyan-950/75 text-cyan-200";
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Compact Header with Problem Selector & 45-Min Pacing Timer */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold mb-1">
            <span>Guided System Design</span>
            <span>•</span>
            <span>{problem.difficulty}</span>
            <span>•</span>
            <span>{targetLevel} Rubric</span>
          </div>
          <h1 className="text-lg font-bold text-white">{problem.title}</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {problem.promptSummary}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Live 45m Pacing Clock */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span className="font-mono text-sm font-bold text-white">
              {formatTimer(secondsLeft)}
            </span>
            <button
              onClick={() => setTimerRunning(!timerRunning)}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
              title={timerRunning ? "Pause timer" : "Start 45m pacing timer"}
            >
              {timerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
          </div>

          <select
            value={problem.id}
            onChange={(e) => setSelectedProblemId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
          >
            {SYSTEM_DESIGN_PROBLEMS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title.split(" (")[0]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 5-Stage Stepper Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {DELIVERY_STAGES.map((stage) => {
          const isCurrent = activeStage === stage.id;
          const stageEval = evaluations[stage.id];
          return (
            <button
              key={stage.id}
              onClick={() => setActiveStage(stage.id)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                isCurrent
                  ? "bg-indigo-600/15 border-indigo-500 text-white"
                  : "bg-slate-900/50 border-slate-800/80 text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>{stage.label}</span>
                <span className="text-[10px] text-slate-400">{stage.timeBox}</span>
              </div>
              {stageEval && (
                <div className="text-[10px] text-emerald-400 font-semibold mt-1">
                  ✓ {stageEval.score}%
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* STAGE 4: TRUE DRAG-AND-DROP WHITEBOARD + BEZIER FLOWS + TOPOLOGY LINTER */}
      {activeStage === "high_level_design" && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Interactive Drag-and-Drop Architecture Whiteboard
              </h3>
              <p className="text-xs text-slate-400">
                <strong>Drag any node</strong> with your mouse. Click <strong>Connect Port</strong> on two nodes to draw animated data flows.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={edgeProtocol}
                onChange={(e) => setEdgeProtocol(e.target.value)}
                placeholder="Edge label (gRPC)"
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white w-28"
              />
              <button
                onClick={() => {
                  setCanvasNodes(problem.referenceNodes);
                  setCanvasEdges(problem.referenceEdges);
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Load Reference Topology
              </button>
              <button
                onClick={() => {
                  setCanvasNodes(problem.starterNodes);
                  setCanvasEdges(problem.starterEdges);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>
          </div>

          {/* Add Node Palette */}
          <div className="flex flex-wrap gap-1.5">
            {PALETTE_COMPONENTS.map((comp) => (
              <button
                key={comp.label}
                onClick={() => handleAddNode(comp)}
                className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3 text-indigo-400" />
                <span>{comp.label}</span>
              </button>
            ))}
          </div>

          {/* LIVE TRAFFIC SPIKE & CHAOS MONKEY SIMULATOR BAR */}
          <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-cyan-300 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Live Load Test:</span>
              </span>
              {(
                [
                  { mult: 1, label: "1x Normal (6k QPS)" },
                  { mult: 10, label: "10x Peak (60k QPS)" },
                  { mult: 50, label: "50x VG / Flash Spike (300k QPS)" }
                ] as const
              ).map((item) => (
                <button
                  key={item.mult}
                  onClick={() => setTrafficMultiplier(item.mult)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition-all ${
                    trafficMultiplier === item.mult
                      ? item.mult === 50
                        ? "bg-rose-600/30 border-rose-400 text-rose-200"
                        : "bg-indigo-600 text-white border-indigo-400"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              <span className="text-slate-300">
                Throughput:{" "}
                <strong className="text-white">
                  {simulatedQps.toLocaleString()} QPS
                </strong>
              </span>
              <span className="text-slate-300">
                Est. P99:{" "}
                <strong
                  className={
                    simulatedP99Ms > 500
                      ? "text-rose-400"
                      : simulatedP99Ms > 180
                      ? "text-amber-300"
                      : "text-emerald-400"
                  }
                >
                  {simulatedP99Ms} ms
                </strong>
              </span>
              <span className="text-slate-300">
                Dropped:{" "}
                <strong
                  className={
                    simulatedDropPct > 0 ? "text-rose-400" : "text-emerald-400"
                  }
                >
                  {simulatedDropPct}%
                </strong>
              </span>
              {chaosKilledNodeId && (
                <button
                  onClick={() => setChaosKilledNodeId(null)}
                  className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-200 font-semibold cursor-pointer"
                >
                  Heal Killed Node
                </button>
              )}
            </div>
          </div>

          {connectingFromId && (
            <div className="px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-xs text-indigo-200 flex items-center justify-between">
              <span>
                Connecting from{" "}
                <strong>
                  {canvasNodes.find((n) => n.id === connectingFromId)?.label}
                </strong>{" "}
                — click another node&apos;s <strong>Connect</strong> button to complete wire.
              </span>
              <button
                onClick={() => setConnectingFromId(null)}
                className="text-xs underline cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Drag-and-Drop Diagram Surface */}
          <div
            ref={canvasRef}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            onPointerLeave={handleCanvasPointerUp}
            className="relative w-full h-[430px] rounded-xl bg-[#070b12] border border-slate-800 overflow-hidden select-none"
          >
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(#4f46e5 1px, transparent 1px)",
                backgroundSize: "20px 20px"
              }}
            />

            {/* Cubic Bezier SVG Edges + Animated Data Packets */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="8"
                  markerHeight="6"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#818cf8" />
                </marker>
              </defs>
              {canvasEdges.map((edge) => {
                const fromNode = canvasNodes.find((n) => n.id === edge.from);
                const toNode = canvasNodes.find((n) => n.id === edge.to);
                if (!fromNode || !toNode) return null;
                const x1 = fromNode.x + 175;
                const y1 = fromNode.y + 36;
                const x2 = toNode.x;
                const y2 = toNode.y + 36;
                const cx1 = x1 + Math.max(40, Math.abs(x2 - x1) * 0.45);
                const cx2 = x2 - Math.max(40, Math.abs(x2 - x1) * 0.45);
                const pathData = `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`;
                return (
                  <g key={edge.id}>
                    <path
                      d={pathData}
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="2.2"
                      markerEnd="url(#arrowhead)"
                    />
                    <circle
                      r={trafficMultiplier === 50 ? "4.5" : "3.5"}
                      fill={simulatedDropPct > 0 ? "#fb7185" : "#38bdf8"}
                    >
                      <animateMotion
                        dur={
                          trafficMultiplier === 50
                            ? "0.65s"
                            : trafficMultiplier === 10
                            ? "1.2s"
                            : "2.4s"
                        }
                        repeatCount="indefinite"
                        path={pathData}
                      />
                    </circle>
                    {edge.protocol && (
                      <g
                        transform={`translate(${(x1 + x2) / 2 - 36}, ${
                          (y1 + y2) / 2 - 11
                        })`}
                      >
                        <rect width="74" height="18" rx="4" fill="#0f172a" stroke="#334155" />
                        <text
                          x="37"
                          y="12"
                          textAnchor="middle"
                          fill="#93c5fd"
                          fontSize="9"
                          fontWeight="600"
                        >
                          {edge.protocol}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Draggable Node Cards */}
            {canvasNodes.map((node) => {
              const isConnectingSource = connectingFromId === node.id;
              const isChaosKilled = chaosKilledNodeId === node.id;
              const nodeLoadPct = getNodeLoadPct(node);
              return (
                <div
                  key={node.id}
                  onPointerDown={(e) => handleNodePointerDown(e, node)}
                  style={{ left: `${node.x}px`, top: `${node.y}px` }}
                  className={`absolute w-[184px] p-2.5 rounded-xl border shadow-lg backdrop-blur-md cursor-grab active:cursor-grabbing transition-all ${
                    isConnectingSource ? "ring-2 ring-cyan-400 " : ""
                  }${
                    isChaosKilled
                      ? "bg-rose-950/90 border-rose-500 text-rose-200 opacity-75"
                      : nodeLoadPct >= 95
                      ? "ring-2 ring-rose-500 animate-pulse " + getCategoryStyles(node.category)
                      : getCategoryStyles(node.category)
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <div className="flex items-center gap-1 truncate">
                      <Move className="w-3 h-3 opacity-60 shrink-0" />
                      <span className="text-[11px] font-bold truncate">{node.label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() =>
                          setChaosKilledNodeId((prev) =>
                            prev === node.id ? null : node.id
                          )
                        }
                        title="Chaos Monkey: Simulate Node Outage / Failover"
                        className={`px-1 rounded text-[9px] font-bold cursor-pointer ${
                          isChaosKilled
                            ? "bg-emerald-500 text-slate-950"
                            : "bg-black/40 hover:bg-rose-500/40 text-amber-300"
                        }`}
                      >
                        {isChaosKilled ? "Heal" : "Kill"}
                      </button>
                      <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => {
                          setCanvasNodes((prev) => prev.filter((n) => n.id !== node.id));
                          setCanvasEdges((prev) =>
                            prev.filter((e) => e.from !== node.id && e.to !== node.id)
                          );
                        }}
                        className="opacity-60 hover:opacity-100 text-rose-300 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="text-[10px] opacity-80 truncate">{node.sublabel}</div>
                  <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-white/10 text-[9px]">
                    <span
                      className={`font-mono font-bold ${
                        isChaosKilled
                          ? "text-rose-300"
                          : nodeLoadPct >= 90
                          ? "text-rose-300"
                          : nodeLoadPct >= 75
                          ? "text-amber-200"
                          : "text-emerald-300"
                      }`}
                    >
                      {isChaosKilled ? "OFFLINE (CHAOS)" : `CPU ${nodeLoadPct}%`}
                    </span>
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => handlePortClick(node.id)}
                      className={`px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5 cursor-pointer ${
                        isConnectingSource
                          ? "bg-cyan-500 text-slate-950"
                          : "bg-black/40 hover:bg-black/70 text-cyan-200"
                      }`}
                    >
                      <GitCommitHorizontal className="w-2.5 h-2.5" />
                      <span>{isConnectingSource ? "Source" : "Connect"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Topology Diagnostics / SPOF Check */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            {topologyDiagnostics.passed ? (
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  Topology Linter Passed: Edge Gateway, Stateless Compute, In-Memory Cache, and Durable Storage tiers verified.
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  <strong>Architecture Linter:</strong> {topologyDiagnostics.warnings[0]}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FOCUSED CURRENT STAGE WORKSPACE */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white">{currentStageMeta.label}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{currentStageMeta.coachTip}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReferenceHint(!showReferenceHint)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-xs font-medium text-slate-300 border border-slate-800 flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>{showReferenceHint ? "Hide Hints" : "Peek Stage Hints"}</span>
            </button>
            <button
              onClick={handleInsertSampleAnswer}
              className="px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-xs font-semibold text-indigo-300 border border-indigo-500/30 cursor-pointer"
            >
              Auto-Fill {targetLevel} Model Answer
            </button>
          </div>
        </div>

        {showReferenceHint && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            {activeStage === "requirements" && (
              <div>
                <div className="font-bold text-indigo-300 mb-1">Key Constraints to Cover:</div>
                <ul className="list-disc list-inside text-slate-300 space-y-1">
                  {problem.nonFunctionalRequirements.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
            {activeStage === "estimation" && (
              <div className="text-slate-300 space-y-1">
                <div className="font-bold text-indigo-300">Reference Capacity Targets:</div>
                <div>• Read QPS: {problem.capacityDefaults.readQps}</div>
                <div>• Write QPS: {problem.capacityDefaults.writeQps}</div>
                <div>• Storage: {problem.capacityDefaults.storagePerYear}</div>
              </div>
            )}
            {(activeStage === "api_data" || activeStage === "high_level_design") && (
              <div className="space-y-2">
                <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" />
                  Reference Schema & Endpoints:
                </div>
                {problem.coreEntities.map((ent, i) => (
                  <div key={i} className="text-slate-300 font-mono text-[11px]">
                    {ent.table} ({ent.dbType}): {ent.schema} [Partition: {ent.partitionKey}]
                  </div>
                ))}
              </div>
            )}
            {activeStage === "deep_dives" && (
              <div className="space-y-2">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  {targetLevel} Deep Dive Questions:
                </div>
                {problem.deepDiveQuestions.map((q, i) => (
                  <div key={i} className="text-slate-300">
                    <strong>[{q.level}]</strong> {q.question}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <textarea
          value={stageInputs[activeStage]}
          onChange={(e) =>
            setStageInputs((prev) => ({ ...prev, [activeStage]: e.target.value }))
          }
          rows={7}
          placeholder={`Type your ${currentStageMeta.label} walkthrough here...`}
          className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 text-xs text-slate-100 font-mono leading-relaxed focus:outline-none focus:border-indigo-500"
        />

        <div className="flex items-center justify-between pt-1">
          <div className="text-xs text-slate-500">
            Step {currentStageMeta.stepNum} of 5
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleEvaluateStage}
              disabled={isEvaluating}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {isEvaluating ? "Grading..." : `Grade Step ${currentStageMeta.stepNum}`}
              </span>
            </button>
            {currentStageIndex < DELIVERY_STAGES.length - 1 && (
              <button
                onClick={() =>
                  setActiveStage(DELIVERY_STAGES[currentStageIndex + 1].id)
                }
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <span>Next Stage</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {currentEval && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-indigo-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-bold text-white">
                  Score: {currentEval.score}/100
                </span>
              </div>
              <span className="text-xs font-semibold text-indigo-300">
                {currentEval.levelCalibrationNote}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {currentEval.interviewerFeedback}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {currentEval.coveredPoints.map((pt, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {pt}
                </span>
              ))}
              {currentEval.missedPoints.map((pt, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-300 flex items-center gap-1"
                >
                  <HelpCircle className="w-3 h-3" />
                  {pt}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
