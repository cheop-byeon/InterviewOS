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
      { id: "postgres", label: "Primary Relational DB", sublabel: "PostgreSQL (ACID)", category: "database", x: 760, y: 180 }
    ],
    starterEdges: [
      { id: "e1", from: "client", to: "gateway", protocol: "HTTPS / WSS" },
      { id: "e2", from: "gateway", to: "booking_svc", protocol: "gRPC" },
      { id: "e3", from: "booking_svc", to: "postgres", protocol: "SQL" }
    ],
    referenceNodes: [
      { id: "client", label: "Web / Mobile Client", sublabel: "SSE Seat Updates", category: "client", x: 40, y: 180 },
      { id: "cdn", label: "CDN & Waiting Room", sublabel: "Cloudflare / Virtual Queue", category: "edge", x: 220, y: 80 },
      { id: "gateway", label: "API Gateway", sublabel: "Token Validation & Rate Limit", category: "edge", x: 220, y: 260 },
      { id: "event_svc", label: "Event & Seat Map Svc", sublabel: "Read-Heavy Microservice", category: "compute", x: 450, y: 90 },
      { id: "booking_svc", label: "Booking & Hold Svc", sublabel: "Atomic Seat Reservation", category: "compute", x: 450, y: 260 },
      { id: "redis_lock", label: "Redis Cluster", sublabel: "SET NX EX 600 Seat Hold", category: "cache", x: 710, y: 110 },
      { id: "postgres", label: "PostgreSQL Shards", sublabel: "Optimistic Locking / ACID", category: "database", x: 710, y: 250 },
      { id: "kafka", label: "Kafka Event Bus", sublabel: "Payment & Expiration Events", category: "queue", x: 710, y: 370 }
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
          "Use a two-phase reservation with a Distributed Lock in Redis (`SET seat:{eventId}:{seatId} {userId} NX EX 600`) backed by PostgreSQL optimistic concurrency control (`UPDATE seats SET status='BOOKED', version=version+1 WHERE seat_id=$1 AND version=$2`). If the user abandons checkout, the 600s Redis TTL automatically expires and releases the seat without requiring cron sweeps.",
        keywords: ["redis", "nx", "ttl", "optimistic locking", "version", "acid", "timeout"]
      },
      {
        level: "L5",
        question: "When Taylor Swift tickets drop, 5 million fans hit the page at 10:00:00 AM. How do you protect your database and Redis cluster from thundering herd collapse while maintaining fairness?",
        idealTradeoff:
          "Introduce a Virtual Waiting Room (Queue-It pattern) at the Edge/Gateway layer. Users entering the lobby are assigned an encrypted queue position in a Redis Sorted Set (`ZADD`) and polled via SSE/WebSocket. Only N thousand active tokens per minute are admitted to the actual seat map & booking service, smoothing a 5M spike into a predictable, bounded QPS.",
        keywords: ["virtual waiting room", "sorted set", "edge", "rate limit", "token", "sse", "thundering herd"]
      },
      {
        level: "L6",
        question: "What happens if the Redis node holding active 10-minute seat locks crashes before replicating to its replica? How do you guarantee zero double-booking even under Redis failover?",
        idealTradeoff:
          "Treat Redis strictly as a fast concurrency gate + TTL cache, while PostgreSQL remains the source of truth with a unique constraint on `(event_id, seat_id)` and `held_until` timestamp. On Redis failover, reconstruct holds from DB or require fencing tokens (monotonically increasing lock epoch IDs) verified by PostgreSQL during final payment commit.",
        keywords: ["fencing token", "failover", "source of truth", "held_until", "idempotency", "split brain"]
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
      "High availability over strict consistency for location pings; strong consistency for ride state transitions (no driver matched to two rides at once)",
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
      },
      {
        method: "POST",
        path: "/api/v1/rides/{rideId}/accept",
        description: "Driver accepts a dispatched ride offer within the 15-second lock window",
        payload: "{ driverId, offerToken } -> { status: 'MATCHED', routePolyline }"
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
        schema: "trip_id PK, rider_id, driver_id, city_id, status (REQUESTED|MATCHED|IN_PROGRESS|COMPLETED), fare",
        partitionKey: "city_id"
      }
    ],
    starterNodes: [
      { id: "driver_app", label: "Driver & Rider Apps", sublabel: "GPS Pings & Ride Req", category: "client", x: 50, y: 180 },
      { id: "ws_gateway", label: "WebSocket Gateway", sublabel: "Persistent Connections", category: "edge", x: 270, y: 180 },
      { id: "match_svc", label: "Dispatch & Match Svc", sublabel: "Ride Matching Logic", category: "compute", x: 510, y: 180 },
      { id: "redis_geo", label: "Redis Geo Index", sublabel: "Geohash / H3 Cells", category: "cache", x: 760, y: 180 }
    ],
    starterEdges: [
      { id: "e1", from: "driver_app", to: "ws_gateway", protocol: "WSS / QUIC" },
      { id: "e2", from: "ws_gateway", to: "match_svc", protocol: "gRPC" },
      { id: "e3", from: "match_svc", to: "redis_geo", protocol: "GEORADIUS / H3" }
    ],
    referenceNodes: [
      { id: "driver_app", label: "Driver & Rider Apps", sublabel: "4s GPS Telemetry", category: "client", x: 40, y: 180 },
      { id: "ws_gateway", label: "WebSocket / QUIC Edge", sublabel: "Connection Manager", category: "edge", x: 240, y: 180 },
      { id: "loc_svc", label: "Location Ingestion Svc", sublabel: "High-Write Streamer", category: "compute", x: 460, y: 90 },
      { id: "match_svc", label: "Dispatch & Matching Svc", sublabel: "ETA & Offer Lock Engine", category: "compute", x: 460, y: 260 },
      { id: "redis_geo", label: "Redis H3 Spatial Cluster", sublabel: "In-Memory Hexagonal Index", category: "cache", x: 720, y: 90 },
      { id: "kafka", label: "Kafka Telemetry Stream", sublabel: "ETA ML & Fraud Analytics", category: "queue", x: 720, y: 220 },
      { id: "trip_db", label: "Sharded Trip DB", sublabel: "PostgreSQL / Schemaless", category: "database", x: 720, y: 340 }
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
          "B-Tree indexes on `(lat, lng)` degrade on 2D range queries and incur massive write amplification from 500k disk updates/sec. Instead, store ephemeral driver coordinates in memory (Redis Cluster) partitioned by Geohash or Uber H3 hexagonal cells, turning a 2D spatial lookup into O(1) hash lookups across the target cell and its 6 neighboring k-ring cells.",
        keywords: ["geohash", "h3", "redis", "in-memory", "write amplification", "2d", "neighbors"]
      },
      {
        level: "L5",
        question: "How do you handle a hot spot like Madison Square Garden or LAX airport where 10,000 riders and 2,000 drivers are concentrated inside a single Geohash/H3 cell?",
        idealTradeoff:
          "Use adaptive spatial resolution (Quadtree dynamic splitting or fine-grained H3 resolution levels 8–10) combined with consistent hashing with read replicas per hot cell, or batch-matching windows (every 2 seconds solve a bipartite graph matching optimization with Hungarian algorithm rather than greedy FCFS).",
        keywords: ["quadtree", "resolution", "hot spot", "batch matching", "bipartite", "replica"]
      },
      {
        level: "L6",
        question: "Why is Euclidean distance (straight-line radius) insufficient for dispatch, and how do you architect real-time road-network ETA calculation at scale?",
        idealTradeoff:
          "A driver 200m away across a river or on the wrong side of a highway exit may have a 15-minute ETA. Filter candidates first via H3 k-ring (top 25 drivers), then query a partitioned Contraction Hierarchies / road-graph routing service weighted by live traffic edge speeds computed from the Kafka driver telemetry stream.",
        keywords: ["road network", "eta", "graph", "dijkstra", "contraction hierarchies", "filter", "traffic"]
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
      },
      {
        method: "POST",
        path: "/api/v1/presence/subscribe",
        description: "Subscribe to online/last-seen updates for active chat viewport contacts",
        payload: "{ targetUserIds: ['u_101', 'u_102'] }"
      }
    ],
    coreEntities: [
      {
        table: "SessionRoutingRegistry",
        dbType: "Redis Cluster",
        schema: "Key: user_session:{userId} -> { chatGatewayHost: 'gw-us-east-42', connId, lastHeartbeat }",
        partitionKey: "userId"
      },
      {
        table: "OfflineInboxMessages",
        dbType: "Apache Cassandra / DynamoDB",
        schema: "recipient_id PK, message_id SK (TimeUUID), sender_id, group_id, ciphertext, status",
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
      { id: "clients", label: "Mobile / Web Clients", sublabel: "E2EE Signal Keys", category: "client", x: 40, y: 180 },
      { id: "chat_gw", label: "Stateful Chat Gateways", sublabel: "100k WebSockets / Node", category: "edge", x: 250, y: 180 },
      { id: "msg_router", label: "Message Routing & Group Fanout", sublabel: "Stateless Workers", category: "compute", x: 480, y: 100 },
      { id: "presence_svc", label: "Presence & Heartbeat Svc", sublabel: "Pub/Sub Status", category: "compute", x: 480, y: 260 },
      { id: "session_redis", label: "Redis Session & Presence", sublabel: "Gateway Routing Table", category: "cache", x: 730, y: 80 },
      { id: "msg_db", label: "Cassandra Inbox Store", sublabel: "Wide-Column TimeUUID", category: "database", x: 730, y: 210 },
      { id: "push_notify", label: "APNs / FCM Push Queue", sublabel: "Offline Wakeup", category: "queue", x: 730, y: 340 }
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
        question: "When User A sends a message to User B, how does the backend know which specific WebSocket server out of 2,000 gateway servers holds User B's active TCP connection?",
        idealTradeoff:
          "Maintain a Session Routing Registry in Redis (`user_session:{userB} -> gateway_node_id`). When User A's gateway receives the message, the routing worker looks up User B's gateway host in Redis and forwards the message via internal gRPC directly to that gateway node. If no active session exists, it writes to the Cassandra offline inbox and triggers APNs/FCM push.",
        keywords: ["session", "redis", "gateway", "routing", "offline", "push"]
      },
      {
        level: "L5",
        question: "Why does broadcasting 'User X is now online' to all 500 of User X's address book contacts cause a massive fanout storm, and how do you avoid it?",
        idealTradeoff:
          "Use Pull/Explicit Subscription on active viewport rather than blind address-book push fanout. A client only subscribes to presence updates for the 1 person (or active chat screen) they are currently viewing, combined with a 30-second heartbeat TTL in Redis.",
        keywords: ["presence", "fanout", "subscription", "heartbeat", "ttl", "viewport"]
      },
      {
        level: "L6",
        question: "How do you guarantee reliable message ordering and zero lost messages if a user switches from Wi-Fi to 5G mid-flight while a group message fanout is occurring?",
        idealTradeoff:
          "Persist every incoming message to the recipient's Cassandra inbox table (keyed by `recipient_id` + monotonic `TimeUUID` / Snowflake ID) *before* attempting WebSocket push, and only delete/mark delivered upon receiving an explicit application-layer `CLIENT_ACK` packet from the recipient device.",
        keywords: ["ack", "inbox", "timeuuid", "snowflake", "idempotency", "ordering", "at-least-once"]
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
      },
      {
        method: "POST",
        path: "/api/v1/ingest/webhook",
        description: "Ingest updated document content or ACL permission delta from connectors",
        payload: "{ source: 'gdrive', docId, aclPrincipals: ['group:eng'], contentHash }"
      }
    ],
    coreEntities: [
      {
        table: "DocumentChunksIndex",
        dbType: "Qdrant / Milvus / Elasticsearch Hybrid",
        schema: "chunk_id PK, tenant_id, doc_id, embedding vector[1024], bm25_tokens, acl_groups[], updated_at",
        partitionKey: "tenant_id"
      },
      {
        table: "UserPrincipalGraph",
        dbType: "Redis + Zanzibar / SpiceDB ACL Cache",
        schema: "Key: acl:{tenantId}:{userId} -> Set of allowed group_ids & role_tokens",
        partitionKey: "tenant_id:user_id"
      }
    ],
    starterNodes: [
      { id: "user_ui", label: "Enterprise Chat UI", sublabel: "SSE Streaming Client", category: "client", x: 40, y: 180 },
      { id: "rag_orch", label: "RAG Orchestrator", sublabel: "Query Rewrite & Prompting", category: "compute", x: 260, y: 180 },
      { id: "vector_db", label: "Vector & Lexical Index", sublabel: "HNSW + BM25 Hybrid", category: "search_ai", x: 520, y: 110 },
      { id: "llm_gw", label: "LLM Inference Gateway", sublabel: "vLLM / Enterprise Model", category: "search_ai", x: 520, y: 260 }
    ],
    starterEdges: [
      { id: "e1", from: "user_ui", to: "rag_orch", protocol: "SSE / HTTPS" },
      { id: "e2", from: "rag_orch", to: "vector_db", protocol: "Hybrid Search" },
      { id: "e3", from: "rag_orch", to: "llm_gw", protocol: "Stream Prompt" }
    ],
    referenceNodes: [
      { id: "user_ui", label: "Enterprise Chat Client", sublabel: "Citations & Feedback", category: "client", x: 35, y: 180 },
      { id: "rag_orch", label: "RAG Query Orchestrator", sublabel: "ACL Pre-Filter & RRF", category: "compute", x: 245, y: 110 },
      { id: "ingest_pipe", label: "Ingestion & Chunking Worker", sublabel: "Kafka + Semantic Chunker", category: "queue", x: 245, y: 290 },
      { id: "acl_cache", label: "Zanzibar / Redis ACL Graph", sublabel: "User Group Membership", category: "cache", x: 485, y: 60 },
      { id: "vector_db", label: "Hybrid Vector + BM25 DB", sublabel: "Tenant-Sharded HNSW", category: "search_ai", x: 485, y: 185 },
      { id: "reranker", label: "Cross-Encoder Reranker", sublabel: "Top 100 -> Top 8 Chunks", category: "search_ai", x: 725, y: 100 },
      { id: "llm_gw", label: "LLM Serving & Guardrails", sublabel: "Citation Grounding Check", category: "search_ai", x: 725, y: 260 }
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
          "Dense embeddings struggle with exact part numbers, error codes (`ERR_4092`), project acronyms, and proper nouns. Use Hybrid Retrieval: execute lexical BM25 search and dense HNSW vector search in parallel, fuse the top 100 candidates via Reciprocal Rank Fusion (RRF), and pass them to a Cross-Encoder Reranker to select the final top 8 chunks.",
        keywords: ["bm25", "hybrid", "rrf", "reciprocal rank fusion", "reranker", "cross-encoder", "exact match"]
      },
      {
        level: "L5",
        question: "How do you enforce document-level ACL permissions without re-embedding all chunks of a 200-page document whenever a user is added to an engineering Google Group?",
        idealTradeoff:
          "Decouple Group-to-Document ACLs from User-to-Group membership! Store `allowed_group_ids` as filterable metadata on document chunks, and store User -> Group mappings in a fast Redis/Zanzibar cache. At query time, look up the user's groups (`['eng-all', 'team-payments']`) and pass them as a pre-filter bitmap into the HNSW vector index search.",
        keywords: ["acl", "group", "pre-filter", "metadata", "decouple", "zanzibar", "redis"]
      },
      {
        level: "L6",
        question: "5 Billion 1024-dim float32 vectors require ~20 TB of RAM for HNSW indexes. How do you reduce memory costs by 8x–16x without destroying recall?",
        idealTradeoff:
          "Apply Scalar Quantization (SQ8 / int8) or Binary/Product Quantization (PQ) with Matryoshka Representation Learning (MRL) in memory for fast candidate recall (fetching top 200), then rescore those 200 candidates using full-precision fp16 vectors stored on NVMe SSD (DiskANN pattern).",
        keywords: ["quantization", "int8", "pq", "diskann", "matryoshka", "rescore", "nvme"]
      }
    ]
  }
];
