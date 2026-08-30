/**
 * Dynamic Importance Calculation Utility
 */

export function calculateDynamicImportance(text: string, category?: string | null): number {
  if (!text) return 0.5;
  const lower = text.toLowerCase();
  let baseScore = 0.5;

  if (category === "profile" || category === "security") baseScore = 0.85;
  else if (category === "goal" || category === "professional") baseScore = 0.75;
  else if (category === "skill") baseScore = 0.70;
  else if (category === "preference") baseScore = 0.60;

  if (/deadline|urgent|important|emergency|meeting|interview|critical|must|asap|tomorrow|today/i.test(lower)) {
    baseScore = Math.min(0.98, baseScore + 0.25);
  } else if (/name|email|phone|role|salary|location|live|work/i.test(lower)) {
    baseScore = Math.min(0.95, baseScore + 0.15);
  }

  // Subtle length-based variance
  const variance = (text.length % 7) * 0.01;
  return Math.max(0.3, Math.min(0.99, Number((baseScore + variance).toFixed(2))));
}
