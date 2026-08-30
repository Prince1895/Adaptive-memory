import * as d3 from "d3";
import type { MemoryNode, MemoryLink } from "@/types/memory";
import { getConnectionOpacity, getConnectionThickness } from "@/lib/utils";

/**
 * Filters and prepares valid links between existing nodes
 */
export function prepareLinks(
  rawLinks: any[],
  nodeIds: Set<number>
): MemoryLink[] {
  return rawLinks
    .filter((link) => nodeIds.has(link.source as number) && nodeIds.has(link.target as number))
    .map((link) => ({
      source: link.source,
      target: link.target,
      source_local: link.source_local,
      target_local: link.target_local,
      strength: link.strength,
    }));
}

/**
 * Gets visible links for the selected node
 * Uses target_global_id (or target_id as fallback) to find connected nodes
 */
export function getVisibleLinks(
  selectedId: number | null,
  nodes: MemoryNode[],
  links: MemoryLink[]
): MemoryLink[] {
  if (!selectedId) {
    // Show top high-priority links when no single node selected
    return links.filter((l) => (l.strength || 0) >= 0.82);
  }

  const selectedNode = nodes.find((n) => n.id === selectedId);
  if (!selectedNode || !selectedNode.connections) return [];

  const visibleLinks: MemoryLink[] = [];

  selectedNode.connections.forEach((conn) => {
    // Use target_global_id for node lookup (fallback to target_id for backward compatibility)
    const targetGlobalId = conn.target_global_id ?? conn.target_id;
    const targetNode = nodes.find(n => n.id === targetGlobalId);
    
    if (targetNode) {
      // Try to find existing link first
      const existingLink = links.find((link) => {
        const sourceId = typeof link.source === 'number' ? link.source : (link.source as any).id;
        const targetId = typeof link.target === 'number' ? link.target : (link.target as any).id;
        return sourceId === selectedId && targetId === targetGlobalId;
      });

      if (existingLink) {
        visibleLinks.push(existingLink);
      } else {
        // Create new link if it doesn't exist in links array
        visibleLinks.push({
          source: selectedId,
          target: targetGlobalId,
          strength: conn.score || 0.5
        });
      }
    }
  });

  console.log(`✓ Bubble ${selectedId} (local: ${selectedNode.local_id}) - Connections in data: ${selectedNode.connections.length}, Lines rendered: ${visibleLinks.length}`);

  return visibleLinks;
}

/**
 * Gets the set of connected node IDs (global IDs) for the selected node
 */
export function getConnectedNodeIds(
  selectedId: number | null,
  nodes: MemoryNode[]
): Set<number> {
  if (!selectedId) return new Set();

  const selectedNode = nodes.find((n) => n.id === selectedId);
  if (!selectedNode || !selectedNode.connections) return new Set();

  // Use target_global_id for connected node IDs (for dimming logic)
  return new Set(selectedNode.connections.map((conn) => conn.target_global_id ?? conn.target_id));
}

/**
 * Renders connection lines between nodes with animation
 */
export function renderConnections(
  container: d3.Selection<SVGGElement, unknown, null, undefined>,
  visibleLinks: MemoryLink[],
  nodes: MemoryNode[]
) {
  const linksContainer = container.select(".links-container");

  const linkSelection = linksContainer
    .selectAll<SVGLineElement, MemoryLink>("line")
    .data(visibleLinks, (d: any) => {
      const sourceId = typeof d.source === 'number' ? d.source : d.source.id;
      const targetId = typeof d.target === 'number' ? d.target : d.target.id;
      return `${sourceId}-${targetId}`;
    });

  // Remove old links with fade out
  linkSelection.exit()
    .transition()
    .duration(300)
    .attr("stroke-opacity", 0)
    .remove();

  // Add new links with animation and priority styling
  const newLinks = linkSelection.enter()
    .append("line")
    .attr("class", "connection-line")
    .attr("stroke", (d) => {
      const str = d.strength || 0.7;
      if (str >= 0.90) return "#f43f5e"; // Glowing Rose for Critical/High Priority
      if (str >= 0.75) return "#f59e0b"; // Glowing Amber for High/Medium Priority
      return "#64748b"; // Standard Slate
    })
    .attr("stroke-width", (d) => {
      const str = d.strength || 0.7;
      if (str >= 0.90) return 4.5;
      if (str >= 0.75) return 3.2;
      return 2.0;
    })
    .attr("stroke-linecap", "round")
    .style("filter", (d) => {
      const str = d.strength || 0.7;
      if (str >= 0.90) return "drop-shadow(0px 0px 6px rgba(244, 63, 94, 0.8))";
      if (str >= 0.75) return "drop-shadow(0px 0px 5px rgba(245, 158, 11, 0.7))";
      return "none";
    })
    .attr("stroke-opacity", 0)
    .attr("x1", (d: any) => {
      const source = typeof d.source === 'number'
        ? nodes.find(n => n.id === d.source)
        : d.source;
      return source?.x ?? 0;
    })
    .attr("y1", (d: any) => {
      const source = typeof d.source === 'number'
        ? nodes.find(n => n.id === d.source)
        : d.source;
      return source?.y ?? 0;
    })
    .attr("x2", (d: any) => {
      const target = typeof d.target === 'number'
        ? nodes.find(n => n.id === d.target)
        : d.target;
      return target?.x ?? 0;
    })
    .attr("y2", (d: any) => {
      const target = typeof d.target === 'number'
        ? nodes.find(n => n.id === d.target)
        : d.target;
      return target?.y ?? 0;
    });

  // Animate new links appearing
  newLinks
    .transition()
    .duration(400)
    .attr("stroke-opacity", (d) => Math.min(1, getConnectionOpacity(d.strength) + 0.4));

  // Update existing links positions
  linkSelection.merge(newLinks)
    .attr("x1", (d: any) => {
      const source = typeof d.source === 'number'
        ? nodes.find(n => n.id === d.source)
        : d.source;
      return source?.x ?? 0;
    })
    .attr("y1", (d: any) => {
      const source = typeof d.source === 'number'
        ? nodes.find(n => n.id === d.source)
        : d.source;
      return source?.y ?? 0;
    })
    .attr("x2", (d: any) => {
      const target = typeof d.target === 'number'
        ? nodes.find(n => n.id === d.target)
        : d.target;
      return target?.x ?? 0;
    })
    .attr("y2", (d: any) => {
      const target = typeof d.target === 'number'
        ? nodes.find(n => n.id === d.target)
        : d.target;
      return target?.y ?? 0;
    });
}
