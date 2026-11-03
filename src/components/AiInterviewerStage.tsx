"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  PhoneCall,
  Radio,
  Sparkles,
  Volume2,
  VolumeX
} from "lucide-react";
import { TargetLevel } from "../lib/types";

export interface InterviewerPersonaProfile {
  companyId: string;
  name: string;
  roleTitle: string;
  location: string;
  accentGradient: string;
  suitColor: string;
  shirtColor: string;
  hairColor: string;
  skinTone: string;
  glasses: boolean;
  beard?: boolean;
  hairStyle: "short_parted" | "wavy_medium" | "bun_modern" | "textured_crop";
  voiceLangHint: string;
  voicePitch: number;
  voiceRate: number;
}

export const INTERVIEWER_PERSONAS: Record<string, InterviewerPersonaProfile> = {
  finn_vend_schibsted: {
    companyId: "finn_vend_schibsted",
    name: "Henrik Solberg",
    roleTitle: "Staff Marketplace & Edge Architect",
    location: "Oslo (FINN.no / Vend & VG)",
    accentGradient: "from-sky-500/30 via-blue-600/20 to-slate-950",
    suitColor: "#1e3a5f",
    shirtColor: "#38bdf8",
    hairColor: "#b47b48",
    skinTone: "#f3cfb3",
    glasses: true,
    beard: true,
    hairStyle: "short_parted",
    voiceLangHint: "en-GB",
    voicePitch: 0.96,
    voiceRate: 1.03
  },
  spotify_nordic: {
    companyId: "spotify_nordic",
    name: "Astrid Lindholm",
    roleTitle: "Staff Backend Engineer — Playback Squad",
    location: "Stockholm HQ (Spotify)",
    accentGradient: "from-emerald-500/30 via-teal-600/20 to-slate-950",
    suitColor: "#14532d",
    shirtColor: "#10b981",
    hairColor: "#d9a05b",
    skinTone: "#f5d5bc",
    glasses: false,
    hairStyle: "wavy_medium",
    voiceLangHint: "en-GB",
    voicePitch: 1.08,
    voiceRate: 1.04
  },
  klarna_wolt_nordic: {
    companyId: "klarna_wolt_nordic",
    name: "Maja Virtanen",
    roleTitle: "Principal Distributed Systems Lead",
    location: "Helsinki / Stockholm (Wolt & Klarna)",
    accentGradient: "from-pink-500/25 via-indigo-600/20 to-slate-950",
    suitColor: "#312e81",
    shirtColor: "#f472b6",
    hairColor: "#4a2e1b",
    skinTone: "#f2ceb2",
    glasses: true,
    hairStyle: "bun_modern",
    voiceLangHint: "en-GB",
    voicePitch: 1.06,
    voiceRate: 1.03
  },
  stripe: {
    companyId: "stripe",
    name: "Marcus Vance",
    roleTitle: "L6 Core Payments & Ledger Bar Raiser",
    location: "San Francisco / Dublin (Stripe)",
    accentGradient: "from-indigo-500/30 via-violet-600/20 to-slate-950",
    suitColor: "#1e1b4b",
    shirtColor: "#818cf8",
    hairColor: "#1f2937",
    skinTone: "#c68b59",
    glasses: true,
    beard: true,
    hairStyle: "textured_crop",
    voiceLangHint: "en-US",
    voicePitch: 0.94,
    voiceRate: 1.04
  },
  openai_anthropic: {
    companyId: "openai_anthropic",
    name: "Dr. Elena Rostova",
    roleTitle: "Staff AI Inference & GPU Cluster Architect",
    location: "San Francisco (OpenAI / Anthropic)",
    accentGradient: "from-emerald-500/30 via-cyan-600/20 to-slate-950",
    suitColor: "#0f172a",
    shirtColor: "#34d399",
    hairColor: "#3b2314",
    skinTone: "#f0c8a8",
    glasses: true,
    hairStyle: "wavy_medium",
    voiceLangHint: "en-US",
    voicePitch: 1.05,
    voiceRate: 1.05
  },
  uber: {
    companyId: "uber",
    name: "Devon Patel",
    roleTitle: "Staff Geo-Dispatch & Real-Time Infra Lead",
    location: "San Francisco (Uber)",
    accentGradient: "from-cyan-500/30 via-blue-600/20 to-slate-950",
    suitColor: "#111827",
    shirtColor: "#22d3ee",
    hairColor: "#111827",
    skinTone: "#b98052",
    glasses: false,
    beard: true,
    hairStyle: "short_parted",
    voiceLangHint: "en-US",
    voicePitch: 0.97,
    voiceRate: 1.05
  },
  meta: {
    companyId: "meta",
    name: "Sarah Chen",
    roleTitle: "IC6 Production & Realtime Systems Interviewer",
    location: "Menlo Park (Meta)",
    accentGradient: "from-blue-500/30 via-indigo-600/20 to-slate-950",
    suitColor: "#172554",
    shirtColor: "#60a5fa",
    hairColor: "#18181b",
    skinTone: "#f1c7a3",
    glasses: false,
    hairStyle: "bun_modern",
    voiceLangHint: "en-US",
    voicePitch: 1.07,
    voiceRate: 1.06
  },
  google: {
    companyId: "google",
    name: "David Kim",
    roleTitle: "L6 Distributed Storage & SRE Bar Raiser",
    location: "Mountain View / Zurich (Google)",
    accentGradient: "from-amber-500/25 via-blue-600/20 to-slate-950",
    suitColor: "#1e293b",
    shirtColor: "#fbbf24",
    hairColor: "#18181b",
    skinTone: "#f0c7a4",
    glasses: true,
    hairStyle: "short_parted",
    voiceLangHint: "en-US",
    voicePitch: 0.98,
    voiceRate: 1.04
  }
};

