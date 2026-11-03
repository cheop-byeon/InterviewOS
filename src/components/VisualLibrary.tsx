"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Code2,
  Cpu,
  Database,
  Gauge,
  Layers,
  Sparkles,
  Zap
} from "lucide-react";
import {
  CACHING_STRATEGIES,
  CODING_PATTERNS_VISUAL,
  LATENCY_NUMBERS,
  SCALE_ZERO_TO_MILLIONS_STEPS
} from "../lib/data/visualLibraryData";

type VisualTab = "scaling" | "patterns" | "reference";

export default function VisualLibrary() {
  const [activeSubTab, setActiveSubTab] = useState<VisualTab>("scaling");
  const [scaleStepIdx, setScaleStepIdx] = useState<number>(3);
  const [selectedPatternId, setSelectedPatternId] = useState<string>(
    CODING_PATTERNS_VISUAL[0].id
  );
  const [patternStepIdx, setPatternStepIdx] = useState<number>(0);

  const currentScaleStep = SCALE_ZERO_TO_MILLIONS_STEPS[scaleStepIdx];
  const currentPattern =
    CODING_PATTERNS_VISUAL.find((p) => p.id === selectedPatternId) ||
    CODING_PATTERNS_VISUAL[0];
  const currentArrayStep =
    currentPattern.arrayDemo.steps[
      Math.min(patternStepIdx, currentPattern.arrayDemo.steps.length - 1)
    ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Compact Header + Focused Sub-Tab Switcher */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-white">Visual Concept Library</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Interactive mental models for distributed architecture and algorithmic patterns.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab("scaling")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === "scaling"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            1. Scaling 0 → 10M Users
          </button>
          <button
            onClick={() => setActiveSubTab("patterns")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === "patterns"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            2. Coding Patterns
          </button>
          <button
            onClick={() => setActiveSubTab("reference")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === "reference"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            3. Caching & Latency
          </button>
        </div>
      </div>

      {/* VIEW 1: PROGRESSIVE SCALING SLIDER */}
      {activeSubTab === "scaling" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Progressive Architecture Evolution
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Step through how a system evolves as traffic grows 10,000x:
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {SCALE_ZERO_TO_MILLIONS_STEPS.map((st, idx) => (
                <button
                  key={st.stepNumber}
                  onClick={() => setScaleStepIdx(idx)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    scaleStepIdx === idx
                      ? "bg-indigo-600 text-white border-indigo-500"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  Stage {st.stepNumber}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-slate-950/80 border border-slate-800/80 rounded-2xl p-6">
            <div className="lg:col-span-5 space-y-3.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{currentScaleStep.scaleTarget}</span>
              </div>
              <h3 className="text-lg font-bold text-white">{currentScaleStep.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {currentScaleStep.explanation}
              </p>
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-200">
                <strong>Bottleneck Solved:</strong> {currentScaleStep.bottleneckSolved}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 uppercase">Latency</div>
                  <div className="text-sm font-extrabold text-cyan-300 mt-0.5">
                    {currentScaleStep.metrics.latency}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 uppercase">SLA</div>
                  <div className="text-sm font-extrabold text-emerald-300 mt-0.5">
                    {currentScaleStep.metrics.availability}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 uppercase">Peak QPS</div>
                  <div className="text-sm font-extrabold text-indigo-300 mt-0.5">
                    {currentScaleStep.metrics.maxThroughput}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 p-6 rounded-xl bg-[#070b12] border border-slate-800/90 flex flex-col justify-center min-h-[260px]">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-5 text-center">
                Active Topology Pipeline (Stage {currentScaleStep.stepNumber} of 5)
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {currentScaleStep.activeComponents.map((comp, i) => (
                  <React.Fragment key={comp}>
                    <div className="px-4 py-3.5 rounded-xl bg-slate-900 border border-indigo-500/40 shadow-md text-center min-w-[135px]">
                      <div className="text-[10px] text-indigo-400 font-bold uppercase mb-0.5">
                        Tier {i + 1}
                      </div>
                      <div className="text-xs font-bold text-white">{comp}</div>
                    </div>
                    {i < currentScaleStep.activeComponents.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-indigo-400 shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: INTERACTIVE CODING PATTERNS STEPPER */}
      {activeSubTab === "patterns" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                Algorithmic Pointer & Stack Visualizer
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Step through state transitions to build visual intuition:
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {CODING_PATTERNS_VISUAL.map((pat) => (
                <button
                  key={pat.id}
                  onClick={() => {
                    setSelectedPatternId(pat.id);
                    setPatternStepIdx(0);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    selectedPatternId === pat.id
                      ? "bg-indigo-600 text-white border-indigo-500"
                      : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {pat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-slate-950/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-cyan-300">
                    {currentArrayStep.stepTitle}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                    {currentPattern.timeComplexity}
                  </span>
                </div>

                <div className="flex items-center justify-center gap-2.5 my-6 py-5 px-2 rounded-xl bg-[#070b12] border border-slate-800/80">
                  {currentPattern.arrayDemo.array.map((val, idx) => {
                    const isHighlighted = currentArrayStep.highlightIndices.includes(idx);
                    const isLeft = currentArrayStep.leftIdx === idx;
                    const isRight = currentArrayStep.rightIdx === idx;
                    return (
                      <div key={idx} className="flex flex-col items-center gap-1.5">
                        <span className="text-[10px] font-mono text-slate-500">
                          {idx}
                        </span>
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-extrabold border transition-all duration-300 ${
                            isHighlighted
                              ? "bg-indigo-600/30 border-indigo-400 text-white scale-105"
                              : "bg-slate-900 border-slate-800 text-slate-400"
                          }`}
                        >
                          {val}
                        </div>
                        <div className="h-5 flex items-center gap-1">
                          {isLeft && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold">
                              L
                            </span>
                          )}
                          {isRight && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold">
                              R
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 rounded-xl bg-indigo-950/25 border border-indigo-500/30 text-xs font-mono text-indigo-200 mb-2">
                  {currentArrayStep.windowState}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentArrayStep.explanation}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  onClick={() => setPatternStepIdx((p) => Math.max(0, p - 1))}
                  disabled={patternStepIdx === 0}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-xs font-semibold text-white flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Prev
                </button>
                <span className="text-xs text-slate-400">
                  Step {patternStepIdx + 1} of {currentPattern.arrayDemo.steps.length}
                </span>
                <button
                  onClick={() =>
                    setPatternStepIdx((p) =>
                      Math.min(currentPattern.arrayDemo.steps.length - 1, p + 1)
                    )
                  }
                  disabled={patternStepIdx >= currentPattern.arrayDemo.steps.length - 1}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-semibold text-white flex items-center gap-1 cursor-pointer"
                >
                  Next
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 bg-slate-950/90 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div>
                <div className="text-xs font-bold text-white mb-2">
                  When to Use This Pattern:
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {currentPattern.whenToUse.map((w, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="text-xs font-bold text-white mb-2">
                  Template Blueprint:
                </div>
                <pre className="p-3.5 rounded-xl bg-[#070b12] border border-slate-800 text-[11px] font-mono text-cyan-200 overflow-x-auto leading-relaxed">
                  {currentPattern.templateSnippet}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: CACHING & LATENCY CHEAT SHEETS */}
      {activeSubTab === "reference" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">
                Caching Strategies Trade-off Matrix
              </h3>
            </div>
            {CACHING_STRATEGIES.map((cs) => (
              <div
                key={cs.name}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5"
              >
                <div className="text-xs font-bold text-emerald-300">{cs.name}</div>
                <div className="text-[11px] text-slate-400">{cs.bestFor}</div>
                <div className="text-xs text-slate-300 pt-1">
                  <strong>Read:</strong> {cs.readFlow}
                </div>
                <div className="text-xs text-slate-300">
                  <strong>Write:</strong> {cs.writeFlow}
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">
                Reference Latency Numbers
              </h3>
            </div>
            <div className="space-y-2">
              {LATENCY_NUMBERS.map((ln) => (
                <div
                  key={ln.operation}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs text-slate-200">{ln.operation}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    {ln.latencyText}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
