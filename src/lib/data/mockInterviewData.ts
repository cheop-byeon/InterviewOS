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
  },
  {
    id: "nordic_spotify_klarna",
    title: "Senior Backend & Distributed Systems Engineer (Nordics)",
    company: "Spotify / Klarna (Stockholm / Helsinki)",
    level: "L5",
    resumeText: `ERIK LINDQVIST
erik.lindqvist@nordicmail.se | Stockholm, Sweden (EU Citizen) | github.com/elindqvist | linkedin.com/in/eriklindqvist

EXPERIENCE
Senior Backend Engineer — NordicPay & Commerce AB, Stockholm (2022 – Present)
- Engineered event-driven payment and settlement microservices in Kotlin, TypeScript, and Go processing 14,000 peak TPS across SEK, NOK, and EUR rails.
- Responsible for maintaining Kafka consumers and PostgreSQL ledgers for instant checkout flows.
- Implemented EU GDPR crypto-shredding and PII tokenization with AWS KMS, passing external Finansinspektionen and SOC2 audits with zero findings.
- Collaborated across 4 autonomous Squads to standardize OpenTelemetry observability and Backstage service templates.

Backend Software Engineer — StreamWave Media, Helsinki (2019 – 2022)
- Built low-latency gRPC and WebSocket state synchronization services on GCP (GKE, Bigtable, Pub/Sub, Redis) serving 18M monthly active listeners.
- Cut P99 cross-device playback handoff latency from 310ms to 78ms using Redis Cluster lease locking.

SKILLS
Languages: Kotlin, Java, TypeScript, Go, Python, SQL
Cloud & Data: GCP (Bigtable, Pub/Sub, Dataflow), AWS, PostgreSQL, Redis, Apache Kafka, Kubernetes, Docker, Terraform, Backstage, gRPC, GDPR / PSD2 Architecture

EDUCATION
M.Sc. in Computer Science, KTH Royal Institute of Technology, Stockholm`,
    jdText: `Role: Senior Backend Engineer — Core Playback & Real-Time Decisioning (L5)
Location: Stockholm, Sweden / Helsinki, Finland (Hybrid • Teamtailor ATS)

About the Squad:
We are looking for a Senior Backend Engineer to join our autonomous Squad in Stockholm/Helsinki building planet-scale real-time state synchronization and low-latency payment/streaming infrastructure.

Requirements & What We Look For:
- 5+ years of production experience building high-concurrency Distributed Systems and Microservices in Java, Kotlin, Go, or TypeScript.
- Strong expertise in Event-Driven Architecture (Apache Kafka / GCP Pub/Sub), Redis caching, and relational/NoSQL storage (PostgreSQL, Bigtable, Cassandra).
- Experience designing low-latency APIs (gRPC, WebSockets, REST) with strict Idempotency, Rate Limiting, and Circuit Breakers on Kubernetes (GCP / AWS).
- Deep awareness of European/Nordic engineering standards, including EU GDPR privacy-by-design, Infrastructure as Code (Terraform), and CI/CD automation.
- Collaborative, low-ego Technical Leadership: thriving in autonomous Squads, authoring RFCs, mentoring peers, and participating in blameless post-mortems.`
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
      "A Doubly Linked List lets you remove any node in O(1) *if* you already have its pointer via the HashMap."
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
      "Kahn's BFS naturally identifies all tasks that can run in parallel at each wave.",
      "If `visited < numTasks`, a directed cycle (deadlock) exists."
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
  },
  {
    id: "merge_intervals",
    title: "Merge Overlapping Calendar / GPU Reservation Intervals",
    pattern: "Intervals / Sorting by Start Time",
    difficulty: "Medium",
    companies: ["Meta", "Google", "OpenAI", "Uber", "Airbnb"],
    prompt:
      "Given an array of `intervals` where `intervals[i] = [start_i, end_i]`, merge all overlapping intervals and return an array of the non-overlapping intervals that cover all the intervals in the input.",
    examples: [
      {
        input: "[[1,3],[2,6],[8,10],[15,18]]",
        output: "[[1,6],[8,10],[15,18]]",
        explanation: "Intervals [1,3] and [2,6] overlap and merge into [1,6]."
      }
    ],
    starterCode: `function mergeIntervals(intervals) {
  if (!intervals.length) return [];
  intervals.sort((a, b) => a[0] - b[0]);
  const res = [intervals[0]];

  for (let i = 1; i < intervals.length; i++) {
    const [curStart, curEnd] = intervals[i];
    const last = res[res.length - 1];
    if (curStart <= last[1]) {
      last[1] = Math.max(last[1], curEnd);
    } else {
      res.push([curStart, curEnd]);
    }
  }
  return res;
}`,
    starterCodePy: `def merge_intervals(intervals: list) -> list:
    if not intervals:
        return []
    intervals.sort(key=lambda x: x[0])
    res = [intervals[0]]
    for start, end in intervals[1:]:
        if start <= res[-1][1]:
            res[-1][1] = max(res[-1][1], end)
        else:
            res.append([start, end])
    return res
`,
    optimalSolution: `// Sort by start time in O(N log N), then merge greedily in a single O(N) pass.`,
    timeComplexity: "O(N log N) dominated by sorting",
    spaceComplexity: "O(N) for output list",
    keyInsights: [
      "Sorting by `start` guarantees that mergeable intervals appear contiguously.",
      "Follow-up in interviews: What if intervals arrive as a dynamic stream? Use a balanced Interval Tree / TreeMap."
    ],
    testCases: [
      {
        input: "[[1,3],[2,6],[8,10],[15,18]]",
        expected: "[[1,6],[8,10],[15,18]]",
        runnerCodeJs: `return mergeIntervals([[1,3],[2,6],[8,10],[15,18]]);`,
        runnerCodePy: `merge_intervals([[1,3],[2,6],[8,10],[15,18]])`
      },
      {
        input: "[[1,4],[4,5]]",
        expected: "[[1,5]]",
        runnerCodeJs: `return mergeIntervals([[1,4],[4,5]]);`,
        runnerCodePy: `merge_intervals([[1,4],[4,5]])`
      }
    ]
  },
  {
    id: "top_k_frequent",
    title: "Top-K Heavy Hitters / Frequent Elements in O(N)",
    pattern: "Bucket Sort / Min-Heap / Count-Min Sketch",
    difficulty: "Medium",
    companies: ["Amazon", "Meta", "Datadog", "Cloudflare", "Stripe"],
    prompt:
      "Given an integer array `nums` and an integer `k`, return the `k` most frequent elements in O(N) linear time using Bucket Sort.",
    examples: [
      {
        input: "nums = [1,1,1,2,2,3], k = 2",
        output: "[1,2]",
        explanation: "1 appears 3 times, 2 appears 2 times."
      }
    ],
    starterCode: `function topKFrequent(nums, k) {
  const counts = new Map();
  for (const n of nums) counts.set(n, (counts.get(n) || 0) + 1);

  const buckets = Array.from({ length: nums.length + 1 }, () => []);
  for (const [num, freq] of counts.entries()) {
    buckets[freq].push(num);
  }

  const res = [];
  for (let f = buckets.length - 1; f >= 0 && res.length < k; f--) {
    for (const num of buckets[f]) {
      res.push(num);
      if (res.length === k) return res;
    }
  }
  return res;
}`,
    starterCodePy: `from collections import Counter

def top_k_frequent(nums: list, k: int) -> list:
    counts = Counter(nums)
    buckets = [[] for _ in range(len(nums) + 1)]
    for num, freq in counts.items():
        buckets[freq].append(num)
    res = []
    for f in range(len(buckets) - 1, 0, -1):
        for num in buckets[f]:
            res.append(num)
            if len(res) == k:
                return res
    return res
`,
    optimalSolution: `// Bucket indexing by frequency achieves strict O(N) time, beating O(N log K) heap when N is bounded.`,
    timeComplexity: "O(N) linear time",
    spaceComplexity: "O(N) for hash map and frequency buckets",
    keyInsights: [
      "Maximum possible frequency of any element is `nums.length`, so an array of `N + 1` buckets avoids sorting.",
      "System Design follow-up: For an unbounded stream of billions of URLs, pair a Count-Min Sketch with a size-K Min-Heap."
    ],
    testCases: [
      {
        input: "nums = [1,1,1,2,2,3], k = 2",
        expected: "[1,2]",
        runnerCodeJs: `return topKFrequent([1,1,1,2,2,3], 2);`,
        runnerCodePy: `top_k_frequent([1,1,1,2,2,3], 2)`
      },
      {
        input: "nums = [4,4,4,6,6,1], k = 1",
        expected: "[4]",
        runnerCodeJs: `return topKFrequent([4,4,4,6,6,1], 1);`,
        runnerCodePy: `top_k_frequent([4,4,4,6,6,1], 1)`
      }
    ]
  },
  {
    id: "revolut_load_balancer",
    title: "Revolut Live TDD: Thread-Safe Load Balancer Registry (O(1) Round-Robin)",
    pattern: "Array + HashSet Index / Atomic Round-Robin / Revolut Famous Live Coding",
    difficulty: "Medium",
    companies: ["Revolut (Europe & Nordics)", "Cloudflare", "Stripe", "Uber"],
    prompt:
      "Revolut's #1 most-asked 60-minute Live TDD Coding screen: Implement an in-memory LoadBalancer with `maxCapacity` (e.g., 10 instances), `register(address)` (rejects duplicates and rejects if full), `unregister(address)` in O(1), and `nextRoundRobin()` returning the next active server address deterministically.",
    examples: [
      {
        input: "lb = new LoadBalancer(2); lb.register('10.0.0.1'); lb.register('10.0.0.2'); [lb.nextRoundRobin(), lb.nextRoundRobin(), lb.nextRoundRobin()]",
        output: "[\"10.0.0.1\",\"10.0.0.2\",\"10.0.0.1\"]",
        explanation: "Cycles through registered instances in round-robin order and rejects duplicate or over-capacity registrations."
      }
    ],
    starterCode: `class LoadBalancer {
  constructor(maxCapacity = 10) {
    this.maxCapacity = maxCapacity;
    this.instances = [];
    this.indexMap = new Map(); // address -> array index for O(1) removal
    this.cursor = 0;
  }

  register(address) {
    if (!address || this.indexMap.has(address) || this.instances.length >= this.maxCapacity) {
      return false;
    }
    this.indexMap.set(address, this.instances.length);
    this.instances.push(address);
    return true;
  }

  unregister(address) {
    if (!this.indexMap.has(address)) return false;
    const idx = this.indexMap.get(address);
    const lastIdx = this.instances.length - 1;
    const lastAddress = this.instances[lastIdx];

    // Swap-with-last for O(1) removal without shifting whole array
    this.instances[idx] = lastAddress;
    this.indexMap.set(lastAddress, idx);
    this.instances.pop();
    this.indexMap.delete(address);
    if (this.instances.length > 0) {
      this.cursor = this.cursor % this.instances.length;
    } else {
      this.cursor = 0;
    }
    return true;
  }

  nextRoundRobin() {
    if (this.instances.length === 0) return null;
    const picked = this.instances[this.cursor % this.instances.length];
    this.cursor = (this.cursor + 1) % this.instances.length;
    return picked;
  }
}`,
    starterCodePy: `class LoadBalancer:
    def __init__(self, max_capacity: int = 10):
        self.max_capacity = max_capacity
        self.instances: list[str] = []
        self.index_map: dict[str, int] = {}
        self.cursor = 0

    def register(self, address: str) -> bool:
        if not address or address in self.index_map or len(self.instances) >= self.max_capacity:
            return False
        self.index_map[address] = len(self.instances)
        self.instances.append(address)
        return True

    def unregister(self, address: str) -> bool:
        if address not in self.index_map:
            return False
        idx = self.index_map[address]
        last_address = self.instances[-1]
        self.instances[idx] = last_address
        self.index_map[last_address] = idx
        self.instances.pop()
        del self.index_map[address]
        self.cursor = (self.cursor % len(self.instances)) if self.instances else 0
        return True

    def next_round_robin(self) -> str | None:
        if not self.instances:
            return None
        picked = self.instances[self.cursor % len(self.instances)]
        self.cursor = (self.cursor + 1) % len(self.instances)
        return picked
`,
    optimalSolution: `// In Java 21 / Kotlin (Revolut's stack), guard mutations with ReentrantReadWriteLock and use AtomicInteger for the round-robin cursor.`,
    timeComplexity: "O(1) for register(), unregister() (swap-with-last), and nextRoundRobin()",
    spaceComplexity: "O(maxCapacity) for array + index map",
    keyInsights: [
      "Revolut interviewers evaluate strict TDD: write unit tests for capacity limits, duplicate rejection, empty state, and round-robin wrap-around FIRST.",
      "In Java/Kotlin, explain why `ReentrantReadWriteLock` (multiple concurrent readers in `nextRoundRobin()` + `AtomicInteger.getAndIncrement()`, exclusive write lock only on `register`/`unregister`) beats a coarse `synchronized` method."
    ],
    testCases: [
      {
        input: "Round-robin across 2 nodes: 10.0.0.1, 10.0.0.2",
        expected: "[\"10.0.0.1\",\"10.0.0.2\",\"10.0.0.1\"]",
        runnerCodeJs: `const lb = new LoadBalancer(2); lb.register("10.0.0.1"); lb.register("10.0.0.2"); return [lb.nextRoundRobin(), lb.nextRoundRobin(), lb.nextRoundRobin()];`,
        runnerCodePy: `(lambda lb: (lb.register("10.0.0.1"), lb.register("10.0.0.2"), [lb.next_round_robin(), lb.next_round_robin(), lb.next_round_robin()])[2])(LoadBalancer(2))`
      },
      {
        input: "Reject duplicate & over-capacity registration (cap=2)",
        expected: "[true,false,true,false]",
        runnerCodeJs: `const lb = new LoadBalancer(2); return [lb.register("10.0.0.1"), lb.register("10.0.0.1"), lb.register("10.0.0.2"), lb.register("10.0.0.3")];`,
        runnerCodePy: `(lambda lb: [lb.register("10.0.0.1"), lb.register("10.0.0.1"), lb.register("10.0.0.2"), lb.register("10.0.0.3")])(LoadBalancer(2))`
      },
      {
        input: "Unregister node 10.0.0.1 -> only 10.0.0.2 remains",
        expected: "\"10.0.0.2\"",
        runnerCodeJs: `const lb = new LoadBalancer(3); lb.register("10.0.0.1"); lb.register("10.0.0.2"); lb.unregister("10.0.0.1"); return lb.nextRoundRobin();`,
        runnerCodePy: `(lambda lb: (lb.register("10.0.0.1"), lb.register("10.0.0.2"), lb.unregister("10.0.0.1"), lb.next_round_robin())[3])(LoadBalancer(3))`
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
    questionTitle: "Design LLM Inference & KV-Cache Serving System with Disaggregated Prefill/Decode",
    details:
      "Manage dynamic continuous batching, Radix-tree prefix KV-caching across H100 nodes, and request queuing under <350ms TTFT SLAs when GPU workers abruptly fail.",
    askedAgo: "Asked 2 days ago",
    frequency: "High Frequency",
    keyRubricSignal: "Disaggregate compute-bound Prefill from memory-bound Decode over RDMA + PagedAttention KV block routing.",
    linkedModule: "system_design",
    linkedTopicId: "openai_llm_inference"
  },
  {
    id: "q_openai_2",
    company: "OpenAI",
    role: "AI / ML Infrastructure",
    level: "L5",
    roundType: "AI Architecture",
    questionTitle: "Design Multi-Tenant Enterprise RAG with Real-Time ACL Permission Sync",
    details:
      "How do you index 500M Slack/Drive documents so that when a user is removed from a security group, they lose vector search visibility within 30 seconds without re-indexing chunks?",
    askedAgo: "Asked 4 days ago",
    frequency: "Verified Onsite",
    keyRubricSignal: "Decouple Zanzibar/Redis User->Group cache from chunk ACL metadata pre-filter bitmaps.",
    linkedModule: "system_design",
    linkedTopicId: "rag_enterprise"
  },
  {
    id: "q_anthropic_1",
    company: "Anthropic",
    role: "AI / ML Infrastructure",
    level: "L6",
    roundType: "AI Architecture",
    questionTitle: "Design a Batch Inference API & Safe Tool-Use Sandbox for Autonomous Agents",
    details:
      "Translate abstract AI agent requirements into hard infrastructure: token-bucket TPM/RPM rate limits, GPU memory batching, credential isolation, and rollback semantics.",
    askedAgo: "Asked 3 days ago",
    frequency: "High Frequency",
    keyRubricSignal: "Combine Firecracker/gVisor microVM tool sandboxing with atomic Redis Lua TPM/RPM token buckets.",
    linkedModule: "system_design",
    linkedTopicId: "openai_llm_inference"
  },
  {
    id: "q_anthropic_2",
    company: "Anthropic",
    role: "Backend / Distributed Systems",
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
    id: "q_stripe_1",
    company: "Stripe",
    role: "Backend / Distributed Systems",
    level: "L5",
    roundType: "System Design",
    questionTitle: "Design a Distributed Idempotent Payment Ledger & Flash-Sale Reservation Engine",
    details:
      "Ensure network timeouts, double-clicks, and delayed webhooks never result in double-charging or split-brain inventory states at 50k peak QPS.",
    askedAgo: "Asked 3 days ago",
    frequency: "Verified Onsite",
    keyRubricSignal: "Combine client Idempotency-Key header in Redis with PostgreSQL optimistic version locking and fencing tokens.",
    linkedModule: "system_design",
    linkedTopicId: "ticketmaster"
  },
  {
    id: "q_stripe_2",
    company: "Stripe",
    role: "Backend / Distributed Systems",
    level: "L6",
    roundType: "System Design",
    questionTitle: "Design a Sub-50ms Real-Time Payment Fraud Detection & Feature Streaming Pipeline",
    details:
      "Score 25,000 transactions/sec synchronously before payment capture using rolling 5-minute velocity features from Kafka/Flink.",
    askedAgo: "Asked 1 week ago",
    frequency: "High Frequency",
    keyRubricSignal: "Pre-compute rolling window aggregates in Flink -> Redis Cluster so synchronous scoring reads in <5ms.",
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
    askedAgo: "Asked 4 days ago",
    frequency: "High Frequency",
    keyRubricSignal: "Uber H3 hexagonal spatial index in Redis + bipartite batch matching window.",
    linkedModule: "system_design",
    linkedTopicId: "uber"
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
    id: "q_meta_2",
    company: "Meta",
    role: "Backend / Distributed Systems",
    level: "L6",
    roundType: "System Design",
    questionTitle: "Design LeetCode Online Judge & Real-Time 100k Contest Leaderboard",
    details:
      "Safely execute untrusted C++/Python code submissions in <2s and maintain live global rankings across 100,000 contestants.",
    askedAgo: "Asked 6 days ago",
    frequency: "Verified Onsite",
    keyRubricSignal: "Firecracker microVMs with cgroups/seccomp + Redis ZSET composite score leaderboard.",
    linkedModule: "system_design",
    linkedTopicId: "leetcode_judge"
  },
  {
    id: "q_google_1",
    company: "Google",
    role: "Backend / Distributed Systems",
    level: "L5",
    roundType: "System Design",
    questionTitle: "Design Google Drive / Dropbox Block-Level Delta Sync & Deduplication",
    details:
      "Sync 50GB files across desktop and mobile devices where editing 1MB only transfers the modified chunk.",
    askedAgo: "Asked 5 days ago",
    frequency: "High Frequency",
    keyRubricSignal: "Rabin fingerprinting 4MB chunks + SHA-256 content-addressable S3 pre-signed URLs.",
    linkedModule: "system_design",
    linkedTopicId: "dropbox_sync"
  },
  {
    id: "q_google_2",
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
  },
  {
    id: "q_spotify_1",
    company: "Spotify",
    role: "Backend / Distributed Systems",
    level: "L5",
    roundType: "System Design",
    questionTitle: "Design Spotify Connect Multi-Device Playback Sync & Offline Royalty Ledger (Stockholm)",
    details:
      "Stockholm Onsite Loop: Transfer active playback position and shuffle queue between iOS, Desktop, and Smart Speakers in <100ms while reconciling offline play counts (>=30s rule) for artist payouts.",
    askedAgo: "Asked 2 days ago • Stockholm",
    frequency: "High Frequency",
    keyRubricSignal:
      "Single-active-device lease in Redis Cluster using Compare-And-Swap sequence numbers + HTTP 206 byte-range CDN caching.",
    linkedModule: "system_design",
    linkedTopicId: "spotify_connect"
  },
  {
    id: "q_klarna_1",
    company: "Klarna",
    role: "Backend / Distributed Systems",
    level: "L6",
    roundType: "System Design",
    questionTitle: "Design Sub-80ms BNPL Checkout Risk Engine & EU GDPR Crypto-Shredding Ledger (Stockholm)",
    details:
      "Stockholm Principal/Staff Loop: Approve 4-installment purchases in <80ms using BankID/PSD2 signals while satisfying EU GDPR Right-to-Erasure on immutable Kafka audit logs.",
    askedAgo: "Asked 3 days ago • Stockholm",
    frequency: "Verified Onsite",
    keyRubricSignal:
      "Pre-computed velocity features in Redis + per-shopper KMS Data Encryption Keys (crypto-shredding PII without mutating tax ledgers).",
    linkedModule: "system_design",
    linkedTopicId: "klarna_vipps_payments"
  },
  {
    id: "q_wolt_1",
    company: "Wolt",
    role: "Backend / Distributed Systems",
    level: "L5",
    roundType: "System Design",
    questionTitle: "Design Real-Time 3-Sided Courier Batch Dispatch & Winter Weather ETA Engine (Helsinki)",
    details:
      "Helsinki Onsite Loop: Match courier partners, restaurants, and hungry customers across Nordic cities where snowstorms dynamically shift travel times and food prep queues.",
    askedAgo: "Asked 4 days ago • Helsinki",
    frequency: "High Frequency",
    keyRubricSignal:
      "H3 hexagonal spatial indexing + rolling 15-second bipartite batch matching window optimizing food wait time vs. courier detour.",
    linkedModule: "system_design",
    linkedTopicId: "uber"
  },
  {
    id: "q_sana_1",
    company: "Sana Labs",
    role: "AI / ML Infrastructure",
    level: "L5",
    roundType: "AI Architecture",
    questionTitle: "Design Multi-Tenant Enterprise AI Agent Workspace with Strict EU GDPR Data Residency (Stockholm)",
    details:
      "Stockholm AI Loop: Index 50M enterprise Slack/Drive/Notion docs with live ACL permission enforcement, hybrid BM25 + HNSW search, and zero cross-tenant prompt leakage.",
    askedAgo: "Asked 3 days ago • Stockholm",
    frequency: "Trending",
    keyRubricSignal:
      "Tenant-partitioned Qdrant/Turbopuffer namespaces + Zanzibar/Redis group ACL pre-filtering before Cross-Encoder reranking.",
    linkedModule: "system_design",
    linkedTopicId: "rag_enterprise"
  },
  {
    id: "q_cognite_1",
    company: "Cognite",
    role: "Backend / Distributed Systems",
    level: "L5",
    roundType: "System Design",
    questionTitle: "Design High-Throughput Industrial IoT Time-Series Ingestion & Asset Knowledge Graph (Oslo)",
    details:
      "Oslo Onsite Loop: Ingest 2M sensor readings/sec from North Sea offshore energy platforms with intermittent satellite connectivity and sub-second anomaly alerting.",
    askedAgo: "Asked 5 days ago • Oslo",
    frequency: "Verified Onsite",
    keyRubricSignal:
      "Edge ring-buffer batching during satellite blackouts + Kafka partition by asset_id + Timescale/ClickHouse columnar downsampling.",
    linkedModule: "system_design",
    linkedTopicId: "spotify_connect"
  },
  {
    id: "q_oura_1",
    company: "Oura",
    role: "Backend / Distributed Systems",
    level: "L5",
    roundType: "Coding",
    questionTitle: "Merge Continuous Biometric Ring Sleep-Stage & HRV Time-Series Windows (Helsinki / Oulu)",
    details:
      "Helsinki Coding Round: Given fragmented BLE ring sync intervals of heart-rate variability (HRV) and temperature data with clock drift, merge overlapping windows in O(N log N).",
    askedAgo: "Asked 6 days ago • Helsinki",
    frequency: "Verified Onsite",
    keyRubricSignal:
      "O(N log N) interval sorting by start epoch + monotonic merge with gap tolerance threshold.",
    linkedModule: "mock_interview",
    linkedTopicId: "merge_intervals_calendar"
  },
  {
    id: "q_finn_vend_1",
    company: "FINN.no / Vend",
    role: "Backend / Distributed Systems",
    level: "L5",
    roundType: "System Design",
    questionTitle: "Design FINN.no Real-Time Faceted Search (Vespa) & 'Fiks Ferdig' Transactional Escrow (Oslo)",
    details:
      "Oslo Grensen Onsite Loop: Support sub-50ms multi-facet geo search across 12M+ Mobility, Real Estate, and Torget listings while preventing double-buying on 'Fiks Ferdig' integrated shipping & Vipps/Klarna escrow.",
    askedAgo: "Asked 1 day ago • Oslo",
    frequency: "High Frequency",
    keyRubricSignal:
      "Transactional Outbox -> Kafka -> Vespa near-real-time indexing + PostgreSQL optimistic version locking (`version = version + 1`) with 10-minute reservation TTL.",
    linkedModule: "system_design",
    linkedTopicId: "finn_vend_schibsted"
  },
  {
    id: "q_blocket_tori_1",
    company: "Blocket / Tori (Vend)",
    role: "Backend / Distributed Systems",
    level: "L6",
    roundType: "System Design",
    questionTitle: "Design a Federated Cross-Nordic Marketplace Data Mesh & Kafka Event Contract Platform (Stockholm / Helsinki)",
    details:
      "Vend Marketplaces Staff Loop: Unify ad-lifecycle events, buyer-seller messaging, and fraud signals across FINN.no (Norway), Blocket & Qasa (Sweden), Tori.fi & Oikotie (Finland), and DBA.dk & Bilbasen (Denmark) without central DB coupling.",
    askedAgo: "Asked 2 days ago • Stockholm / Helsinki",
    frequency: "Verified Onsite",
    keyRubricSignal:
      "Federated Kafka Data Mesh with Confluent Schema Registry (Avro/Protobuf backward-compatibility CI gates) + per-domain data product ownership.",
    linkedModule: "system_design",
    linkedTopicId: "finn_vend_schibsted"
  },
  {
    id: "q_vg_schibsted_1",
    company: "VG / Schibsted",
    role: "Backend / Distributed Systems",
    level: "L5",
    roundType: "System Design",
    questionTitle: "Design VG.no & Aftonbladet Breaking-News Varnish Edge Shield & Cross-Brand SSO Paywall (Oslo / Stockholm)",
    details:
      "Schibsted Media Onsite Loop: Absorb a 50x breaking-news traffic surge (300,000+ QPS) within 10 seconds when journalists update the live front page every 5 seconds, while enforcing Schibsted Account (SPiD) subscriber paywalls.",
    askedAgo: "Asked 2 days ago • Oslo / Stockholm",
    frequency: "High Frequency",
    keyRubricSignal:
      "Varnish Cache `stale-while-revalidate` + single-flight request coalescing (waiting list on cache miss) + stateless JWT/Edge KV paywall verification.",
    linkedModule: "system_design",
    linkedTopicId: "finn_vend_schibsted"
  },
  {
    id: "q_schibsted_ai_1",
    company: "FINN.no / Vend",
    role: "AI / ML Infrastructure",
    level: "L5",
    roundType: "AI Architecture",
    questionTitle: "Design Multimodal 'Snap-to-Sell' Listing Assistant & Real-Time Scam Detection Pipeline (Schibsted / Vend AI)",
    details:
      "Nordic AI Foundations Loop: Seller uploads 3 photos of a used bicycle or sofa on FINN/Blocket/Tori; generate structured category attributes, fair Nordic price range from historical Vespa comps, and block phishing scammers before publication.",
    askedAgo: "Asked 3 days ago • Oslo / Stockholm",
    frequency: "Trending",
    keyRubricSignal:
      "Vision-LLM structured output extraction (Pydantic AI / vLLM) + Vespa hybrid vector/attribute kNN price lookup + synchronous risk-score gate before Kafka `AdPublished` event.",
    linkedModule: "system_design",
    linkedTopicId: "finn_vend_schibsted"
  },
  {
    id: "q_revolut_1",
    company: "Revolut",
    role: "Backend / Distributed Systems",
    level: "L5",
    roundType: "System Design",
    questionTitle: "Design Revolut Multi-Currency FX Exchange (30s Quote Lock) & Deadlock-Free Double-Entry Ledger (Europe / Nordics)",
    details:
      "Revolut System Design Loop: Allow 50M+ European & Nordic users to convert SEK/NOK/EUR/GBP at a guaranteed 30-second live FX rate and execute instant P2P transfers with zero floating-point drift, zero deadlocks, and daily SEPA/Swish reconciliation.",
    askedAgo: "Asked 1 day ago • Stockholm / London / Remote",
    frequency: "High Frequency",
    keyRubricSignal:
      "Append-only Double-Entry Ledger (`DEBIT`+`CREDIT`=0) in integer minor units + deterministic sorted `SELECT ... FOR UPDATE` (`min(accA,accB)` first) + Redis 30s quote lock.",
    linkedModule: "system_design",
    linkedTopicId: "revolut_multicurrency_ledger"
  },
  {
    id: "q_revolut_2",
    company: "Revolut",
    role: "Backend / Distributed Systems",
    level: "L5",
    roundType: "Coding",
    questionTitle: "Revolut Live TDD Coding: Implement Thread-Safe In-Memory Load Balancer & Money Transfer Service",
    details:
      "Revolut's signature 60-minute live pairing screen: Build a Load Balancer supporting `register`, `unregister`, and `nextRoundRobin` (max 10 instances, no duplicates) in pure Java/Kotlin/Python/TS using strict TDD (write unit tests first!) and fine-grained thread locks.",
    askedAgo: "Asked 2 days ago • Europe / Nordics",
    frequency: "Verified Onsite",
    keyRubricSignal:
      "Write failing unit tests FIRST (TDD), use Array + HashMap index swap-with-last for O(1) removal, and guard concurrent access with `ReentrantReadWriteLock` + `AtomicInteger`.",
    linkedModule: "mock_interview",
    linkedTopicId: "revolut_load_balancer"
  },
  {
    id: "q_revolut_3",
    company: "Revolut",
    role: "Backend / Distributed Systems",
    level: "L6",
    roundType: "System Design",
    questionTitle: "Design Cross-Border Banking Saga Orchestrator & Automated Daily External Rail Reconciliation",
    details:
      "Revolut Principal/Staff Loop: What happens when a user transfers 25,000 SEK to an external Eurozone IBAN via SEPA Instant, the local wallet debit succeeds, but the partner banking gateway times out mid-flight?",
    askedAgo: "Asked 3 days ago • London / Stockholm",
    frequency: "Verified Onsite",
    keyRubricSignal:
      "Never hold 2PC locks across external bank APIs: move funds to an internal Suspense Ledger Account via Saga Orchestrator, poll/webhook idempotency status, and run T+0 reconciliation.",
    linkedModule: "system_design",
    linkedTopicId: "revolut_multicurrency_ledger"
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
    role: "Staff AI Systems Engineer — Inference & Retrieval",
    level: "L6",
    compensation: "$420k – $550k",
    stage: "oa_screen",
    atsMatchScore: 79,
    mockReadinessScore: 82,
    nextAction: "Complete LLM Inference KV-Cache & RAG Deep Dive",
    updatedAt: "Yesterday",
    linkedProblemId: "openai_llm_inference",
    notes: "Technical phone screen scheduled for Friday. Focus on PagedAttention KV-cache routing, HNSW quantization, and streaming SSE."
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
  },
  {
    id: "job_5_spotify",
    company: "Spotify (Stockholm)",
    role: "Senior Backend Engineer — Core Playback & Connect Squad",
    level: "L5",
    compensation: "920k – 1.15M SEK + RSU (€95k–€115k)",
    stage: "onsite",
    atsMatchScore: 88,
    mockReadinessScore: 86,
    nextAction: "Practice Spotify Connect State Sync & Squad Collaboration Loop",
    updatedAt: "Today • Stockholm",
    linkedProblemId: "spotify_connect",
    notes: "Nordic loop via Teamtailor: 1 Collaborative System Design (Connect Dealer / GCP), 1 Pragmatic Coding, 1 Squad Values & Architecture Deep Dive."
  },
  {
    id: "job_6_klarna_wolt",
    company: "Klarna / Wolt (Nordics)",
    role: "Staff Distributed Systems Engineer — Real-Time Decisioning",
    level: "L6",
    compensation: "€125k – €155k + Equity (Stockholm / Helsinki)",
    stage: "applied",
    atsMatchScore: 83,
    mockReadinessScore: 84,
    nextAction: "Practice Sub-80ms BNPL Risk Engine & GDPR Crypto-Shredding",
    updatedAt: "Yesterday • Nordic Hub",
    linkedProblemId: "klarna_vipps_payments",
    notes: "Emphasize Kafka transactional outbox, EU GDPR crypto-shredding with KMS, and sub-80ms checkout SLAs."
  },
  {
    id: "job_7_finn_schibsted",
    company: "FINN.no / Vend & Schibsted (Oslo / Stockholm)",
    role: "Senior Platform Engineer — Marketplaces (Blocket/Tori) & VG Edge",
    level: "L5",
    compensation: "950k – 1.25M NOK / SEK + Pension & Bonus",
    stage: "onsite",
    atsMatchScore: 89,
    mockReadinessScore: 87,
    nextAction: "Practice FINN.no Vespa Search, Fiks Ferdig Escrow & VG Varnish Edge",
    updatedAt: "Today • Oslo / Stockholm",
    linkedProblemId: "finn_vend_schibsted",
    notes: "Loop via Jobylon ATS: 1) 60m TDD Pair Programming / Case Review (Kotlin/TS), 2) System Design (FINN Fiks Ferdig & VG Varnish Edge), 3) Autonomous Squad Values Round."
  },
  {
    id: "job_8_revolut",
    company: "Revolut (Nordics & Europe Remote)",
    role: "Senior Backend Engineer — Core Payments & FX Ledger (Java 21 / Kotlin)",
    level: "L5",
    compensation: "€130k – €175k + Equity (Europe's #1 Private Tech Co)",
    stage: "oa_screen",
    atsMatchScore: 91,
    mockReadinessScore: 89,
    nextAction: "Practice Revolut Live TDD Load Balancer & Multi-Currency FX Ledger",
    updatedAt: "Today • Stockholm / London / Remote",
    linkedProblemId: "revolut_multicurrency_ledger",
    notes: "Revolut Loop: 1) 60m Live TDD Coding (Load Balancer / Money Transfer — write unit tests first, zero Spring magic!), 2) System Design (Double-Entry FX Ledger), 3) Bar Raiser."
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
