import {
  CodingProblem,
  CompanyQuestionItem,
  JobApplicationCard,
  PracticeSessionRecord,
  ResumeJDPreset,
  StarStory
} from "../types";

export const RESUME_JD_PRESETS: ResumeJDPreset[] = [
  {
    id: "senior_backend_stripe",
    title: "Senior Backend / Distributed Systems Engineer",
    company: "Stripe / Fintech Tier-1",
    level: "L5",
    resumeText: `ALEX CHEN
alex.chen@email.com | San Francisco, CA | github.com/alexchen | linkedin.com/in/alexchen

EXPERIENCE
Senior Software Engineer — FinPay Systems (2023 – Present)
- Engineered distributed payment processing microservices in Go and TypeScript handling 18,000 peak QPS with 99.995% availability.
- Responsible for working on the Redis caching layer to make database queries faster for merchant dashboards.
- Built an asynchronous webhook delivery pipeline using Apache Kafka and PostgreSQL, reducing dead-letter queue retries by 64%.
- Helped migrate monolithic billing service to Kubernetes on AWS EKS across 3 availability zones.

Software Engineer — CloudScale Corp (2020 – 2023)
- Implemented REST and gRPC APIs for multi-tenant subscription management serving 1.4M daily active users.
- Optimized slow PostgreSQL queries by adding composite indexes and read replicas, cutting P99 API latency from 420ms to 85ms.
- Worked with cross-functional teams to build rate limiting for public API endpoints.

SKILLS
Languages: Go, TypeScript, Python, SQL
Infrastructure & Data: PostgreSQL, Redis, Apache Kafka, Docker, Kubernetes, AWS, gRPC, REST, Distributed Systems

EDUCATION
B.S. in Computer Science, University of California, Berkeley`,
    jdText: `Role: Senior Backend Engineer — Core Payments & Ledger Infrastructure (L5)
Location: San Francisco / Hybrid

About the Role:
We are looking for a Senior Backend Engineer to architect and scale our global payment settlement and distributed ledger systems. You will design fault-tolerant microservices operating at 99.999% availability.

Requirements & Key Skills:
- 5+ years of experience building high-throughput Distributed Systems and Microservices in Go, Java, or TypeScript.
- Deep expertise in ACID transactions, Idempotency, Distributed Locks, and Event-Driven Architecture using Apache Kafka.
- Strong production experience with PostgreSQL (sharding, partitioning, query optimization) and Redis caching strategies.
- Experience designing Rate Limiting, Circuit Breakers, and high-availability APIs (gRPC / REST) deployed on Kubernetes and AWS.
- Demonstrated Technical Leadership, mentoring junior engineers, and driving cross-team RFC architecture reviews.
- Bonus: Experience with Observability (OpenTelemetry, Prometheus, Grafana) and Double-Entry Ledger systems.`
  },
  {
    id: "ai_platform_openai",
    title: "Staff AI Systems / RAG Infrastructure Engineer",
    company: "AI Frontier Lab",
    level: "L6",
    resumeText: `SAMIRA PATEL
samira.patel@email.com | Seattle, WA | github.com/spatel

EXPERIENCE
Lead Machine Learning Systems Engineer — DocuMind AI (2022 – Present)
- Architected enterprise Retrieval-Augmented Generation (RAG) search pipeline in Python and Rust indexing 80M enterprise documents.
- Reduced P95 retrieval latency by 58% (from 390ms to 164ms) by implementing HNSW vector quantization and Redis semantic caching.
- Responsible for building LLM evaluation pipelines and prompt routing across multiple model providers.
- Led a team of 6 engineers to ship document ACL permission filtering for Slack and Google Drive connectors.

Software Engineer II — SearchGrid (2019 – 2022)
- Built distributed Elasticsearch ingestion workers processing 12,000 updates/sec via Kafka streams.
- Worked on improving search relevance using BM25 and neural reranking models.

SKILLS
Python, Rust, TypeScript, PyTorch, Vector Databases, RAG, Embeddings, Kafka, Redis, Kubernetes, AWS

EDUCATION
M.S. in Computer Science, University of Washington`,
    jdText: `Role: Staff AI Platform Engineer — Enterprise Search & Agentic Infrastructure (L6)
Requirements:
- 7+ years building large-scale Distributed Systems, Search Infrastructure, or ML Platforms in Python, Rust, or Go.
- Deep experience with Retrieval-Augmented Generation (RAG), Vector Databases (HNSW, Qdrant/Milvus), Hybrid Search (BM25 + Dense Embeddings), and Cross-Encoder Reranking.
- Expertise in LLM Inference Optimization (vLLM, KV Cache, Streaming SSE, Token Rate Limiting) and Guardrails / Evals.
- Proven Staff-level Technical Leadership: authoring multi-quarter technical strategy, mentoring engineers, and aligning Product & Security stakeholders.`
  }
];

