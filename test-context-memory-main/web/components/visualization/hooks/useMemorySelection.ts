import { useState, useCallback, useEffect } from "react";
import type { Memory, MemoryNode } from "@/types/memory";

/**
 * Hook to manage memory selection state and actions
 * Handles bubble selection, linked memories, panel visibility, and clearing selection
 * 
 * Mobile behavior:
 * - Tap bubble: Shows panel + connections
 * - Close panel (X): Closes panel but keeps connections visible
 * - Tap empty space: Clears connections
 */
export function useMemorySelection(data: any) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [linkedMemories, setLinkedMemories] = useState<Memory[]>([]);
  const [visibleLinkCount, setVisibleLinkCount] = useState(0);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Clear selection when clicking empty space
  const clearSelection = useCallback(() => {
    setSelectedId(null);
    setSelectedMemory(null);
    setLinkedMemories([]);
    setIsPanelOpen(false);
  }, []);

  // Close panel only (keep connections visible on mobile)
  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
    setSelectedMemory(null);
    setLinkedMemories([]);
    // On mobile, keep selectedId to maintain connections
    // On desktop, clear everything
    if (!isMobile) {
      setSelectedId(null);
    }
  }, [isMobile]);

  // Handle bubble click - update panel without changing positions
  const selectBubble = useCallback((node: MemoryNode, event: MouseEvent) => {
    event.stopPropagation();

    const memory = data?.nodes?.find((n: any) => n.id === node.id);
    if (!memory) return;

    setSelectedMemory({
      ...memory,
      type: memory.type === "semantic" ? "semantic" : "bubble",
    } as Memory);

    const linkedIds = new Set<number>();

    // 1. From connections array
    (memory.connections || []).forEach((conn: any) => {
      const targetId = conn.target_global_id ?? conn.target_id;
      if (targetId !== undefined && targetId !== null) linkedIds.add(Number(targetId));
    });

    // 2. From graph links
    (data?.links || []).forEach((link: any) => {
      const sourceId = typeof link.source === "object" ? link.source?.id : link.source;
      const targetId = typeof link.target === "object" ? link.target?.id : link.target;
      if (Number(sourceId) === Number(node.id) && targetId !== undefined && targetId !== null) {
        linkedIds.add(Number(targetId));
      } else if (Number(targetId) === Number(node.id) && sourceId !== undefined && sourceId !== null) {
        linkedIds.add(Number(sourceId));
      }
    });

    const linked = (data?.nodes?.filter((n: any) => linkedIds.has(Number(n.id)) && Number(n.id) !== Number(node.id)) || []).map(
      (n: any) => ({
        ...n,
        type: n.type === "semantic" ? "semantic" : "bubble",
      } as Memory)
    );
    setLinkedMemories(linked);
    setIsPanelOpen(true);
  }, [data]);

  // Handle selecting a linked memory
  const selectLinkedMemory = useCallback((id: number, handleBubbleClick: (node: MemoryNode, event: MouseEvent) => void) => {
    const memory = data?.nodes?.find((n: any) => n.id === id);
    if (!memory) {
      console.warn(`⚠ Cannot find memory with id ${id}`);
      return;
    }

    console.log(`✓ Selecting linked memory: ${id}`);
    setSelectedId(id);
    // Create a synthetic event for bubble click
    const syntheticEvent = { stopPropagation: () => {} } as MouseEvent;
    handleBubbleClick(memory as MemoryNode, syntheticEvent);
  }, [data]);

  return {
    selectedId,
    setSelectedId,
    selectedMemory,
    setSelectedMemory,
    linkedMemories,
    setLinkedMemories,
    visibleLinkCount,
    setVisibleLinkCount,
    isPanelOpen,
    setIsPanelOpen,
    isMobile,
    clearSelection,
    closePanel,
    selectBubble,
    selectLinkedMemory,
  };
}
