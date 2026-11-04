"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileCode2,
  GitPullRequest,
  Lightbulb,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Wrench
} from "lucide-react";
import { TargetLevel } from "../lib/types";

interface PrCodeLine {
  lineNumber: number;
  code: string;
  isBug?: boolean;
  bugSeverity?: "CRITICAL" | "HIGH" | "MEDIUM";
  bugCategory?: string;
  staffExplanation?: string;
  fixedLineSuggestion?: string;
}

interface PrReviewScenario {
  id: string;
  company: string;
  title: string;
  language: string;
  prAuthor: string;
  prDescription: string;
  liveMutationPrompt: string;
  idealMutationDesign: string;
  mutationKeywords: string[];
  lines: PrCodeLine[];
}

const PR_SCENARIOS: PrReviewScenario[] = [
  {
    id: "pr_finn_fiks_ferdig",
    company: "FINN.no / Vend (Oslo / Stockholm)",
    title: "PR #418: 'Fiks Ferdig' Recommerce Escrow & Vespa Search Indexing",
    language: "Kotlin / Spring / PostgreSQL",
    prAuthor: "junior-dev@finn.no",
    prDescription:
      "Implements buyer reservation for second-hand Torget items, captures Vipps escrow hold, and updates the Vespa search index to mark the ad as RESERVED.",
    liveMutationPrompt:
      "Live Requirement Mutation (Minute 35): Sellers on FINN.no and Blocket now want to allow up to 3 concurrent price-negotiation offers ('Smarte Bud') before locking the item, where accepting one offer automatically expires the other two and releases their Vipps holds. How do you refactor this without race conditions?",
    idealMutationDesign:
      "Separate `listing_offers` (many-to-one with `status = PENDING`) from the atomic lock on `marketplace_listings`. When the seller accepts `offer_id`, execute a single PostgreSQL transaction: `UPDATE marketplace_listings SET status='RESERVED', accepted_offer_id=$1, version=version+1 WHERE ad_id=$2 AND status='ACTIVE'`, mark other pending offers as `SUPERSEDED`, and emit a single `OfferAccepted` event to the Transactional Outbox so a Kafka worker asynchronously voids the losing Vipps authorizations.",
    mutationKeywords: ["outbox", "version", "optimistic", "transaction", "async", "kafka", "void"],
    lines: [
      {
        lineNumber: 1,
        code: "@PostMapping(\"/api/v1/fiks-ferdig/reserve/{adId}\")"
      },
      {
        lineNumber: 2,
        code: "fun reserveItem(@PathVariable adId: String, @RequestBody req: ReserveReq): ResponseEntity<Any> {"
      },
      {
        lineNumber: 3,
        code: "    val ad = jdbc.queryForObject(\"SELECT * FROM listings WHERE ad_id = '$adId'\", ListingMapper())",
        isBug: true,
        bugSeverity: "CRITICAL",
        bugCategory: "SQL Injection + Non-Locked Read (Check-Then-Act Race Condition)",
        staffExplanation:
          "1) String interpolation `'$adId'` enables SQL Injection (use parameterized `?`). 2) Reading `ad.status` with a plain `SELECT` before updating later creates a classic Check-Then-Act race condition where 3 concurrent buyers all see `status == ACTIVE`.",
        fixedLineSuggestion:
          "Use parameterized `UPDATE listings SET status='RESERVED', version=version+1 WHERE ad_id=? AND status='ACTIVE'`."
      },
      {
        lineNumber: 4,
        code: "    if (ad.status != \"ACTIVE\") return ResponseEntity.status(409).body(\"Already reserved\")"
      },
      {
        lineNumber: 5,
        code: "    val totalNok: Double = ad.priceNok * 1.035 + req.shippingFeeNok",
        isBug: true,
        bugSeverity: "CRITICAL",
        bugCategory: "Floating-Point Currency Math (IEEE 754 Precision Bug)",
        staffExplanation:
          "Never use `Double` or `Float` for NOK/SEK/EUR money calculations (`0.1 + 0.2 != 0.3`). Buyer escrow fees and Posten shipping must be computed in 64-bit integer minor units (`Long` øre) or `BigDecimal` with explicit `HALF_EVEN` rounding.",
        fixedLineSuggestion:
          "val totalOre: Long = (ad.priceOre * 1035L) / 1000L + req.shippingFeeOre"
      },
      {
        lineNumber: 6,
        code: "    val vippsTx = vippsClient.authorizeEscrowHold(req.buyerId, totalNok)",
        isBug: true,
        bugSeverity: "HIGH",
        bugCategory: "Missing Client Idempotency-Key on External Payment Call",
        staffExplanation:
          "Calling `vippsClient.authorizeEscrowHold` without passing a deterministic `Idempotency-Key` (e.g., `reserve:$adId:${req.buyerId}`) means a client network retry or timeout will double-charge the buyer's Vipps account.",
        fixedLineSuggestion:
          "val vippsTx = vippsClient.authorizeEscrowHold(req.buyerId, totalOre, idempotencyKey = req.idempotencyKey)"
      },
      {
        lineNumber: 7,
        code: "    jdbc.update(\"UPDATE listings SET status = 'RESERVED' WHERE ad_id = ?\", adId)",
        isBug: true,
        bugSeverity: "CRITICAL",
        bugCategory: "Unconditional Overwrite Without Optimistic Version Check",
        staffExplanation:
          "Even if two threads passed line 4 simultaneously, this `UPDATE` lacks `AND status = 'ACTIVE' AND version = ?`. Both threads will overwrite the row and both buyers will be charged via Vipps!",
        fixedLineSuggestion:
          "val rows = jdbc.update(\"UPDATE listings SET status='RESERVED', version=version+1 WHERE ad_id=? AND status='ACTIVE'\", adId)"
      },
      {
        lineNumber: 8,
        code: "    vespaHttpClient.putDocument(adId, mapOf(\"status\" to \"RESERVED\"))",
        isBug: true,
        bugSeverity: "HIGH",
        bugCategory: "Synchronous Dual-Write to PostgreSQL & Vespa Search",
        staffExplanation:
          "Synchronous dual-writing to Postgres and Vespa inside the HTTP thread causes permanent state drift if Vespa times out after Postgres commits. Instead, insert an `AdReserved` event into a PostgreSQL `outbox_events` table in the same transaction and stream to Vespa via Kafka.",
        fixedLineSuggestion:
          "outboxRepo.insertEvent(txId, topic = \"finn.torget.ad-events\", payload = AdReservedEvent(adId))"
      },
      {
        lineNumber: 9,
        code: "    return ResponseEntity.ok( mapOf(\"reserved\" to true, \"vippsTx\" to vippsTx.id) )"
      },
      {
        lineNumber: 10,
        code: "}"
      }
    ]
  },
  {
    id: "pr_revolut_fx_transfer",
    company: "Revolut / Klarna (London / Stockholm)",
    title: "PR #892: Multi-Currency FX Wallet Transfer & Quote Execution",
    language: "Java 21 / jOOQ / Redis",
    prAuthor: "core-payments-candidate@revolut.com",
    prDescription:
      "Executes a real-time SEK -> EUR conversion using a 30-second Redis FX quote and moves funds between the sender and recipient wallet accounts.",
    liveMutationPrompt:
      "Live Requirement Mutation (Minute 35): Regulatory compliance in Sweden & the EU now requires flagging any transfer where a user's rolling 24-hour cross-border volume exceeds €10,000, placing the funds in an internal `AML_HOLD_SUSPENSE` ledger account without blocking <100ms P99 database locks. How do you extend this?",
    idealMutationDesign:
      "Pre-compute rolling 24h user transfer volume in Redis (`INCRBYFLOAT` / integer minor units with sliding window) or Flink. If `rolling24hMinor + amountMinor > 10_000_00`, the transfer still executes atomically in <50ms using Double-Entry Ledger rows, but the `CREDIT` leg writes to `revolut_aml_suspense_account` instead of the recipient's spendable balance, and emits a Kafka `AmlReviewRequired` event.",
    mutationKeywords: ["suspense", "double-entry", "redis", "kafka", "rolling", "atomic", "credit"],
    lines: [
      {
        lineNumber: 1,
        code: "public TransferResult executeFxTransfer(UUID fromAcc, UUID toAcc, String quoteId, double amountSek) {",
        isBug: true,
        bugSeverity: "CRITICAL",
        bugCategory: "IEEE-754 `double` Used for Monetary Amount",
        staffExplanation:
          "In Revolut and Klarna interviews, using `double` or `float` for money is an instant rejection. Always use `long amountMinor` (øre/cents) or `BigDecimal`.",
        fixedLineSuggestion:
          "public TransferResult executeFxTransfer(UUID fromAcc, UUID toAcc, String quoteId, long amountMinor, String idempotencyKey)"
      },
      {
        lineNumber: 2,
        code: "    FxQuote quote = redis.get(\"fx_quote:\" + quoteId);"
      },
      {
        lineNumber: 3,
        code: "    if (quote == null || quote.isExpired()) throw new QuoteExpiredException();"
      },
      {
        lineNumber: 4,
        code: "    redis.del(\"fx_quote:\" + quoteId);",
        isBug: true,
        bugSeverity: "HIGH",
        bugCategory: "Non-Atomic Redis GET + DEL (Quote Replay Race Condition)",
        staffExplanation:
          "Two concurrent requests with the same `quoteId` can both pass `redis.get()` at line 2 before either runs `redis.del()` at line 4, executing a single FX quote twice! Use atomic `GETDEL` or a Redis Lua script.",
        fixedLineSuggestion:
          "FxQuote quote = redis.getDel(\"fx_quote:\" + quoteId); // Atomic single-flight consumption"
      },
      {
        lineNumber: 5,
        code: "    dsl.transaction(cfg -> {"
      },
      {
        lineNumber: 6,
        code: "        var sender = dsl.selectFrom(ACCOUNTS).where(ACCOUNTS.ID.eq(fromAcc)).forUpdate().fetchOne();",
        isBug: true,
        bugSeverity: "CRITICAL",
        bugCategory: "AB-BA Database Deadlock (Unsorted `SELECT ... FOR UPDATE`)",
        staffExplanation:
          "Locking `fromAcc` first and `toAcc` second causes an immediate PostgreSQL deadlock if User A transfers to User B at the exact millisecond User B transfers to User A. Always sort `firstLock = min(fromAcc, toAcc)` and `secondLock = max(fromAcc, toAcc)`!",
        fixedLineSuggestion:
          "List<UUID> sortedIds = Stream.of(fromAcc, toAcc).sorted().toList(); // Lock in canonical order"
      },
      {
        lineNumber: 7,
        code: "        var receiver = dsl.selectFrom(ACCOUNTS).where(ACCOUNTS.ID.eq(toAcc)).forUpdate().fetchOne();"
      },
      {
        lineNumber: 8,
        code: "        dsl.update(ACCOUNTS).set(ACCOUNTS.BALANCE, sender.getBalance() - amountSek).where(ACCOUNTS.ID.eq(fromAcc)).execute();",
        isBug: true,
        bugSeverity: "CRITICAL",
        bugCategory: "Missing Balance >= 0 Check & Missing Immutable Double-Entry Journal Rows",
        staffExplanation:
          "1) Never allow `sender.getBalance() - amount` without verifying sufficient funds (`balance_minor >= amount_minor`). 2) Revolut requires an append-only **Double-Entry Ledger** (`INSERT INTO ledger_entries` with balanced `DEBIT` and `CREDIT` rows), never un-audited in-place overwrites.",
        fixedLineSuggestion:
          "Insert immutable DEBIT & CREDIT rows into `ledger_entries` + enforce `CHECK (balance_minor >= 0)`."
      },
      {
        lineNumber: 9,
        code: "        sepaHttpGateway.sendCrossBorderWire(toAcc, amountSek * quote.rate());",
        isBug: true,
        bugSeverity: "HIGH",
        bugCategory: "External Blocking HTTP Call Inside an Open DB Transaction",
        staffExplanation:
          "Calling an external banking HTTP gateway (`sepaHttpGateway`) while holding `FOR UPDATE` row locks in PostgreSQL will exhaust the DB connection pool whenever SEPA takes 2+ seconds. Commit to an internal Suspense account + Transactional Outbox first!",
        fixedLineSuggestion:
          "Write `TransferInitiated` to `outbox_events` inside the DB transaction; execute external SEPA call asynchronously via Saga worker."
      },
      {
        lineNumber: 10,
        code: "    });"
      }
    ]
  },
  {
    id: "pr_vg_wolt_edge",
    company: "VG.no (Schibsted) & Wolt (Helsinki)",
    title: "PR #204: Breaking-News Live Feed & Dynamic Delivery Surge Handler",
    language: "TypeScript / Node.js / Redis",
    prAuthor: "platform-squad@schibsted.com",
    prDescription:
      "Serves VG.no live breaking-news front page with personalized courier/subscriber widgets and refreshes Redis cache on expiry.",
    liveMutationPrompt:
      "Live Requirement Mutation (Minute 35): During a major election night or Helsinki snowstorm, the personalization microservice begins timing out at 3,000ms. How do you ensure the front page or checkout fee still renders in <40ms without cascading failure?",
    idealMutationDesign:
      "Wrap the non-critical personalization/surge dependency in a strict **40ms Timeout + Circuit Breaker** with a **Graceful Static/Cached Fallback** (e.g., serve the Varnish-cached national front page or default H3 base delivery tier when the circuit is OPEN) so core availability remains 99.99%.",
    mutationKeywords: ["circuit breaker", "timeout", "fallback", "graceful", "degradation", "varnish", "stale"],
    lines: [
      {
        lineNumber: 1,
        code: "export async function getBreakingFrontPage(req: Request) {"
      },
      {
        lineNumber: 2,
        code: "  const cached = await redis.get('vg:frontpage:html');"
      },
      {
        lineNumber: 3,
        code: "  if (cached) return JSON.parse(cached);"
      },
      {
        lineNumber: 4,
        code: "  // Cache expired! Fetch fresh articles from CMS Postgres (takes ~180ms)",
        isBug: true,
        bugSeverity: "CRITICAL",
        bugCategory: "Cache Stampede / Thundering Herd on TTL Expiry (300k QPS)",
        staffExplanation:
          "When `vg:frontpage:html` expires during a 300,000 QPS breaking-news spike, 50,000 concurrent requests all see `cached == null` during the 180ms CMS query and hit PostgreSQL simultaneously! Use Varnish `stale-while-revalidate` or single-flight request coalescing (mutex lock).",
        fixedLineSuggestion:
          "Use Single-Flight Request Coalescing / Varnish `beresp.grace` so only 1 background worker refreshes the cache while others read stale."
      },
      {
        lineNumber: 5,
        code: "  const articles = await cmsDb.query('SELECT * FROM articles ORDER BY published_at DESC LIMIT 50');"
      },
      {
        lineNumber: 6,
        code: "  for (const art of articles) { art.author = await cmsDb.query(`SELECT * FROM authors WHERE id=${art.authorId}`); }",
        isBug: true,
        bugSeverity: "HIGH",
        bugCategory: "Classic N+1 Database Query Inside Loop",
        staffExplanation:
          "Executing `await cmsDb.query(...)` inside a `for` loop over 50 articles triggers 50 sequential database round-trips on every cache miss. Batch with `WHERE id = ANY($1)` or a single `JOIN`.",
        fixedLineSuggestion:
          "const authors = await cmsDb.query('SELECT * FROM authors WHERE id = ANY($1)', [ articles.map(a => a.authorId) ]);"
      },
      {
        lineNumber: 7,
        code: "  const personalizedAds = await fetch('http://ad-engine.internal/rank?user=' + req.userId);",
        isBug: true,
        bugSeverity: "HIGH",
        bugCategory: "Unbounded Downstream `fetch` Without Timeout or Circuit Breaker",
        staffExplanation:
          "Node's `fetch` without an `AbortSignal.timeout(80)` will hang the entire front-page request if the downstream ad/personalization service degrades. Always enforce a hard timeout and graceful fallback.",
        fixedLineSuggestion:
          "const personalizedAds = await fetch(url, { signal: AbortSignal.timeout(60) }).catch(() => DEFAULT_FALLBACK_ADS);"
      },
      {
        lineNumber: 8,
        code: "  await redis.set('vg:frontpage:html', JSON.stringify({ articles, personalizedAds }));",
        isBug: true,
        bugSeverity: "CRITICAL",
        bugCategory: "Cross-User PII / Personalization Cache Poisoning + Missing TTL",
        staffExplanation:
          "1) Storing user-specific `personalizedAds` inside the global `'vg:frontpage:html'` cache key leaks User A's personalized data to all subsequent readers! 2) `redis.set` without `EX <ttl>` caches it forever.",
        fixedLineSuggestion:
          "Cache only anonymous public HTML in `'vg:frontpage:html'` with `EX 5` (5s TTL), and hydrate user-specific state at the edge or client."
      },
      {
        lineNumber: 9,
        code: "  return { articles, personalizedAds };"
      },
      {
        lineNumber: 10,
        code: "}"
      }
    ]
  }
];

