import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env";

export interface AuthenticatedRequest extends Request {
  user?: { id: string; name: string; email: string };
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ detail: "Authentication required" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; name: string; email: string };
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ detail: "Invalid or expired token" });
  }
}
