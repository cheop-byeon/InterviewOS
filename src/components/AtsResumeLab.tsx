"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  Download,
  FileCheck2,
  Sparkles,
  Target,
  Upload,
  Wand2,
  XCircle
} from "lucide-react";
import { RESUME_JD_PRESETS } from "../lib/data/mockInterviewData";
import { ATS_VENDOR_PROFILES, AtsVendorProfile } from "../lib/data/companyRubrics";
import { analyzeResumeAgainstJD } from "../lib/engines/atsEngine";
import { ActiveTab } from "../lib/types";

interface AtsResumeLabProps {
  resumeText: string;
  setResumeText: (text: string) => void;
  jdText: string;
  setJdText: (text: string) => void;
  onNavigateToModule: (tab: ActiveTab, topicId?: string) => void;
  onScanRecorded?: () => void;
}

type AtsSubStep = "input" | "bullets" | "keywords";

export default function AtsResumeLab({
  resumeText,
  setResumeText,
  jdText,
  setJdText,
  onNavigateToModule,
  onScanRecorded
}: AtsResumeLabProps) {
  const [subStep, setSubStep] = useState<AtsSubStep>("input");
  const [keywordFilter, setKeywordFilter] = useState<"all" | "missing" | "found">("all");
  const [appliedBulletIds, setAppliedBulletIds] = useState<Record<string, boolean>>({});
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [layoutWarning, setLayoutWarning] = useState<string | null>(null);
  const [savingScan, setSavingScan] = useState(false);
  const [selectedVendorId, setSelectedVendorId] =
    useState<AtsVendorProfile["id"]>("greenhouse");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const scanResult = useMemo(
    () => analyzeResumeAgainstJD(resumeText, jdText),
    [resumeText, jdText]
  );

  const activeVendor = useMemo(
    () =>
      ATS_VENDOR_PROFILES.find((v) => v.id === selectedVendorId) ||
      ATS_VENDOR_PROFILES[1],
    [selectedVendorId]
  );

  const vendorCalibratedScore = useMemo(() => {
    const w = activeVendor.weights;
    let raw =
      scanResult.hardSkillMatchPct * w.hardSkillWeight +
      scanResult.architectureMatchPct * w.architectureWeight +
      scanResult.impactMetricScore * w.impactWeight +
      scanResult.parsabilityScore * w.parsabilityWeight;

    // Apply vendor-specific strict parser penalties
    if (activeVendor.strictChecks.penalizeMultiColumn && layoutWarning) {
      raw -= 8;
    }
    if (
      activeVendor.strictChecks.requireAcronymExpansion &&
      !resumeText.includes("(")
    ) {
      raw -= 4;
    }
    return Math.max(25, Math.min(99, Math.round(raw)));
  }, [scanResult, activeVendor, layoutWarning, resumeText]);

  const handleSaveScanSnapshot = async () => {
    setSavingScan(true);
    try {
      const matchedCount = scanResult.keywords.filter((k) => k.foundInResume).length;
      const missingCount = scanResult.keywords.filter((k) => !k.foundInResume).length;
      await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "record_resume_scan",
          scan: {
            roleTitle: scanResult.detectedRole,
            targetLevel: scanResult.detectedLevel,
            overallScore: scanResult.overallScore,
            keywordMatchScore: scanResult.hardSkillMatchPct,
            impactMetricScore: scanResult.impactMetricScore,
            formattingScore: scanResult.parsabilityScore,
            matchedCount,
            missingCount
          }
        })
      });
      setUploadStatus(`✓ Saved Scan (${scanResult.overallScore}%) to SQLite DB`);
      onScanRecorded?.();
    } catch {
      setUploadStatus("Failed to save scan snapshot.");
    } finally {
      setSavingScan(false);
    }
  };

  const handleLoadPreset = (presetId: string) => {
    const found = RESUME_JD_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setResumeText(found.resumeText);
      setJdText(found.jdText);
      setAppliedBulletIds({});
      setUploadStatus(null);
      setLayoutWarning(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadStatus(`Parsing ${file.name}...`);
    setLayoutWarning(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.text) {
        setResumeText(data.text);
        setAppliedBulletIds({});
        setUploadStatus(`✓ Imported ${file.name}`);
        if (data.layoutWarning) {
          setLayoutWarning(data.layoutWarning);
        }
      } else {
        setUploadStatus(`Error: ${data.error || "Could not parse file"}`);
      }
    } catch {
      setUploadStatus("Upload failed. Please try a .pdf, .docx, or .txt file.");
    }
  };

  const handleExportCleanAtsPdf = () => {
    const win = window.open("", "_blank", "width=850,height=950");
    if (!win) return;
    const escaped = resumeText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ATS-Optimized Resume — Export PDF</title>
          <style>
            body {
              font-family: "Helvetica Neue", Arial, sans-serif;
              color: #111827;
              max-width: 740px;
              margin: 36px auto;
              padding: 0 24px;
              line-height: 1.5;
              font-size: 11pt;
            }
            pre {
              white-space: pre-wrap;
              font-family: inherit;
              margin: 0;
            }
            .banner {
              background: #eff6ff;
              border: 1px solid #bfdbfe;
              padding: 10px 16px;
              border-radius: 8px;
              margin-bottom: 24px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 10pt;
            }
            @media print {
              .banner { display: none; }
              body { margin: 12px auto; }
            }
          </style>
        </head>
        <body>
          <div class="banner">
            <span><strong>Single-Column ATS-Compliant Format</strong> (Score: ${scanResult.overallScore}%)</span>
            <button onclick="window.print()" style="background:#4f46e5;color:#fff;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:bold;">
              Save as PDF / Print
            </button>
          </div>
          <pre>${escaped}</pre>
        </body>
      </html>
    `);
    win.document.close();
  };

  const handleApplyXyzRewrite = (original: string, xyzRewrite: string, id: string) => {
    const updated = resumeText.replace(original, xyzRewrite);
    setResumeText(updated);
    setAppliedBulletIds((prev) => ({ ...prev, [id]: true }));
  };

  const filteredKeywords = scanResult.keywords.filter((k) => {
    if (keywordFilter === "missing") return !k.foundInResume;
    if (keywordFilter === "found") return k.foundInResume;
    return true;
  });

  const missingCount = scanResult.keywords.filter((k) => !k.foundInResume).length;
  const weakBulletsCount = scanResult.bulletCritiques.filter(
    (b) => b.score < 85 && !appliedBulletIds[b.id] && b.original !== b.xyzRewrite
  ).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Compact Top Summary & Step Switcher */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center shrink-0">
            <span
              className={`text-lg font-extrabold ${
                vendorCalibratedScore >= 82
                  ? "text-emerald-400"
                  : vendorCalibratedScore >= 68
                  ? "text-amber-400"
                  : "text-rose-400"
              }`}
            >
              {vendorCalibratedScore}%
            </span>
            <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">
              {activeVendor.id}
            </span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">ATS & Resume Optimizer</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Target Role: <strong className="text-slate-200">{scanResult.detectedRole}</strong> ({scanResult.detectedLevel}) • Calibrated for{" "}
              <strong className="text-indigo-300">{activeVendor.name}</strong>
            </p>
          </div>
        </div>

        {/* Progressive Disclosure Step Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setSubStep("input")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subStep === "input"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            1. Resume & JD
          </button>
          <button
            onClick={() => setSubStep("bullets")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              subStep === "bullets"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>2. XYZ Bullet Rewriter</span>
            {weakBulletsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300">
                {weakBulletsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setSubStep("keywords")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              subStep === "keywords"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>3. Keyword Gaps & Plan</span>
            {missingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/20 text-rose-300">
                {missingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* STEP 1: FOCUSED RESUME & JD INPUT + FILE UPLOAD & PDF EXPORT */}
      {subStep === "input" && (
        <div className="space-y-5">
          {/* Quick Score Breakdown Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Hard Skills Match", val: scanResult.hardSkillMatchPct, color: "text-indigo-400" },
              { label: "Architecture Signal", val: scanResult.architectureMatchPct, color: "text-violet-400" },
              { label: "Quantified Impact", val: scanResult.impactMetricScore, color: "text-emerald-400" },
              { label: "ATS Parsability", val: scanResult.parsabilityScore, color: "text-cyan-400" }
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between"
              >
                <span className="text-xs text-slate-400">{stat.label}</span>
                <span className={`text-sm font-bold ${stat.color}`}>{stat.val}%</span>
              </div>
            ))}
          </div>

          {/* Enterprise ATS Vendor Parser Simulator (Workday / Greenhouse / Lever / Taleo) */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                  Corporate ATS Vendor Parser Calibration (Jobscan Moat)
                </span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Simulate how specific corporate ATS engines parse and weight your resume:
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ATS_VENDOR_PROFILES.map((vendor) => (
                  <button
                    key={vendor.id}
                    onClick={() => setSelectedVendorId(vendor.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      selectedVendorId === vendor.id
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {vendor.name.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="text-slate-200 font-semibold">
                  {activeVendor.name}{" "}
                  <span className="text-slate-500 font-normal">
                    — Used by {activeVendor.usedByCompanies.join(", ")}
                  </span>
                </div>
                <p className="text-slate-400 leading-relaxed">{activeVendor.parsingBehavior}</p>
                <p className="text-emerald-300/90 text-[11px]">
                  <strong>Insider Recruiter Tip:</strong> {activeVendor.recruiterTip}
                </p>
              </div>
              <div className="shrink-0 text-right bg-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-800">
                <div className="text-[10px] uppercase text-slate-400 font-semibold">
                  {activeVendor.name.split(" ")[0]} Score
                </div>
                <div className="text-lg font-extrabold text-indigo-300">
                  {vendorCalibratedScore}%
                </div>
              </div>
            </div>
          </div>

          {/* File Upload + PDF Export + Preset Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.md"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-xs font-semibold text-indigo-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Resume (.PDF / .DOCX / .TXT)</span>
              </button>

              <button
                onClick={handleExportCleanAtsPdf}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-xs font-semibold text-emerald-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export ATS-Clean PDF</span>
              </button>

              <button
                onClick={handleSaveScanSnapshot}
                disabled={savingScan}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-xs font-semibold text-cyan-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" />
                <span>{savingScan ? "Saving..." : "Log Scan to SQLite"}</span>
              </button>

              {uploadStatus && (
                <span className="text-xs text-emerald-400 font-medium">{uploadStatus}</span>
              )}
            </div>

            <div className="flex gap-2">
              {RESUME_JD_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleLoadPreset(preset.id)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
                >
                  Load {preset.company} ({preset.level})
                </button>
              ))}
            </div>
          </div>

          {layoutWarning && (
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{layoutWarning}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col">
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4" />
                  Your Resume
                </label>
                <span className="text-[11px] text-slate-500">
                  {resumeText.trim().split(/\s+/).length} words
                </span>
              </div>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={14}
                className="w-full rounded-xl bg-slate-950 border border-slate-800/90 p-3.5 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col">
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                  <Target className="w-4 h-4" />
                  Target Job Description
                </label>
                <span className="text-[11px] text-slate-500">Auto-parsed</span>
              </div>
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                rows={14}
                className="w-full rounded-xl bg-slate-950 border border-slate-800/90 p-3.5 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>
          </div>

          {/* Bottom Next-Step Bar */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-slate-300">{scanResult.executiveSummary}</p>
            <button
              onClick={() => setSubStep("bullets")}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <span>Review {scanResult.bulletCritiques.length} Bullets</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: FOCUSED XYZ BULLET REWRITER */}
      {subStep === "bullets" && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-indigo-400" />
                Google XYZ Bullet-by-Bullet Optimizer
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Formula: Accomplished <strong className="text-indigo-300">[X]</strong> as measured by{" "}
                <strong className="text-emerald-300">[Y]</strong>, by doing{" "}
                <strong className="text-cyan-300">[Z]</strong>.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCleanAtsPdf}
                className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-xs font-semibold text-emerald-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Updated PDF</span>
              </button>
              <button
                onClick={() => setSubStep("keywords")}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
              >
                <span>Next: Keyword Gaps</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {scanResult.bulletCritiques.map((b) => {
              const isStrong = b.score >= 85;
              const alreadyApplied = appliedBulletIds[b.id] || b.original === b.xyzRewrite;
              return (
                <div
                  key={b.id}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/90 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isStrong
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-amber-500/15 text-amber-300"
                        }`}
                      >
                        Score: {b.score}/100
                      </span>
                      {!b.hasQuantifiedMetric && (
                        <span className="text-xs text-rose-300">
                          • Missing quantified metric (%, ms, QPS)
                        </span>
                      )}
                    </div>

                    {!alreadyApplied && (
                      <button
                        onClick={() => handleApplyXyzRewrite(b.original, b.xyzRewrite, b.id)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Apply Rewrite
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    {b.original}
                  </div>

                  {!alreadyApplied && (
                    <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-1">
                      <div className="text-[11px] font-semibold text-indigo-300">
                        Suggested {scanResult.detectedLevel} XYZ Rewrite:
                      </div>
                      <div className="text-xs text-white leading-relaxed">{b.xyzRewrite}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 3: FOCUSED KEYWORD GAPS, PARSABILITY & NEXT STEPS */}
      {subStep === "keywords" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">Keyword Alignment</h3>
                <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  {(["all", "missing", "found"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setKeywordFilter(f)}
                      className={`px-2.5 py-1 rounded text-xs font-medium capitalize cursor-pointer ${
                        keywordFilter === f
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredKeywords.map((item) => (
                  <div
                    key={item.keyword}
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      item.foundInResume
                        ? "bg-emerald-950/15 border-emerald-500/25"
                        : "bg-rose-950/15 border-rose-500/25"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {item.foundInResume ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <span className="text-xs font-medium text-white">{item.keyword}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {item.foundInResume ? `${item.frequencyInResume}x` : "Missing"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-4">ATS Parsability Checklist</h3>
              <div className="space-y-2.5">
                {scanResult.formattingChecks.map((chk) => (
                  <div
                    key={chk.id}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-2.5"
                  >
                    {chk.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="text-xs font-medium text-slate-200">{chk.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{chk.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-indigo-500/30 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Recommended Practice Modules for This Job Description
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {scanResult.prepRecommendations.map((rec, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="text-xs font-bold text-white mb-1">{rec.skillGap}</div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{rec.reason}</p>
                  </div>
                  <button
                    onClick={() => onNavigateToModule(rec.recommendedModule, rec.targetTopicId)}
                    className="w-full py-2 px-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>{rec.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
