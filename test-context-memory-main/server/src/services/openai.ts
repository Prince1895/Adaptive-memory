import OpenAI from "openai";
import { OPENROUTER_API_KEY, OPENAI_API_KEY } from "../config/env";

export let openaiClient: OpenAI;

if (OPENROUTER_API_KEY) {
  openaiClient = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: OPENROUTER_API_KEY,
    defaultHeaders: {
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "ContextMemory Web App"
    }
  });
} else if (OPENAI_API_KEY) {
  openaiClient = new OpenAI({ apiKey: OPENAI_API_KEY });
} else {
  openaiClient = new OpenAI({ apiKey: "dummy-key-for-init" });
}
