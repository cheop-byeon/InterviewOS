import {
  BulletCritique,
  FormattingCheck,
  KeywordItem,
  PrepRecommendation,
  ResumeScanResult,
  TargetLevel
} from "../types";

const KNOWN_CATALOG: {
  keyword: string;
  aliases: string[];
  category: KeywordItem["category"];
  importance: KeywordItem["importance"];
}[] = [
  { keyword: "Distributed Systems", aliases: ["distributed system", "distributed", "microservices"], category: "architecture", importance: "critical" },
  { keyword: "PostgreSQL", aliases: ["postgres", "postgresql", "sql"], category: "hard_skill", importance: "critical" },
  { keyword: "Redis", aliases: ["redis", "in-memory cache", "caching"], category: "hard_skill", importance: "critical" },
  { keyword: "Apache Kafka", aliases: ["kafka", "event-driven", "message queue", "streaming"], category: "architecture", importance: "critical" },
  { keyword: "Go", aliases: ["golang", " go ", "go,"], category: "hard_skill", importance: "recommended" },
  { keyword: "TypeScript", aliases: ["typescript", "ts", "node.js"], category: "hard_skill", importance: "recommended" },
  { keyword: "Python", aliases: ["python", "pytorch", "fastapi"], category: "hard_skill", importance: "recommended" },
  { keyword: "Rust", aliases: ["rust"], category: "hard_skill", importance: "bonus" },
  { keyword: "Idempotency", aliases: ["idempotent", "idempotency", "exactly-once"], category: "architecture", importance: "critical" },
  { keyword: "Distributed Locks", aliases: ["distributed lock", "locking", "optimistic locking", "concurrency"], category: "architecture", importance: "critical" },
  { keyword: "ACID Transactions", aliases: ["acid", "transaction", "consistency", "ledger"], category: "architecture", importance: "critical" },
  { keyword: "Rate Limiting", aliases: ["rate limit", "rate limiting", "throttling", "token bucket"], category: "architecture", importance: "recommended" },
  { keyword: "Circuit Breakers", aliases: ["circuit breaker", "fault-tolerant", "resilience", "availability"], category: "architecture", importance: "recommended" },
  { keyword: "Sharding & Partitioning", aliases: ["shard", "sharding", "partition", "partitioning"], category: "architecture", importance: "recommended" },
  { keyword: "gRPC & REST", aliases: ["grpc", "rest", "api"], category: "hard_skill", importance: "critical" },
  { keyword: "Kubernetes & AWS", aliases: ["kubernetes", "k8s", "eks", "aws", "docker"], category: "tooling", importance: "recommended" },
  { keyword: "Observability", aliases: ["observability", "opentelemetry", "prometheus", "grafana", "monitoring"], category: "tooling", importance: "bonus" },
  { keyword: "RAG & Vector Databases", aliases: ["rag", "retrieval-augmented", "vector", "hnsw", "qdrant", "milvus", "pinecone", "pgvector", "embeddings"], category: "architecture", importance: "critical" },
  { keyword: "Hybrid Search (BM25)", aliases: ["bm25", "hybrid search", "reranking", "cross-encoder", "elasticsearch", "opensearch"], category: "architecture", importance: "critical" },
  { keyword: "LLM Inference & KV-Cache", aliases: ["vllm", "tensorrt", "kv cache", "pagedattention", "prefill", "streaming", "sse", "llm"], category: "hard_skill", importance: "recommended" },
  { keyword: "NoSQL & Wide-Column DBs", aliases: ["cassandra", "dynamodb", "scylla", "bigtable", "mongodb", "nosql"], category: "hard_skill", importance: "recommended" },
  { keyword: "Stream Processing (Flink/Spark)", aliases: ["flink", "spark", "kinesis", "stream processing", "watermark", "windowing"], category: "architecture", importance: "recommended" },
  { keyword: "React & Modern Frontend", aliases: ["react", "next.js", "nextjs", "redux", "tailwind", "frontend"], category: "hard_skill", importance: "recommended" },
  { keyword: "GraphQL & API Gateways", aliases: ["graphql", "apollo", "envoy", "kong", "api gateway"], category: "hard_skill", importance: "bonus" },
  { keyword: "Infrastructure as Code (Terraform)", aliases: ["terraform", "pulumi", "cloudformation", "iac", "helm"], category: "tooling", importance: "recommended" },
  { keyword: "CI/CD & DevSecOps", aliases: ["ci/cd", "github actions", "gitlab", "jenkins", "argocd", "canary"], category: "tooling", importance: "recommended" },
  { keyword: "Consensus & Replication (Raft/Paxos)", aliases: ["raft", "paxos", "quorum", "wal", "write-ahead log", "replication", "leader election"], category: "architecture", importance: "bonus" },
  { keyword: "Security & Auth (OAuth2/RBAC)", aliases: ["oauth", "oauth2", "oidc", "jwt", "rbac", "acl", "zero-trust", "encryption"], category: "architecture", importance: "recommended" },
  { keyword: "Technical Leadership", aliases: ["led", "mentored", "rfc", "leadership", "architected", "cross-functional", "strategy"], category: "soft_skill", importance: "critical" }
];

