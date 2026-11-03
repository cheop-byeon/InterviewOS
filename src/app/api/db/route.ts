import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "interview_os_db.json");

async function ensureDbFile() {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
    await fs.access(DB_FILE);
  } catch {
    await fs.writeFile(
      DB_FILE,
      JSON.stringify(
        {
          savedResumes: [],
          sessionHistory: [],
          customQuestions: [],
          updatedAt: new Date().toISOString()
        },
        null,
        2
      ),
      "utf-8"
    );
  }
}

export async function GET() {
  try {
    await ensureDbFile();
    const raw = await fs.readFile(DB_FILE, "utf-8");
    return NextResponse.json(JSON.parse(raw));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "DB read error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDbFile();
    const body = await req.json();
    const currentRaw = await fs.readFile(DB_FILE, "utf-8");
    const current = JSON.parse(currentRaw);

    const updated = {
      ...current,
      ...body,
      updatedAt: new Date().toISOString()
    };

    await fs.writeFile(DB_FILE, JSON.stringify(updated, null, 2), "utf-8");
    return NextResponse.json({ ok: true, data: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "DB write error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
