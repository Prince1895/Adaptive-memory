"use client";

import React, { useState } from "react";
import { 
  Sparkles,
  Play,
  Pause,
  Info,
  CheckCircle2,
  ArrowRight
} from "lucide-react";

type FlowMode = "all" | "add" | "search" | "state_change";

export function AnimatedArchitectureDiagram() {
  const [activeMode, setActiveMode] = useState<FlowMode>("all");
  const [isPlaying, setIsPlaying] = useState(true);

  // Configuration for path states based on selected mode
  const isPathActive = (pathId: string) => {
    if (activeMode === "all") return true;
    if (activeMode === "add") {
      return ["p-browser-next", "p-next-express", "p-express-core", "p-core-openrouter", "p-core-sqlite"].includes(pathId);
    }
    if (activeMode === "search") {
      return ["p-browser-next", "p-next-express", "p-express-core", "p-core-sqlite"].includes(pathId);
    }
    if (activeMode === "state_change") {
      return ["p-browser-next", "p-next-express", "p-express-core", "p-core-openrouter", "p-core-sqlite"].includes(pathId);
    }
    return true;
  };

  const getFlowColor = () => {
    if (activeMode === "add") return "#3b82f6"; // Blue
    if (activeMode === "search") return "#10b981"; // Green
    if (activeMode === "state_change") return "#ec4899"; // Pink
    return "#f59e0b"; // Amber default
  };

  const getModeInfo = () => {
    switch (activeMode) {
      case "add":
        return {
          title: "Memory Add Execution Pipeline",
          color: "border-blue-500/30 bg-blue-500/10 text-blue-400",
          steps: [
            "User submits chat message in Next.js UI",
            "Express receives /api/chat payload",
            "adaptive-context-memory runs extraction via OpenRouter LLM",
            "New semantic facts & episodic bubbles saved into SQLite"
          ]
        };
      case "search":
        return {
          title: "MMR Vector Search Pipeline",
          color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
          steps: [
            "User asks question or prompt",
            "Express calls memoryStore.search(query, conversationId)",
            "Pure JS vector engine executes cosine similarity on SQLite vectors",
            "MMR algorithm balances query relevance with informational diversity"
          ]
        };
      case "state_change":
        return {
          title: "Smart State-Change & Negation Pipeline",
          color: "border-pink-500/30 bg-pink-500/10 text-pink-400",
          steps: [
            "User states workflow shift (e.g. 'stopped using Rust')",
            "Tool classifier evaluates turn against existing memory store",
            "Triggers DELETE / REPLACE action on stale memory",
            "SQLite database synchronously updates to prevent hallucinations"
          ]
        };
      default:
        return {
          title: "Complete End-to-End System Pipeline",
          color: "border-amber-500/30 bg-amber-500/10 text-amber-400",
          steps: [
            "Next.js Frontend communicates via HTTP with Express API (:8000)",
            "Express handles JWT Auth & delegates memory operations to core npm library",
            "adaptive-context-memory handles embedding cache, extraction & MMR search",
            "Persists data locally in SQLite (~/.contextmemory/memory.db)"
          ]
        };
    }
  };

  const modeInfo = getModeInfo();

  return (
    <div className="w-full max-w-5xl mx-auto my-8 rounded-3xl border border-amber-500/20 bg-[#0D0D12] p-6 md:p-8 shadow-2xl relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 relative z-10 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Interactive System Flow
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white">
            Architecture & Execution Flow
          </h3>
          <p className="text-xs md:text-sm text-white/50 mt-1">
            Click a flow mode below to simulate real-time packet movement between modules.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 bg-[#171721] p-1.5 rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => setActiveMode("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeMode === "all"
                ? "bg-amber-500 text-black shadow-lg shadow-amber-500/25"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            All Flows
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("add")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeMode === "add"
                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            Memory Add
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("search")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeMode === "search"
                ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/25"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            MMR Search
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("state_change")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeMode === "state_change"
                ? "bg-pink-500 text-white shadow-lg shadow-pink-500/25"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            State Resolution
          </button>
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors border-l border-white/10 ml-1 pl-2"
            title={isPlaying ? "Pause Flow Animation" : "Play Flow Animation"}
          >
            {isPlaying ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>

      {/* Active Flow Explanation Banner */}
      <div className={`p-4 rounded-2xl border ${modeInfo.color} mb-6 transition-all`}>
        <div className="flex items-center gap-2 font-bold text-sm mb-2">
          <Info className="w-4 h-4" />
          {modeInfo.title}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {modeInfo.steps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-white/80 bg-black/30 p-2 rounded-xl border border-white/5">
              <span className="w-4 h-4 rounded-full bg-white/10 text-white flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5 font-bold">
                {idx + 1}
              </span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pure SVG Diagram Canvas (Pixel Perfect Alignment) */}
      <div className="relative w-full overflow-x-auto">
        <div className="min-w-[850px]">
          <svg className="w-full h-[650px] block overflow-visible" viewBox="0 0 900 650">
            <defs>
              <filter id="svg-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              <linearGradient id="express-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>

              <linearGradient id="core-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
            </defs>

            {/* CONNECTING PATHS */}
            {/* Path 1: User Browser -> Next.js */}
            <path
              id="p-browser-next"
              d="M 450 92 L 450 138"
              fill="none"
              stroke={isPathActive("p-browser-next") ? getFlowColor() : "rgba(255,255,255,0.08)"}
              strokeWidth={isPathActive("p-browser-next") ? "2.5" : "1.5"}
              strokeDasharray="6 6"
              className="transition-colors duration-300"
            />

            {/* Path 2: Next.js -> Express */}
            <path
              id="p-next-express"
              d="M 450 202 L 450 256"
              fill="none"
              stroke={isPathActive("p-next-express") ? getFlowColor() : "rgba(255,255,255,0.08)"}
              strokeWidth={isPathActive("p-next-express") ? "2.5" : "1.5"}
              strokeDasharray="6 6"
              className="transition-colors duration-300"
            />

            {/* Path 3: Express -> adaptive-context-memory Core */}
            <path
              id="p-express-core"
              d="M 360 324 C 360 370, 220 350, 220 398"
              fill="none"
              stroke={isPathActive("p-express-core") ? getFlowColor() : "rgba(255,255,255,0.08)"}
              strokeWidth={isPathActive("p-express-core") ? "2.5" : "1.5"}
              strokeDasharray="6 6"
              className="transition-colors duration-300"
            />

            {/* Path 4: Express -> SQLite Auth */}
            <path
              id="p-express-sqlite-auth"
              d="M 540 324 C 540 370, 680 350, 680 398"
              fill="none"
              stroke={isPathActive("p-express-sqlite-auth") ? "#a855f7" : "rgba(255,255,255,0.08)"}
              strokeWidth={isPathActive("p-express-sqlite-auth") ? "2" : "1.5"}
              strokeDasharray="6 6"
              className="transition-colors duration-300"
            />

            {/* Path 5: adaptive-context-memory Core -> SQLite Vector Store */}
            <path
              id="p-core-sqlite"
              d="M 350 432 L 550 432"
              fill="none"
              stroke={isPathActive("p-core-sqlite") ? getFlowColor() : "rgba(255,255,255,0.08)"}
              strokeWidth={isPathActive("p-core-sqlite") ? "2.5" : "1.5"}
              strokeDasharray="6 6"
              className="transition-colors duration-300"
            />

            {/* Path 6: adaptive-context-memory Core -> OpenRouter API */}
            <path
              id="p-core-openrouter"
              d="M 220 466 L 220 538"
              fill="none"
              stroke={isPathActive("p-core-openrouter") ? getFlowColor() : "rgba(255,255,255,0.08)"}
              strokeWidth={isPathActive("p-core-openrouter") ? "2.5" : "1.5"}
              strokeDasharray="6 6"
              className="transition-colors duration-300"
            />

            {/* PATH LABELS */}
            <g className="text-[10px] font-mono font-semibold">
              {/* HTTP / API Label */}
              <rect x="405" y="105" width="90" height="20" rx="6" fill="#171721" stroke="#333" />
              <text x="450" y="119" textAnchor="middle" fill={isPathActive("p-browser-next") ? getFlowColor() : "#888"}>HTTP / API</text>

              {/* /api/* proxy Label */}
              <rect x="400" y="218" width="100" height="20" rx="6" fill="#171721" stroke="#333" />
              <text x="450" y="232" textAnchor="middle" fill={isPathActive("p-next-express") ? getFlowColor() : "#888"}>/api/* proxy</text>

              {/* npm imports Label */}
              <rect x="235" y="340" width="90" height="20" rx="6" fill="#171721" stroke="#333" />
              <text x="280" y="354" textAnchor="middle" fill={isPathActive("p-express-core") ? getFlowColor() : "#888"}>npm imports</text>

              {/* JWT Auth Label */}
              <rect x="575" y="340" width="80" height="20" rx="6" fill="#171721" stroke="#333" />
              <text x="615" y="354" textAnchor="middle" fill={isPathActive("p-express-sqlite-auth") ? "#a855f7" : "#888"}>JWT Auth</text>

              {/* Store / Retrieve Label */}
              <rect x="390" y="422" width="120" height="20" rx="6" fill="#171721" stroke="#333" />
              <text x="450" y="436" textAnchor="middle" fill={isPathActive("p-core-sqlite") ? getFlowColor() : "#888"}>store / retrieve</text>

              {/* Embeddings + LLM Label */}
              <rect x="155" y="492" width="130" height="20" rx="6" fill="#171721" stroke="#333" />
              <text x="220" y="506" textAnchor="middle" fill={isPathActive("p-core-openrouter") ? getFlowColor() : "#888"}>embeddings + LLM</text>
            </g>

            {/* FLOWING ANIMATED DATA PARTICLES */}
            {isPlaying && (
              <>
                {isPathActive("p-browser-next") && (
                  <g filter="url(#svg-glow)">
                    <circle r="5" fill={getFlowColor()}>
                      <animateMotion dur="1.5s" repeatCount="indefinite" path="M 450 92 L 450 138" />
                    </circle>
                  </g>
                )}

                {isPathActive("p-next-express") && (
                  <g filter="url(#svg-glow)">
                    <circle r="5" fill={getFlowColor()}>
                      <animateMotion dur="1.6s" repeatCount="indefinite" path="M 450 202 L 450 256" />
                    </circle>
                  </g>
                )}

                {isPathActive("p-express-core") && (
                  <g filter="url(#svg-glow)">
                    <circle r="5" fill={getFlowColor()}>
                      <animateMotion dur="2.2s" repeatCount="indefinite" path="M 360 324 C 360 370, 220 350, 220 398" />
                    </circle>
                  </g>
                )}

                {isPathActive("p-express-sqlite-auth") && (
                  <g filter="url(#svg-glow)">
                    <circle r="4" fill="#a855f7">
                      <animateMotion dur="2.5s" repeatCount="indefinite" path="M 540 324 C 540 370, 680 350, 680 398" />
                    </circle>
                  </g>
                )}

                {isPathActive("p-core-sqlite") && (
                  <g filter="url(#svg-glow)">
                    <circle r="5" fill={getFlowColor()}>
                      <animateMotion dur="2.0s" repeatCount="indefinite" path="M 350 432 L 550 432" />
                    </circle>
                  </g>
                )}

                {isPathActive("p-core-openrouter") && (
                  <g filter="url(#svg-glow)">
                    <circle r="5" fill={getFlowColor()}>
                      <animateMotion dur="1.8s" repeatCount="indefinite" path="M 220 466 L 220 538" />
                    </circle>
                  </g>
                )}
              </>
            )}

            {/* NODE 1: User Browser (:3000) */}
            <g transform="translate(330, 28)">
              <rect width="240" height="64" rx="16" fill="#171721" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
              <circle cx="36" cy="32" r="18" fill="rgba(245,158,11,0.15)" />
              <path d="M 36 24 C 31.58 24 28 27.58 28 32 C 28 36.42 31.58 40 36 40 C 40.42 40 44 36.42 44 32 C 44 27.58 40.42 24 36 24 Z M 36 26 C 37.5 26 39 28.5 39 32 C 39 35.5 37.5 38 36 38 C 34.5 38 33 35.5 33 32 C 33 28.5 34.5 26 36 26 Z M 30 32 C 30 31.5 35 31.5 42 31.5" stroke="#f59e0b" strokeWidth="1.5" fill="none" />
              <text x="68" y="28" fill="#ffffff" fontWeight="bold" fontSize="13">User Browser</text>
              <rect x="156" y="16" width="46" height="16" rx="4" fill="rgba(245,158,11,0.2)" />
              <text x="179" y="28" fill="#fbbf24" fontFamily="monospace" fontSize="10" fontWeight="bold" textAnchor="middle">:3000</text>
              <text x="68" y="46" fill="#888899" fontSize="11">Next.js Web Interface</text>
            </g>

            {/* NODE 2: Next.js Frontend */}
            <g transform="translate(330, 138)">
              <rect width="240" height="64" rx="16" fill="#171721" stroke="rgba(59,130,246,0.3)" strokeWidth="1.5" />
              <circle cx="36" cy="32" r="18" fill="rgba(59,130,246,0.15)" />
              <path d="M 28 28 L 36 23 L 44 28 L 36 33 Z M 28 32 L 36 37 L 44 32 M 28 36 L 36 41 L 44 36" stroke="#3b82f6" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <text x="68" y="30" fill="#ffffff" fontWeight="bold" fontSize="13">Next.js Frontend</text>
              <text x="68" y="47" fill="#888899" fontSize="11">React 19 / D3 Graph Visualizer</text>
            </g>

            {/* NODE 3: Express Backend (:8000) */}
            <g transform="translate(310, 256)">
              <rect width="280" height="68" rx="18" fill="#1E1C27" stroke="url(#express-grad)" strokeWidth="2" filter="url(#svg-glow)" />
              <rect width="280" height="68" rx="18" fill="#1E1C27" stroke="url(#express-grad)" strokeWidth="2" />
              <rect x="18" y="14" width="40" height="40" rx="12" fill="url(#express-grad)" />
              <path d="M 30 28 L 46 28 M 30 34 L 46 34 M 30 40 L 46 40" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
              <text x="70" y="32" fill="#ffffff" fontWeight="bold" fontSize="14">Express Backend</text>
              <rect x="215" y="18" width="46" height="18" rx="4" fill="rgba(245,158,11,0.2)" />
              <text x="238" y="31" fill="#fbbf24" fontFamily="monospace" fontSize="10" fontWeight="bold" textAnchor="middle">:8000</text>
              <text x="70" y="50" fill="#aaaaaa" fontSize="11">TypeScript Express REST API</text>
            </g>

            {/* NODE 4: adaptive-context-memory Core Package */}
            <g transform="translate(90, 398)">
              <rect width="260" height="68" rx="18" fill="#161A26" stroke="#3b82f6" strokeWidth="2" />
              <rect x="16" y="14" width="40" height="40" rx="12" fill="rgba(59,130,246,0.2)" />
              <path d="M 36 24 L 45 29 L 45 39 L 36 44 L 27 39 L 27 29 Z M 27 29 L 36 34 L 45 29 M 36 34 L 36 44" stroke="#60a5fa" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <text x="68" y="30" fill="#ffffff" fontWeight="bold" fontSize="12">adaptive-context-memory</text>
              <rect x="68" y="36" width="160" height="18" rx="4" fill="rgba(245,158,11,0.15)" />
              <text x="148" y="49" fill="#fbbf24" fontFamily="monospace" fontSize="10" fontWeight="bold" textAnchor="middle">npm v1.0.0 (TypeScript Engine)</text>
            </g>

            {/* NODE 5: SQLite Vector Database */}
            <g transform="translate(550, 398)">
              <rect width="260" height="68" rx="18" fill="#1C1826" stroke="#a855f7" strokeWidth="2" />
              <rect x="16" y="14" width="40" height="40" rx="12" fill="rgba(168,85,247,0.2)" />
              <ellipse cx="36" cy="27" rx="10" ry="4" stroke="#c084fc" strokeWidth="1.5" fill="none" />
              <path d="M 26 27 L 26 37 C 26 39 30 41 36 41 C 42 41 46 39 46 37 L 46 27" stroke="#c084fc" strokeWidth="1.5" fill="none" />
              <text x="68" y="32" fill="#ffffff" fontWeight="bold" fontSize="13">SQLite Vector Database</text>
              <text x="68" y="50" fill="#888899" fontSize="11">better-sqlite3 / App & Memory Store</text>
            </g>

            {/* NODE 6: OpenRouter API */}
            <g transform="translate(90, 538)">
              <rect width="260" height="64" rx="16" fill="#15201C" stroke="#10b981" strokeWidth="1.5" />
              <rect x="16" y="12" width="40" height="40" rx="12" fill="rgba(16,185,129,0.2)" />
              <rect x="30" y="26" width="12" height="12" rx="2" stroke="#34d399" strokeWidth="1.5" fill="none" />
              <path d="M 36 21 L 36 26 M 36 38 L 36 43 M 25 32 L 30 32 M 42 32 L 47 32" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" />
              <text x="68" y="30" fill="#ffffff" fontWeight="bold" fontSize="13">OpenRouter API</text>
              <text x="68" y="47" fill="#888899" fontSize="11">GPT-4o / Claude & Embeddings</text>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
