import { ArchitectureEvolutionStep, CodingPatternVisual } from "../types";

export const SCALE_ZERO_TO_MILLIONS_STEPS: ArchitectureEvolutionStep[] = [
  {
    stepNumber: 1,
    title: "Stage 1: Single Server Setup (MVP)",
    scaleTarget: "1 – 1,000 Concurrent Users",
    bottleneckSolved: "Initial deployment simplicity; zero network hop between app & DB",
    explanation:
      "Everything runs on a single instance: Web App, API, and SQLite/PostgreSQL database. Fast to ship, but a single point of failure (SPOF) where CPU spikes from DB queries starve the web server.",
    activeComponents: ["DNS", "Single Web + DB Server"],
    metrics: { latency: "45ms", availability: "99.0% (SPOF)", maxThroughput: "~800 QPS" }
  },
  {
    stepNumber: 2,
    title: "Stage 2: Separate Compute & Database Tiers",
    scaleTarget: "1,000 – 15,000 Concurrent Users",
    bottleneckSolved: "Independent vertical scaling of CPU-heavy API vs. I/O-heavy Storage",
    explanation:
      "Splitting the web server and relational database onto dedicated instances allows you to provision NVMe SSDs and high RAM for PostgreSQL while optimizing CPU cores for the application server.",
    activeComponents: ["DNS", "Stateless App Server", "Dedicated Primary DB"],
    metrics: { latency: "32ms", availability: "99.5%", maxThroughput: "~4,500 QPS" }
  },
  {
    stepNumber: 3,
    title: "Stage 3: Load Balancer + Read Replicas",
    scaleTarget: "15,000 – 250,000 Concurrent Users",
    bottleneckSolved: "Eliminates Web SPOF and offloads 80%+ read traffic from Primary DB",
    explanation:
      "An L7 Load Balancer (ALB/NGINX) distributes traffic across an auto-scaling group of stateless web servers across multiple Availability Zones. Writes go to Primary DB; reads route to 3 Read Replicas.",
    activeComponents: [
      "DNS",
      "L7 Load Balancer",
      "Auto-Scaling Web Fleet (3x)",
      "Primary DB (Writes)",
      "Read Replicas (3x Reads)"
    ],
    metrics: { latency: "22ms", availability: "99.95%", maxThroughput: "~35,000 QPS" }
  },
  {
    stepNumber: 4,
    title: "Stage 4: Redis Cache-Aside + Global CDN Edge",
    scaleTarget: "250,000 – 2,000,000 Concurrent Users",
    bottleneckSolved: "Sub-millisecond hot-key reads and 90% reduction in database read load",
    explanation:
      "Static assets & edge-cacheable API responses are served from 200+ global CDN PoPs. Hot database rows and user sessions live in a Redis Cluster (Cache-Aside pattern), reducing P99 read latency to <10ms.",
    activeComponents: [
      "Global CDN Edge",
      "L7 Load Balancer",
      "Stateless Microservices",
      "Redis Cluster (Sub-ms Cache)",
      "Primary DB + Read Replicas"
    ],
    metrics: { latency: "8ms (P95)", availability: "99.99%", maxThroughput: "~220,000 QPS" }
  },
  {
    stepNumber: 5,
    title: "Stage 5: Horizontal DB Sharding + Async Message Queues",
    scaleTarget: "10,000,000+ Concurrent Users (Hyperscale)",
    bottleneckSolved: "Breaks single Primary DB write ceiling & smooths traffic spikes asynchronously",
    explanation:
      "Write throughput is scaled horizontally by sharding the database via Consistent Hashing on `user_id` or `tenant_id`. Heavy or bursty writes are buffered through Apache Kafka and processed asynchronously by worker fleets.",
    activeComponents: [
      "Global CDN + WAF",
      "Multi-Region API Gateways",
      "Stateless Services + Workers",
      "Redis Cluster (Multi-AZ)",
      "Kafka Event Streaming Bus",
      "Consistent-Hashed DB Shards (16x)"
    ],
    metrics: { latency: "5ms (P95)", availability: "99.999%", maxThroughput: "1,500,000+ QPS" }
  }
];