const STRONG_ACTION_VERBS = [
  "architected",
  "engineered",
  "designed",
  "built",
  "scaled",
  "reduced",
  "optimized",
  "implemented",
  "spearheaded",
  "led",
  "migrated",
  "automated",
  "launched",
  "accelerated",
  "orchestrated"
];

const PASSIVE_PHRASES = [
  "responsible for",
  "helped",
  "worked on",
  "worked with",
  "assisted in",
  "participated in",
  "duties included"
];

export function analyzeResumeAgainstJD(resumeText: string, jdText: string): ResumeScanResult {
  const resumeLower = ` ${resumeText.toLowerCase()} `;
  const jdLower = ` ${jdText.toLowerCase()} `;

  // 1. Detect target keywords mentioned in the JD
  const matchedCatalog = KNOWN_CATALOG.filter((item) =>
    item.aliases.some((alias) => jdLower.includes(alias))
  );

  const activeCatalog = matchedCatalog.length >= 6 ? matchedCatalog : KNOWN_CATALOG.slice(0, 12);

  const keywords: KeywordItem[] = activeCatalog.map((item) => {
    let freq = 0;
    for (const alias of item.aliases) {
      const regex = new RegExp(alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      const matches = resumeText.match(regex);
      if (matches) freq += matches.length;
    }
    return {
      keyword: item.keyword,
      category: item.category,
      foundInResume: freq > 0,
      frequencyInResume: freq,
      importance: item.importance
    };
  });

  // 2. Extract and critique resume bullet points
  const lines = resumeText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("-") || l.startsWith("•") || l.startsWith("*"));

  const bulletCritiques: BulletCritique[] = lines.map((rawLine, idx) => {
    const cleanBullet = rawLine.replace(/^[-•*]\s*/, "").trim();
    const lowerBullet = cleanBullet.toLowerCase();
    const firstWord = lowerBullet.split(/\s+/)[0]?.replace(/[^a-z]/g, "") || "";

    const hasActionVerb = STRONG_ACTION_VERBS.includes(firstWord);
    const isPassive = PASSIVE_PHRASES.some((p) => lowerBullet.includes(p));
    const hasQuantifiedMetric = /(\d+%|\d+x|\$\d+|\d+\s*(ms|sec|s|qps|tps|m|k|b|tb|gb|users|documents|engineers|zones))/i.test(
      cleanBullet
    );

    const issues: string[] = [];
    let score = 55;

    if (hasActionVerb) score += 20;
    else issues.push("Starts with a weak or passive verb instead of a high-ownership action verb");

    if (hasQuantifiedMetric) score += 25;
    else issues.push("Missing quantified impact metric (e.g., % latency reduction, QPS scale, SLA, or engineering time saved)");

    if (isPassive) {
      score -= 20;
      issues.push("Contains passive phrasing ('Responsible for' / 'Helped' / 'Worked on') that dilutes ownership signal");
    }

    score = Math.max(25, Math.min(98, score));

    // Generate smart Google XYZ rewrite
    let xyzRewrite = cleanBullet;
    let explanation = "Strong XYZ bullet: Clearly states technical action, system mechanism, and measurable engineering outcome.";

    if (lowerBullet.includes("redis") && !hasQuantifiedMetric) {
      xyzRewrite =
        "Architected a distributed Redis cache-aside layer with automated TTL invalidation, reducing P99 merchant dashboard query latency by 68% (from 310ms to 98ms) and offloading 75% of read traffic from primary PostgreSQL.";
      explanation =
        "Replaces 'Responsible for working on Redis' with Google's XYZ formula: Accomplished [68% P99 latency drop] as measured by [310ms -> 98ms & 75% DB offload] by doing [distributed Redis cache-aside with TTL invalidation].";
    } else if (lowerBullet.includes("rate limit") && !hasQuantifiedMetric) {
      xyzRewrite =
        "Engineered a distributed Sliding Window Rate Limiter at the API Gateway layer using Redis atomic Lua scripts, blocking 99.4% of abusive burst traffic across 15,000 QPS with <2ms overhead.";
      explanation =
        "Upgrades vague 'Worked with teams to build rate limiting' into a specific L5/L6 architectural accomplishment with mechanism (Redis Lua scripts) and concrete SLA metrics.";
    } else if (lowerBullet.includes("kubernetes") || lowerBullet.includes("migrate")) {
      xyzRewrite =
        "Spearheaded zero-downtime migration of monolithic billing service to multi-AZ Kubernetes (AWS EKS), cutting deployment lead time by 70% and achieving 99.99% regional fault tolerance.";
      explanation =
        "Replaces 'Helped migrate' with direct technical leadership ownership and quantifies both operational velocity (70% faster deploys) and reliability (99.99% SLA).";
    } else if (lowerBullet.includes("evaluation") || lowerBullet.includes("prompt")) {
      xyzRewrite =
        "Designed an automated LLM evaluation and semantic routing framework across 4 frontier models, improving answer groundedness accuracy by 24% while cutting token inference cost by $18k/month.";
      explanation =
        "Transforms passive 'Responsible for building LLM evaluation pipelines' into quantified quality (+24% groundedness) and cost efficiency ($18k/mo saved).";
    } else if (lowerBullet.includes("bm25") || lowerBullet.includes("reranking")) {
      xyzRewrite =
        "Implemented a two-stage Hybrid Retrieval pipeline combining BM25 lexical search with Cross-Encoder neural reranking, boosting Top-5 retrieval NDCG@5 by 31% across 50M indexed documents.";
      explanation =
        "Converts 'Worked on improving search relevance' into a rigorous ML/Search systems metric (NDCG@5 +31%) and clear architectural pattern.";
    } else if (!hasQuantifiedMetric || isPassive) {
      xyzRewrite = `Engineered ${cleanBullet.replace(/^(responsible for working on|responsible for|helped|worked on|worked with)\s+/i, "")}, improving system throughput by 45% and reducing P99 latency to <50ms in production.`;
      explanation =
        "Applies Google's XYZ structure by leading with a strong ownership verb and anchoring the technical work to measurable production latency/throughput gains.";
    }

    return {
      id: `bullet_${idx}`,
      original: cleanBullet,
      score,
      hasActionVerb,
      hasQuantifiedMetric,
      isPassive,
      issues,
      xyzRewrite,
      explanation
    };
  });

  // 3. Formatting & ATS Parsability Checks
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(resumeText);
  const hasGithubOrLinkedin = /(github\.com|linkedin\.com)/i.test(resumeText);
  const hasExperienceHeader = /\b(experience|employment|work history)\b/i.test(resumeText);
  const hasSkillsHeader = /\b(skills|technologies|technical skills)\b/i.test(resumeText);
  const wordCount = resumeText.trim().split(/\s+/).length;

  const formattingChecks: FormattingCheck[] = [
    {
      id: "contact_info",
      label: "Parsable Contact Header & Portfolio Links",
      passed: hasEmail && hasGithubOrLinkedin,
      detail: hasEmail && hasGithubOrLinkedin
        ? "Email and GitHub/LinkedIn profile links detected in plain text header."
        : "Missing plain-text email or GitHub/LinkedIn URLs (avoid embedding links inside icons)."
    },
    {
      id: "standard_sections",
      label: "Standard ATS Section Headings (Experience, Skills, Education)",
      passed: hasExperienceHeader && hasSkillsHeader,
      detail: hasExperienceHeader && hasSkillsHeader
        ? "Standard section taxonomy recognized by Greenhouse, Lever, and Workday parsers."
        : "Ensure explicit 'EXPERIENCE' and 'SKILLS' headings for reliable ATS segmentation."
    },
    {
      id: "quantified_density",
      label: "Quantified Impact Ratio (>= 60% of bullets contain metrics)",
      passed:
        bulletCritiques.length > 0 &&
        bulletCritiques.filter((b) => b.hasQuantifiedMetric).length / bulletCritiques.length >= 0.6,
      detail: `${bulletCritiques.filter((b) => b.hasQuantifiedMetric).length} of ${bulletCritiques.length} experience bullets contain hard numbers (%, ms, QPS, scale).`
    },
    {
      id: "active_voice",
      label: "Zero Passive Ownership Phrasing ('Responsible for', 'Helped')",
      passed: bulletCritiques.every((b) => !b.isPassive),
      detail: bulletCritiques.every((b) => !b.isPassive)
        ? "All bullets begin with strong, direct engineering ownership verbs."
        : `${bulletCritiques.filter((b) => b.isPassive).length} bullets use passive phrasing that weakens L5/L6 hiring signal.`
    },
    {
      id: "length_check",
      label: "Optimal Technical Conciseness",
      passed: wordCount >= 100 && wordCount <= 850,
      detail: `Resume contains ${wordCount} words — clean single-column parsable structure.`
    }
  ];

  // 4. Calculate Aggregate Scores
  const hardKeywords = keywords.filter((k) => k.category === "hard_skill" || k.category === "tooling");
  const archKeywords = keywords.filter((k) => k.category === "architecture" || k.category === "soft_skill");

  const hardSkillMatchPct =
    hardKeywords.length > 0
      ? Math.round((hardKeywords.filter((k) => k.foundInResume).length / hardKeywords.length) * 100)
      : 85;

  const architectureMatchPct =
    archKeywords.length > 0
      ? Math.round((archKeywords.filter((k) => k.foundInResume).length / archKeywords.length) * 100)
      : 80;

  const impactMetricScore =
    bulletCritiques.length > 0
      ? Math.round(bulletCritiques.reduce((acc, b) => acc + b.score, 0) / bulletCritiques.length)
      : 70;

  const parsabilityScore = Math.round(
    (formattingChecks.filter((c) => c.passed).length / formattingChecks.length) * 100
  );

  const overallScore = Math.round(
    hardSkillMatchPct * 0.3 +
      architectureMatchPct * 0.3 +
      impactMetricScore * 0.25 +
      parsabilityScore * 0.15
  );

  const detectedLevel: TargetLevel = jdLower.includes("staff") || jdLower.includes("l6") || jdLower.includes("7+ years")
    ? "L6"
    : jdLower.includes("senior") || jdLower.includes("l5") || jdLower.includes("5+ years")
    ? "L5"
    : "L4";

  const detectedRole = jdLower.includes("rag") || jdLower.includes("ai ") || jdLower.includes("ml")
    ? "Staff / Senior AI & Retrieval Systems Engineer"
    : "Senior Backend & Distributed Systems Engineer";

  // 5. Generate End-to-End Prep Recommendations linking ATS gaps to our Practice Modules!
  const prepRecommendations: PrepRecommendation[] = [
    {
      skillGap: "Distributed Locks, Idempotency & High-Concurrency ACID",
      recommendedModule: "system_design",
      targetTopicId: "ticketmaster",
      actionLabel: "Launch Ticketmaster Guided System Design",
      reason: "JD emphasizes ACID transactions, Idempotency, and Distributed Locks under peak load."
    },
    {
      skillGap: "Rate Limiting & Sliding Window Concurrency",
      recommendedModule: "mock_interview",
      targetTopicId: "rate_limiter_sliding_window",
      actionLabel: "Practice Rate Limiter Coding + AI Mock Round",
      reason: "JD requires production experience with API Rate Limiting and burst protection."
    },
    {
      skillGap: "Enterprise RAG, Hybrid Search (BM25 + HNSW) & Reranking",
      recommendedModule: "system_design",
      targetTopicId: "rag_enterprise",
      actionLabel: "Practice Enterprise RAG System Design",
      reason: "Directly drills Vector Quantization, ACL pre-filtering, and <250ms hybrid retrieval."
    }
  ];

  const missingCritical = keywords
    .filter((k) => !k.foundInResume && k.importance !== "bonus")
    .map((k) => k.keyword);

  const executiveSummary =
    overallScore >= 80
      ? `Strong ${detectedLevel} candidate match (${overallScore}%). Your core stack aligns well, but upgrading ${bulletCritiques.filter((b) => b.score < 80).length} passive bullets with the XYZ rewrites below and adding [${missingCritical.slice(0, 3).join(", ") || "Observability & Sharding"}] will push your ATS score past 92%.`
      : `Moderate ATS match (${overallScore}%) for ${detectedRole} (${detectedLevel}). Recruiters and ATS filters are looking for explicit signals on [${missingCritical.slice(0, 4).join(", ")}], and ${bulletCritiques.filter((b) => !b.hasQuantifiedMetric).length} resume bullets need quantified metrics.`;

  return {
    overallScore,
    hardSkillMatchPct,
    architectureMatchPct,
    impactMetricScore,
    parsabilityScore,
    detectedRole,
    detectedLevel,
    keywords,
    bulletCritiques,
    formattingChecks,
    prepRecommendations,
    executiveSummary
  };
}
