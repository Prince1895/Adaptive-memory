import { Router, Response } from "express";
import { appDb } from "../db/appDb";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";

export const conversationsRouter = Router();

conversationsRouter.get("/", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const rows = appDb
    .prepare("SELECT id, title, created_at, updated_at FROM conversations WHERE user_id = ? ORDER BY updated_at DESC")
    .all(userId);
  res.json(rows);
});

conversationsRouter.get("/:id", authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const convId = parseInt(req.params.id as string, 10);
  const conv = appDb.prepare("SELECT * FROM conversations WHERE id = ? AND user_id = ?").get(convId, req.user!.id);

  if (!conv) {
    res.status(404).json({ detail: "Conversation not found" });
    return;
  }

  const messages = appDb
    .prepare("SELECT role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY id ASC")
    .all(convId);

  res.json({ ...conv, messages });
});

conversationsRouter.delete("/:id", authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const convId = parseInt(req.params.id as string, 10);
  appDb.prepare("DELETE FROM messages WHERE conversation_id = ?").run(convId);
  appDb.prepare("DELETE FROM conversations WHERE id = ? AND user_id = ?").run(convId, req.user!.id);
  res.json({ success: true });
});
