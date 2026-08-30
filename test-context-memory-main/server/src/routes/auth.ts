import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { appDb } from "../db/appDb";
import { JWT_SECRET } from "../config/env";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";

export const authRouter = Router();

export function getUserUsage(userId: string) {
  const row = appDb
    .prepare(`
      SELECT COUNT(*) as count 
      FROM messages m 
      JOIN conversations c ON m.conversation_id = c.id 
      WHERE c.user_id = ? AND m.role = 'user'
    `)
    .get(userId) as { count: number };

  const count = row?.count || 0;
  const limit = 10;
  const remaining = Math.max(0, limit - count);

  return {
    free_messages_remaining: remaining,
    free_message_limit: limit,
    message_count: count,
    has_api_key: false
  };
}

const handleRegister = async (req: Request, res: Response): Promise<void> => {
  try {
    const name = req.body.full_name || req.body.name;
    const { email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ detail: "Missing required fields (name/email/password)" });
      return;
    }

    const existing = appDb.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (existing) {
      res.status(400).json({ detail: "Email already registered" });
      return;
    }

    const id = "usr_" + Math.random().toString(36).substring(2, 10);
    const password_hash = await bcrypt.hash(password, 10);

    appDb.prepare("INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)").run(
      id,
      name,
      email,
      password_hash
    );

    const token = jwt.sign({ id, name, email }, JWT_SECRET, { expiresIn: "7d" });
    const userPayload = {
      id,
      name,
      full_name: name,
      email,
      is_active: true,
      usage: getUserUsage(id)
    };

    res.json({
      access_token: token,
      refresh_token: token,
      token,
      token_type: "bearer",
      expires_in: 604800,
      user: userPayload
    });
  } catch (err: any) {
    res.status(500).json({ detail: err.message || "Internal server error" });
  }
};

const handleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ detail: "Missing email or password" });
      return;
    }

    const user = appDb.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user) {
      res.status(401).json({ detail: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ detail: "Invalid credentials" });
      return;
    }

    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    const userPayload = {
      id: user.id,
      name: user.name,
      full_name: user.name,
      email: user.email,
      is_active: true,
      usage: getUserUsage(user.id)
    };

    res.json({
      access_token: token,
      refresh_token: token,
      token,
      token_type: "bearer",
      expires_in: 604800,
      user: userPayload
    });
  } catch (err: any) {
    res.status(500).json({ detail: err.message || "Internal server error" });
  }
};

authRouter.post("/signup", handleRegister);
authRouter.post("/register", handleRegister);

authRouter.post("/signin", handleLogin);
authRouter.post("/login", handleLogin);

authRouter.post("/refresh", (req: Request, res: Response) => {
  const refreshToken = req.body.refresh_token;
  if (!refreshToken) {
    res.status(400).json({ detail: "Refresh token required" });
    return;
  }
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as any;
    const newToken = jwt.sign({ id: decoded.id, name: decoded.name, email: decoded.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ access_token: newToken, refresh_token: newToken, token_type: "bearer", expires_in: 604800 });
  } catch (err) {
    res.status(401).json({ detail: "Invalid refresh token" });
  }
});

authRouter.post("/logout", (req: Request, res: Response) => {
  res.json({ success: true });
});

authRouter.get("/me", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ detail: "Not authenticated" });
    return;
  }
  res.json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    full_name: req.user.name,
    is_active: true,
    usage: getUserUsage(req.user.id),
    user: req.user
  });
});

authRouter.get("/usage", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ detail: "Not authenticated" });
    return;
  }
  res.json(getUserUsage(req.user.id));
});