export const CACHING_STRATEGIES = [
  {
    name: "Cache-Aside (Lazy Loading)",
    bestFor: "Read-heavy workloads where stale data for a short TTL is acceptable (User profiles, articles)",
    readFlow: "App checks Redis -> On Cache Miss, App reads DB -> App populates Redis with TTL",
    writeFlow: "App writes directly to DB -> App invalidates (deletes) cache key in Redis",
    pros: "Resilient to cache failure; only caches data that is actually requested",
    cons: "Initial request suffers Cache Miss penalty (3 round trips); risk of thundering herd on hot key expiration"
  },
  {
    name: "Write-Through",
    bestFor: "Strict consistency between cache and DB where read latency must always be warm",
    readFlow: "App reads from Cache (almost guaranteed hit)",
    writeFlow: "App writes to Cache AND Cache synchronously writes to DB in same transaction",
    pros: "Cache is never stale; zero cache-miss penalty after writes",
    cons: "Higher write latency (must wait for both Cache + DB); pollutes cache with infrequently read data"
  },
  {
    name: "Write-Behind (Write-Back)",
    bestFor: "Ultra-high write throughput workloads (View counters, likes, IoT telemetry, gaming leaderboards)",
    readFlow: "App reads directly from Redis Cache",
    writeFlow: "App writes to Redis only (returns immediately) -> Async queue flushes batches to DB every N sec",
    pros: "Blazing fast write latency and massive write coalescing (10,000 increments = 1 DB UPDATE)",
    cons: "Risk of data loss if cache node crashes before async flush completes (mitigate with Redis AOF + Kafka)"
  }
];

export const LATENCY_NUMBERS = [
  { operation: "L1 Cache Reference", latencyText: "1 ns", nsValue: 1, tier: "CPU" },
  { operation: "Main Memory (RAM) Reference", latencyText: "100 ns", nsValue: 100, tier: "Memory" },
  { operation: "Redis In-Memory Lookup (Same AZ)", latencyText: "500 µs (0.5 ms)", nsValue: 500000, tier: "Cache" },
  { operation: "NVMe SSD Random Read (4KB)", latencyText: "150 µs (0.15 ms)", nsValue: 150000, tier: "Storage" },
  { operation: "PostgreSQL Indexed Primary Key Query", latencyText: "2 – 4 ms", nsValue: 3000000, tier: "Database" },
  { operation: "Cross-AZ Network Round Trip", latencyText: "1 – 2 ms", nsValue: 1500000, tier: "Network" },
  { operation: "US East <-> US West Packet RTT", latencyText: "65 ms", nsValue: 65000000, tier: "Global WAN" },
  { operation: "US <-> Europe Transatlantic RTT", latencyText: "140 ms", nsValue: 140000000, tier: "Global WAN" }
];