export const CODING_PROBLEMS: CodingProblem[] = [
  {
    id: "lru_cache_ttl",
    title: "Design LRU Cache with O(1) Operations",
    pattern: "Hash Map + Doubly Linked List",
    difficulty: "Medium",
    companies: ["Meta", "Amazon", "Stripe", "Google", "Microsoft"],
    prompt:
      "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache. Implement `get(key)` and `put(key, value)` such that both run in strict O(1) average time complexity. When the cache reaches `capacity`, evict the least recently used key before inserting a new key.",
    examples: [
      {
        input: "capacity = 2, put(1, 10), put(2, 20), get(1), put(3, 30), get(2)",
        output: "[10, -1, 30]",
        explanation: "Accessing key 1 marks it most recently used, so put(3, 30) evicts key 2."
      }
    ],
    starterCode: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
  }

  get(key) {
    if (!this.map.has(key)) return -1;
    const val = this.map.get(key);
    // Refresh recency order in O(1)
    this.map.delete(key);
    this.map.set(key, val);
    return val;
  }

  put(key, value) {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.capacity) {
      const oldestKey = this.map.keys().next().value;
      if (oldestKey !== undefined) this.map.delete(oldestKey);
    }
    this.map.set(key, value);
  }
}`,
    starterCodePy: `from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = OrderedDict()

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)
`,
    optimalSolution: `// Explicit Doubly Linked List + HashMap gives strict O(1) lookup and O(1) splice.`,
    timeComplexity: "O(1) for both get() and put()",
    spaceComplexity: "O(capacity) to store at most C nodes",
    keyInsights: [
      "A standard HashMap gives O(1) lookup but doesn't track recency order on its own without a linked list.",
      "A Doubly Linked List lets you remove any node in O(1) *if* you already have its pointer via the HashMap.",
      "Using dummy sentinel `head` and `tail` nodes eliminates null-pointer edge cases."
    ],
    testCases: [
      {
        input: "put(1,10), put(2,20), get(1)",
        expected: "10",
        runnerCodeJs: `const c = new LRUCache(2); c.put(1, 10); c.put(2, 20); return c.get(1);`,
        runnerCodePy: `(lambda c: (c.put(1, 10), c.put(2, 20), c.get(1))[2])(LRUCache(2))`
      },
      {
        input: "put(3,30) [evicts key 2] -> get(2)",
        expected: "-1",
        runnerCodeJs: `const c = new LRUCache(2); c.put(1, 10); c.put(2, 20); c.get(1); c.put(3, 30); return c.get(2);`,
        runnerCodePy: `(lambda c: (c.put(1, 10), c.put(2, 20), c.get(1), c.put(3, 30), c.get(2))[4])(LRUCache(2))`
      },
      {
        input: "overwrite key 1 -> put(1,99) -> get(1)",
        expected: "99",
        runnerCodeJs: `const c = new LRUCache(2); c.put(1, 10); c.put(1, 99); return c.get(1);`,
        runnerCodePy: `(lambda c: (c.put(1, 10), c.put(1, 99), c.get(1))[2])(LRUCache(2))`
      }
    ]
  },
  {
    id: "rate_limiter_sliding_window",
    title: "Implement Per-User Sliding Window Rate Limiter",
    pattern: "Queue / Sliding Window / Monotonic Timestamps",
    difficulty: "Medium",
    companies: ["Stripe", "Uber", "Cloudflare", "Datadog", "OpenAI"],
    prompt:
      "Design an in-memory Rate Limiter that allows at most `maxRequests` per `windowSeconds` for each `userId`. Implement `allowRequest(userId, timestampSec)` returning a boolean.",
    examples: [
      {
        input: "maxRequests = 3, windowSeconds = 10 -> allow('u1', 1), allow('u1', 2), allow('u1', 5), allow('u1', 8)",
        output: "[true, true, true, false]",
        explanation: "4th request at t=8 falls within [0..8] window where 3 requests already occurred."
      }
    ],
    starterCode: `class SlidingWindowRateLimiter {
  constructor(maxRequests, windowSeconds) {
    this.maxRequests = maxRequests;
    this.windowSeconds = windowSeconds;
    this.userTimestamps = new Map();
  }

  allowRequest(userId, timestampSec) {
    const queue = this.userTimestamps.get(userId) || [];
    const windowStart = timestampSec - this.windowSeconds;

    while (queue.length > 0 && queue[0] <= windowStart) {
      queue.shift();
    }

    if (queue.length >= this.maxRequests) {
      this.userTimestamps.set(userId, queue);
      return false;
    }

    queue.push(timestampSec);
    this.userTimestamps.set(userId, queue);
    return true;
  }
}`,
    starterCodePy: `from collections import defaultdict, deque

class SlidingWindowRateLimiter:
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.queues = defaultdict(deque)

    def allow_request(self, user_id: str, timestamp_sec: int) -> bool:
        q = self.queues[user_id]
        window_start = timestamp_sec - self.window_seconds
        while q and q[0] <= window_start:
            q.popleft()
        if len(q) >= self.max_requests:
            return False
        q.append(timestamp_sec)
        return True
`,
    optimalSolution: `// In distributed production, execute Sliding Window Counter or Token Bucket atomically via Redis Lua script.`,
    timeComplexity: "Amortized O(1) per allowRequest call",
    spaceComplexity: "O(U * maxRequests) where U is active users",
    keyInsights: [
      "Always clarify thread-safety (mutex per user bucket vs. atomic Redis Lua script in distributed systems).",
      "Discuss memory trade-off between Sliding Window Log (exact, higher memory) vs. Sliding Window Counter (approximate, O(1) memory)."
    ],
    testCases: [
      {
        input: "allow('u1', 1), allow('u1', 2), allow('u1', 5)",
        expected: "[true,true,true]",
        runnerCodeJs: `const rl = new SlidingWindowRateLimiter(3, 10); return [rl.allowRequest('u1', 1), rl.allowRequest('u1', 2), rl.allowRequest('u1', 5)];`,
        runnerCodePy: `(lambda rl: [rl.allow_request('u1', 1), rl.allow_request('u1', 2), rl.allow_request('u1', 5)])(SlidingWindowRateLimiter(3, 10))`
      },
      {
        input: "4th req at t=8 inside 10s window -> false",
        expected: "false",
        runnerCodeJs: `const rl = new SlidingWindowRateLimiter(3, 10); rl.allowRequest('u1', 1); rl.allowRequest('u1', 2); rl.allowRequest('u1', 5); return rl.allowRequest('u1', 8);`,
        runnerCodePy: `(lambda rl: [rl.allow_request('u1', 1), rl.allow_request('u1', 2), rl.allow_request('u1', 5), rl.allow_request('u1', 8)][3])(SlidingWindowRateLimiter(3, 10))`
      },
      {
        input: "req at t=12 after t=1 expires -> true",
        expected: "true",
        runnerCodeJs: `const rl = new SlidingWindowRateLimiter(3, 10); rl.allowRequest('u1', 1); rl.allowRequest('u1', 2); rl.allowRequest('u1', 5); rl.allowRequest('u1', 8); return rl.allowRequest('u1', 12);`,
        runnerCodePy: `(lambda rl: [rl.allow_request('u1', 1), rl.allow_request('u1', 2), rl.allow_request('u1', 5), rl.allow_request('u1', 8), rl.allow_request('u1', 12)][4])(SlidingWindowRateLimiter(3, 10))`
      }
    ]
  },
  {
    id: "task_scheduler_topo",
    title: "Distributed Build Dependency Order (Topological Sort)",
    pattern: "Kahn's Algorithm (BFS Indegree) / Cycle Detection",
    difficulty: "Hard",
    companies: ["Google", "Meta", "Databricks", "Anthropic", "Snowflake"],
    prompt:
      "Given `numTasks` labeled `0` to `numTasks - 1` and a list of prerequisite pairs `[task, prereq]`, return true if all tasks can be scheduled without circular dependencies (deadlock), or false if a cycle exists.",
    examples: [
      {
        input: "numTasks = 4, prereqs = [[1,0],[2,0],[3,1],[3,2]]",
        output: "true",
        explanation: "Valid topological execution order is [0, 1, 2, 3]."
      }
    ],
    starterCode: `function canFinishTasks(numTasks, prereqs) {
  const indegree = new Array(numTasks).fill(0);
  const adj = Array.from({ length: numTasks }, () => []);

  for (const [course, pre] of prereqs) {
    adj[pre].push(course);
    indegree[course]++;
  }

  const queue = [];
  for (let i = 0; i < numTasks; i++) {
    if (indegree[i] === 0) queue.push(i);
  }

  let visited = 0;
  while (queue.length > 0) {
    const curr = queue.shift();
    visited++;
    for (const next of adj[curr]) {
      indegree[next]--;
      if (indegree[next] === 0) queue.push(next);
    }
  }

  return visited === numTasks;
}`,
    starterCodePy: `from collections import deque

def can_finish_tasks(num_tasks: int, prereqs: list) -> bool:
    indegree = [0] * num_tasks
    adj = [[] for _ in range(num_tasks)]
    for task, pre in prereqs:
        adj[pre].append(task)
        indegree[task] += 1
    q = deque([i for i in range(num_tasks) if indegree[i] == 0])
    visited = 0
    while q:
        curr = q.popleft()
        visited += 1
        for nxt in adj[curr]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                q.append(nxt)
    return visited == num_tasks
`,
    optimalSolution: `// Kahn's BFS algorithm processes nodes with 0 indegree and detects cycles if visited < numTasks.`,
    timeComplexity: "O(V + E) where V is tasks and E is dependencies",
    spaceComplexity: "O(V + E) for adjacency list and indegree array",
    keyInsights: [
      "Kahn's BFS naturally identifies all tasks that can run in parallel at each wave (level-order).",
      "If `visited < numTasks`, a directed cycle (deadlock) exists among the remaining nodes with `indegree > 0`."
    ],
    testCases: [
      {
        input: "DAG: 4 tasks [[1,0],[2,0],[3,1],[3,2]]",
        expected: "true",
        runnerCodeJs: `return canFinishTasks(4, [[1,0],[2,0],[3,1],[3,2]]);`,
        runnerCodePy: `can_finish_tasks(4, [[1,0],[2,0],[3,1],[3,2]])`
      },
      {
        input: "Cycle deadlock: 2 tasks [[1,0],[0,1]]",
        expected: "false",
        runnerCodeJs: `return canFinishTasks(2, [[1,0],[0,1]]);`,
        runnerCodePy: `can_finish_tasks(2, [[1,0],[0,1]])`
      }
    ]
  }
];

