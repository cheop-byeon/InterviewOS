import {
  CanvasEdge,
  CanvasNode,
  DeliveryStageId,
  InterviewMode,
  InterviewScorecard,
  StepEvaluationResult,
  SystemDesignProblem,
  TargetLevel
} from "../types";

/**
 * Evaluates a single step of the HelloInterview 5-Step Delivery Framework
 */
export function evaluateGuidedStep(
  problem: SystemDesignProblem,
  stageId: DeliveryStageId,
  userResponse: string,
  canvasNodes: CanvasNode[],
  canvasEdges: CanvasEdge[],
  targetLevel: TargetLevel
): StepEvaluationResult {
  const lower = userResponse.toLowerCase();

  if (stageId === "requirements") {
    const covered: string[] = [];
    const missed: string[] = [];

    const checks = [
      { label: "Core user journeys (Functional Scope)", test: /(search|view|book|reserve|send|match|query|ingest|request)/i },
      { label: "Consistency vs. Availability trade-off (CAP / ACID)", test: /(consistency|acid|availability|eventual|double.?book|atomic)/i },
      { label: "Latency & SLA targets (e.g., <200ms P99, 99.99%)", test: /(latency|ms|p99|p95|99\.9|sla|real.?time)/i },
      { label: "Scale & concurrency sizing (DAU / Peak QPS)", test: /(million|dau|qps|concurrent|peak|scale|throughput)/i }
    ];

    for (const c of checks) {
      if (c.test.test(lower)) covered.push(c.label);
      else missed.push(c.label);
    }

    const score = Math.min(98, Math.max(35, 35 + covered.length * 16));
    return {
      stageId,
      score,
      status: score >= 80 ? "strong" : score >= 60 ? "acceptable" : "needs_work",
      coveredPoints: covered,
      missedPoints: missed,
      interviewerFeedback:
        score >= 80
          ? `Strong framing! You clearly separated functional user journeys from non-functional SLAs and explicitly called out the consistency vs. latency boundary.`
          : `Good start, but in a 45-minute loop you want to lock down 3–4 crisp Functional Requirements and explicitly state your CAP theorem stance (${problem.nonFunctionalRequirements[0]}) before jumping into databases.`,
      levelCalibrationNote:
        targetLevel === "L6"
          ? "Staff (L6) bar: Proactively scope out non-goals (e.g., third-party payment gateway internals) and identify the #1 load-bearing constraint in under 4 minutes."
          : "Senior (L5) bar: Quantify read vs. write ratio and define strict vs. eventual consistency per path."
    };
  }

  if (stageId === "estimation") {
    const hasQps = /(qps|rps|queries|requests|sec)/i.test(lower);
    const hasStorage = /(tb|gb|pb|storage|memory|ram)/i.test(lower);
    const hasPeak = /(peak|spike|concurrent|fanout)/i.test(lower);

    const covered: string[] = [];
    const missed: string[] = [];
    if (hasQps) covered.push(`Read vs. Write QPS (${problem.capacityDefaults.readQps})`);
    else missed.push(`Read vs. Write QPS breakdown (${problem.capacityDefaults.readQps})`);

    if (hasStorage) covered.push(`Storage & Memory footprint (${problem.capacityDefaults.storagePerYear})`);
    else missed.push(`Storage & Cache sizing (${problem.capacityDefaults.storagePerYear})`);

    if (hasPeak) covered.push("Peak-to-Average traffic multiplier & burst sizing");
    else missed.push("Peak concurrency spike math (critical for provisioning shards/locks)");

    const score = Math.min(96, 40 + covered.length * 19);
    return {
      stageId,
      score,
      status: score >= 78 ? "strong" : score >= 58 ? "acceptable" : "needs_work",
      coveredPoints: covered,
      missedPoints: missed,
      interviewerFeedback:
        score >= 78
          ? "Solid back-of-the-envelope math. More importantly, you tied your numbers directly to architectural decisions (why in-memory Redis or sharding is required)."
          : "Remember HelloInterview's rule of thumb: never do math in a vacuum! Only calculate numbers that directly justify a design decision (e.g., whether working set fits in a single Redis cluster).",
      levelCalibrationNote: `Reference targets: ${problem.capacityDefaults.readQps} | ${problem.capacityDefaults.writeQps}.`
    };
  }

  if (stageId === "api_data") {
    const hasEndpoints = /(get|post|put|ws|wss|\/api|\/v1|endpoint)/i.test(lower);
    const hasSchema = /(pk|fk|key|id|table|schema|index|partition|shard)/i.test(lower);
    const hasIdempotency = /(idempotency|token|cursor|pagination|ttl|version)/i.test(lower);

    const covered: string[] = [];
    const missed: string[] = [];
    if (hasEndpoints) covered.push("REST / WebSocket / gRPC API contracts defined");
    else missed.push("Explicit API method + path + request/response payload");

    if (hasSchema) covered.push("Core Entities, Primary Keys & Partition Keys");
    else missed.push("Database table schema & partition/sharding key selection");

    if (hasIdempotency) covered.push("Idempotency keys / TTL / Optimistic version fields");
    else missed.push("Idempotency key or concurrency version column on write endpoints");

    const score = Math.min(97, 40 + covered.length * 19);
    return {
      stageId,
      score,
      status: score >= 78 ? "strong" : score >= 58 ? "acceptable" : "needs_work",
      coveredPoints: covered,
      missedPoints: missed,
      interviewerFeedback:
        score >= 78
          ? "Clean API and data model design. Including idempotency and partition keys early makes your High-Level Design much smoother."
          : `Make sure to specify your partition key (${problem.coreEntities[0]?.partitionKey}) and concurrency control fields before drawing the full architecture.`,
      levelCalibrationNote: "Senior+ candidates explicitly avoid sending user_id in the request body when it should be extracted from the verified JWT/Auth header."
    };
  }

  if (stageId === "high_level_design") {
    const nodeLabels = canvasNodes.map((n) => `${n.label} ${n.sublabel} ${n.category}`.toLowerCase()).join(" ");
    const combined = `${lower} ${nodeLabels}`;

    const hasEdgeLayer = /(gateway|cdn|websocket|load balancer)/i.test(combined);
    const hasCacheLayer = /(redis|cache|in-memory)/i.test(combined);
    const hasDbLayer = /(postgres|cassandra|database|vector|shard)/i.test(combined);
    const hasAsyncQueue = /(kafka|queue|stream|pub\/sub|push)/i.test(combined);
    const hasConnections = canvasEdges.length >= 4;

    const covered: string[] = [];
    const missed: string[] = [];

    if (hasEdgeLayer) covered.push("Edge / API Gateway / Connection Layer on canvas");
    else missed.push("Edge Gateway / Load Balancer / WebSocket tier");

    if (hasCacheLayer) covered.push("In-Memory Cache / Lock / Spatial Index (Redis)");
    else missed.push("Low-latency Redis layer for hot locks/sessions/cache");

    if (hasDbLayer) covered.push("Primary Durable Storage Tier");
    else missed.push("Durable Database (PostgreSQL / Cassandra / Vector DB)");

    if (hasAsyncQueue) covered.push("Async Event Bus / Queue (Kafka) for decoupling");
    else missed.push("Message Queue / Stream (Kafka) to decouple heavy side-effects");

    if (hasConnections) covered.push(`${canvasNodes.length} Architecture Nodes & ${canvasEdges.length} Data Flows wired`);
    else missed.push("Connect at least 4 data-flow edges on the Interactive Architecture Canvas");

    const score = Math.min(98, 25 + covered.length * 15);
    return {
      stageId,
      score,
      status: score >= 80 ? "strong" : score >= 60 ? "acceptable" : "needs_work",
      coveredPoints: covered,
      missedPoints: missed,
      interviewerFeedback:
        score >= 80
          ? "Excellent end-to-end topology! Your interactive canvas separates stateless compute, fast in-memory coordination, durable storage, and asynchronous event processing."
          : "Your architecture canvas is missing a few critical tiers (check missed points below, or click 'Load Reference Architecture' to compare your topology with the FAANG reference blueprint).",
      levelCalibrationNote: "Interviewers love when you trace the read path and write path separately across your diagram."
    };
  }

  // Deep Dives
  const matchedKeywords = problem.requiredArchitectureKeywords.filter((kw) =>
    lower.includes(kw.toLowerCase())
  );
  const covered = matchedKeywords.map((k) => `Addressed architectural concept: '${k.toUpperCase()}'`);
  const missed = problem.requiredArchitectureKeywords
    .filter((kw) => !lower.includes(kw.toLowerCase()))
    .slice(0, 4)
    .map((k) => `Discuss trade-offs around: '${k.toUpperCase()}'`);

  const score = Math.min(
    98,
    Math.max(45, Math.round((matchedKeywords.length / Math.max(1, problem.requiredArchitectureKeywords.length)) * 85) + (lower.length > 180 ? 15 : 0))
  );

  return {
    stageId,
    score,
    status: score >= 78 ? "strong" : score >= 60 ? "acceptable" : "needs_work",
    coveredPoints: covered.length > 0 ? covered : ["Provided initial bottleneck discussion"],
    missedPoints: missed,
    interviewerFeedback:
      score >= 78
        ? `Strong ${targetLevel}-calibrated deep dive! You defended failure modes, edge cases, and latency vs. consistency trade-offs with concrete mechanisms.`
        : `To clear the ${targetLevel} bar, don't just name technologies—explain *what breaks* at 10x load and compare at least two approaches (e.g., Pessimistic DB locks vs. Redis TTL + Optimistic Versioning).`,
    levelCalibrationNote:
      targetLevel === "L6"
        ? "L6 Staff distinction: Proactively drive the deep dive into multi-region failover, split-brain mitigation, and cost/operational complexity without waiting for interviewer hints."
        : "L5 Senior distinction: Identify bottlenecks on your own diagram and propose concrete mitigations."
  };
}

