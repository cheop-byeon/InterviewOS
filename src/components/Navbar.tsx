"use client";

import React, { useState } from "react";
import {
  Briefcase,
  Building2,
  Cpu,
  FileSearch,
  Layers,
  LayoutDashboard,
  MessageSquareCode,
  Network,
  Settings,
  Sparkles,
  X
} from "lucide-react";
import { ActiveTab, LLMConfig, TargetLevel } from "../lib/types";

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  targetLevel: TargetLevel;
  setTargetLevel: (level: TargetLevel) => void;
  llmConfig: LLMConfig;
  setLlmConfig: (cfg: LLMConfig) => void;
  atsScore: number;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  targetLevel,
  setTargetLevel,
  llmConfig,
  setLlmConfig,
  atsScore
}: NavbarProps) {
  const [showAiModal, setShowAiModal] = useState(false);

  const navGroups: {
    groupLabel: string;
    items: { id: ActiveTab; label: string; badge?: string; icon: React.ReactNode }[];
  }[] = [
    {
      groupLabel: "Overview",
      items: [
        { id: "dashboard", label: "Home", icon: <LayoutDashboard className="w-4 h-4" /> }
      ]
    },
    {
      groupLabel: "Prepare & Optimize",
      items: [
        {
          id: "ats_lab",
          label: "ATS & Resume Lab",
          badge: `${atsScore}%`,
          icon: <FileSearch className="w-4 h-4" />
        },
        {
          id: "visual_library",
          label: "Visual Concepts",
          icon: <Layers className="w-4 h-4" />
        },
        {
          id: "question_bank",
          label: "Company Questions",
          badge: "Live",
          icon: <Building2 className="w-4 h-4" />
        }
      ]
    },
    {
      groupLabel: "Interactive Practice",
      items: [
        {
          id: "system_design",
          label: "System Design",
          icon: <Network className="w-4 h-4" />
        },
        {
          id: "mock_interview",
          label: "AI Mock Studio",
          icon: <MessageSquareCode className="w-4 h-4" />
        }
      ]
    },
    {
      groupLabel: "Career Pipeline",
      items: [
        {
          id: "job_crm",
          label: "Job CRM & STAR",
          icon: <Briefcase className="w-4 h-4" />
        }
      ]
    }
  ];

  const levelDescriptions: Record<TargetLevel, string> = {
    L4: "Mid-Level (IC4)",
    L5: "Senior (IC5)",
    L6: "Staff+ (IC6)"
  };

  return (
    <>
      <aside className="w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-[#0b101b] flex flex-col justify-between">
        <div className="p-5">
          {/* Brand Header */}
          <div
            onClick={() => setActiveTab("dashboard")}
            className="flex items-center gap-3 cursor-pointer mb-8"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white">
                Interview<span className="text-indigo-400">OS</span>
              </span>
              <span className="block text-[11px] text-slate-400">
                Career & Prep Workspace
              </span>
            </div>
          </div>

          {/* Grouped Sidebar Navigation */}
          <div className="flex lg:flex-col gap-2 lg:gap-6 overflow-x-auto pb-2 lg:pb-0">
            {navGroups.map((group) => (
              <div key={group.groupLabel} className="flex lg:flex-col gap-1 shrink-0">
                <div className="hidden lg:block text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-3 mb-1">
                  {group.groupLabel}
                </div>
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                        isActive
                          ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 font-semibold"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={isActive ? "text-indigo-400" : "text-slate-400"}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                            isActive
                              ? "bg-indigo-500/25 text-indigo-200"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Sidebar Controls: Target Level & AI Settings */}
        <div className="hidden lg:flex flex-col gap-3 p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
              <span>Target Bar</span>
              <span className="text-indigo-300 font-medium">
                {levelDescriptions[targetLevel]}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {(["L4", "L5", "L6"] as TargetLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setTargetLevel(lvl)}
                  className={`py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    targetLevel === lvl
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowAiModal(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {llmConfig.mode === "hybrid_local"
                  ? "Smart Rubric Engine"
                  : `Live LLM (${llmConfig.mode})`}
              </span>
            </div>
            <Settings className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </aside>

      {/* AI Engine Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-400" />
                <h3 className="font-semibold text-white text-base">
                  AI & Rubric Evaluation Settings
                </h3>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              InterviewOS works out-of-the-box with its built-in rubric engine. Optionally connect your own API key for live LLM generation.
            </p>

            <div className="space-y-3 mb-5">
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: "hybrid_local", label: "Built-in Rubric (Default)" },
                    { id: "gemini", label: "Google Gemini API" },
                    { id: "openai", label: "OpenAI GPT-4o API" },
                    { id: "anthropic", label: "Anthropic Claude API" }
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setLlmConfig({ ...llmConfig, mode: opt.id })}
                    className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${
                      llmConfig.mode === opt.id
                        ? "bg-indigo-600/20 border-indigo-500 text-white"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {llmConfig.mode !== "hybrid_local" && (
                <div className="pt-2 space-y-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    {llmConfig.mode.toUpperCase()} API Key
                  </label>
                  <input
                    type="password"
                    value={llmConfig.apiKey}
                    onChange={(e) => setLlmConfig({ ...llmConfig, apiKey: e.target.value })}
                    placeholder="Paste API key..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