export const CODING_PATTERNS_VISUAL: CodingPatternVisual[] = [
  {
    id: "sliding_window",
    name: "Dynamic Sliding Window",
    whenToUse: [
      "Contiguous subarray / substring problems",
      "Finding longest/shortest window satisfying a constraint (at most K distinct, sum >= target)",
      "Optimizing O(N²) nested loops over contiguous ranges down to O(N)"
    ],
    timeComplexity: "O(N) Time | O(1) or O(K) Space",
    classicProblems: [
      "Longest Substring Without Repeating Characters",
      "Minimum Window Substring",
      "Max Consecutive Ones III"
    ],
    templateSnippet: `function slidingWindow(nums: number[], k: number): number {
  let left = 0, windowSum = 0, best = 0;
  for (let right = 0; right < nums.length; right++) {
    windowSum += nums[right]; // 1. Expand right pointer
    while (windowSum > k) {   // 2. Shrink left while invalid
      windowSum -= nums[left];
      left++;
    }
    best = Math.max(best, right - left + 1); // 3. Record valid state
  }
  return best;
}`,
    arrayDemo: {
      array: [2, 1, 5, 1, 3, 2],
      steps: [
        {
          stepTitle: "Step 1: Expand Window [0..2] (Target Sum <= 7)",
          leftIdx: 0,
          rightIdx: 2,
          highlightIndices: [0, 1, 2],
          windowState: "windowSum = 2 + 1 + 5 = 8 (> 7, Invalid!)",
          explanation: "Right pointer advances to index 2 (val 5). Window sum reaches 8, exceeding constraint K=7."
        },
        {
          stepTitle: "Step 2: Contract Left Pointer -> [1..2]",
          leftIdx: 1,
          rightIdx: 2,
          highlightIndices: [1, 2],
          windowState: "windowSum = 8 - 2 = 6 (<= 7, Valid! MaxLen = 2)",
          explanation: "We shrink `left` from index 0 to 1, subtracting 2. The window [1, 5] has sum 6 <= 7."
        },
        {
          stepTitle: "Step 3: Expand Right Pointer -> [1..3]",
          leftIdx: 1,
          rightIdx: 3,
          highlightIndices: [1, 2, 3],
          windowState: "windowSum = 6 + 1 = 7 (<= 7, Valid! MaxLen = 3)",
          explanation: "Right advances to index 3 (val 1). Window [1, 5, 1] sums to 7, updating our best length to 3!"
        },
        {
          stepTitle: "Step 4: Slide & Maintain Optimal Window -> [3..5]",
          leftIdx: 3,
          rightIdx: 5,
          highlightIndices: [3, 4, 5],
          windowState: "windowSum = 1 + 3 + 2 = 6 (<= 7, Valid! MaxLen = 3)",
          explanation: "Each element is visited at most twice (once by `right`, once by `left`), guaranteeing O(N) runtime."
        }
      ]
    }
  },
  {
    id: "monotonic_stack",
    name: "Monotonic Decreasing Stack",
    whenToUse: [
      "Next Greater Element / Next Smaller Element in O(N)",
      "Daily Temperatures / Stock Span / Largest Rectangle in Histogram",
      "Trapping Rain Water horizontal layer resolution"
    ],
    timeComplexity: "O(N) Time | O(N) Space",
    classicProblems: [
      "Daily Temperatures (LC 739)",
      "Largest Rectangle in Histogram (LC 84)",
      "Next Greater Element II (LC 503)"
    ],
    templateSnippet: `function nextGreaterElements(temps: number[]): number[] {
  const res = new Array(temps.length).fill(0);
  const stack: number[] = []; // Stores indices in decreasing order of temp
  for (let i = 0; i < temps.length; i++) {
    while (stack.length && temps[i] > temps[stack.at(-1)!]) {
      const prevIdx = stack.pop()!;
      res[prevIdx] = i - prevIdx; // Found first warmer day!
    }
    stack.push(i);
  }
  return res;
}`,
    arrayDemo: {
      array: [73, 74, 75, 71, 69, 76],
      steps: [
        {
          stepTitle: "Step 1: Push 73, then 74 Pops 73",
          leftIdx: 0,
          rightIdx: 1,
          highlightIndices: [0, 1],
          windowState: "Stack: [idx 1 (74°)] | Resolved: idx 0 -> wait 1 day",
          explanation: "74 > 73, so index 0 is popped immediately and resolved with distance (1 - 0 = 1)."
        },
        {
          stepTitle: "Step 2: 75 Pops 74, then 71 & 69 Stack Up",
          leftIdx: 2,
          rightIdx: 4,
          highlightIndices: [2, 3, 4],
          windowState: "Stack (Decreasing): [idx 2 (75°), idx 3 (71°), idx 4 (69°)]",
          explanation: "71 and 69 are cooler than 75, so they push onto the stack maintaining monotonic decreasing order."
        },
        {
          stepTitle: "Step 3: 76 Arrives & Cascades Pops!",
          leftIdx: 2,
          rightIdx: 5,
          highlightIndices: [2, 3, 4, 5],
          windowState: "76° pops 69° (d=1), 71° (d=2), and 75° (d=3) in one sweep!",
          explanation: "Because the stack is monotonic, a single warmer day (76°) resolves all smaller pending days in amortized O(1) per element."
        }
      ]
    }
  },
  {
    id: "two_pointers",
    name: "Converging Two Pointers",
    whenToUse: [
      "Sorted arrays or palindromic string validation",
      "Finding pairs/triplets that sum to target (2Sum II / 3Sum) without O(N) hash map overhead",
      "Container With Most Water / Dutch National Flag partitioning"
    ],
    timeComplexity: "O(N) Time | O(1) Auxiliary Space",
    classicProblems: [
      "3Sum (LC 15)",
      "Container With Most Water (LC 11)",
      "Trapping Rain Water (LC 42)"
    ],
    templateSnippet: `function twoSumSorted(nums: number[], target: number): [number, number] {
  let left = 0, right = nums.length - 1;
  while (left < right) {
    const sum = nums[left] + nums[right];
    if (sum === target) return [left, right];
    if (sum < target) left++; // Need larger sum
    else right--;             // Need smaller sum
  }
  return [-1, -1];
}`,
    arrayDemo: {
      array: [1, 3, 4, 6, 8, 11],
      steps: [
        {
          stepTitle: "Step 1: Initialize Ends (Target = 10)",
          leftIdx: 0,
          rightIdx: 5,
          highlightIndices: [0, 5],
          windowState: "nums[0] + nums[5] = 1 + 11 = 12 (> 10)",
          explanation: "Sum 12 is too large. Since array is sorted, decrementing `right` is guaranteed to decrease the sum."
        },
        {
          stepTitle: "Step 2: Decrement Right -> [0, 4]",
          leftIdx: 0,
          rightIdx: 4,
          highlightIndices: [0, 4],
          windowState: "nums[0] + nums[4] = 1 + 8 = 9 (< 10)",
          explanation: "Sum 9 is too small. Increment `left` to increase the sum."
        },
        {
          stepTitle: "Step 3: Increment Left -> [1, 4]",
          leftIdx: 1,
          rightIdx: 4,
          highlightIndices: [1, 4],
          windowState: "nums[1] + nums[4] = 3 + 8 = 11 (> 10)",
          explanation: "Sum 11 > 10, so decrement `right` to index 3."
        },
        {
          stepTitle: "Step 4: Exact Match Found at [2, 3]!",
          leftIdx: 2,
          rightIdx: 3,
          highlightIndices: [2, 3],
          windowState: "nums[2] + nums[3] = 4 + 6 = 10 (Target Hit!)",
          explanation: "We eliminated impossible pairs at every step in O(N) time and O(1) memory."
        }
      ]
    }
  }
];
