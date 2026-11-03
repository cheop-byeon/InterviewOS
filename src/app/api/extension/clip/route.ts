import { NextRequest, NextResponse } from "next/server";
import {
  createQuestionInSqlite,
  getDatabaseTelemetry,
  getFullWorkspaceFromSqlite,
  recordResumeScanInSqlite,
  syncJobApplicationsInSqlite
} from "@/lib/server/sqliteDb";
import { analyzeResumeAgainstJD } from "@/lib/engines/atsEngine";
import { RESUME_JD_PRESETS } from "@/lib/data/mockInterviewData";
import { CompanyQuestionItem, JobApplicationCard } from "@/lib/types";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mode = body.mode || "job_clip";

    if (mode === "question_clip") {
      const rawText = String(body.rawText || body.jdText || "").trim();
      if (!rawText) {
        return NextResponse.json(
          { error: "No text provided to clip" },
          { status: 400, headers: CORS_HEADERS }
        );
      }
      const company = String(body.company || "OpenAI").trim();
      const firstLine = rawText.split(/\n+/)[0]?.slice(0, 88) || `${company} Onsite Question`;
      const item: CompanyQuestionItem = {
        id: `q_ext_${Date.now()}`,
        company,
        role: "Backend / Distributed Systems",
        level: "L5",
        roundType: "System Design",
        questionTitle: firstLine,
        details: `${rawText}${body.url ? `\n(Clipped from: ${body.url})` : ""}`,
        askedAgo: "Clipped via Extension • Just now",
        frequency: "Verified Onsite",
        keyRubricSignal:
          "Define correctness invariants, quantify QPS & storage, and defend failure trade-offs.",
        linkedModule: "system_design",
        linkedTopicId: "ticketmaster",
        upvotes: 5
      };

      const created = createQuestionInSqlite(item);
      return NextResponse.json(
        {
          ok: true,
          mode: "question_clip",
          question: created,
          telemetry: getDatabaseTelemetry()
        },
        { headers: CORS_HEADERS }
      );
    }

    // Default: mode === "job_clip"
    const jdText = String(body.jdText || "").trim();
    if (!jdText) {
      return NextResponse.json(
        { error: "Job description text is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const resumeText = String(body.resumeText || RESUME_JD_PRESETS[0].resumeText);
    const scan = analyzeResumeAgainstJD(resumeText, jdText);

    const lower = jdText.toLowerCase();
    const detectedCompany =
      body.company ||
      (lower.includes("openai")
        ? "OpenAI"
        : lower.includes("anthropic")
        ? "Anthropic"
        : lower.includes("stripe")
        ? "Stripe"
        : lower.includes("uber")
        ? "Uber"
        : lower.includes("meta")
        ? "Meta"
        : lower.includes("google")
        ? "Google"
        : lower.includes("databricks")
        ? "Databricks"
        : "Tech Co");

    const linkedProblemId =
      lower.includes("llm") || lower.includes("inference")
        ? "openai_llm_inference"
        : lower.includes("rag") || lower.includes("vector")
        ? "rag_enterprise"
        : lower.includes("geo") || lower.includes("dispatch")
        ? "uber"
        : lower.includes("file") || lower.includes("sync")
        ? "dropbox_sync"
        : "ticketmaster";

    const missingKeywords = scan.keywords
      .filter((k) => !k.foundInResume)
      .map((k) => k.keyword);
    const matchedKeywords = scan.keywords
      .filter((k) => k.foundInResume)
      .map((k) => k.keyword);

    const newJobCard: JobApplicationCard = {
      id: `job_ext_${Date.now()}`,
      company: detectedCompany,
      role: body.title || scan.detectedRole,
      level: scan.detectedLevel,
      compensation: scan.detectedLevel === "L6" ? "$380k – $520k" : "$265k – $350k",
      stage: "wishlist",
      atsMatchScore: scan.overallScore,
      mockReadinessScore: 80,
      nextAction:
        missingKeywords.length > 0
          ? `Add missing keywords: ${missingKeywords.slice(0, 3).join(", ")}`
          : "Ready for System Design & Mock Loop",
      updatedAt: "Clipped via Extension",
      linkedProblemId,
      notes: `Clipped via Chrome Extension${body.url ? ` (${body.url})` : ""}. ATS Score: ${scan.overallScore}%.`
    };

    const { jobCards } = getFullWorkspaceFromSqlite();
    syncJobApplicationsInSqlite([newJobCard, ...jobCards]);

    recordResumeScanInSqlite({
      roleTitle: `${detectedCompany} — ${newJobCard.role}`,
      targetLevel: scan.detectedLevel,
      overallScore: scan.overallScore,
      keywordMatchScore: scan.hardSkillMatchPct,
      impactMetricScore: scan.impactMetricScore,
      formattingScore: scan.parsabilityScore,
      matchedCount: matchedKeywords.length,
      missingCount: missingKeywords.length
    });

    return NextResponse.json(
      {
        ok: true,
        mode: "job_clip",
        jobCard: newJobCard,
        atsScore: scan.overallScore,
        missingKeywords: missingKeywords.slice(0, 6),
        matchedKeywords: matchedKeywords.slice(0, 6),
        telemetry: getDatabaseTelemetry()
      },
      { headers: CORS_HEADERS }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Extension clip failed";
    return NextResponse.json({ error: msg }, { status: 500, headers: CORS_HEADERS });
  }
}
