import { NextRequest, NextResponse } from "next/server";
import {
  createQuestionInSqlite,
  getDatabaseTelemetry,
  getFullWorkspaceFromSqlite,
  upvoteQuestionInSqlite
} from "@/lib/server/sqliteDb";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const company = searchParams.get("company");
    const roundType = searchParams.get("roundType");
    const level = searchParams.get("level");
    const search = searchParams.get("search")?.toLowerCase();

    const { questionBank, telemetry } = getFullWorkspaceFromSqlite();

    const filtered = questionBank.filter((q) => {
      if (company && company !== "All" && q.company !== company) return false;
      if (roundType && roundType !== "All" && q.roundType !== roundType) return false;
      if (level && level !== "All" && q.level !== level) return false;
      if (
        search &&
        !q.questionTitle.toLowerCase().includes(search) &&
        !q.details.toLowerCase().includes(search) &&
        !q.company.toLowerCase().includes(search)
      ) {
        return false;
      }
      return true;
    });

    return NextResponse.json({
      questions: filtered,
      totalCount: questionBank.length,
      telemetry
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to query SQLite question_bank";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === "upvote" && body.questionId) {
      const upvotes = upvoteQuestionInSqlite(body.questionId, body.delta ?? 1);
      return NextResponse.json({
        ok: true,
        upvotes,
        telemetry: getDatabaseTelemetry()
      });
    }

    if (body.question) {
      const created = createQuestionInSqlite(body.question);
      return NextResponse.json({
        ok: true,
        question: created,
        telemetry: getDatabaseTelemetry()
      });
    }

    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to mutate SQLite question_bank";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
