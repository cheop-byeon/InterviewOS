import { NextRequest, NextResponse } from "next/server";
import zlib from "zlib";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execFileAsync = promisify(execFile);

function extractTextFromPdfBuffer(buf: Buffer): { text: string; multiColumnWarning: boolean } {
  const raw = buf.toString("latin1");
  const chunks: string[] = [];

  // Decompress FlateDecode streams and extract text inside (...) Tj / [...] TJ
  const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
  let match: RegExpExecArray | null;
  while ((match = streamRegex.exec(raw)) !== null) {
    const streamBytes = Buffer.from(match[1], "latin1");
    let decoded = "";
    try {
      decoded = zlib.inflateSync(streamBytes).toString("latin1");
    } catch {
      decoded = match[1];
    }

    const tjMatches = decoded.match(/\(([^()\\]|\\.)*\)\s*Tj/g) || [];
    for (const tj of tjMatches) {
      const inner = tj.replace(/^\(|\)\s*Tj$/g, "");
      chunks.push(inner);
    }

    const arrayMatches = decoded.match(/\[([\s\S]*?)\]\s*TJ/g) || [];
    for (const arr of arrayMatches) {
      const parts = arr.match(/\(([^()\\]|\\.)*\)/g) || [];
      const line = parts.map((p) => p.slice(1, -1)).join("");
      if (line.trim()) chunks.push(line);
    }
  }

  const cleaned = chunks
    .join(" ")
    .replace(/\\n/g, "\n")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\s{2,}/g, " ")
    .trim();

  const multiColumnWarning = /\/ColumnCount|\/Table/i.test(raw);
  return { text: cleaned, multiColumnWarning };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (fileName.endsWith(".txt") || fileName.endsWith(".md")) {
      return NextResponse.json({
        text: buffer.toString("utf-8"),
        fileName: file.name,
        layoutWarning: null
      });
    }

    if (fileName.endsWith(".docx")) {
      const tmpPath = path.join(os.tmpdir(), `resume_${Date.now()}.docx`);
      await fs.writeFile(tmpPath, buffer);
      try {
        const pyScript = `
import zipfile, xml.etree.ElementTree as ET, sys
with zipfile.ZipFile(sys.argv[1]) as z:
    xml_content = z.read('word/document.xml')
tree = ET.fromstring(xml_content)
paragraphs = []
for p in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
    texts = [t.text for t in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if t.text]
    if texts:
        paragraphs.append(''.join(texts))
print('\\n'.join(paragraphs))
`;
        const { stdout } = await execFileAsync("python3", ["-c", pyScript, tmpPath], {
          timeout: 3000
        });
        await fs.unlink(tmpPath).catch(() => {});
        return NextResponse.json({
          text: stdout.trim(),
          fileName: file.name,
          layoutWarning: null
        });
      } catch {
        await fs.unlink(tmpPath).catch(() => {});
      }
    }

    if (fileName.endsWith(".pdf")) {
      const { text, multiColumnWarning } = extractTextFromPdfBuffer(buffer);
      if (text && text.length > 40) {
        return NextResponse.json({
          text,
          fileName: file.name,
          layoutWarning: multiColumnWarning
            ? "Detected multi-column or table PDF objects that may scramble parsing in legacy ATS engines."
            : null
        });
      }
      return NextResponse.json({
        text: buffer
          .toString("utf-8")
          .replace(/[^\x20-\x7E\n]/g, " ")
          .replace(/\s{3,}/g, "\n")
          .slice(0, 4000),
        fileName: file.name,
        layoutWarning:
          "PDF uses custom glyph encoding or scanned images. For 100% ATS accuracy, verify the extracted plain text below."
      });
    }

    return NextResponse.json({
      text: buffer.toString("utf-8"),
      fileName: file.name,
      layoutWarning: null
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to parse resume file";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
