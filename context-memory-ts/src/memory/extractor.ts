/**
 * Memory extractor — TypeScript port of Python extractor.py
 *
 * Uses an LLM to extract semantic facts and episodic bubbles
 * from the latest user/assistant interaction.
 */

import { getLlmClient } from "../core/llmClient.js";
import { getSettings } from "../core/settings.js";
import { withRetry } from "../core/retry.js";
import { EXTRACTION_SYSTEM_PROMPT } from "../utils/prompts.js";

export interface BubbleData {
  text: string;
  importance: number;
}

export interface ExtractionResult {
  semantic: string[];
  bubbles: BubbleData[];
}

/** Parse raw LLM JSON output, stripping any markdown code fences */
function parseJson(raw: string): ExtractionResult {
  let str = raw.trim();
  const fence = str.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fence) str = fence[1].trim();

  try {
    const parsed = JSON.parse(str) as Partial<ExtractionResult>;
    return {
      semantic: Array.isArray(parsed.semantic) ? parsed.semantic : [],
      bubbles: Array.isArray(parsed.bubbles) ? parsed.bubbles : [],
    };
  } catch {
    return { semantic: [], bubbles: [] };
  }
}

/**
 * Ask the LLM to extract semantic facts and episodic bubbles
 * from the latest conversation exchange.
 */
export async function extractMemories(
  latestPair: string[],
  summaryText: string,
  recentMessages: string[]
): Promise<ExtractionResult> {
  const s = getSettings();
  const client = getLlmClient();

  const recentText = recentMessages.join("\n");
  const latestText = latestPair.join("\n");

  const messages = [
    { role: "system" as const, content: EXTRACTION_SYSTEM_PROMPT },
    {
      role: "user" as const,
      content: `Conversation Summary:\n${summaryText}\n\nRecent Messages:\n${recentText}\n\nLatest Interaction:\n${latestText}\n\nExtract memory facts (semantic facts and bubbles).`,
    },
  ];

  const response = await withRetry(() =>
    client.chat.completions.create({
      model: s.llmModel,
      messages,
      temperature: 0.1,
    })
  );

  const raw = response.choices[0].message.content ?? "";
  if (s.debug) console.log("[ContextMemory] Extraction raw:", raw.slice(0, 300));

  const result = parseJson(raw);
  if (s.debug)
    console.log(
      `[ContextMemory] Extracted: ${result.semantic.length} semantic, ${result.bubbles.length} bubbles`
    );

  return result;
}
