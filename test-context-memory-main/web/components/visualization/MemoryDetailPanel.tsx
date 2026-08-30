import { useState, useEffect } from "react";
import { X, Calendar, Info, Tag, Network, Trash2, Loader2, Pencil, Check, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";
import { api } from "@/lib/api";
import type { Memory } from "@/types/memory";
import { getBubbleColor } from "@/lib/utils";

interface MemoryDetailPanelProps {
  memory: (Memory & { category?: string }) | null;
  linkedMemories: Memory[];
  onClose: () => void;
  onSelectMemory: (id: number) => void;
  useConstantColor?: boolean;
}

export function MemoryDetailPanel({
  memory,
  linkedMemories,
  onClose,
  onSelectMemory,
  useConstantColor = false,
}: MemoryDetailPanelProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    if (memory) {
      setEditText(memory.text);
      setIsEditing(false);
    }
  }, [memory]);

  if (!memory) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const category = (memory as any).category || (memory.type === "semantic" ? "semantic_fact" : "episodic_event");

  const handleDelete = async () => {
    if (!memory || isDeleting) return;
    setIsDeleting(true);
    try {
      await api.deleteMemory(memory.id);
      toast.success(`Deleted memory #${memory.local_id || memory.id}`);
      mutate("/memories");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete memory");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!memory || isSaving || !editText.trim()) return;
    setIsSaving(true);
    try {
      await api.updateMemory(memory.id, editText.trim());
      toast.success("Memory updated successfully");
      memory.text = editText.trim();
      mutate("/memories");
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update memory");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/30 z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed md:absolute top-0 right-0 w-full md:w-96 h-full bg-card border-l border-border shadow-xl flex flex-col animate-slide-in-right z-50 overflow-hidden">
        {/* Header */}
        <div className="border-b border-border p-4 flex items-start justify-between bg-muted/20">
          <div className="flex items-start gap-3 flex-1">
            {/* Memory Icon */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md"
              style={{
                backgroundColor: getBubbleColor(
                  memory.type === "semantic" ? "semantic" : "bubble",
                  memory.created_at,
                  useConstantColor
                ),
              }}
            >
              #{memory.local_id || memory.id}
            </div>

            {/* Memory Title */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm mb-1 line-clamp-2">
                {memory.text}
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(memory.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-md transition-colors"
              title="Edit memory"
              aria-label="Edit memory"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-md transition-colors"
              title="Delete memory"
              aria-label="Delete memory"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin text-destructive" /> : <Trash2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Memory Badges */}
          <div className="flex flex-wrap gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                memory.type === "semantic"
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              }`}
            >
              {memory.type === "semantic" ? "Semantic Fact" : "Episodic Bubble"}
            </span>

            <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted border border-border text-muted-foreground flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {category}
            </span>

            {(() => {
              const importancePct = Math.round((memory.importance || 0.8) * 100);
              let priorityLabel = "Standard";
              let priorityColor = "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20";
              if (importancePct >= 85) {
                priorityLabel = "High Priority";
                priorityColor = "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20";
              } else if (importancePct >= 70) {
                priorityLabel = "Medium Priority";
                priorityColor = "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20";
              }
              return (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${priorityColor}`}>
                  {priorityLabel} ({importancePct}%)
                </span>
              );
            })()}
          </div>

          {/* Dynamic Importance Progress Bar */}
          <div className="bg-muted/40 p-4 rounded-xl border border-border/50 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-muted-foreground uppercase tracking-wider font-semibold">Priority & Importance Score</span>
              <span className="font-bold text-foreground">{Math.round((memory.importance || 0.8) * 100)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  (memory.importance || 0.8) >= 0.85
                    ? "bg-gradient-to-r from-rose-500 to-pink-500"
                    : (memory.importance || 0.8) >= 0.70
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500"
                    : "bg-gradient-to-r from-emerald-500 to-teal-500"
                }`}
                style={{ width: `${Math.round((memory.importance || 0.8) * 100)}%` }}
              />
            </div>
          </div>

          {/* Memory Text Content or Edit Input */}
          <div className="bg-muted/40 p-4 rounded-xl border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-accent" />
                Memory Content
              </h4>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-accent hover:underline flex items-center gap-1"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full text-sm p-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-accent resize-none min-h-[90px]"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditText(memory.text);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted transition-colors flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSaving || !editText.trim()}
                    className="px-3 py-1.5 rounded-lg bg-foreground text-background text-xs hover:opacity-90 transition-opacity flex items-center gap-1 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground leading-relaxed font-normal">
                {memory.text}
              </p>
            )}
          </div>

          {/* Overview Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-card border border-border rounded-lg">
              <span className="text-muted-foreground block mb-1">Global Node ID</span>
              <span className="font-semibold text-foreground">#{memory.id}</span>
            </div>
            <div className="p-3 bg-card border border-border rounded-lg">
              <span className="text-muted-foreground block mb-1">Connections</span>
              <span className="font-semibold text-foreground">{linkedMemories.length} linked</span>
            </div>
          </div>

          {/* Connected Memories Section */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
              <Network className="w-3.5 h-3.5 text-emerald-500" />
              Connected Nodes ({linkedMemories.length})
            </h4>

            {linkedMemories.length === 0 ? (
              <div className="p-4 text-center border border-dashed border-border rounded-xl text-xs text-muted-foreground">
                No direct connections recorded for this memory bubble.
              </div>
            ) : (
              <div className="space-y-2.5">
                {linkedMemories.map((linked) => (
                  <button
                    key={linked.id}
                    onClick={() => onSelectMemory(linked.id)}
                    className="w-full flex items-start gap-3 p-3 rounded-xl border border-border/60 hover:border-accent hover:bg-muted/50 transition-all text-left group"
                  >
                    {/* Linked Memory Icon */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm"
                      style={{
                        backgroundColor: getBubbleColor(
                          linked.type === "semantic" ? "semantic" : "bubble",
                          linked.created_at,
                          useConstantColor
                        ),
                      }}
                    >
                      #{linked.local_id || linked.id}
                    </div>

                    {/* Linked Memory Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground line-clamp-2 mb-1 group-hover:text-accent transition-colors">
                        {linked.text}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="capitalize">{linked.type === "semantic" ? "Fact" : "Bubble"}</span>
                        <span>•</span>
                        <span>{formatDate(linked.created_at)}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
