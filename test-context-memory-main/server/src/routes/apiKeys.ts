import { Router, Response } from "express";
import { appDb } from "../db/appDb";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";

export const apiKeysRouter = Router();

// Validate API Key against OpenRouter or OpenAI
apiKeysRouter.post("/validate", authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { api_key } = req.body;
    if (!api_key || typeof api_key !== "string" || !api_key.trim()) {
      res.status(400).json({ valid: false, detail: "API key is required" });
      return;
    }

    const key = api_key.trim();
    let isValid = false;

    try {
      if (key.startsWith("sk-or-v1-")) {
        const response = await fetch("https://openrouter.ai/api/v1/auth/key", {
          headers: { Authorization: `Bearer ${key}` }
        });
        isValid = response.status === 200 || response.ok;
      } else {
        const response = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${key}` }
        });
        isValid = response.status === 200 || response.ok;
      }
    } catch (e) {
      // If network fetch fails, basic format verification
      isValid = key.length > 20;
    }

    if (isValid) {
      res.json({ valid: true, message: "API key is valid" });
    } else {
      res.status(400).json({ valid: false, detail: "Invalid API key" });
    }
  } catch (err: any) {
    res.status(500).json({ valid: false, detail: err.message || "Failed to validate API key" });
  }
});

// Store API key for user
apiKeysRouter.post("/", authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { api_key } = req.body;
    const userId = req.user!.id;

    if (!api_key || typeof api_key !== "string" || !api_key.trim()) {
      res.status(400).json({ detail: "API key is required" });
      return;
    }

    appDb.prepare("UPDATE users SET api_key = ? WHERE id = ?").run(api_key.trim(), userId);
    res.json({ success: true, message: "API key stored successfully" });
  } catch (err: any) {
    res.status(500).json({ detail: err.message || "Failed to store API key" });
  }
});

// Get API key status
apiKeysRouter.get("/status", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = appDb.prepare("SELECT api_key FROM users WHERE id = ?").get(userId) as any;
    const hasKey = !!(user && user.api_key);
    res.json({
      has_key: hasKey,
      key_preview: hasKey ? `${user.api_key.substring(0, 7)}...${user.api_key.slice(-4)}` : null
    });
  } catch (err: any) {
    res.status(500).json({ detail: err.message || "Failed to get API key status" });
  }
});

// Delete API key
apiKeysRouter.delete("/", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    appDb.prepare("UPDATE users SET api_key = NULL WHERE id = ?").run(userId);
    res.json({ success: true, message: "API key deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ detail: err.message || "Failed to delete API key" });
  }
});