export const COMPANY_QUESTION_BANK: CompanyQuestionItem[] = [
  {
    id: "q_openai_1",
    company: "OpenAI",
    role: "AI / ML Infrastructure",
    level: "L6",
    roundType: "AI Architecture",
    questionTitle: "Design Multi-Tenant Enterprise RAG with Real-Time ACL Permission Sync",
    details:
      "How do you index 500M Slack/Drive documents so that when a user is removed from a security group, they lose vector search visibility within 30 seconds without re-indexing chunks?",
    askedAgo: "Asked 2 days ago",
    frequency: "High Frequency",
    keyRubricSignal: "Decouple Zanzibar/Redis User->Group cache from chunk ACL metadata pre-filter bitmaps.",
    linkedModule: "system_design",
    linkedTopicId: "rag_enterprise"
  },
  {
    id: "q_stripe_1",
    company: "Stripe",
    role: "Backend / Distributed Systems",
    level: "L5",
    roundType: "System Design",
    questionTitle: "Design High-Concurrency Flash Sale & Idempotent Payment Ledger",
    details:
      "Prevent double-charging and double-booking when 50,000 concurrent requests attempt to reserve the same inventory items with flaky client retries.",
    askedAgo: "Asked 4 days ago",
    frequency: "Verified Onsite",
    keyRubricSignal: "Combine client Idempotency-Key header in Redis with PostgreSQL optimistic version locking and fencing tokens.",
    linkedModule: "system_design",
    linkedTopicId: "ticketmaster"
  },
  {
    id: "q_uber_1",
    company: "Uber",
    role: "Backend / Distributed Systems",
    level: "L5",
    roundType: "System Design",
    questionTitle: "Design Real-Time Driver Telemetry & Airport Surge Dispatch Engine",
    details:
      "Ingest 500k GPS pings/sec and match riders to drivers at busy airports without hot-shard collapse.",
    askedAgo: "Asked 1 week ago",
    frequency: "High Frequency",
    keyRubricSignal: "Uber H3 hexagonal spatial index in Redis + bipartite batch matching window.",
    linkedModule: "system_design",
    linkedTopicId: "uber"
  },
  {
    id: "q_anthropic_1",
    company: "Anthropic",
    role: "AI / ML Infrastructure",
    level: "L5",
    roundType: "Coding",
    questionTitle: "Implement Token-Aware Sliding Window Rate Limiter for LLM API Tiers",
    details:
      "Enforce both Requests-Per-Minute (RPM) and Tokens-Per-Minute (TPM) per organization with O(1) amortized check latency.",
    askedAgo: "Asked 5 days ago",
    frequency: "Trending",
    keyRubricSignal: "Monotonic timestamp queue eviction + discussion of atomic Redis Lua token bucket.",
    linkedModule: "mock_interview",
    linkedTopicId: "rate_limiter_sliding_window"
  },
  {
    id: "q_meta_1",
    company: "Meta",
    role: "Backend / Distributed Systems",
    level: "L5",
    roundType: "System Design",
    questionTitle: "Design WhatsApp Group Chat Fanout & Online Presence at 1B DAU",
    details:
      "How do you route messages across 2,000 stateful WebSocket gateways and prevent presence fanout storms?",
    askedAgo: "Asked 3 days ago",
    frequency: "High Frequency",
    keyRubricSignal: "Viewport-scoped presence subscription + TimeUUID Cassandra offline inbox.",
    linkedModule: "system_design",
    linkedTopicId: "whatsapp"
  },
  {
    id: "q_google_1",
    company: "Google",
    role: "Backend / Distributed Systems",
    level: "L5",
    roundType: "Coding",
    questionTitle: "Parallel Build Task Scheduler with Cycle Detection (Kahn's BFS)",
    details:
      "Schedule thousands of dependent build targets in minimum parallel stages and detect circular dependencies.",
    askedAgo: "Asked 1 week ago",
    frequency: "Verified Onsite",
    keyRubricSignal: "O(V + E) topological sort with indegree queue + parallel wave grouping.",
    linkedModule: "mock_interview",
    linkedTopicId: "task_scheduler_topo"
  }
];

