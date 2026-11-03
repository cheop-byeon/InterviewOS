import fs from "fs";
import path from "path";
import {
  CodingProblem,
  CompanyQuestionItem,
  DatabaseTelemetry,
  JobApplicationCard,
  PracticeSessionRecord,
  ResumeScanRecord,
  StarStory,
  SystemDesignProblem,
  TargetLevel,
  UserProfileRecord
} from "../types";
import { SYSTEM_DESIGN_PROBLEMS } from "../data/systemDesignProblems";
import {
  CODING_PROBLEMS,
  COMPANY_QUESTION_BANK,
  INITIAL_JOB_CARDS,
  INITIAL_SESSION_HISTORY,
  INITIAL_STAR_STORIES
} from "../data/mockInterviewData";

interface SqliteStatement {
  run: (...params: unknown[]) => { changes: number | bigint; lastInsertRowid: number | bigint };
  get: (...params: unknown[]) => Record<string, unknown> | undefined;
  all: (...params: unknown[]) => Record<string, unknown>[];
}

interface SqliteDatabaseSync {
  exec: (sql: string) => void;
  prepare: (sql: string) => SqliteStatement;
  close: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DatabaseSync } = require("node:sqlite") as {
  DatabaseSync: new (filePath: string) => SqliteDatabaseSync;
};

const DATA_DIR = path.join(process.cwd(), "data");
const SQLITE_DB_PATH = path.join(DATA_DIR, "interview_os.sqlite");

let dbInstance: SqliteDatabaseSync | null = null;

function getDb(): SqliteDatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const db = new DatabaseSync(SQLITE_DB_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA synchronous = NORMAL;");
  db.exec("PRAGMA foreign_keys = ON;");

  initializeSchemaAndSeed(db);
  dbInstance = db;
  return db;
}