interface AiInterviewerStageProps {
  companyLoopId: string;
  companyName: string;
  targetLevel: TargetLevel;
  isAiSpeaking: boolean;
  isListening: boolean;
  isThinking: boolean;
  ttsEnabled: boolean;
  handsFreeMode: boolean;
  latestInterviewerText: string;
  liveTranscriptPreview: string;
  clarityScore: number;
  depthScore: number;
  onToggleTts: () => void;
  onToggleMic: () => void;
  onToggleHandsFree: () => void;
  onReplayLastPrompt: () => void;
}

export default function AiInterviewerStage({
  companyLoopId,
  companyName,
  targetLevel,
  isAiSpeaking,
  isListening,
  isThinking,
  ttsEnabled,
  handsFreeMode,
  latestInterviewerText,
  liveTranscriptPreview,
  clarityScore,
  depthScore,
  onToggleTts,
  onToggleMic,
  onToggleHandsFree,
  onReplayLastPrompt
}: AiInterviewerStageProps) {
  const persona =
    INTERVIEWER_PERSONAS[companyLoopId] || INTERVIEWER_PERSONAS.finn_vend_schibsted;

  // Mouth viseme state (0 = closed smile, 1 = slightly open, 2 = medium vowel, 3 = wide vowel)
  const [mouthViseme, setMouthViseme] = useState<number>(0);
  const [isBlinking, setIsBlinking] = useState<boolean>(false);
  const [headTiltDeg, setHeadTiltDeg] = useState<number>(0);
  const [waveBars, setWaveBars] = useState<number[]>([22, 35, 18, 42, 28, 36, 20, 40]);

  // Optional Candidate Self-View Webcam PiP
  const [webcamEnabled, setWebcamEnabled] = useState<boolean>(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Animate mouth visemes & voice waveform when AI is speaking
  useEffect(() => {
    if (!isAiSpeaking) {
      setMouthViseme(0);
      setWaveBars([14, 18, 12, 20, 16, 14, 18, 12]);
      return;
    }

    const interval = setInterval(() => {
      setMouthViseme(Math.floor(Math.random() * 4));
      setHeadTiltDeg((Math.random() - 0.5) * 2.4);
      setWaveBars(
        Array.from({ length: 8 }, () => Math.floor(25 + Math.random() * 70))
      );
    }, 115);

    return () => clearInterval(interval);
  }, [isAiSpeaking]);

  // Animate waveform when user is speaking into microphone
  useEffect(() => {
    if (!isListening || isAiSpeaking) return;
    const interval = setInterval(() => {
      setHeadTiltDeg(1.5); // Attentive listening nod
      setWaveBars(
        Array.from({ length: 8 }, () => Math.floor(20 + Math.random() * 60))
      );
    }, 140);
    return () => clearInterval(interval);
  }, [isListening, isAiSpeaking]);

  // Natural eye blinking every 3.4 seconds
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 3400);
    return () => clearInterval(blinkInterval);
  }, []);

  // Cleanup webcam on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleToggleWebcam = async () => {
    if (webcamEnabled) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setWebcamEnabled(false);
      return;
    }

    setWebcamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
        audio: false
      });
      streamRef.current = stream;
      setWebcamEnabled(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 60);
    } catch {
      setWebcamError("Camera permission blocked or unavailable");
      setWebcamEnabled(false);
    }
  };

  const cleanCaption = latestInterviewerText
    .replace(/\*\*/g, "")
    .replace(/\n+/g, " ")
    .trim();

  const statusLabel = isThinking
    ? "Evaluating your architecture & rubric signals..."
    : isAiSpeaking
    ? `${persona.name} is speaking...`
    : isListening
    ? "Listening to your answer (Speak now)..."
    : "Ready — Click Mic or type below to respond";

  return (
    <div
      className={`relative rounded-2xl border border-slate-800 bg-gradient-to-b ${persona.accentGradient} overflow-hidden p-4 shadow-xl`}
    >
      {/* Top Call Bar: Interviewer Identity + Call Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 z-10 relative">
        <div className="flex items-center gap-2.5">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isAiSpeaking
                ? "bg-emerald-400 animate-ping"
                : isListening
                ? "bg-rose-400 animate-ping"
                : "bg-emerald-400"
            }`}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">{persona.name}</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-900/90 border border-slate-700 text-[10px] font-semibold text-indigo-300">
                {companyName} • {targetLevel} Interviewer
              </span>
            </div>
            <div className="text-[11px] text-slate-300">
              {persona.roleTitle} • {persona.location}
            </div>
          </div>
        </div>

        {/* Call Mode & Audio Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={onToggleHandsFree}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              handsFreeMode
                ? "bg-emerald-600/25 border-emerald-400/50 text-emerald-200"
                : "bg-slate-950/80 border-slate-800 text-slate-300 hover:text-white"
            }`}
            title="Automatically turn on voice & mic for a continuous back-and-forth call"
          >
            <PhoneCall className="w-3 h-3" />
            <span>{handsFreeMode ? "Hands-Free Call: ON" : "Hands-Free Call"}</span>
          </button>

          <button
            onClick={onToggleTts}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 border cursor-pointer ${
              ttsEnabled
                ? "bg-indigo-600/30 border-indigo-400/50 text-indigo-200"
                : "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {ttsEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-indigo-300" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
            <span>{ttsEnabled ? "Voice On" : "Voice Muted"}</span>
          </button>

          <button
            onClick={onReplayLastPrompt}
            className="px-2.5 py-1 rounded-lg bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-[11px] text-slate-300 cursor-pointer"
            title="Have the AI Interviewer speak the question again"
          >
            Repeat Question
          </button>

          <button
            onClick={handleToggleWebcam}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 border cursor-pointer ${
              webcamEnabled
                ? "bg-cyan-600/25 border-cyan-400/50 text-cyan-200"
                : "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {webcamEnabled ? (
              <Camera className="w-3.5 h-3.5 text-cyan-300" />
            ) : (
              <CameraOff className="w-3.5 h-3.5" />
            )}
            <span>{webcamEnabled ? "Self-View On" : "Self-View Cam"}</span>
          </button>
        </div>
      </div>

      {/* Center Stage: Animated AI Interviewer Figure + Audio Visualizer + Optional Candidate PiP */}
      <div className="my-3 relative flex flex-col items-center justify-center min-h-[220px] rounded-xl bg-slate-950/65 border border-slate-800/90 p-3 overflow-hidden">
        {/* Subtle studio background grid & glow */}
        <div
          className={`absolute w-52 h-52 rounded-full blur-3xl transition-all duration-500 ${
            isAiSpeaking
              ? "bg-indigo-500/25 scale-110"
              : isListening
              ? "bg-rose-500/20 scale-105"
              : "bg-sky-500/10 scale-100"
          }`}
        />

        {/* Animated Human Interviewer SVG Figure */}
        <div className="relative z-10 flex flex-col items-center">
          <div
            className={`relative rounded-full p-1 transition-all duration-300 ${
              isAiSpeaking
                ? "ring-4 ring-emerald-400/70 shadow-lg shadow-emerald-500/20"
                : isListening
                ? "ring-4 ring-rose-500/70 shadow-lg shadow-rose-500/20"
                : "ring-2 ring-slate-700/80"
            }`}
          >
            <svg
              width="136"
              height="136"
              viewBox="0 0 160 160"
              className="rounded-full bg-gradient-to-b from-slate-800 to-slate-950"
            >
              {/* Studio Halo */}
              <circle cx="80" cy="80" r="76" fill="url(#studioGrad)" opacity="0.35" />
              <defs>
                <radialGradient id="studioGrad" cx="50%" cy="35%" r="60%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#0f172a" />
                </radialGradient>
              </defs>

              {/* Shoulders / Suit Jacket */}
              <path
                d="M22 160 C26 122, 52 114, 80 114 C108 114, 134 122, 138 160 Z"
                fill={persona.suitColor}
              />
              {/* Inner Shirt / Collar */}
              <polygon points="64,114 80,144 96,114" fill={persona.shirtColor} />
              {/* Suit Lapels */}
              <polygon
                points="56,115 80,145 68,160 48,160"
                fill="#0f172a"
                opacity="0.45"
              />
              <polygon
                points="104,115 80,145 92,160 112,160"
                fill="#0f172a"
                opacity="0.45"
              />

              {/* Neck */}
              <rect
                x="69"
                y="96"
                width="22"
                height="24"
                rx="8"
                fill={persona.skinTone}
              />

              {/* Head Group (Tilts slightly when speaking or nodding) */}
              <g
                transform={`rotate(${headTiltDeg} 80 72)`}
                style={{ transition: "transform 120ms ease-out" }}
              >
                {/* Back Hair for longer styles */}
                {persona.hairStyle === "wavy_medium" && (
                  <path
                    d="M44 55 C38 80, 40 105, 50 112 L110 112 C120 105, 122 80, 116 55 Z"
                    fill={persona.hairColor}
                  />
                )}
                {persona.hairStyle === "bun_modern" && (
                  <circle cx="80" cy="24" r="16" fill={persona.hairColor} />
                )}

                {/* Ears */}
                <circle cx="48" cy="72" r="7" fill={persona.skinTone} />
                <circle cx="112" cy="72" r="7" fill={persona.skinTone} />

                {/* Face Base */}
                <rect
                  x="50"
                  y="34"
                  width="60"
                  height="72"
                  rx="28"
                  fill={persona.skinTone}
                />

                {/* Beard (if persona has beard) */}
                {persona.beard && (
                  <path
                    d="M50 76 C50 98, 64 108, 80 108 C96 108, 110 98, 110 76 C106 86, 94 92, 80 92 C66 92, 54 86, 50 76 Z"
                    fill={persona.hairColor}
                    opacity="0.82"
                  />
                )}

                {/* Top Hair */}
                {persona.hairStyle === "short_parted" && (
                  <path
                    d="M48 56 C48 32, 64 26, 82 26 C100 26, 112 34, 112 56 C104 42, 88 38, 68 42 C58 44, 52 50, 48 56 Z"
                    fill={persona.hairColor}
                  />
                )}
                {persona.hairStyle === "textured_crop" && (
                  <path
                    d="M49 54 C50 30, 65 25, 80 25 C95 25, 110 30, 111 54 C102 42, 58 42, 49 54 Z"
                    fill={persona.hairColor}
                  />
                )}
                {(persona.hairStyle === "wavy_medium" ||
                  persona.hairStyle === "bun_modern") && (
                  <path
                    d="M48 58 C48 30, 64 26, 80 26 C96 26, 112 30, 112 58 C102 42, 86 38, 66 42 C56 44, 51 50, 48 58 Z"
                    fill={persona.hairColor}
                  />
                )}

                {/* Eyebrows (raise slightly when speaking or inquisitive) */}
                <path
                  d={
                    isAiSpeaking
                      ? "M59 56 Q66 52 73 55"
                      : isThinking
                      ? "M59 54 Q66 50 73 55"
                      : "M59 57 Q66 54 73 57"
                  }
                  stroke="#1e293b"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d={
                    isAiSpeaking
                      ? "M87 55 Q94 52 101 56"
                      : isThinking
                      ? "M87 56 Q94 53 101 57"
                      : "M87 57 Q94 54 101 57"
                  }
                  stroke="#1e293b"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Eyes (Blink or look up when thinking) */}
                {isBlinking ? (
                  <>
                    <line
                      x1="61"
                      y1="65"
                      x2="71"
                      y2="65"
                      stroke="#0f172a"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <line
                      x1="89"
                      y1="65"
                      x2="99"
                      y2="65"
                      stroke="#0f172a"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </>
                ) : (
                  <>
                    <ellipse cx="66" cy="65" rx="5.5" ry="4.2" fill="#ffffff" />
                    <circle
                      cx={isThinking ? "68" : "66"}
                      cy={isThinking ? "63.5" : "65"}
                      r="2.7"
                      fill="#0f172a"
                    />
                    <circle cx="65" cy="64" r="1" fill="#ffffff" />

                    <ellipse cx="94" cy="65" rx="5.5" ry="4.2" fill="#ffffff" />
                    <circle
                      cx={isThinking ? "96" : "94"}
                      cy={isThinking ? "63.5" : "65"}
                      r="2.7"
                      fill="#0f172a"
                    />
                    <circle cx="93" cy="64" r="1" fill="#ffffff" />
                  </>
                )}

                {/* Glasses (if persona wears glasses) */}
                {persona.glasses && (
                  <g stroke="#334155" strokeWidth="2" fill="none">
                    <rect
                      x="56"
                      y="59"
                      width="20"
                      height="13"
                      rx="4"
                      fill="#38bdf8"
                      fillOpacity="0.08"
                    />
                    <rect
                      x="84"
                      y="59"
                      width="20"
                      height="13"
                      rx="4"
                      fill="#38bdf8"
                      fillOpacity="0.08"
                    />
                    <line x1="76" y1="65" x2="84" y2="65" />
                  </g>
                )}

                {/* Nose */}
                <path
                  d="M80 67 L78 78 L83 79"
                  stroke="#b48364"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Animated Mouth Visemes (Lip-Sync to Speech!) */}
                {mouthViseme === 0 && (
                  <path
                    d="M71 88 Q80 93 89 88"
                    stroke="#7f1d1d"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    fill="none"
                  />
                )}
                {mouthViseme === 1 && (
                  <ellipse cx="80" cy="89" rx="7" ry="3.2" fill="#7f1d1d" />
                )}
                {mouthViseme === 2 && (
                  <g>
                    <ellipse cx="80" cy="89" rx="8.5" ry="5.5" fill="#7f1d1d" />
                    <rect
                      x="74"
                      y="85"
                      width="12"
                      height="2.2"
                      rx="1"
                      fill="#ffffff"
                    />
                  </g>
                )}
                {mouthViseme === 3 && (
                  <g>
                    <ellipse cx="80" cy="90" rx="6.5" ry="7" fill="#7f1d1d" />
                    <path d="M75 93 Q80 96 85 93" fill="#ef4444" />
                  </g>
                )}

                {/* Headset Boom Mic (Authentic Interviewer Detail) */}
                <path
                  d="M112 74 Q108 92 92 92"
                  stroke="#475569"
                  strokeWidth="2.2"
                  fill="none"
                />
                <circle cx="91" cy="92" r="2.8" fill="#10b981" />
              </g>
            </svg>

            {/* Live Speaking / Listening Badge */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[10px] font-bold text-white whitespace-nowrap flex items-center gap-1 shadow">
              <Radio
                className={`w-3 h-3 ${
                  isAiSpeaking
                    ? "text-emerald-400"
                    : isListening
                    ? "text-rose-400"
                    : "text-indigo-400"
                }`}
              />
              <span>
                {isThinking
                  ? "Thinking..."
                  : isAiSpeaking
                  ? "AI Speaking"
                  : isListening
                  ? "Listening to You"
                  : "Live Video"}
              </span>
            </div>
          </div>

          {/* Real-time Audio Waveform Visualizer */}
          <div className="mt-4 flex items-end justify-center gap-1 h-7">
            {waveBars.map((heightPct, idx) => (
              <div
                key={idx}
                style={{
                  height: `${
                    isAiSpeaking || isListening ? Math.max(18, heightPct) : 18
                  }%`
                }}
                className={`w-1.5 rounded-full transition-all duration-100 ${
                  isAiSpeaking
                    ? "bg-emerald-400"
                    : isListening
                    ? "bg-rose-400"
                    : "bg-slate-700"
                }`}
              />
            ))}
          </div>

          <div className="mt-1 text-[11px] font-medium text-slate-300">
            {statusLabel}
          </div>
        </div>

        {/* Optional Candidate Self-View Webcam Picture-in-Picture (Bottom Right) */}
        {webcamEnabled && (
          <div className="absolute bottom-3 right-3 w-32 h-24 rounded-xl overflow-hidden border-2 border-cyan-500/60 bg-slate-900 shadow-lg z-20">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
            <div className="absolute bottom-1 left-1.5 px-1.5 py-0.5 rounded bg-slate-950/80 text-[9px] font-semibold text-cyan-200">
              You (Candidate)
            </div>
          </div>
        )}

        {/* Live Telemetry Overlay (Top Left of Stage) */}
        <div className="absolute top-3 left-3 hidden sm:flex flex-col gap-1 bg-slate-950/80 border border-slate-800/90 rounded-xl p-2.5 text-[10px]">
          <div className="text-slate-400 font-semibold uppercase">Live Rubric Signal</div>
          <div className="flex items-center justify-between gap-3 text-slate-200">
            <span>Clarity:</span>
            <strong className="text-indigo-300">{clarityScore}%</strong>
          </div>
          <div className="flex items-center justify-between gap-3 text-slate-200">
            <span>Tech Depth:</span>
            <strong className="text-emerald-300">{depthScore}%</strong>
          </div>
        </div>

        {/* Prominent Push-to-Speak Button on Stage */}
        <div className="absolute bottom-3 left-3 z-20">
          <button
            onClick={onToggleMic}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border shadow cursor-pointer transition-all ${
              isListening
                ? "bg-rose-600 text-white border-rose-400 animate-pulse"
                : "bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400/50"
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-3.5 h-3.5" />
                <span>Stop & Send Voice</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5" />
                <span>Speak to {persona.name.split(" ")[0]}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {webcamError && (
        <div className="text-[11px] text-amber-300 mb-2">{webcamError}</div>
      )}

      {/* Live Subtitle / Closed-Caption Teleprompter Bar */}
      <div className="rounded-xl bg-slate-950/90 border border-slate-800/90 p-3 text-xs leading-relaxed">
        {isListening && liveTranscriptPreview ? (
          <div className="flex items-start gap-2 text-rose-200">
            <Sparkles className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-rose-300">Live Voice Transcript: </span>
              &ldquo;{liveTranscriptPreview}&rdquo;
            </div>
          </div>
        ) : (
          <div className="text-slate-200">
            <span className="font-bold text-indigo-300">{persona.name}: </span>
            <span className="italic">
              &ldquo;
              {cleanCaption.length > 260
                ? `${cleanCaption.slice(0, 260)}...`
                : cleanCaption}
              &rdquo;
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