export const INITIAL_SESSION_HISTORY: PracticeSessionRecord[] = [
  {
    id: "hist_1",
    date: "3 days ago",
    type: "mock_interview",
    title: "System Design: WhatsApp Global Messaging",
    level: "L5",
    scorePct: 74,
    verdict: "Lean Hire"
  },
  {
    id: "hist_2",
    date: "Yesterday",
    type: "coding_execution",
    title: "Coding: Sliding Window Rate Limiter",
    level: "L5",
    scorePct: 86,
    verdict: "Hire"
  },
  {
    id: "hist_3",
    date: "Today",
    type: "system_design_step",
    title: "System Design: Ticketmaster High Concurrency",
    level: "L5",
    scorePct: 91,
    verdict: "Strong Hire"
  }
];

export const INITIAL_JOB_CARDS: JobApplicationCard[] = [
  {
    id: "job_1",
    company: "Stripe",
    role: "Senior Backend Engineer — Core Payments",
    level: "L5",
    compensation: "$265k – $310k",
    stage: "onsite",
    atsMatchScore: 84,
    mockReadinessScore: 88,
    nextAction: "Practice Ticketmaster / Distributed Locks & Idempotency",
    updatedAt: "Today",
    linkedProblemId: "ticketmaster",
    notes: "Recruiter confirmed 4 onsite rounds: System Design (High Concurrency), Bug Squash, Integration Coding, HM Behavioral."
  },
  {
    id: "job_2",
    company: "OpenAI",
    role: "Staff AI Systems Engineer — Retrieval Infrastructure",
    level: "L6",
    compensation: "$420k – $550k",
    stage: "oa_screen",
    atsMatchScore: 79,
    mockReadinessScore: 82,
    nextAction: "Complete Enterprise RAG Architecture Deep Dive",
    updatedAt: "Yesterday",
    linkedProblemId: "rag_enterprise",
    notes: "Technical phone screen scheduled for Friday. Focus on HNSW quantization, ACL pre-filtering, and streaming SSE latency."
  },
  {
    id: "job_3",
    company: "Uber",
    role: "Senior Software Engineer — Marketplace Dispatch",
    level: "L5",
    compensation: "$280k – $330k",
    stage: "applied",
    atsMatchScore: 76,
    mockReadinessScore: 75,
    nextAction: "Review H3 Spatial Indexing & Rate Limiter patterns",
    updatedAt: "2 days ago",
    linkedProblemId: "uber",
    notes: "Referred by former teammate on Rider Pricing team. Tailored resume using XYZ bullet optimizer."
  },
  {
    id: "job_4",
    company: "Meta",
    role: "Production / Distributed Systems Engineer (IC5)",
    level: "L5",
    compensation: "$295k – $360k",
    stage: "wishlist",
    atsMatchScore: 71,
    mockReadinessScore: 70,
    nextAction: "Run ATS scan against IC5 Infrastructure JD",
    updatedAt: "3 days ago",
    linkedProblemId: "whatsapp",
    notes: "Target role for Q4 loop. Need to emphasize Cassandra / high-fanout messaging experience."
  }
];