function initializeSchemaAndSeed(db: SqliteDatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      target_role TEXT NOT NULL,
      target_level TEXT NOT NULL,
      streak_days INTEGER NOT NULL DEFAULT 5,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS system_design_problems (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      company_tags_json TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      category TEXT NOT NULL,
      estimated_minutes INTEGER NOT NULL,
      summary TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS coding_problems (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      pattern TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      companies_json TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS question_bank (
      id TEXT PRIMARY KEY,
      company TEXT NOT NULL,
      role TEXT NOT NULL,
      level TEXT NOT NULL,
      round_type TEXT NOT NULL,
      question_title TEXT NOT NULL,
      details TEXT NOT NULL,
      asked_ago TEXT NOT NULL,
      frequency TEXT NOT NULL,
      key_rubric_signal TEXT NOT NULL,
      linked_module TEXT NOT NULL,
      linked_topic_id TEXT NOT NULL,
      upvotes INTEGER NOT NULL DEFAULT 18,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS job_applications (
      id TEXT PRIMARY KEY,
      company TEXT NOT NULL,
      role TEXT NOT NULL,
      level TEXT NOT NULL,
      compensation TEXT NOT NULL,
      stage TEXT NOT NULL,
      ats_match_score INTEGER NOT NULL,
      mock_readiness_score INTEGER NOT NULL,
      next_action TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      linked_problem_id TEXT,
      notes TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS star_stories (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      project_context TEXT NOT NULL,
      competencies_json TEXT NOT NULL,
      situation TEXT NOT NULL,
      task TEXT NOT NULL,
      action TEXT NOT NULL,
      result_quantified TEXT NOT NULL,
      level_impact_note TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS practice_sessions (
      id TEXT PRIMARY KEY,
      date_label TEXT NOT NULL,
      session_type TEXT NOT NULL,
      title TEXT NOT NULL,
      level TEXT NOT NULL,
      score_pct INTEGER NOT NULL,
      verdict TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS resume_scans (
      id TEXT PRIMARY KEY,
      role_title TEXT NOT NULL,
      target_level TEXT NOT NULL,
      overall_score INTEGER NOT NULL,
      keyword_match_score INTEGER NOT NULL,
      impact_metric_score INTEGER NOT NULL,
      formatting_score INTEGER NOT NULL,
      matched_count INTEGER NOT NULL,
      missing_count INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_question_bank_company ON question_bank(company);
    CREATE INDEX IF NOT EXISTS idx_question_bank_round_type ON question_bank(round_type);
    CREATE INDEX IF NOT EXISTS idx_job_applications_stage ON job_applications(stage);
    CREATE INDEX IF NOT EXISTS idx_practice_sessions_created ON practice_sessions(created_at DESC);
  `);

  seedDefaultData(db, false);
}

export function seedDefaultData(db: SqliteDatabaseSync, forceReset = false): void {
  const nowIso = new Date().toISOString();

  if (forceReset) {
    db.exec(`
      DELETE FROM users;
      DELETE FROM system_design_problems;
      DELETE FROM coding_problems;
      DELETE FROM question_bank;
      DELETE FROM job_applications;
      DELETE FROM star_stories;
      DELETE FROM practice_sessions;
      DELETE FROM resume_scans;
    `);
  }

  // 1. Seed default user profile
  const userStmt = db.prepare(`
    INSERT OR IGNORE INTO users (id, name, email, target_role, target_level, streak_days, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  userStmt.run(
    "default-candidate",
    "Alex Rivera",
    "alex.rivera@interviewos.dev",
    "Senior Backend & AI Systems Engineer",
    "L5",
    7,
    nowIso
  );

  // 2. Upsert System Design Problems (always keep catalog fresh with latest blueprints)
  const sdStmt = db.prepare(`
    INSERT OR REPLACE INTO system_design_problems (
      id, title, company_tags_json, difficulty, category, estimated_minutes, summary, payload_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const problem of SYSTEM_DESIGN_PROBLEMS) {
    sdStmt.run(
      problem.id,
      problem.title,
      JSON.stringify(problem.companyTags),
      problem.difficulty,
      problem.category,
      problem.estimatedMinutes,
      problem.promptSummary,
      JSON.stringify(problem),
      nowIso
    );
  }

  // 3. Upsert Coding Problems (always keep catalog fresh with latest runnable problems)
  const codingStmt = db.prepare(`
    INSERT OR REPLACE INTO coding_problems (
      id, title, pattern, difficulty, companies_json, payload_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const problem of CODING_PROBLEMS) {
    codingStmt.run(
      problem.id,
      problem.title,
      problem.pattern,
      problem.difficulty,
      JSON.stringify(problem.companies),
      JSON.stringify(problem),
      nowIso
    );
  }

  // 4. Seed Question Bank (INSERT OR IGNORE so user upvotes & custom additions persist)
  const qbStmt = db.prepare(`
    INSERT OR IGNORE INTO question_bank (
      id, company, role, level, round_type, question_title, details, asked_ago,
      frequency, key_rubric_signal, linked_module, linked_topic_id, upvotes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  COMPANY_QUESTION_BANK.forEach((q, idx) => {
    const initialUpvotes = 48 - idx * 3;
    qbStmt.run(
      q.id,
      q.company,
      q.role,
      q.level,
      q.roundType,
      q.questionTitle,
      q.details,
      q.askedAgo,
      q.frequency,
      q.keyRubricSignal,
      q.linkedModule,
      q.linkedTopicId,
      initialUpvotes,
      nowIso
    );
  });

  // 5. Seed Job Applications if table is empty
  const jobCountRow = db.prepare("SELECT COUNT(*) as cnt FROM job_applications").get();
  if (!jobCountRow || Number(jobCountRow.cnt) === 0) {
    const jobStmt = db.prepare(`
      INSERT INTO job_applications (
        id, company, role, level, compensation, stage, ats_match_score,
        mock_readiness_score, next_action, updated_at, linked_problem_id, notes, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    INITIAL_JOB_CARDS.forEach((job, idx) => {
      jobStmt.run(
        job.id,
        job.company,
        job.role,
        job.level,
        job.compensation,
        job.stage,
        job.atsMatchScore,
        job.mockReadinessScore,
        job.nextAction,
        job.updatedAt,
        job.linkedProblemId ?? null,
        job.notes,
        idx
      );
    });
  }

  // 6. Seed STAR Stories if table is empty
  const storyCountRow = db.prepare("SELECT COUNT(*) as cnt FROM star_stories").get();
  if (!storyCountRow || Number(storyCountRow.cnt) === 0) {
    const storyStmt = db.prepare(`
      INSERT INTO star_stories (
        id, title, project_context, competencies_json, situation, task, action,
        result_quantified, level_impact_note, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const story of INITIAL_STAR_STORIES) {
      storyStmt.run(
        story.id,
        story.title,
        story.projectContext,
        JSON.stringify(story.competencies),
        story.situation,
        story.task,
        story.action,
        story.resultQuantified,
        story.levelImpactNote,
        nowIso
      );
    }
  }

  // 7. Seed Practice Sessions if table is empty
  const sessionCountRow = db.prepare("SELECT COUNT(*) as cnt FROM practice_sessions").get();
  if (!sessionCountRow || Number(sessionCountRow.cnt) === 0) {
    const sessionStmt = db.prepare(`
      INSERT INTO practice_sessions (
        id, date_label, session_type, title, level, score_pct, verdict, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    INITIAL_SESSION_HISTORY.forEach((sess, idx) => {
      const ts = new Date(Date.now() - (INITIAL_SESSION_HISTORY.length - idx) * 3600_000).toISOString();
      sessionStmt.run(
        sess.id,
        sess.date,
        sess.type,
        sess.title,
        sess.level,
        sess.scorePct,
        sess.verdict,
        ts
      );
    });
  }

  // 8. Seed initial Resume Scan history if table is empty
  const scanCountRow = db.prepare("SELECT COUNT(*) as cnt FROM resume_scans").get();
  if (!scanCountRow || Number(scanCountRow.cnt) === 0) {
    const scanStmt = db.prepare(`
      INSERT INTO resume_scans (
        id, role_title, target_level, overall_score, keyword_match_score,
        impact_metric_score, formatting_score, matched_count, missing_count, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    scanStmt.run(
      "scan_initial_1",
      "Stripe — Senior Backend Engineer (Payments & Ledger)",
      "L5",
      78,
      74,
      82,
      90,
      11,
      4,
      new Date(Date.now() - 86400_000).toISOString()
    );
    scanStmt.run(
      "scan_initial_2",
      "OpenAI — Staff AI Systems & Inference Engineer",
      "L6",
      85,
      83,
      88,
      92,
      14,
      2,
      nowIso
    );
  }
}

export function getDatabaseTelemetry(): DatabaseTelemetry {
  const db = getDb();
  let fileSizeBytes = 0;
  try {
    if (fs.existsSync(SQLITE_DB_PATH)) {
      fileSizeBytes = fs.statSync(SQLITE_DB_PATH).size;
    }
  } catch {
    fileSizeBytes = 0;
  }

  const countTable = (table: string): number => {
    const row = db.prepare(`SELECT COUNT(*) as cnt FROM ${table}`).get();
    return Number(row?.cnt ?? 0);
  };

  const avgAtsRow = db.prepare("SELECT ROUND(AVG(overall_score)) as avg_score FROM resume_scans").get();
  const avgPracticeRow = db.prepare("SELECT ROUND(AVG(score_pct)) as avg_score FROM practice_sessions").get();
  const upvotesRow = db.prepare("SELECT COALESCE(SUM(upvotes), 0) as total_upvotes FROM question_bank").get();
  const activeJobsRow = db
    .prepare("SELECT COUNT(*) as cnt FROM job_applications WHERE stage != 'wishlist'")
    .get();

  return {
    engine: "SQLite 3 (node:sqlite DatabaseSync)",
    dbPath: "data/interview_os.sqlite",
    journalMode: "WAL (Write-Ahead Logging)",
    fileSizeBytes,
    tableCounts: {
      users: countTable("users"),
      system_design_problems: countTable("system_design_problems"),
      coding_problems: countTable("coding_problems"),
      question_bank: countTable("question_bank"),
      job_applications: countTable("job_applications"),
      star_stories: countTable("star_stories"),
      practice_sessions: countTable("practice_sessions"),
      resume_scans: countTable("resume_scans")
    },
    aggregates: {
      avgAtsScore: Number(avgAtsRow?.avg_score ?? 80),
      avgPracticeScore: Number(avgPracticeRow?.avg_score ?? 84),
      totalUpvotes: Number(upvotesRow?.total_upvotes ?? 0),
      activePipelineCount: Number(activeJobsRow?.cnt ?? 0)
    }
  };
}

export function getFullWorkspaceFromSqlite(): {
  user: UserProfileRecord;
  systemDesignProblems: SystemDesignProblem[];
  codingProblems: CodingProblem[];
  questionBank: CompanyQuestionItem[];
  jobCards: JobApplicationCard[];
  starStories: StarStory[];
  sessionHistory: PracticeSessionRecord[];
  resumeScans: ResumeScanRecord[];
  telemetry: DatabaseTelemetry;
} {
  const db = getDb();

  const userRow = db.prepare("SELECT * FROM users LIMIT 1").get();
  const user: UserProfileRecord = {
    id: String(userRow?.id ?? "default-candidate"),
    name: String(userRow?.name ?? "Alex Rivera"),
    email: String(userRow?.email ?? "alex.rivera@interviewos.dev"),
    targetRole: String(userRow?.target_role ?? "Senior Backend & AI Systems Engineer"),
    targetLevel: (userRow?.target_level as TargetLevel) ?? "L5",
    streakDays: Number(userRow?.streak_days ?? 7)
  };

  const sdRows = db.prepare("SELECT payload_json FROM system_design_problems ORDER BY rowid ASC").all();
  const systemDesignProblems: SystemDesignProblem[] = sdRows.map((r) =>
    JSON.parse(String(r.payload_json))
  );

  const codingRows = db.prepare("SELECT payload_json FROM coding_problems ORDER BY rowid ASC").all();
  const codingProblems: CodingProblem[] = codingRows.map((r) =>
    JSON.parse(String(r.payload_json))
  );

  const qbRows = db
    .prepare("SELECT * FROM question_bank ORDER BY upvotes DESC, created_at DESC")
    .all();
  const questionBank: CompanyQuestionItem[] = qbRows.map((r) => ({
    id: String(r.id),
    company: String(r.company),
    role: r.role as CompanyQuestionItem["role"],
    level: r.level as TargetLevel,
    roundType: r.round_type as CompanyQuestionItem["roundType"],
    questionTitle: String(r.question_title),
    details: String(r.details),
    askedAgo: String(r.asked_ago),
    frequency: r.frequency as CompanyQuestionItem["frequency"],
    keyRubricSignal: String(r.key_rubric_signal),
    linkedModule: r.linked_module as CompanyQuestionItem["linkedModule"],
    linkedTopicId: String(r.linked_topic_id),
    upvotes: Number(r.upvotes ?? 18)
  }));

  const jobRows = db
    .prepare("SELECT * FROM job_applications ORDER BY sort_order ASC, rowid ASC")
    .all();
  const jobCards: JobApplicationCard[] = jobRows.map((r) => ({
    id: String(r.id),
    company: String(r.company),
    role: String(r.role),
    level: r.level as TargetLevel,
    compensation: String(r.compensation),
    stage: r.stage as JobApplicationCard["stage"],
    atsMatchScore: Number(r.ats_match_score),
    mockReadinessScore: Number(r.mock_readiness_score),
    nextAction: String(r.next_action),
    updatedAt: String(r.updated_at),
    linkedProblemId: r.linked_problem_id ? String(r.linked_problem_id) : undefined,
    notes: String(r.notes)
  }));

  const storyRows = db.prepare("SELECT * FROM star_stories ORDER BY rowid ASC").all();
  const starStories: StarStory[] = storyRows.map((r) => ({
    id: String(r.id),
    title: String(r.title),
    projectContext: String(r.project_context),
    competencies: JSON.parse(String(r.competencies_json)),
    situation: String(r.situation),
    task: String(r.task),
    action: String(r.action),
    resultQuantified: String(r.result_quantified),
    levelImpactNote: String(r.level_impact_note)
  }));

  const sessionRows = db
    .prepare("SELECT * FROM practice_sessions ORDER BY created_at DESC, rowid DESC LIMIT 50")
    .all();
  const sessionHistory: PracticeSessionRecord[] = sessionRows.map((r) => ({
    id: String(r.id),
    date: String(r.date_label),
    type: r.session_type as PracticeSessionRecord["type"],
    title: String(r.title),
    level: r.level as TargetLevel,
    scorePct: Number(r.score_pct),
    verdict: String(r.verdict)
  }));

  const scanRows = db
    .prepare("SELECT * FROM resume_scans ORDER BY created_at DESC LIMIT 25")
    .all();
  const resumeScans: ResumeScanRecord[] = scanRows.map((r) => ({
    id: String(r.id),
    roleTitle: String(r.role_title),
    targetLevel: r.target_level as TargetLevel,
    overallScore: Number(r.overall_score),
    keywordMatchScore: Number(r.keyword_match_score),
    impactMetricScore: Number(r.impact_metric_score),
    formattingScore: Number(r.formatting_score),
    matchedCount: Number(r.matched_count),
    missingCount: Number(r.missing_count),
    createdAt: String(r.created_at)
  }));

  return {
    user,
    systemDesignProblems,
    codingProblems,
    questionBank,
    jobCards,
    starStories,
    sessionHistory,
    resumeScans,
    telemetry: getDatabaseTelemetry()
  };
}

export function syncJobApplicationsInSqlite(jobCards: JobApplicationCard[]): void {
  const db = getDb();
  db.exec("BEGIN TRANSACTION;");
  try {
    db.exec("DELETE FROM job_applications;");
    const stmt = db.prepare(`
      INSERT INTO job_applications (
        id, company, role, level, compensation, stage, ats_match_score,
        mock_readiness_score, next_action, updated_at, linked_problem_id, notes, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    jobCards.forEach((job, idx) => {
      stmt.run(
        job.id,
        job.company,
        job.role,
        job.level,
        job.compensation,
        job.stage,
        job.atsMatchScore,
        job.mockReadinessScore,
        job.nextAction,
        job.updatedAt,
        job.linkedProblemId ?? null,
        job.notes,
        idx
      );
    });
    db.exec("COMMIT;");
  } catch (err) {
    db.exec("ROLLBACK;");
    throw err;
  }
}

export function syncStarStoriesInSqlite(stories: StarStory[]): void {
  const db = getDb();
  const nowIso = new Date().toISOString();
  db.exec("BEGIN TRANSACTION;");
  try {
    db.exec("DELETE FROM star_stories;");
    const stmt = db.prepare(`
      INSERT INTO star_stories (
        id, title, project_context, competencies_json, situation, task, action,
        result_quantified, level_impact_note, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const story of stories) {
      stmt.run(
        story.id,
        story.title,
        story.projectContext,
        JSON.stringify(story.competencies),
        story.situation,
        story.task,
        story.action,
        story.resultQuantified,
        story.levelImpactNote,
        nowIso
      );
    }
    db.exec("COMMIT;");
  } catch (err) {
    db.exec("ROLLBACK;");
    throw err;
  }
}

export function syncPracticeSessionsInSqlite(sessions: PracticeSessionRecord[]): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO practice_sessions (
      id, date_label, session_type, title, level, score_pct, verdict, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  sessions.forEach((sess, idx) => {
    const ts = new Date(Date.now() - idx * 60_000).toISOString();
    stmt.run(
      sess.id,
      sess.date,
      sess.type,
      sess.title,
      sess.level,
      sess.scorePct,
      sess.verdict,
      ts
    );
  });
}

export function recordPracticeSessionInSqlite(session: PracticeSessionRecord): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO practice_sessions (
      id, date_label, session_type, title, level, score_pct, verdict, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    session.id,
    session.date,
    session.type,
    session.title,
    session.level,
    session.scorePct,
    session.verdict,
    new Date().toISOString()
  );
}

export function recordResumeScanInSqlite(
  scan: Omit<ResumeScanRecord, "id" | "createdAt"> & { id?: string; createdAt?: string }
): ResumeScanRecord {
  const db = getDb();
  const id = scan.id ?? `scan_${Date.now()}`;
  const createdAt = scan.createdAt ?? new Date().toISOString();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO resume_scans (
      id, role_title, target_level, overall_score, keyword_match_score,
      impact_metric_score, formatting_score, matched_count, missing_count, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    scan.roleTitle,
    scan.targetLevel,
    scan.overallScore,
    scan.keywordMatchScore,
    scan.impactMetricScore,
    scan.formattingScore,
    scan.matchedCount,
    scan.missingCount,
    createdAt
  );
  return {
    id,
    ...scan,
    createdAt
  };
}

export function upvoteQuestionInSqlite(questionId: string, delta = 1): number {
  const db = getDb();
  db.prepare("UPDATE question_bank SET upvotes = MAX(0, upvotes + ?) WHERE id = ?").run(
    delta,
    questionId
  );
  const row = db.prepare("SELECT upvotes FROM question_bank WHERE id = ?").get(questionId);
  return Number(row?.upvotes ?? 0);
}

export function createQuestionInSqlite(item: CompanyQuestionItem): CompanyQuestionItem {
  const db = getDb();
  const nowIso = new Date().toISOString();
  const upvotes = item.upvotes ?? 1;
  db.prepare(`
    INSERT OR REPLACE INTO question_bank (
      id, company, role, level, round_type, question_title, details, asked_ago,
      frequency, key_rubric_signal, linked_module, linked_topic_id, upvotes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    item.id,
    item.company,
    item.role,
    item.level,
    item.roundType,
    item.questionTitle,
    item.details,
    item.askedAgo,
    item.frequency,
    item.keyRubricSignal,
    item.linkedModule,
    item.linkedTopicId,
    upvotes,
    nowIso
  );
  return { ...item, upvotes };
}

export function updateUserLevelInSqlite(targetLevel: TargetLevel): void {
  const db = getDb();
  db.prepare("UPDATE users SET target_level = ?, updated_at = ? WHERE id = 'default-candidate'").run(
    targetLevel,
    new Date().toISOString()
  );
}

export function resetSqliteDatabase(): void {
  const db = getDb();
  seedDefaultData(db, true);
}
