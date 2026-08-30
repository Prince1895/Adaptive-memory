/**
 * Tool Classifier v2 — with retry wrapper + category detection.
 */

import { getLlmClient } from "../core/llmClient.js";
import { getSettings } from "../core/settings.js";
import { withRetry } from "../core/retry.js";
import { TOOL_CALL_SYSTEM_PROMPT } from "../utils/prompts.js";
import type { MemoryRow } from "../db/database.js";

export type MemoryAction = "ADD" | "UPDATE" | "REPLACE" | "DELETE" | "NOOP";

export interface ToolDecision {
  action: MemoryAction;
  memoryId: number | null;
  text: string | null;
  category: string | null; // NEW: auto-detected category
}

function parseDecision(raw: string, fallbackText: string, debug: boolean): ToolDecision {
  let str = raw.trim();
  const fence = str.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fence) str = fence[1].trim();

  try {
    const parsed = JSON.parse(str) as {
      action?: string;
      memory_id?: number | null;
      text?: string | null;
      category?: string | null;
    };

    const action = (parsed.action?.toUpperCase() ?? "ADD") as MemoryAction;
    const validActions: MemoryAction[] = ["ADD", "UPDATE", "REPLACE", "DELETE", "NOOP"];
    const safeAction = validActions.includes(action) ? action : "ADD";

    return {
      action: safeAction,
      memoryId: parsed.memory_id ?? null,
      text: parsed.text ?? fallbackText,
      category: parsed.category ?? null,
    };
  } catch (e) {
    if (debug) console.log("[ContextMemory] Tool classifier parse error:", e);
    return { action: "ADD", memoryId: null, text: fallbackText, category: null };
  }
}

export async function llmToolCall(
  candidateFact: string,
  similarMemories: MemoryRow[]
): Promise<ToolDecision> {
  const s = getSettings();
  const client = getLlmClient();

  const memoryContext =
    similarMemories.length > 0
      ? similarMemories.map((m) => `- ID ${m.id} [${m.category ?? "?"}]: ${m.memory_text}`).join("\n")
      : "No existing memories found.";

  const messages = [
    { role: "system" as const, content: TOOL_CALL_SYSTEM_PROMPT },
    {
      role: "user" as const,
      content: `Candidate fact:\n${candidateFact}\n\nExisting similar memories:\n${memoryContext}\n\nDecide the action.`,
    },
  ];

  const response = await withRetry(() =>
    client.chat.completions.create({ model: s.llmModel, messages, temperature: 0 })
  );

  const raw = response.choices[0].message.content ?? "";
  if (s.debug) console.log("[ContextMemory] Tool classifier output:", raw);

  return parseDecision(raw, candidateFact, s.debug);
}
