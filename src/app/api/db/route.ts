import { NextRequest, NextResponse } from "next/server";
import {
  createQuestionInSqlite,
  getDatabaseTelemetry,
  getFullWorkspaceFromSqlite,
  recordPracticeSessionInSqlite,
  recordResumeScanInSqlite,
  resetSqliteDatabase,
  syncJobApplicationsInSqlite,
  syncPracticeSessionsInSqlite,
  syncStarStoriesInSqlite,
  updateUserLevelInSqlite,
  upvoteQuestionInSqlite
} from "@/lib/server/sqliteDb";

export async function GET() {
  try {
    const workspace = getFullWorkspaceFromSqlite();
    return NextResponse.json(workspace);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "SQLite DB read error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Handle specific SQL actions
    if (body.action === "reset_db") {
      resetSqliteDatabase();
      return NextResponse.json({
        ok: true,
        workspace: getFullWorkspaceFromSqlite()
      });
    }

    if (body.action === "upvote_question" && body.questionId) {
      const upvotes = upvoteQuestionInSqlite(body.questionId, body.delta ?? 1);
      return NextResponse.json({
        ok: true,
        upvotes,
        telemetry: getDatabaseTelemetry()
      });
    }

    if (body.action === "create_question" && body.question) {
      const created = createQuestionInSqlite(body.question);
      return NextResponse.json({
        ok: true,
        question: created,
        telemetry: getDatabaseTelemetry()
      });
    }

    if (body.action === "record_session" && body.session) {
      recordPracticeSessionInSqlite(body.session);
      return NextResponse.json({
        ok: true,
        telemetry: getDatabaseTelemetry()
      });
    }

    if (body.action === "record_resume_scan" && body.scan) {
      const scanRecord = recordResumeScanInSqlite(body.scan);
      return NextResponse.json({
        ok: true,
        scan: scanRecord,
        telemetry: getDatabaseTelemetry()
      });
    }

    // Handle relational state synchronization
    if (Array.isArray(body.jobCards)) {
      syncJobApplicationsInSqlite(body.jobCards);
    }

    if (Array.isArray(body.starStories)) {
      syncStarStoriesInSqlite(body.starStories);
    }

    if (Array.isArray(body.sessionHistory)) {
      syncPracticeSessionsInSqlite(body.sessionHistory);
    }

    if (body.targetLevel) {
      updateUserLevelInSqlite(body.targetLevel);
    }

    return NextResponse.json({
      ok: true,
      telemetry: getDatabaseTelemetry(),
      updatedAt: new Date().toISOString()
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "SQLite DB write error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