/**
 * Generates an adaptive next interviewer question + live coaching signal during Mock Interviews
 */
export function generateMockInterviewerTurn(
  mode: InterviewMode,
  targetLevel: TargetLevel,
  turnCount: number,
  candidateMessage: string,
  contextTitle: string
): {
  reply: string;
  stageTag: string;
  clarity: number;
  depth: number;
  coachHint: string;
} {
  const lower = candidateMessage.toLowerCase();
  const wordCount = candidateMessage.trim().split(/\s+/).length;

  const hasMetricsOrTradeoffs =
    /(\d+|latency|qps|o\(n\)|o\(1\)|redis|kafka|postgres|shard|lock|ttl|trade-?off|because|however|versus|vs)/i.test(
      lower
    );

  const clarity = Math.min(96, Math.max(55, 62 + Math.min(25, Math.floor(wordCount / 4))));
  const depth = Math.min(
    98,
    Math.max(48, 52 + (hasMetricsOrTradeoffs ? 28 : 5) + Math.min(18, Math.floor(wordCount / 6)))
  );

  if (mode === "system_design") {
    if (turnCount === 1) {
      return {
        reply: `Good requirements framing for **${contextTitle}**. Before we draw the high-level components, let's lock down the API contract and data model: What are the 2–3 core API endpoints, what database engine do you choose for the primary entities, and what is your partition key?`,
        stageTag: "Stage 2: API & Data Model",
        clarity,
        depth,
        coachHint: "Specify exact HTTP/gRPC endpoints, primary keys, partition keys, and whether you need ACID or eventual consistency."
      };
    }
    if (turnCount === 2) {
      return {
        reply: `Makes sense. Now walk me through the **High-Level Architecture** for the write path and read path. Specifically, when traffic spikes 20x (${targetLevel} scale), where is the first bottleneck in your design and how do we prevent cascading database overload?`,
        stageTag: "Stage 3: High-Level Design & Scaling",
        clarity,
        depth,
        coachHint: "Trace Client -> API Gateway -> Stateless Service -> Redis Cache/Lock -> Sharded DB + Kafka async workers."
      };
    }
    return {
      reply: `Let's push on a **${targetLevel} Deep Dive failure mode**: Suppose your primary Redis cluster node holding active state/locks crashes mid-request before replicating to its replica. How does your system prevent data corruption or double-processing, and how do you handle failback without a thundering herd?`,
      stageTag: "Stage 4: Failure Modes & Trade-offs",
      clarity,
      depth,
      coachHint: "Discuss Fencing Tokens, Idempotency Keys, Optimistic Concurrency Control in the source-of-truth DB, and jittered cache warm-up."
    };
  }

  if (mode === "coding") {
    if (turnCount === 1) {
      return {
        reply: `Thanks for walking through your initial approach. Before or as you code it in the editor: what is the exact **Time and Space Complexity** of your solution, and what edge cases (e.g., capacity = 1, duplicate keys, concurrency) could break it?`,
        stageTag: "Complexity & Edge Cases",
        clarity,
        depth,
        coachHint: "State Big-O time & space clearly and explain the invariant that keeps every operation O(1)."
      };
    }
    return {
      reply: `Nice implementation. Now for a **${targetLevel} production follow-up**: Right now this data structure lives in a single process's memory. If we deploy this across 50 stateless API servers behind a load balancer, how would you distribute this state while keeping latency under 2ms?`,
      stageTag: "Distributed Systems Extension",
      clarity,
        depth,
      coachHint: "Compare Sticky Sessions / Consistent Hashing ring vs. centralized Redis atomic Lua script vs. local L1 cache + Redis L2."
    };
  }

  if (mode === "behavioral") {
    if (turnCount === 1) {
      return {
        reply: `Thanks for sharing that context. Let's drill into your specific **personal contribution (the 'I' vs. 'We')**: What was the hardest technical or organizational disagreement you faced during that project, and what concrete evidence or prototype did you use to win alignment?`,
        stageTag: "STAR Probe: Conflict & Ownership",
        clarity,
        depth,
        coachHint: "Use 'I' statements. Quantify the trade-off options you evaluated and the measurable outcome (%, latency, revenue, velocity)."
      };
    }
    return {
      reply: `Looking back at that outcome from a **${targetLevel}** lens: What was the biggest architectural or process mistake you made along the way, and what systemic guardrail did you put in place so the organization wouldn't hit that issue again?`,
      stageTag: "STAR Probe: Reflection & Systemic Impact",
      clarity,
      depth,
      coachHint: "Show blameless ownership and systemic leverage (RFC templates, automated canary rollbacks, SLO alerts)."
    };
  }

  // resume_jd mode
  if (turnCount === 1) {
    return {
      reply: `On your resume, you highlighted scaling distributed backend services with PostgreSQL, Redis, and Kafka. For this **${targetLevel}** role, walk me through the single highest-concurrency bottleneck you personally debugged in production: how did you diagnose it, and why did you choose your architecture over simpler alternatives?`,
      stageTag: "Resume Deep Dive: Architecture Ownership",
      clarity,
      depth,
      coachHint: "Connect your past production metrics directly to the requirements in the target Job Description."
    };
  }
  return {
    reply: `That's a strong example. One gap recruiters often probe between resume bullets and **${targetLevel}** expectations is cross-team technical leadership: Tell me how you drove an architectural standard (like idempotency, observability, or RAG evaluation) across multiple teams who had competing priorities.`,
    stageTag: "JD Alignment: Scope & Influence",
    clarity,
    depth,
    coachHint: "Highlight RFC authorship, measurable adoption across teams, and business/SLA impact."
  };
}