interface PrBugSquashArenaProps {
  targetLevel: TargetLevel;
}

export default function PrBugSquashArena({ targetLevel }: PrBugSquashArenaProps) {
  const [selectedPrId, setSelectedPrId] = useState<string>(PR_SCENARIOS[0].id);
  const [flaggedLines, setFlaggedLines] = useState<Record<number, boolean>>({});
  const [submittedReview, setSubmittedReview] = useState<boolean>(false);
  const [mutationDesignText, setMutationDesignText] = useState<string>("");
  const [mutationFeedback, setMutationFeedback] = useState<{
    scorePct: number;
    matchedKeywords: string[];
    missingKeywords: string[];
  } | null>(null);

  const currentPr =
    PR_SCENARIOS.find((p) => p.id === selectedPrId) || PR_SCENARIOS[0];

  const totalActualBugs = currentPr.lines.filter((l) => l.isBug).length;
  const correctlyFlaggedCount = currentPr.lines.filter(
    (l) => l.isBug && flaggedLines[l.lineNumber]
  ).length;
  const falsePositivesCount = currentPr.lines.filter(
    (l) => !l.isBug && flaggedLines[l.lineNumber]
  ).length;

  const handleSelectScenario = (id: string) => {
    setSelectedPrId(id);
    setFlaggedLines({});
    setSubmittedReview(false);
    setMutationDesignText("");
    setMutationFeedback(null);
  };

  const toggleLineFlag = (lineNum: number) => {
    setFlaggedLines((prev) => ({
      ...prev,
      [lineNum]: !prev[lineNum]
    }));
  };

  const handleGradeMutation = () => {
    const lower = mutationDesignText.toLowerCase();
    const matched = currentPr.mutationKeywords.filter((k) =>
      lower.includes(k.toLowerCase())
    );
    const missing = currentPr.mutationKeywords.filter(
      (k) => !lower.includes(k.toLowerCase())
    );
    const scorePct = Math.min(
      100,
      Math.round((matched.length / currentPr.mutationKeywords.length) * 100)
    );
    setMutationFeedback({
      scorePct,
      matchedKeywords: matched,
      missingKeywords: missing
    });
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-5">
      {/* Header & PR Scenario Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <GitPullRequest className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Nordic & FinTech PR Bug-Squash + Take-Home Mutation Simulator ({targetLevel})
            </span>
          </div>
          <h2 className="text-base font-bold text-white mt-0.5">
            Click Any Line in the Pull Request Below to Flag Production Bugs
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Used by <strong className="text-slate-200">FINN.no / Vend, Schibsted / VG, Wolt, Klarna, Revolut, and Stripe</strong> instead of textbook LeetCode puzzles.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {PR_SCENARIOS.map((pr) => (
            <button
              key={pr.id}
              onClick={() => handleSelectScenario(pr.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-all ${
                selectedPrId === pr.id
                  ? "bg-amber-500/20 border-amber-400/50 text-amber-200"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {pr.company.split(" (")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* PR Metadata Banner */}
      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="space-y-0.5">
          <div className="font-bold text-white flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-cyan-400" />
            <span>{currentPr.title}</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-cyan-300">
              {currentPr.language}
            </span>
          </div>
          <p className="text-slate-400">{currentPr.prDescription}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-semibold">
            Flagged: <strong className="text-amber-300">{Object.values(flaggedLines).filter(Boolean).length}</strong> / {totalActualBugs} Bugs
          </span>
          <button
            onClick={() => setSubmittedReview(true)}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
          >
            Grade My PR Review
          </button>
          {submittedReview && (
            <button
              onClick={() => {
                setFlaggedLines({});
                setSubmittedReview(false);
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              title="Reset PR Review"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Interactive PR Code Diff Viewer */}
      <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden font-mono text-xs">
        {currentPr.lines.map((line) => {
          const isFlagged = !!flaggedLines[line.lineNumber];
          const showBugReveal = submittedReview && line.isBug;
          const isFalsePositive = submittedReview && isFlagged && !line.isBug;

          return (
            <div key={line.lineNumber} className="border-b border-slate-900/90 last:border-b-0">
              <div
                onClick={() => toggleLineFlag(line.lineNumber)}
                className={`flex items-start gap-3 px-3.5 py-2 cursor-pointer transition-colors ${
                  showBugReveal && isFlagged
                    ? "bg-emerald-950/35 hover:bg-emerald-950/45"
                    : showBugReveal && !isFlagged
                    ? "bg-rose-950/35 hover:bg-rose-950/45"
                    : isFalsePositive
                    ? "bg-amber-950/25"
                    : isFlagged
                    ? "bg-amber-500/15 hover:bg-amber-500/20"
                    : "hover:bg-slate-900/80"
                }`}
              >
                <span className="w-6 text-right text-slate-500 select-none shrink-0">
                  {line.lineNumber}
                </span>

                <span className="w-5 shrink-0 mt-0.5">
                  {isFlagged ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  ) : showBugReveal ? (
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  ) : null}
                </span>

                <pre className="flex-1 overflow-x-auto text-slate-200 whitespace-pre-wrap">
                  {line.code}
                </pre>

                <span className="shrink-0 text-[10px] font-sans font-semibold">
                  {showBugReveal && isFlagged && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ✓ Caught ({line.bugSeverity})
                    </span>
                  )}
                  {showBugReveal && !isFlagged && (
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      ✗ Missed Bug ({line.bugSeverity})
                    </span>
                  )}
                  {!submittedReview && isFlagged && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      Flagged in Review
                    </span>
                  )}
                </span>
              </div>

              {/* Staff Engineer Explanation Drawer when Submitted */}
              {submittedReview && line.isBug && (
                <div className="px-11 py-3 bg-slate-900/90 border-t border-slate-800/80 font-sans space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>
                      [{line.bugSeverity}] {line.bugCategory}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {line.staffExplanation}
                  </p>
                  {line.fixedLineSuggestion && (
                    <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30 font-mono text-[11px] text-emerald-200">
                      <strong>Staff Fix:</strong> {line.fixedLineSuggestion}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Review Score Summary Banner */}
      {submittedReview && (
        <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-white text-sm">
                PR Review Score: Caught {correctlyFlaggedCount} of {totalActualBugs} Production Bugs
                {falsePositivesCount > 0 ? ` (${falsePositivesCount} non-bug line flagged)` : " (Zero false positives!)"}
              </div>
              <p className="text-slate-300">
                {correctlyFlaggedCount >= totalActualBugs - 1
                  ? `Strong Hire (${targetLevel}) signal — You spotted the concurrency, monetary precision, and distributed state bugs!`
                  : "Review the red 'Missed Bug' annotations above—Nordic & FinTech interviewers probe heavily on race conditions and money math."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Part 2: Wolt / FINN / Revolut Live Requirement Mutation Defense */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span>Part 2: Live Requirement Mutation Defense (Wolt & FINN.no Style)</span>
          </div>
          <button
            onClick={() => setMutationDesignText(currentPr.idealMutationDesign)}
            className="text-[11px] font-semibold text-indigo-300 hover:text-indigo-200 flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            <span>Insert Staff Reference Refactoring</span>
          </button>
        </div>

        <p className="text-xs text-slate-200 leading-relaxed font-medium">
          {currentPr.liveMutationPrompt}
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <textarea
            value={mutationDesignText}
            onChange={(e) => setMutationDesignText(e.target.value)}
            rows={3}
            placeholder="Explain how you would refactor the domain model and database/event flow to support this live requirement change..."
            className="flex-1 rounded-xl bg-slate-900 border border-slate-800 p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleGradeMutation}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer shrink-0"
          >
            Evaluate Refactoring
          </button>
        </div>

        {mutationFeedback && (
          <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5 text-xs">
            <div className="font-bold text-emerald-300">
              Live Refactoring Rubric Match: {mutationFeedback.scorePct}%
            </div>
            <p className="text-slate-300 leading-relaxed">
              <strong>Staff Reference Solution:</strong> {currentPr.idealMutationDesign}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
