import express, { Request, Response } from "express";
import cors from "cors";
import { PORT } from "./config/env";
import { authRouter } from "./routes/auth";
import { conversationsRouter } from "./routes/conversations";
import { chatRouter } from "./routes/chat";
import { memoriesRouter } from "./routes/memories";
import { apiKeysRouter } from "./routes/apiKeys";

const app = express();

app.use(cors());
app.use(express.json());

// System Health & Status Endpoint
app.get(["/", "/api/health"], (req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "ContextMemory Express Backend",
    package: "adaptive-context-memory",
    version: "1.0.0",
    port: PORT
  });
});

// Modular Routers
app.use("/api/auth", authRouter);
app.use("/api/conversations", conversationsRouter);
app.use("/api/chat", chatRouter);
app.use("/api/memories", memoriesRouter);
app.use("/api/api-keys", apiKeysRouter);

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 ContextMemory Express Backend running on http://localhost:${PORT}`);
});
