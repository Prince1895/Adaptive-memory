"use client";

import { useState } from "react";
import { ZoomIn, ZoomOut, RotateCcw, Sparkles, Trash2, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";
import { api } from "@/lib/api";

interface GraphControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

export function GraphControls({ onZoomIn, onZoomOut, onResetView }: GraphControlsProps) {
  const [isConsolidating, setIsConsolidating] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  const handleConsolidate = async () => {
    setIsConsolidating(true);
    try {
      const res = await api.consolidateMemories();
      toast.success(`Consolidated ${res.consolidated_count} duplicate memories into unified facts!`);
      mutate((key) => typeof key === "string" && key.includes("memories"));
    } catch (err: any) {
      toast.error(err.message || "Failed to consolidate memories");
    } finally {
      setIsConsolidating(false);
    }
  };

  const handlePurge = async () => {
    if (!confirm("Are you sure you want to purge episodic bubbles older than 30 days?")) return;
    setIsPurging(true);
    try {
      const res = await api.purgeMemories(30);
      toast.success(`Purged ${res.purged_count} old episodic bubbles!`);
      mutate((key) => typeof key === "string" && key.includes("memories"));
    } catch (err: any) {
      toast.error(err.message || "Failed to purge memories");
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
      {/* Zoom controls group */}
      <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg shadow-lg flex flex-col">
        <button
          onClick={onZoomIn}
          className="p-2 hover:bg-muted transition-colors rounded-t-lg border-b border-border text-muted-foreground hover:text-foreground"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={onZoomOut}
          className="p-2 hover:bg-muted transition-colors border-b border-border text-muted-foreground hover:text-foreground"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={onResetView}
          className="p-2 hover:bg-muted transition-colors rounded-b-lg text-muted-foreground hover:text-foreground"
          title="Reset view"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Advanced Memory Actions */}
      <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg shadow-lg flex flex-col">
        <button
          onClick={handleConsolidate}
          disabled={isConsolidating}
          className="p-2 hover:bg-muted transition-colors rounded-t-lg border-b border-border text-amber-500 hover:text-amber-600 disabled:opacity-50"
          title="Consolidate duplicate memories (LLM)"
        >
          {isConsolidating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        </button>
        <button
          onClick={handlePurge}
          disabled={isPurging}
          className="p-2 hover:bg-muted transition-colors rounded-b-lg text-muted-foreground hover:text-destructive disabled:opacity-50"
          title="Purge old episodic bubbles (>30d)"
        >
          {isPurging ? <Loader2 className="w-4 h-4 animate-spin text-destructive" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
