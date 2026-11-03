import { SystemDesignProblem } from "../types";

export const SYSTEM_DESIGN_PROBLEMS: SystemDesignProblem[] = [
  {
    id: "ticketmaster",
    title: "Design Ticketmaster (High-Concurrency Event Ticketing)",
    companyTags: ["Meta", "Uber", "Amazon", "Stripe", "Airbnb"],
    difficulty: "Hard",
    category: "Distributed Systems",
    estimatedMinutes: 45,
    promptSummary:
      "Design an online ticketing platform like Ticketmaster that sells tickets for high-demand events (e.g., Taylor Swift concert where 5M users compete for 60,000 seats simultaneously). Prevent double-booking while keeping seat map browsing fast.",
    functionalRequirements: [
      "Users can search events and view venue details & interactive seat maps",
      "Users can select available seats and hold them temporarily (e.g., 10-minute checkout timer)",
      "Users can complete payment to confirm booking or release seats upon timeout/failure",
      "Support a fair Virtual Waiting Queue during extreme traffic spikes (flash sales)"
    ],
    nonFunctionalRequirements: [
      "Strict ACID consistency for seat reservations — zero double-booking (no two users get the same seat)",
      "High availability (99.99%) for browsing events; strong consistency for booking",
      "Scale to 5M+ concurrent active users during flash drops and 50,000+ booking attempts/sec",
      "Low latency (<200ms) for seat map status reads using edge caching / SSE updates"
    ],
    capacityDefaults: {
      dau: "20M DAU (5M concurrent peak during Taylor Swift drop)",
      readQps: "150,000 read QPS (peak seat map polling/SSE)",
      writeQps: "15,000 reservation write QPS during drop",
      storagePerYear: "2.5 TB / year (Events, Seats, Bookings, Audit Logs)",
      bandwidth: "1.2 GB/s egress at peak"
    },
    apiEndpoints: [
      {
        method: "GET",
        path: "/api/v1/events/{eventId}/seats",
        description: "Fetch real-time seat map status (Available, Held, Booked) by section",
        payload: "Query: ?sectionId=sec_102 -> Returns array of { seatId, status, price }"
      },
      {
        method: "POST",
        path: "/api/v1/bookings/reserve",
        description: "Atomically lock selected seats for a 10-minute payment window",
        payload: "{ eventId, seatIds: ['A12', 'A13'], idempotencyKey: 'uuid-v4' } -> { reservationId, expiresAt }"
      },
      {
        method: "POST",
        path: "/api/v1/bookings/confirm",
        description: "Finalize ticket purchase via Stripe/Payment token before hold TTL expires",
        payload: "{ reservationId, paymentIntentId } -> { ticketIds, status: 'CONFIRMED' }"
      }
    ],
    coreEntities: [
      {
        table: "Seats",
        dbType: "PostgreSQL (Partitioned by event_id)",
        schema: "seat_id PK, event_id FK, section, row, status (AVAILABLE | HELD | BOOKED), version INT",
        partitionKey: "event_id"
      },
      {
        table: "SeatHoldLocks (Distributed Cache)",
        dbType: "Redis Cluster (with TTL)",
        schema: "Key: seat_hold:{event_id}:{seat_id} -> Value: { user_id, reservation_id } EX 600 NX",
        partitionKey: "event_id:seat_id"
      },
      {
        table: "Bookings",
        dbType: "PostgreSQL",
        schema: "booking_id PK, user_id, event_id, seat_ids[], status, payment_id, created_at",
        partitionKey: "booking_id"
      }
    ],
    starterNodes: [
      { id: "client", label: "Web / Mobile Client", sublabel: "React / iOS / Android", category: "client", x: 50, y: 180 },
      { id: "gateway", label: "API Gateway", sublabel: "Auth, Rate Limit, Routing", category: "edge", x: 260, y: 180 },
      { id: "booking_svc", label: "Booking Service", sublabel: "Reservation & Checkout", category: "compute", x: 500, y: 180 },
      { id: "postgres", label: "Primary Relational DB", sublabel: "PostgreSQL (ACID)", category: "database", x: 740, y: 180 }
    ],
    starterEdges: [
      { id: "e1", from: "client", to: "gateway", protocol: "HTTPS / WSS" },
      { id: "e2", from: "gateway", to: "booking_svc", protocol: "gRPC" },
      { id: "e3", from: "booking_svc", to: "postgres", protocol: "SQL" }
    ],
    referenceNodes: [
      { id: "client", label: "Web / Mobile Client", sublabel: "SSE Seat Updates", category: "client", x: 30, y: 180 },
      { id: "cdn", label: "CDN & Waiting Room", sublabel: "Cloudflare / Virtual Queue", category: "edge", x: 230, y: 80 },
      { id: "gateway", label: "API Gateway", sublabel: "Token Validation & Rate Limit", category: "edge", x: 230, y: 260 },
      { id: "event_svc", label: "Event & Seat Map Svc", sublabel: "Read-Heavy Microservice", category: "compute", x: 460, y: 90 },
      { id: "booking_svc", label: "Booking & Hold Svc", sublabel: "Atomic Seat Reservation", category: "compute", x: 460, y: 260 },
      { id: "redis_lock", label: "Redis Cluster", sublabel: "SET NX EX 600 Seat Hold", category: "cache", x: 700, y: 100 },
      { id: "postgres", label: "PostgreSQL Shards", sublabel: "Optimistic Locking / ACID", category: "database", x: 700, y: 230 },
      { id: "kafka", label: "Kafka Event Bus", sublabel: "Payment & Expiration Events", category: "queue", x: 700, y: 340 }
    ],
    referenceEdges: [
      { id: "re1", from: "client", to: "cdn", protocol: "HTTPS" },
      { id: "re2", from: "client", to: "gateway", protocol: "HTTPS / SSE" },
      { id: "re3", from: "gateway", to: "event_svc", protocol: "gRPC" },
      { id: "re4", from: "gateway", to: "booking_svc", protocol: "gRPC" },
      { id: "re5", from: "event_svc", to: "redis_lock", protocol: "Read Cache" },
      { id: "re6", from: "booking_svc", to: "redis_lock", protocol: "SET NX EX 600" },
      { id: "re7", from: "booking_svc", to: "postgres", protocol: "ACID Tx" },
      { id: "re8", from: "booking_svc", to: "kafka", protocol: "Async Events" }
    ],
    requiredArchitectureKeywords: [
      "redis",
      "ttl",
      "lock",
      "optimistic",
      "queue",
      "waiting room",
      "idempotency",
      "acid",
      "postgres"
    ],
    deepDiveQuestions: [
      {
        level: "L4",
        question: "How do you prevent two users from booking the exact same seat at the exact same millisecond, and what happens if a user closes their browser during checkout?",
        idealTradeoff:
          "Use a two-phase reservation with a Distributed Lock in Redis (`SET seat:{eventId}:{seatId} {userId} NX EX 600`) backed by PostgreSQL optimistic concurrency control (`UPDATE seats SET status='BOOKED', version=version+1 WHERE seat_id=$1 AND version=$2`). If the user abandons checkout, the 600s Redis TTL automatically expires.",
        keywords: ["redis", "nx", "ttl", "optimistic locking", "version", "acid", "timeout"]
      },
      {
        level: "L5",
        question: "When Taylor Swift tickets drop, 5 million fans hit the page at 10:00:00 AM. How do you protect your database and Redis cluster from thundering herd collapse while maintaining fairness?",
        idealTradeoff:
          "Introduce a Virtual Waiting Room at the Edge/Gateway layer. Users entering the lobby are assigned an encrypted queue position in a Redis Sorted Set (`ZADD`) and polled via SSE. Only N thousand active tokens per minute are admitted to the booking service.",
        keywords: ["virtual waiting room", "sorted set", "edge", "rate limit", "token", "sse", "thundering herd"]
      },
      {
        level: "L6",
        question: "What happens if the Redis node holding active 10-minute seat locks crashes before replicating to its replica? How do you guarantee zero double-booking even under Redis failover?",
        idealTradeoff:
          "Treat Redis strictly as a fast concurrency gate + TTL cache, while PostgreSQL remains the source of truth with a unique constraint on `(event_id, seat_id)` and `held_until` timestamp, or verify monotonically increasing fencing tokens during final payment commit.",
        keywords: ["fencing token", "failover", "source of truth", "held_until", "idempotency", "split brain"]
      }
    ]
  },
  {
    id: "openai_llm_inference",
    title: "Design OpenAI LLM Inference & KV-Cache Serving Cluster",
    companyTags: ["OpenAI", "Anthropic", "Google DeepMind", "Meta", "NVIDIA"],
    difficulty: "Staff+",
    category: "GenAI & ML Systems",
    estimatedMinutes: 45,
    promptSummary:
      "Design a high-throughput, low-latency distributed LLM serving platform (like ChatGPT / Claude API) that handles millions of streaming token generation requests with dynamic continuous batching, prefix KV-cache routing, and GPU fault recovery.",
    functionalRequirements: [
      "Users/APIs submit multi-turn chat prompts and receive real-time SSE token streams",
      "Support Continuous In-Flight Batching (iteration-level scheduling) across GPU workers",
      "Prefix KV-Cache reuse so multi-turn conversations and shared system prompts avoid redundant prefill compute",
      "Enforce per-organization Requests-Per-Minute (RPM) and Tokens-Per-Minute (TPM) rate limits"
    ],
    nonFunctionalRequirements: [
      "Time-To-First-Token (TTFT) < 350ms; Inter-Token Latency (ITL) < 25ms per token",
      "Maximize GPU HBM memory utilization (>85%) using PagedAttention virtual memory blocks",
      "Graceful worker failover: if a GPU node crashes mid-stream, transparently resume generation without dropping the user session",
      "Disaggregate Prefill (compute-bound) and Decode (memory-bandwidth-bound) phases across specialized GPU pools"
    ],
    capacityDefaults: {
      dau: "100M DAU, 250,000 concurrent streaming SSE connections",
      readQps: "50,000 prompt requests/sec (~15M output tokens/sec)",
      writeQps: "50,000 conversation state & telemetry logs/sec",
      storagePerYear: "80 GB HBM per H100 GPU; Distributed NVMe/RDMA KV-Cache pool",
      bandwidth: "400 Gbps InfiniBand / RoCE RDMA for KV-Cache transfer"
    },
    apiEndpoints: [
      {
        method: "POST",
        path: "/v1/chat/completions (SSE Stream)",
        description: "Submit chat messages array and stream back generated tokens via Server-Sent Events",
        payload: "{ model: 'gpt-4o', messages: [...], stream: true, max_tokens: 2048 }"
      }
    ],
    coreEntities: [
      {
        table: "PrefixKVCacheRoutingTree",
        dbType: "In-Memory Radix Tree (Consistent Prefix Router)",
        schema: "token_prefix_hash PK -> { gpu_worker_id, kv_block_ids[], last_accessed_ts }",
        partitionKey: "token_prefix_hash"
      },
      {
        table: "TokenRateLimitBuckets",
        dbType: "Redis Cluster (Atomic Lua Token Bucket)",
        schema: "org_id PK -> { rpm_tokens, tpm_tokens, last_refill_ms }",
        partitionKey: "org_id"
      }
    ],
    starterNodes: [
      { id: "api_client", label: "SDK / Chat Client", sublabel: "SSE Token Stream", category: "client", x: 35, y: 180 },
      { id: "llm_gateway", label: "API & TPM Rate Limiter", sublabel: "Token Bucket Lua", category: "edge", x: 245, y: 180 },
      { id: "kv_router", label: "Prefix-Aware Router", sublabel: "Radix Tree KV Affinity", category: "compute", x: 475, y: 180 },
      { id: "gpu_fleet", label: "vLLM GPU Worker Fleet", sublabel: "PagedAttention H100s", category: "search_ai", x: 700, y: 180 }
    ],
    starterEdges: [
      { id: "e1", from: "api_client", to: "llm_gateway", protocol: "SSE / HTTPS" },
      { id: "e2", from: "llm_gateway", to: "kv_router", protocol: "gRPC Stream" },
      { id: "e3", from: "kv_router", to: "gpu_fleet", protocol: "Schedule Batch" }
    ],
    referenceNodes: [
      { id: "api_client", label: "SDK / Chat Client", sublabel: "SSE Token Stream", category: "client", x: 30, y: 180 },
      { id: "llm_gateway", label: "API Gateway & Guardrails", sublabel: "TPM/RPM Rate Limit", category: "edge", x: 225, y: 180 },
      { id: "kv_router", label: "Radix Prefix Router", sublabel: "KV-Cache Locality Scheduler", category: "compute", x: 440, y: 100 },
      { id: "redis_tpm", label: "Redis Token Bucket", sublabel: "Org Quota Tracking", category: "cache", x: 440, y: 270 },
      { id: "prefill_pool", label: "Prefill GPU Pool", sublabel: "Compute-Bound Prompt Pass", category: "search_ai", x: 685, y: 75 },
      { id: "decode_pool", label: "Decode GPU Pool", sublabel: "Memory-Bound Token Gen", category: "search_ai", x: 685, y: 210 },
      { id: "kv_store", label: "RDMA Distributed KV Pool", sublabel: "PagedAttention Block Cache", category: "database", x: 685, y: 335 }
    ],
    referenceEdges: [
      { id: "re1", from: "api_client", to: "llm_gateway", protocol: "SSE" },
      { id: "re2", from: "llm_gateway", to: "redis_tpm", protocol: "Check TPM" },
      { id: "re3", from: "llm_gateway", to: "kv_router", protocol: "Route Prefix" },
      { id: "re4", from: "kv_router", to: "prefill_pool", protocol: "Prefill Batch" },
      { id: "re5", from: "prefill_pool", to: "decode_pool", protocol: "RDMA KV Transfer" },
      { id: "re6", from: "decode_pool", to: "kv_store", protocol: "Swap KV Blocks" }
    ],
    requiredArchitectureKeywords: [
      "kv cache",
      "continuous batching",
      "pagedattention",
      "prefill",
      "decode",
      "ttft",
      "radix",
      "rate limit",
      "sse"
    ],
    deepDiveQuestions: [
      {
        level: "L4",
        question: "Why does static batching waste up to 70% of GPU compute on LLM inference, and how does Continuous (Iteration-Level) Batching solve it?",
        idealTradeoff:
          "In static batching, if Request A finishes at 20 tokens and Request B generates 1,000 tokens, the GPU slot for Request A sits idle waiting for B to finish. Continuous batching schedules at the single-token iteration level, immediately evicting completed sequences and injecting new queued prompts into the next forward pass.",
        keywords: ["continuous batching", "iteration", "gpu", "idle", "padding"]
      },
      {
        level: "L5",
        question: "Why should a global load balancer NOT use simple Round-Robin routing across LLM GPU workers for multi-turn chat?",
        idealTradeoff:
          "Round-robin destroys KV-Cache locality, forcing every turn of a 30k-token conversation to recompute the entire prompt prefill from scratch. Instead, use a Radix-Tree Prefix-Aware Router (like SGLang/vLLM) that hashes token prefixes and routes requests to the GPU worker already holding those KV blocks in HBM.",
        keywords: ["prefix", "radix", "kv cache", "locality", "prefill", "round-robin"]
      },
      {
        level: "L6",
        question: "Why do frontier serving clusters disaggregate Prefill and Decode onto separate GPU pools?",
        idealTradeoff:
          "Prefill (processing 10k input tokens in parallel) is compute-bound and spikes TTFT when mixed with Decode. Decode (generating 1 token at a time) is memory-bandwidth-bound. Disaggregating them lets you optimize Prefill nodes for FLOPs and transfer the resulting KV-Cache blocks over 400Gbps RDMA to high-bandwidth Decode nodes for jitter-free token streaming.",
        keywords: ["disaggregate", "prefill", "decode", "compute-bound", "memory-bound", "rdma", "ttft"]
      }
    ]
  },
  {
    id: "uber",
    title: "Design Uber (Real-Time Location Indexing & Ride Matching)",
    companyTags: ["Uber", "Lyft", "Google", "DoorDash", "Grab"],
    difficulty: "Hard",
    category: "Real-Time & Geo",
    estimatedMinutes: 45,
    promptSummary:
      "Design a ride-hailing backend that ingests real-time GPS pings from millions of active drivers every 4 seconds, displays nearby cars to riders, and matches riders with optimal drivers with low latency.",
    functionalRequirements: [
      "Drivers broadcast live GPS coordinates every 3–5 seconds",
      "Riders can view nearby available drivers and request a ride with ETA & upfront price",
      "System matches rider request to nearby available drivers sequentially (15s accept window)",
      "Real-time trip tracking and status updates from pickup to dropoff"
    ],
    nonFunctionalRequirements: [
      "Ultra-high write throughput for driver telemetry (~500,000 GPS pings/sec)",
      "Low-latency spatial queries (<100ms to find K nearest available drivers within 3km)",
      "High availability over strict consistency for location pings; strong consistency for ride state transitions",
      "Horizontal scalability partitioned by geographic region / city"
    ],
    capacityDefaults: {
      dau: "40M riders, 5M active drivers (2M concurrent online)",
      readQps: "100,000 nearby driver queries/sec",
      writeQps: "500,000 location pings/sec (2M drivers / 4 sec)",
      storagePerYear: "150 TB / year (Trip history & telemetry archival)",
      bandwidth: "250 MB/s ingress for GPS packets"
    },
    apiEndpoints: [
      {
        method: "WS",
        path: "wss://location.uber.com/v1/driver/telemetry",
        description: "Persistent bidirectional WebSocket / QUIC stream for driver GPS updates & dispatch pushes",
        payload: "{ driverId, lat: 37.7749, lng: -122.4194, bearing: 90, timestamp }"
      },
      {
        method: "POST",
        path: "/api/v1/rides/request",
        description: "Create a ride request and trigger spatial dispatch matching",
        payload: "{ riderId, pickupLat, pickupLng, destLat, destLng, tier: 'UberX' }"
      }
    ],
    coreEntities: [
      {
        table: "GeoLocationIndex (In-Memory)",
        dbType: "Redis Cluster (GeoHash / Uber H3 hexagonal cells)",
        schema: "H3 Cell ID -> Set of { driver_id, lat, lng, status, updated_at }",
        partitionKey: "h3_cell_id (sharded by city/region)"
      },
      {
        table: "Trips",
        dbType: "PostgreSQL / Spanner (Sharded by city_id)",
        schema: "trip_id PK, rider_id, driver_id, city_id, status, fare",
        partitionKey: "city_id"
      }
    ],
    starterNodes: [
      { id: "driver_app", label: "Driver & Rider Apps", sublabel: "GPS Pings & Ride Req", category: "client", x: 50, y: 180 },
      { id: "ws_gateway", label: "WebSocket Gateway", sublabel: "Persistent Connections", category: "edge", x: 270, y: 180 },
      { id: "match_svc", label: "Dispatch & Match Svc", sublabel: "Ride Matching Logic", category: "compute", x: 510, y: 180 },
      { id: "redis_geo", label: "Redis Geo Index", sublabel: "Geohash / H3 Cells", category: "cache", x: 730, y: 180 }
    ],
    starterEdges: [
      { id: "e1", from: "driver_app", to: "ws_gateway", protocol: "WSS / QUIC" },
      { id: "e2", from: "ws_gateway", to: "match_svc", protocol: "gRPC" },
      { id: "e3", from: "match_svc", to: "redis_geo", protocol: "GEORADIUS / H3" }
    ],
    referenceNodes: [
      { id: "driver_app", label: "Driver & Rider Apps", sublabel: "4s GPS Telemetry", category: "client", x: 35, y: 180 },
      { id: "ws_gateway", label: "WebSocket / QUIC Edge", sublabel: "Connection Manager", category: "edge", x: 235, y: 180 },
      { id: "loc_svc", label: "Location Ingestion Svc", sublabel: "High-Write Streamer", category: "compute", x: 455, y: 90 },
      { id: "match_svc", label: "Dispatch & Matching Svc", sublabel: "ETA & Offer Lock Engine", category: "compute", x: 455, y: 260 },
      { id: "redis_geo", label: "Redis H3 Spatial Cluster", sublabel: "In-Memory Hexagonal Index", category: "cache", x: 700, y: 90 },
      { id: "kafka", label: "Kafka Telemetry Stream", sublabel: "ETA ML & Surge Pricing", category: "queue", x: 700, y: 215 },
      { id: "trip_db", label: "Sharded Trip DB", sublabel: "PostgreSQL / Schemaless", category: "database", x: 700, y: 335 }
    ],
    referenceEdges: [
      { id: "re1", from: "driver_app", to: "ws_gateway", protocol: "WSS / QUIC" },
      { id: "re2", from: "ws_gateway", to: "loc_svc", protocol: "gRPC Stream" },
      { id: "re3", from: "ws_gateway", to: "match_svc", protocol: "gRPC" },
      { id: "re4", from: "loc_svc", to: "redis_geo", protocol: "H3 Cell Update" },
      { id: "re5", from: "loc_svc", to: "kafka", protocol: "Async Stream" },
      { id: "re6", from: "match_svc", to: "redis_geo", protocol: "K-Ring Query" },
      { id: "re7", from: "match_svc", to: "trip_db", protocol: "ACID State" }
    ],
    requiredArchitectureKeywords: [
      "geohash",
      "h3",
      "quadtree",
      "websocket",
      "redis",
      "lock",
      "eta",
      "shard",
      "location"
    ],
    deepDiveQuestions: [
      {
        level: "L4",
        question: "Why can't we simply run `SELECT * FROM drivers WHERE lat BETWEEN x1 AND x2 AND lng BETWEEN y1 AND y2` in PostgreSQL for 500,000 updates/sec?",
        idealTradeoff:
          "B-Tree indexes on `(lat, lng)` degrade on 2D range queries and incur massive write amplification from 500k disk updates/sec. Store ephemeral coordinates in memory (Redis Cluster) partitioned by Uber H3 hexagonal cells.",
        keywords: ["geohash", "h3", "redis", "in-memory", "write amplification"]
      },
      {
        level: "L5",
        question: "How do you handle a hot spot like LAX airport where 10,000 riders and 2,000 drivers are concentrated inside a single H3 cell?",
        idealTradeoff:
          "Use finer H3 resolution levels (level 9–10) combined with read replicas per hot cell and 2-second bipartite batch-matching windows (Hungarian algorithm) rather than greedy FCFS.",
        keywords: ["resolution", "hot spot", "batch matching", "bipartite", "replica"]
      },
      {
        level: "L6",
        question: "Why is straight-line Euclidean distance insufficient for dispatch, and how do you architect real-time road-network ETA at scale?",
        idealTradeoff:
          "Filter top 25 candidates via H3 k-ring first, then query a partitioned Contraction Hierarchies road-graph service weighted by live traffic edge speeds from Kafka.",
        keywords: ["road network", "eta", "graph", "contraction hierarchies", "traffic"]
      }
    ]
  },
  {
    id: "whatsapp",
    title: "Design WhatsApp (Global Real-Time Messaging & Presence)",
    companyTags: ["Meta", "Discord", "Slack", "Snap", "Apple"],
    difficulty: "Medium",
    category: "Real-Time & Geo",
    estimatedMinutes: 45,
    promptSummary:
      "Design a global instant messaging system supporting 1-on-1 and group chats (up to 1,000 members), message delivery receipts (sent/delivered/read), offline inbox queuing, and online/last-seen presence indicators.",
    functionalRequirements: [
      "Real-time 1-on-1 and Group messaging (up to 1,000 participants)",
      "Delivery state machine: Sent (single tick), Delivered (double tick), Read (blue tick)",
      "Offline message storage & push notification delivery when recipient is disconnected",
      "Online / Last Seen presence indicator for contacts"
    ],
    nonFunctionalRequirements: [
      "Low message delivery latency (<100ms globally for online users)",
      "At-least-once delivery with client-side deduplication and causal message ordering",
      "Scale to 2B users, 100M concurrent persistent WebSocket connections, 100B messages/day",
      "Minimal server-side storage footprint (transient queue for E2E encrypted payloads)"
    ],
    capacityDefaults: {
      dau: "1 Billion DAU (100M concurrent WebSockets)",
      readQps: "1.2M messages delivered/sec",
      writeQps: "1.15M messages sent/sec",
      storagePerYear: "Transient inbox queue + Cassandra/HBase chat history",
      bandwidth: "3.5 GB/s global message payload traffic"
    },
    apiEndpoints: [
      {
        method: "WS",
        path: "wss://chat.whatsapp.net/v1/stream",
        description: "Multiplexed persistent connection for sending messages, ACKs, and heartbeats",
        payload: "{ type: 'SEND_MSG', clientMsgId, recipientId, ciphertext, timestamp }"
      }
    ],
    coreEntities: [
      {
        table: "SessionRoutingRegistry",
        dbType: "Redis Cluster",
        schema: "Key: user_session:{userId} -> { chatGatewayHost, connId, lastHeartbeat }",
        partitionKey: "userId"
      },
      {
        table: "OfflineInboxMessages",
        dbType: "Apache Cassandra / DynamoDB",
        schema: "recipient_id PK, message_id SK (TimeUUID), sender_id, ciphertext, status",
        partitionKey: "recipient_id"
      }
    ],
    starterNodes: [
      { id: "clients", label: "Mobile / Web Clients", sublabel: "E2E Signal Protocol", category: "client", x: 50, y: 180 },
      { id: "chat_gw", label: "Chat Gateway Cluster", sublabel: "Stateful WebSocket Servers", category: "edge", x: 280, y: 180 },
      { id: "session_redis", label: "Session & Presence Redis", sublabel: "User -> Gateway Mapping", category: "cache", x: 530, y: 110 },
      { id: "msg_db", label: "Message Store", sublabel: "Cassandra / DynamoDB", category: "database", x: 530, y: 260 }
    ],
    starterEdges: [
      { id: "e1", from: "clients", to: "chat_gw", protocol: "WSS" },
      { id: "e2", from: "chat_gw", to: "session_redis", protocol: "Redis Lookup" },
      { id: "e3", from: "chat_gw", to: "msg_db", protocol: "Write/Read" }
    ],
    referenceNodes: [
      { id: "clients", label: "Mobile / Web Clients", sublabel: "E2EE Signal Keys", category: "client", x: 35, y: 180 },
      { id: "chat_gw", label: "Stateful Chat Gateways", sublabel: "100k WebSockets / Node", category: "edge", x: 245, y: 180 },
      { id: "msg_router", label: "Message Routing & Fanout", sublabel: "Stateless Workers", category: "compute", x: 470, y: 100 },
      { id: "presence_svc", label: "Presence & Heartbeat Svc", sublabel: "Pub/Sub Status", category: "compute", x: 470, y: 260 },
      { id: "session_redis", label: "Redis Session & Presence", sublabel: "Gateway Routing Table", category: "cache", x: 700, y: 80 },
      { id: "msg_db", label: "Cassandra Inbox Store", sublabel: "Wide-Column TimeUUID", category: "database", x: 700, y: 210 },
      { id: "push_notify", label: "APNs / FCM Push Queue", sublabel: "Offline Wakeup", category: "queue", x: 700, y: 335 }
    ],
    referenceEdges: [
      { id: "re1", from: "clients", to: "chat_gw", protocol: "WSS" },
      { id: "re2", from: "chat_gw", to: "msg_router", protocol: "gRPC" },
      { id: "re3", from: "chat_gw", to: "presence_svc", protocol: "Heartbeat" },
      { id: "re4", from: "msg_router", to: "session_redis", protocol: "Lookup Host" },
      { id: "re5", from: "msg_router", to: "msg_db", protocol: "Persist Inbox" },
      { id: "re6", from: "msg_router", to: "push_notify", protocol: "Offline Push" },
      { id: "re7", from: "presence_svc", to: "session_redis", protocol: "TTL 30s" }
    ],
    requiredArchitectureKeywords: [
      "websocket",
      "gateway",
      "redis",
      "cassandra",
      "fanout",
      "heartbeat",
      "presence",
      "push notification",
      "ack"
    ],
    deepDiveQuestions: [
      {
        level: "L4",
        question: "How does the backend know which specific WebSocket server out of 2,000 gateway servers holds User B's active TCP connection?",
        idealTradeoff:
          "Maintain a Session Routing Registry in Redis (`user_session:{userB} -> gateway_node_id`). Look up User B's gateway host in Redis and forward via internal gRPC.",
        keywords: ["session", "redis", "gateway", "routing"]
      },
      {
        level: "L5",
        question: "Why does broadcasting 'User X is online' to all 500 address book contacts cause a fanout storm, and how do you avoid it?",
        idealTradeoff:
          "Use explicit viewport subscription rather than blind address-book push fanout: clients only subscribe to presence for the active chat screen they are viewing.",
        keywords: ["presence", "fanout", "subscription", "heartbeat", "ttl"]
      },
      {
        level: "L6",
        question: "How do you guarantee reliable ordering and zero lost messages if a user switches from Wi-Fi to 5G mid-flight?",
        idealTradeoff:
          "Persist incoming messages to the recipient's Cassandra inbox table keyed by `recipient_id` + monotonic `TimeUUID` before attempting WebSocket push, deleting only after an application-layer `CLIENT_ACK`.",
        keywords: ["ack", "inbox", "timeuuid", "idempotency", "ordering"]
      }
    ]
  },
  {
    id: "rag_enterprise",
    title: "Design Enterprise GenAI RAG & Semantic Search Platform",
    companyTags: ["OpenAI", "Anthropic", "Google", "Databricks", "Glean"],
    difficulty: "Staff+",
    category: "GenAI & ML Systems",
    estimatedMinutes: 45,
    promptSummary:
      "Design an enterprise Retrieval-Augmented Generation (RAG) system like Glean or ChatGPT Enterprise that indexes 500M internal documents across Slack, Drive, and Jira with strict document-level ACL permissions and sub-2-second time-to-first-token.",
    functionalRequirements: [
      "Continuous ingestion & incremental syncing of documents from Google Drive, Slack, Jira, Confluence",
      "Strict Access Control List (ACL) enforcement — users must never retrieve chunks from docs they lack permission to view",
      "Hybrid Search combining lexical keyword match (BM25) + dense semantic vector search",
      "Streaming LLM answer synthesis with inline source citations and hallucination guardrails"
    ],
    nonFunctionalRequirements: [
      "Zero ACL data leakage (permission changes reflected within <60 seconds)",
      "Retrieval + Reranking latency <250ms; Time-to-First-Token (TTFT) <800ms",
      "Scale to 500M documents (~5 Billion vector chunks at 1024 dimensions)",
      "High relevance precision using two-stage retrieval + cross-encoder reranking"
    ],
    capacityDefaults: {
      dau: "2M enterprise seats across 500 tenants",
      readQps: "15,000 RAG queries/sec",
      writeQps: "25,000 document updates & ACL syncs/sec",
      storagePerYear: "20 TB Vector Index (int8/scalar quantized HNSW) + 100 TB Doc Store",
      bandwidth: "800 MB/s embedding & streaming pipeline"
    },
    apiEndpoints: [
      {
        method: "POST",
        path: "/api/v1/rag/query (SSE Stream)",
        description: "Execute permission-aware hybrid retrieval, reranking, and LLM streaming answer with citations",
        payload: "{ tenantId, userId, query, conversationHistory[] } -> SSE stream of { token, citations[] }"
      }
    ],
    coreEntities: [
      {
        table: "DocumentChunksIndex",
        dbType: "Qdrant / Milvus / Elasticsearch Hybrid",
        schema: "chunk_id PK, tenant_id, doc_id, embedding vector[1024], bm25_tokens, acl_groups[]",
        partitionKey: "tenant_id"
      },
      {
        table: "UserPrincipalGraph",
        dbType: "Redis + Zanzibar / SpiceDB ACL Cache",
        schema: "Key: acl:{tenantId}:{userId} -> Set of allowed group_ids",
        partitionKey: "tenant_id:user_id"
      }
    ],
    starterNodes: [
      { id: "user_ui", label: "Enterprise Chat UI", sublabel: "SSE Streaming Client", category: "client", x: 40, y: 180 },
      { id: "rag_orch", label: "RAG Orchestrator", sublabel: "Query Rewrite & Prompting", category: "compute", x: 260, y: 180 },
      { id: "vector_db", label: "Vector & Lexical Index", sublabel: "HNSW + BM25 Hybrid", category: "search_ai", x: 510, y: 110 },
      { id: "llm_gw", label: "LLM Inference Gateway", sublabel: "vLLM / Enterprise Model", category: "search_ai", x: 510, y: 260 }
    ],
    starterEdges: [
      { id: "e1", from: "user_ui", to: "rag_orch", protocol: "SSE / HTTPS" },
      { id: "e2", from: "rag_orch", to: "vector_db", protocol: "Hybrid Search" },
      { id: "e3", from: "rag_orch", to: "llm_gw", protocol: "Stream Prompt" }
    ],
    referenceNodes: [
      { id: "user_ui", label: "Enterprise Chat Client", sublabel: "Citations & Feedback", category: "client", x: 30, y: 180 },
      { id: "rag_orch", label: "RAG Query Orchestrator", sublabel: "ACL Pre-Filter & RRF", category: "compute", x: 235, y: 110 },
      { id: "ingest_pipe", label: "Ingestion & Chunking Worker", sublabel: "Kafka + Semantic Chunker", category: "queue", x: 235, y: 290 },
      { id: "acl_cache", label: "Zanzibar / Redis ACL Graph", sublabel: "User Group Membership", category: "cache", x: 470, y: 60 },
      { id: "vector_db", label: "Hybrid Vector + BM25 DB", sublabel: "Tenant-Sharded HNSW", category: "search_ai", x: 470, y: 185 },
      { id: "reranker", label: "Cross-Encoder Reranker", sublabel: "Top 100 -> Top 8 Chunks", category: "search_ai", x: 700, y: 100 },
      { id: "llm_gw", label: "LLM Serving & Guardrails", sublabel: "Citation Grounding Check", category: "search_ai", x: 700, y: 260 }
    ],
    referenceEdges: [
      { id: "re1", from: "user_ui", to: "rag_orch", protocol: "SSE" },
      { id: "re2", from: "rag_orch", to: "acl_cache", protocol: "Fetch Groups" },
      { id: "re3", from: "rag_orch", to: "vector_db", protocol: "Filtered ANN + BM25" },
      { id: "re4", from: "ingest_pipe", to: "vector_db", protocol: "Upsert Embeddings" },
      { id: "re5", from: "vector_db", to: "reranker", protocol: "RRF Top 100" },
      { id: "re6", from: "reranker", to: "llm_gw", protocol: "Top 8 Context" }
    ],
    requiredArchitectureKeywords: [
      "vector",
      "bm25",
      "hybrid",
      "rerank",
      "acl",
      "chunk",
      "embedding",
      "hnsw",
      "citation"
    ],
    deepDiveQuestions: [
      {
        level: "L4",
        question: "Why is pure dense vector search insufficient for enterprise search, and how do you combine it with keyword search?",
        idealTradeoff:
          "Use Hybrid Retrieval: execute lexical BM25 and dense HNSW vector search in parallel, fuse top 100 via Reciprocal Rank Fusion (RRF), and pass to a Cross-Encoder Reranker.",
        keywords: ["bm25", "hybrid", "rrf", "reranker", "cross-encoder"]
      },
      {
        level: "L5",
        question: "How do you enforce document-level ACL permissions without re-embedding all chunks when a user joins a Google Group?",
        idealTradeoff:
          "Decouple Group-to-Document ACLs from User-to-Group membership! Store `allowed_group_ids` on document chunks and User -> Group mappings in Redis/Zanzibar, passing the user's groups as a pre-filter bitmap into HNSW search.",
        keywords: ["acl", "group", "pre-filter", "metadata", "decouple", "zanzibar"]
      },
      {
        level: "L6",
        question: "5 Billion 1024-dim float32 vectors require ~20 TB of RAM. How do you reduce memory costs by 8x–16x without destroying recall?",
        idealTradeoff:
          "Apply Scalar Quantization (int8) or Binary/Product Quantization (PQ) in RAM for candidate recall (top 200), then rescore those 200 using full-precision fp16 vectors on NVMe SSD (DiskANN pattern).",
        keywords: ["quantization", "int8", "pq", "diskann", "rescore", "nvme"]
      }
    ]
  },
  {
    id: "dropbox_sync",
    title: "Design Dropbox / Google Drive (Block-Level Cloud File Sync)",
    companyTags: ["Dropbox", "Google", "Apple", "Microsoft", "Box"],
    difficulty: "Hard",
    category: "Distributed Systems",
    estimatedMinutes: 45,
    promptSummary:
      "Design a cloud file storage and multi-device synchronization service supporting 50GB+ files, resumable uploads, delta sync (only uploading modified 4MB blocks), deduplication, and instant multi-device change notifications.",
    functionalRequirements: [
      "Users can upload, download, and share files/folders up to 50GB across desktop & mobile clients",
      "Delta Sync & Resumable Uploads: modifying a 10GB file only uploads the changed 4MB block chunks",
      "Content-addressable deduplication via SHA-256 block hashes",
      "Real-time file version history and multi-device sync notifications"
    ],
    nonFunctionalRequirements: [
      "Strict ACID metadata consistency (folder hierarchy, file versions, permissions)",
      "99.999999999% (11 nines) blob durability across multi-region Object Storage (S3)",
      "Aggressive bandwidth & storage savings via client-side chunking, SHA-256 dedup, and zstd compression"
    ],
    capacityDefaults: {
      dau: "100M DAU across 300M connected devices",
      readQps: "120,000 metadata/sync queries/sec",
      writeQps: "40,000 block chunk commits/sec",
      storagePerYear: "500 PB Object Storage (after ~35% SHA-256 deduplication savings)",
      bandwidth: "15 GB/s direct Client <-> S3 Pre-Signed URL throughput"
    },
    apiEndpoints: [
      {
        method: "POST",
        path: "/api/v1/files/init-upload",
        description: "Send array of 4MB block SHA-256 hashes; returns pre-signed S3 URLs ONLY for blocks not already in cloud",
        payload: "{ fileId, version, blockHashes: ['sha256_1', 'sha256_2'] } -> { missingHashes: ['sha256_2'], presignedUrls }"
      }
    ],
    coreEntities: [
      {
        table: "FileMetadata & Versions",
        dbType: "Sharded PostgreSQL / Spanner",
        schema: "file_id PK, workspace_id, latest_version INT, block_list_ids[], updated_at",
        partitionKey: "workspace_id"
      },
      {
        table: "ContentAddressableBlocks",
        dbType: "S3 Object Storage + Block Index DB",
        schema: "block_sha256 PK, s3_object_uri, byte_size, ref_count",
        partitionKey: "block_sha256"
      }
    ],
    starterNodes: [
      { id: "sync_client", label: "Desktop Sync Client", sublabel: "4MB Chunker & Watcher", category: "client", x: 40, y: 180 },
      { id: "meta_svc", label: "Metadata & Dedup Svc", sublabel: "Hash Check & Pre-Signed URL", category: "compute", x: 290, y: 180 },
      { id: "s3_blob", label: "S3 Block Storage", sublabel: "Direct Client Upload", category: "database", x: 580, y: 100 },
      { id: "meta_db", label: "PostgreSQL Metadata DB", sublabel: "ACID File Revisions", category: "database", x: 580, y: 260 }
    ],
    starterEdges: [
      { id: "e1", from: "sync_client", to: "meta_svc", protocol: "HTTPS" },
      { id: "e2", from: "sync_client", to: "s3_blob", protocol: "Pre-Signed PUT" },
      { id: "e3", from: "meta_svc", to: "meta_db", protocol: "ACID SQL" }
    ],
    referenceNodes: [
      { id: "sync_client", label: "Desktop/Mobile Client", sublabel: "Rabin Fingerprint 4MB Chunker", category: "client", x: 35, y: 180 },
      { id: "api_gw", label: "API Gateway", sublabel: "Auth & Rate Limit", category: "edge", x: 235, y: 180 },
      { id: "meta_svc", label: "Metadata & Dedup Svc", sublabel: "SHA-256 Check & Presign", category: "compute", x: 455, y: 95 },
      { id: "notify_svc", label: "SSE / Long-Poll Sync Svc", sublabel: "Device Delta Push", category: "compute", x: 455, y: 270 },
      { id: "s3_blob", label: "S3 Content-Addressed Store", sublabel: "Direct Pre-Signed Upload", category: "database", x: 700, y: 75 },
      { id: "meta_db", label: "Sharded Metadata DB", sublabel: "PostgreSQL ACID Versions", category: "database", x: 700, y: 205 },
      { id: "redis_pub", label: "Redis Pub/Sub Registry", sublabel: "Workspace Device Channels", category: "cache", x: 700, y: 330 }
    ],
    referenceEdges: [
      { id: "re1", from: "sync_client", to: "api_gw", protocol: "HTTPS / SSE" },
      { id: "re2", from: "api_gw", to: "meta_svc", protocol: "gRPC" },
      { id: "re3", from: "sync_client", to: "s3_blob", protocol: "Direct PUT/GET" },
      { id: "re4", from: "meta_svc", to: "meta_db", protocol: "ACID Commit" },
      { id: "re5", from: "meta_svc", to: "redis_pub", protocol: "Publish Revision" },
      { id: "re6", from: "redis_pub", to: "notify_svc", protocol: "Fanout Delta" }
    ],
    requiredArchitectureKeywords: [
      "chunk",
      "4mb",
      "sha-256",
      "deduplication",
      "pre-signed",
      "s3",
      "metadata",
      "acid",
      "delta"
    ],
    deepDiveQuestions: [
      {
        level: "L4",
        question: "Why should file bytes NEVER flow through your backend API servers during upload/download?",
        idealTradeoff:
          "Proxying 50GB file uploads through stateless API servers saturates NIC bandwidth and ties up worker threads. Instead, the Metadata Service checks block SHA-256 hashes and returns S3 Pre-Signed URLs so the client uploads/downloads 4MB blocks directly to/from S3.",
        keywords: ["pre-signed", "s3", "direct", "bandwidth", "metadata"]
      },
      {
        level: "L5",
        question: "How does Content-Addressable Storage enable cross-user deduplication and instant delta sync?",
        idealTradeoff:
          "Splitting files into 4MB blocks (via Content-Defined Chunking / Rabin Fingerprinting) and indexing each block by its `SHA-256` hash means only modified blocks are uploaded on edit, and identical blocks already in S3 are skipped during `init-upload`.",
        keywords: ["sha-256", "chunk", "rabin", "deduplication", "delta"]
      },
      {
        level: "L6",
        question: "How do you handle concurrent edits when two offline devices modify the same file and reconnect?",
        idealTradeoff:
          "Use optimistic concurrency on file `version` in PostgreSQL (`UPDATE files SET version=version+1 WHERE file_id=$1 AND version=$2`). The first device to reconnect commits `v2`; the second device's base version `v1` fails the check and saves its blocks as a non-destructive conflicted copy so zero user work is lost.",
        keywords: ["optimistic", "version", "conflict", "acid"]
      }
    ]
  },
  {
    id: "leetcode_judge",
    title: "Design LeetCode (Sandboxed Online Code Execution Judge)",
    companyTags: ["Meta", "Amazon", "OpenAI", "Anthropic", "Databricks"],
    difficulty: "Hard",
    category: "Core Infrastructure",
    estimatedMinutes: 45,
    promptSummary:
      "Design an online coding platform and remote code execution engine that safely compiles and runs untrusted user code across 15+ languages against test suites during live weekly contests with 100,000+ participants.",
    functionalRequirements: [
      "Users can view problems, submit code in 15+ languages, and receive pass/fail + runtime/memory percentiles",
      "Strict security isolation so malicious code (fork bombs, infinite loops, filesystem/network exploits) cannot escape",
      "Live Weekly Contest Leaderboard ranking 100,000+ contestants in real time by score and penalty time"
    ],
    nonFunctionalRequirements: [
      "Strict container/microVM isolation (no outbound network, read-only rootfs, cgroups CPU/RAM caps, seccomp syscall filters)",
      "Queue-to-result p95 turnaround < 2.5 seconds even during contest submission spikes (20,000 submissions/min)",
      "Real-time leaderboard queries in O(log N) using Redis Sorted Sets"
    ],
    capacityDefaults: {
      dau: "1.5M DAU (100k concurrent during Saturday contest)",
      readQps: "60,000 problem & leaderboard reads/sec",
      writeQps: "1,500 code execution submissions/sec at peak",
      storagePerYear: "10 TB submission code & test case artifacts",
      bandwidth: "300 MB/s test case & stdout payloads"
    },
    apiEndpoints: [
      {
        method: "POST",
        path: "/api/v1/submissions",
        description: "Enqueue untrusted code submission and return submissionId for SSE/polling",
        payload: "{ problemId, language: 'cpp', sourceCode } -> { submissionId, status: 'QUEUED' }"
      }
    ],
    coreEntities: [
      {
        table: "ContestLeaderboard",
        dbType: "Redis Sorted Set (ZSET)",
        schema: "Key: contest:{id}:leaderboard -> Member: user_id, Score: composite(points, -penalty_seconds)",
        partitionKey: "contest_id"
      }
    ],
    starterNodes: [
      { id: "coder_ui", label: "Web IDE Client", sublabel: "Monaco Editor + SSE", category: "client", x: 40, y: 180 },
      { id: "api_svc", label: "Submission API", sublabel: "Auth & Rate Limit", category: "compute", x: 265, y: 180 },
      { id: "job_queue", label: "Kafka / SQS Job Queue", sublabel: "Buffer Contest Spikes", category: "queue", x: 500, y: 180 },
      { id: "sandbox_fleet", label: "Firecracker / gVisor Workers", sublabel: "Isolated Code Runners", category: "compute", x: 720, y: 180 }
    ],
    starterEdges: [
      { id: "e1", from: "coder_ui", to: "api_svc", protocol: "HTTPS / SSE" },
      { id: "e2", from: "api_svc", to: "job_queue", protocol: "Enqueue Job" },
      { id: "e3", from: "job_queue", to: "sandbox_fleet", protocol: "Pull & Run" }
    ],
    referenceNodes: [
      { id: "coder_ui", label: "Web IDE Client", sublabel: "Monaco + SSE Status", category: "client", x: 35, y: 180 },
      { id: "api_gw", label: "API Gateway", sublabel: "Submission Rate Limit", category: "edge", x: 230, y: 180 },
      { id: "sub_svc", label: "Submission & Contest Svc", sublabel: "State & Scoring", category: "compute", x: 445, y: 100 },
      { id: "job_queue", label: "Language-Sharded Queue", sublabel: "Kafka / RabbitMQ", category: "queue", x: 445, y: 265 },
      { id: "sandbox_fleet", label: "Firecracker MicroVM Fleet", sublabel: "cgroups + seccomp + No Net", category: "compute", x: 700, y: 265 },
      { id: "redis_zset", label: "Redis ZSET Leaderboard", sublabel: "O(log N) Rank Updates", category: "cache", x: 700, y: 80 }
    ],
    referenceEdges: [
      { id: "re1", from: "coder_ui", to: "api_gw", protocol: "HTTPS / SSE" },
      { id: "re2", from: "api_gw", to: "sub_svc", protocol: "gRPC" },
      { id: "re3", from: "sub_svc", to: "job_queue", protocol: "Enqueue" },
      { id: "re4", from: "job_queue", to: "sandbox_fleet", protocol: "Worker Pull" },
      { id: "re5", from: "sandbox_fleet", to: "sub_svc", protocol: "Verdict Callback" },
      { id: "re6", from: "sub_svc", to: "redis_zset", protocol: "ZADD Score" }
    ],
    requiredArchitectureKeywords: [
      "sandbox",
      "firecracker",
      "gvisor",
      "seccomp",
      "cgroups",
      "queue",
      "sorted set",
      "zset",
      "isolation"
    ],
    deepDiveQuestions: [
      {
        level: "L4",
        question: "How do you prevent a user from submitting `while(true) fork();` or reading `/etc/passwd` on your execution server?",
        idealTradeoff:
          "Run every submission inside an ephemeral Firecracker microVM or gVisor sandbox with Linux `cgroups` (strict PID count limit `pids.max=32`, memory limit `256MB`, CPU quota), `seccomp-bpf` syscall whitelist, read-only rootfs, and zero network interfaces.",
        keywords: ["cgroups", "seccomp", "firecracker", "gvisor", "pids", "network"]
      },
      {
        level: "L5",
        question: "How do you rank 100,000 contest participants in real time where ties in points are broken by earliest penalty time?",
        idealTradeoff:
          "Use a Redis Sorted Set (`ZSET`) where the 64-bit float score encodes both `points` in the high bits and `(MAX_TIME - penalty_seconds)` in the lower bits, giving O(log N) `ZADD` updates and O(log N) `ZREVRANK` rank lookups.",
        keywords: ["redis", "sorted set", "zset", "zadd", "composite score"]
      },
      {
        level: "L6",
        question: "How do you avoid cold-start container boot overhead (500ms+) on every single 10ms Python/C++ test run?",
        idealTradeoff:
          "Maintain pre-warmed language-specific microVM pools with mounted read-only compiler toolchains and cached test-case volumes on local NVMe tmpfs, snapshotting and resetting VM memory in <5ms between runs.",
        keywords: ["pre-warm", "snapshot", "tmpfs", "nvme", "cold-start"]
      }
    ]
  },
  {
    id: "spotify_connect",
    title: "Design Spotify Connect & Global Audio Streaming State Sync (Nordic Flagship)",
    companyTags: ["Spotify", "Epidemic Sound", "Tidal", "Apple"],
    difficulty: "Hard",
    category: "Real-Time & Geo",
    estimatedMinutes: 45,
    promptSummary:
      "Design Spotify's global audio streaming delivery and 'Spotify Connect' multi-device state synchronization system supporting 600M+ users, <100ms cross-device playback handoff (Phone -> Laptop -> Smart Speaker), byte-range CDN caching, and offline mode royalty reconciliation.",
    functionalRequirements: [
      "Stream low-latency encrypted Ogg Vorbis / AAC audio tracks (160kbps–320kbps) with instant seek via HTTP byte-range requests",
      "Spotify Connect: Seamlessly transfer active playback position, volume, and shuffle queue across Phone, Desktop, and TV in <100ms",
      "Offline Mode: Download encrypted tracks locally and reconcile offline play counts for artist royalty payouts upon reconnection",
      "Emit real-time 'Friend Activity' and track-completion events into Kafka / GCP PubSub for Discover Weekly ML pipelines"
    ],
    nonFunctionalRequirements: [
      "Time-to-First-Audio-Byte < 150ms globally via multi-CDN edge caching (98%+ cache hit ratio for top 10% catalog)",
      "Conflict-free playback state convergence across connected devices using monotonic sequence numbers / CRDTs",
      "99.99% availability for audio streaming even if social/recommendation microservices degrade"
    ],
    capacityDefaults: {
      dau: "260M DAU (620M MAU globally)",
      readQps: "850,000 track chunk & metadata requests/sec",
      writeQps: "180,000 playback state & royalty telemetry events/sec",
      storagePerYear: "120M tracks (~4 PB raw master audio across multi-bitrate tiers in GCS)",
      bandwidth: "45 Tbps global CDN egress peak"
    },
    apiEndpoints: [
      {
        method: "GET",
        path: "/api/v1/audio/stream/{trackId}?bitrate=320k",
        description: "Returns signed CDN byte-range URL + AES-128 decryption key token for client ring-buffer pre-fetching",
        payload: "Headers: { Range: 'bytes=0-524287' } -> 206 Partial Content"
      },
      {
        method: "WS",
        path: "wss://connect.spotify.com/v1/dealer",
        description: "Bidirectional WebSocket ('Dealer' / Mercury protocol) syncing active device lease, timestamp offset, and queue mutations",
        payload: "{ cmd: 'TRANSFER_PLAYBACK', activeDeviceId: 'living_room_speaker', positionMs: 84320, seqNum: 412 }"
      }
    ],
    coreEntities: [
      {
        table: "user_connect_cluster (Redis Cluster + Bigtable)",
        dbType: "Redis Cluster (Hot State)",
        schema: "user_id, active_device_id, track_uri, playback_pos_ms, started_at_epoch_ms, queue_hash, seq_num",
        partitionKey: "user_id"
      },
      {
        table: "royalty_play_ledger (GCP Pub/Sub -> Scio / BigQuery)",
        dbType: "Append-Only Event Stream",
        schema: "event_uuid (idempotency), user_id, track_id,artist_id, listened_ms (must be >=30000ms), offline_batch_flag",
        partitionKey: "track_id"
      }
    ],
    starterNodes: [
      { id: "mobile_app", label: "iOS / Android Client", sublabel: "Controller + Local Cache", category: "client", x: 35, y: 120 },
      { id: "smart_speaker", label: "Smart Speaker / Desktop", sublabel: "Active Audio Output", category: "client", x: 35, y: 260 },
      { id: "edge_cdn", label: "Multi-CDN Edge", sublabel: "Byte-Range Audio Chunks", category: "edge", x: 280, y: 110 },
      { id: "connect_svc", label: "Spotify Connect Dealer", sublabel: "WebSocket State Sync", category: "compute", x: 280, y: 260 },
      { id: "redis_state", label: "Redis Session State", sublabel: "Active Device Lease", category: "cache", x: 540, y: 260 }
    ],
    starterEdges: [
      { id: "e1", from: "smart_speaker", to: "edge_cdn", protocol: "HTTP 206 Byte-Range" },
      { id: "e2", from: "mobile_app", to: "connect_svc", protocol: "WSS Mercury" },
      { id: "e3", from: "smart_speaker", to: "connect_svc", protocol: "WSS Mercury" },
      { id: "e4", from: "connect_svc", to: "redis_state", protocol: "State Lease" }
    ],
    referenceNodes: [
      { id: "mobile_app", label: "Mobile Controller", sublabel: "WSS + Offline SQLite", category: "client", x: 30, y: 100 },
      { id: "smart_speaker", label: "Smart Speaker Player", sublabel: "Ring-Buffer Pre-Fetch", category: "client", x: 30, y: 260 },
      { id: "edge_cdn", label: "Fastly / Cloud CDN", sublabel: "AES-128 Byte-Range", category: "edge", x: 250, y: 80 },
      { id: "connect_dealer", label: "Connect Dealer Gateway", sublabel: "Stateful WSS Router", category: "compute", x: 250, y: 250 },
      { id: "redis_cluster", label: "Redis Connect Cluster", sublabel: "Single-Active-Device Lock", category: "cache", x: 495, y: 170 },
      { id: "pubsub_kafka", label: "GCP Pub/Sub Stream", sublabel: ">=30s Royalty Telemetry", category: "queue", x: 495, y: 310 },
      { id: "gcs_bigtable", label: "GCS Master + Bigtable", sublabel: "Audio Blobs & User Graph", category: "database", x: 725, y: 170 }
    ],
    referenceEdges: [
      { id: "re1", from: "smart_speaker", to: "edge_cdn", protocol: "HTTP 206 Chunks" },
      { id: "re2", from: "edge_cdn", to: "gcs_bigtable", protocol: "Origin Miss (<2%)" },
      { id: "re3", from: "mobile_app", to: "connect_dealer", protocol: "WSS Command" },
      { id: "re4", from: "smart_speaker", to: "connect_dealer", protocol: "WSS State Ack" },
      { id: "re5", from: "connect_dealer", to: "redis_cluster", protocol: "CAS seq_num" },
      { id: "re6", from: "connect_dealer", to: "pubsub_kafka", protocol: "Stream >=30s Event" }
    ],
    requiredArchitectureKeywords: [
      "cdn",
      "byte-range",
      "websocket",
      "redis",
      "lease",
      "offline",
      "idempotency",
      "royalty"
    ],
    deepDiveQuestions: [
      {
        level: "L4",
        question: "Why should clients fetch audio in 512KB HTTP 206 byte-range chunks rather than downloading the entire 10MB file upfront?",
        idealTradeoff:
          "Byte-range requests enable <150ms instant playback start, instant scrubbing/seeking to any timestamp offset without downloading skipped bytes, and save 60%+ CDN bandwidth when users skip tracks in the first 10 seconds.",
        keywords: ["byte-range", "206", "seek", "bandwidth", "cdn"]
      },
      {
        level: "L5",
        question: "In Spotify Connect, if a user taps 'Play on Laptop' while their Phone is still playing on cellular, how do you prevent both devices from playing simultaneously?",
        idealTradeoff:
          "Enforce a single-active-device lease in Redis Cluster using Compare-And-Swap (`seq_num` + `active_device_id`). When the Laptop claims the lease, the Connect Dealer pushes a `PAUSE_LEASE_REVOKED` frame to the Phone WebSocket and calculates `current_pos = started_at_offset + (now - started_at_epoch)` so the Laptop resumes at the exact millisecond.",
        keywords: ["lease", "compare-and-swap", "seq_num", "redis", "websocket"]
      },
      {
        level: "L6",
        question: "A user listens to 400 downloaded songs offline on a flight. How do you ensure accurate artist royalty payouts (>30s rule) without allowing malicious clients to spoof 1M fake plays?",
        idealTradeoff:
          "Client logs signed, monotonic play-session receipts (`client_event_uuid`, device hardware attestation token, track duration bounds). Upon reconnect, the ingestion pipeline deduplicates by `client_event_uuid` and runs anomaly/velocity heuristics (e.g., total listened duration cannot exceed elapsed wall-clock offline time).",
        keywords: ["offline", "idempotency", "uuid", "attestation", "wall-clock", "royalty"]
      }
    ]
  },
  {
    id: "klarna_vipps_payments",
    title: "Design Klarna / Vipps Real-Time BNPL Risk Engine & GDPR Ledger (Nordic FinTech)",
    companyTags: ["Klarna", "Vipps MobilePay", "Tink", "Stripe", "Wise"],
    difficulty: "Staff+",
    category: "Distributed Systems",
    estimatedMinutes: 45,
    promptSummary:
      "Design a pan-Nordic & European Instant Payment and Buy-Now-Pay-Later (BNPL) decisioning platform that scores credit/fraud risk in <80ms at checkout, integrates PSD2 Open Banking (Tink/BankID), and enforces EU GDPR Right-to-Erasure ('crypto-shredding') on immutable financial event streams.",
    functionalRequirements: [
      "Synchronous Checkout Decisioning: Approve or decline a 4-installment BNPL purchase or instant P2P transfer in <80ms P99",
      "Verify identity via Nordic BankID / MitID and pull real-time PSD2 account signals via Tink Open Banking",
      "Maintain an immutable double-entry multi-currency ledger (SEK, NOK, DKK, EUR) with strict idempotency",
      "EU GDPR Compliance: Support Right-to-Erasure (RTBF) for customer PII without corrupting immutable audit & tax ledgers"
    ],
    nonFunctionalRequirements: [
      "Zero double-debits or orphaned installment schedules under retry storms (Strict Serializability on ledger entries)",
      "P99 Checkout Risk Evaluation < 80ms even when external credit bureaus or PSD2 bank APIs experience 2-second tail latency",
      "Strict EU regional data residency + cryptographic PII erasure ('crypto-shredding')"
    ],
    capacityDefaults: {
      dau: "45M active Nordic & EU shoppers (2.5M merchants)",
      readQps: "75,000 risk feature & limit lookups/sec",
      writeQps: "18,000 checkout transactions & installment ledger writes/sec",
      storagePerYear: "90 TB immutable double-entry ledger + 400 TB Kafka audit log",
      bandwidth: "3.2 GB/s internal gRPC feature & ledger stream"
    },
    apiEndpoints: [
      {
        method: "POST",
        path: "/api/v1/checkout/authorize",
        description: "Evaluates real-time BNPL credit/fraud risk and places an idempotent hold on customer credit line",
        payload: "Headers: { 'Idempotency-Key': 'uuid' }, Body: { shopperId, merchantId, amountMinor: 149900, currency: 'SEK' }"
      },
      {
        method: "DELETE",
        path: "/api/v1/privacy/gdpr-shred/{shopperId}",
        description: "Executes GDPR Right-to-Erasure by destroying the shopper's per-subject KMS encryption key while preserving anonymized tax ledger rows",
        payload: "{ shopperId, legalRetentionCheck: 'PASSED' } -> { shreddedKeyId, status: 'PII_CRYPTO_SHREDDED' }"
      }
    ],
    coreEntities: [
      {
        table: "double_entry_ledger (PostgreSQL / Aurora Partitioned)",
        dbType: "Relational ACID (Partitioned)",
        schema: "entry_id, tx_id, account_id, direction (DEBIT|CREDIT), amount_minor, currency, idempotency_key",
        partitionKey: "account_id"
      },
      {
        table: "pii_kms_keyring (Vault / AWS KMS)",
        dbType: "Key Management Store",
        schema: "shopper_id, data_encryption_key_cipher, created_at, shredded_at",
        partitionKey: "shopper_id"
      }
    ],
    starterNodes: [
      { id: "checkout_ui", label: "Merchant Checkout SDK", sublabel: "BankID + Idempotency", category: "client", x: 35, y: 180 },
      { id: "checkout_gw", label: "Checkout Orchestrator", sublabel: "<80ms SLA Budget", category: "compute", x: 260, y: 180 },
      { id: "risk_engine", label: "Real-Time Risk Scorer", sublabel: "Flink + Redis Feature Store", category: "search_ai", x: 500, y: 100 },
      { id: "ledger_db", label: "Double-Entry Ledger", sublabel: "PostgreSQL ACID", category: "database", x: 500, y: 265 }
    ],
    starterEdges: [
      { id: "e1", from: "checkout_ui", to: "checkout_gw", protocol: "HTTPS" },
      { id: "e2", from: "checkout_gw", to: "risk_engine", protocol: "gRPC (<25ms)" },
      { id: "e3", from: "checkout_gw", to: "ledger_db", protocol: "ACID Commit" }
    ],
    referenceNodes: [
      { id: "checkout_ui", label: "Checkout Widget", sublabel: "BankID / MitID Token", category: "client", x: 30, y: 180 },
      { id: "api_gw", label: "EU-North API Gateway", sublabel: "Idempotency & mTLS", category: "edge", x: 225, y: 180 },
      { id: "checkout_svc", label: "Checkout Saga Svc", sublabel: "Circuit Breaker + Timeout", category: "compute", x: 430, y: 180 },
      { id: "redis_features", label: "Redis Feature Store", sublabel: "Pre-Computed Velocity (<5ms)", category: "cache", x: 675, y: 65 },
      { id: "ledger_pg", label: "Partitioned Ledger DB", sublabel: "Double-Entry SEK/EUR/NOK", category: "database", x: 675, y: 180 },
      { id: "kafka_kms", label: "Kafka + Per-User KMS", sublabel: "GDPR Crypto-Shredding", category: "queue", x: 675, y: 305 }
    ],
    referenceEdges: [
      { id: "re1", from: "checkout_ui", to: "api_gw", protocol: "HTTPS" },
      { id: "re2", from: "api_gw", to: "checkout_svc", protocol: "gRPC" },
      { id: "re3", from: "checkout_svc", to: "redis_features", protocol: "Fetch Risk Features" },
      { id: "re4", from: "checkout_svc", to: "ledger_pg", protocol: "Serial Ledger Tx" },
      { id: "re5", from: "checkout_svc", to: "kafka_kms", protocol: "Encrypted Audit Event" }
    ],
    requiredArchitectureKeywords: [
      "idempotency",
      "ledger",
      "double-entry",
      "gdpr",
      "crypto-shredding",
      "circuit breaker",
      "redis",
      "flink"
    ],
    deepDiveQuestions: [
      {
        level: "L4",
        question: "Why must financial ledgers store amounts as integer minor units (e.g., `14990` öre/cents) with an explicit `DEBIT`/`CREDIT` pair instead of updating a single `balance` float column?",
        idealTradeoff:
          "IEEE 754 floats introduce rounding errors (`0.1 + 0.2 != 0.3`), and in-place `UPDATE balance` destroys auditability. Double-entry integer rows ensure `SUM(credits) - SUM(debits) == 0` across the entire system.",
        keywords: ["integer", "double-entry", "audit", "float", "minor"]
      },
      {
        level: "L5",
        question: "External credit bureau and PSD2 Open Banking APIs often take 800ms–2000ms. How do you hit a strict <80ms checkout decision SLA?",
        idealTradeoff:
          "Decouple slow external fetches from the hot checkout path! Pre-compute rolling user repayment velocity and cached BankID/Tink credit tiers in Redis (<5ms read). Use a strict 45ms circuit-breaker timeout on live bureau calls with fallback to cached risk limits for returning users.",
        keywords: ["circuit breaker", "redis", "pre-compute", "timeout", "fallback"]
      },
      {
        level: "L6",
        question: "Under EU GDPR Article 17 (Right to Erasure), a user demands deletion of their personal data, but Swedish/EU financial law requires retaining immutable tax ledgers for 7 years. How do you reconcile immutable Kafka/ledger logs with GDPR erasure?",
        idealTradeoff:
          "Implement Crypto-Shredding + PII Tokenization: never write raw name/SSN/email into Kafka or the financial ledger—store only an opaque `shopper_uuid` and encrypt any PII payload with a per-user Data Encryption Key (DEK) stored in KMS/Vault. When a GDPR erasure request arrives after legal hold, delete the user's DEK in O(1), rendering historical Kafka PII permanently undecryptable without mutating the log.",
        keywords: ["crypto-shredding", "kms", "dek", "gdpr", "immutable", "tokenization"]
      }
    ]
  }
];