/**
 * Generates a complete FAANG-calibrated Rubric Scorecard at the end of a Mock Interview
 */
export function generateInterviewScorecard(
  mode: InterviewMode,
  targetLevel: TargetLevel,
  candidateResponses: string[]
): InterviewScorecard {
  const combined = candidateResponses.join(" ").toLowerCase();
  const totalWords = combined.split(/\s+/).filter(Boolean).length;

  const hasQuantMetrics = /(\d+%|\d+\s*ms|\d+\s*qps|o\(1\)|o\(n\)|99\.9)/i.test(combined);
  const hasArchDepth = /(redis|kafka|postgres|shard|partition|lock|ttl|idempotency|hnsw|bm25|hashmap|linked list)/i.test(
    combined
  );
  const hasTradeoffs = /(trade-?off|versus|vs|however|downside|bottleneck|failover|consistency)/i.test(
    combined
  );

  const baseScore = Math.min(
    94,
    Math.max(
      64,
      62 +
        (hasQuantMetrics ? 11 : 0) +
        (hasArchDepth ? 12 : 0) +
        (hasTradeoffs ? 9 : 0) +
        Math.min(8, Math.floor(totalWords / 35))
    )
  );

  const overallHireSignal: InterviewScorecard["overallHireSignal"] =
    baseScore >= 88
      ? "Strong Hire"
      : baseScore >= 78
      ? "Hire"
      : baseScore >= 68
      ? "Lean Hire"
      : "Lean No-Hire";

  const dimensions = [
    {
      dimension: "Problem Navigation & Structure (Delivery Framework)",
      score: Number((baseScore >= 82 ? 3.6 : 3.1).toFixed(1)),
      maxScore: 4.0,
      verdict: (baseScore >= 80 ? "Exceeds" : "Meets") as "Exceeds" | "Meets" | "Below",
      feedback:
        "Structured progression from requirements and constraints into concrete implementation without premature optimization."
    },
    {
      dimension: `Technical Depth & ${targetLevel} Calibration`,
      score: Number((hasArchDepth ? 3.7 : 2.9).toFixed(1)),
      maxScore: 4.0,
      verdict: (hasArchDepth ? "Exceeds" : "Meets") as "Exceeds" | "Meets" | "Below",
      feedback: hasArchDepth
        ? "Demonstrated strong command of storage internals, caching patterns, and concurrency invariants."
        : "Good high-level intuition; push deeper into specific data structures, lock mechanisms, and failure modes."
    },
    {
      dimension: "Trade-off Defense & Edge-Case Handling",
      score: Number((hasTradeoffs ? 3.5 : 2.8).toFixed(1)),
      maxScore: 4.0,
      verdict: (hasTradeoffs ? "Exceeds" : "Meets") as "Exceeds" | "Meets" | "Below",
      feedback: hasTradeoffs
        ? "Proactively contrasted competing approaches and articulated why specific trade-offs fit the workload."
        : "Explicitly state at least two alternatives (Option A vs. Option B) before committing to a design choice."
    },
    {
      dimension: "Communication Clarity & Quantified Signal",
      score: Number((hasQuantMetrics ? 3.6 : 3.0).toFixed(1)),
      maxScore: 4.0,
      verdict: (hasQuantMetrics ? "Exceeds" : "Meets") as "Exceeds" | "Meets" | "Below",
      feedback: hasQuantMetrics
        ? "Anchored claims with concrete latency, throughput, and Big-O complexity numbers."
        : "Anchor more of your answers with quantitative SLAs (e.g., P99 latency in ms, QPS scale, % improvement)."
    }
  ];

  return {
    overallHireSignal,
    calibratedLevel: targetLevel,
    overallScorePct: baseScore,
    dimensions,
    strengths: [
      "Clear top-down communication following a structured interview roadmap",
      hasArchDepth
        ? "Strong selection of production-grade primitives (Redis, Partitioned DBs, Async Streams)"
        : "Logical decomposition of core user flows and system responsibilities",
      "Responsive to interviewer pushback on scaling bottlenecks"
    ],
    growthAreas: [
      !hasTradeoffs
        ? "State trade-offs proactively ('We choose X over Y because of constraint Z') before the interviewer asks"
        : "Dive even faster into multi-region failover and split-brain edge cases for Staff+ calibration",
      !hasQuantMetrics
        ? "Include explicit capacity numbers (QPS, storage, P99 latency targets) early in the conversation"
        : "Tie back-of-the-envelope estimates directly to shard count and cache memory sizing"
    ],
    sampleStrongerAnswer:
      mode === "system_design"
        ? "To guarantee zero double-booking at 50k peak QPS while keeping seat-map reads <50ms, I separate the fast concurrency gate from durable ledger state: (1) Edge Waiting Room smooths burst admission; (2) Redis Cluster executes atomic `SET seat:{id} {user} NX EX 600` holds; (3) PostgreSQL enforces final ACID booking with an optimistic `version` check and fencing token so even a Redis failover cannot cause a double-sell."
        : "I implemented an O(1) LRU Cache by pairing a HashMap<Key, Node> with a Doubly Linked List using sentinel head/tail nodes. In a distributed multi-node deployment, I avoid sticky-session imbalance by partitioning keys across a Redis cluster via Consistent Hashing and executing atomic eviction/TTL updates via Lua scripts."
  };
}