export const INITIAL_STAR_STORIES: StarStory[] = [
  {
    id: "story_1",
    title: "Zero-Downtime Payment Ledger Migration & Dead-Letter Recovery",
    projectContext: "FinPay Systems — Core Settlement Engine (L5 Scope)",
    competencies: ["Technical Complexity", "Leadership", "Speed vs Quality"],
    situation:
      "Our monolithic webhook & settlement table hit 85% CPU saturation during Black Friday bursts, causing 4.2% of merchant webhook deliveries to time out and land in an unmonitored retry loop.",
    task:
      "Lead the architecture and zero-downtime migration to an event-driven Kafka + partitioned PostgreSQL outbox pattern within 6 weeks before Q4 peak traffic.",
    action:
      "Authored the RFC comparing dual-writes vs. transactional Change Data Capture (CDC); aligned 3 product teams on idempotency key headers; implemented exponential backoff with jitter and an automated dead-letter replay worker in Go.",
    resultQuantified:
      "Reduced dead-letter failures by 64%, cut P99 settlement latency from 420ms to 85ms, and processed 18,000 peak QPS during Cyber Monday with 99.995% availability and zero lost transactions.",
    levelImpactNote:
      "Strong L5/L6 signal: Demonstrates proactive bottleneck identification, cross-team RFC alignment, and clear trade-off defense (CDC outbox vs. dual writes)."
  },
  {
    id: "story_2",
    title: "Resolving Cross-Team Architecture Deadlock on Multi-Region Caching",
    projectContext: "Enterprise Search & ACL Pipeline (Conflict + Ambiguity)",
    competencies: ["Conflict Resolution", "Ambiguity", "Leadership"],
    situation:
      "Security and Core Platform teams were deadlocked for 3 weeks: Security demanded zero-TTL synchronous permission checks on every RAG query, while Product required <200ms P95 retrieval latency.",
    task:
      "Bridge the deadlock with an architecture that satisfied strict ACL compliance without violating our <200ms latency SLA.",
    action:
      "Built a benchmark prototype demonstrating that 98% of ACL changes were document-level rather than user-group changes. Proposed decoupling group membership (cached in Redis with webhook invalidation in <3s) from document ACL metadata pre-filters.",
    resultQuantified:
      "Unblocked the launch 2 weeks ahead of schedule, achieving 164ms P95 retrieval latency (58% faster) while passing external SOC2 security audit with zero ACL leakage.",
    levelImpactNote:
      "Strong L6 Staff signal: Resolves organizational conflict using empirical prototyping rather than opinion battles."
  }
];
