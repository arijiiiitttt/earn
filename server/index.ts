import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import authRoutes from "./src/routes/auth";
import contractRoutes from "./src/routes/contracts";
import submissionRoutes from "./src/routes/submissions";
import userRoutes from "./src/routes/users";
import { errorHandler } from "./src/middlewares/errorHandler";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL || "https://your-domain.com"
        : [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:4173",
          ],
    credentials: true,
  })
);

// ── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  message: { error: "Too many requests, please slow down." },
});
app.use("/api/", limiter);

// ── Logging + parsing ─────────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/users", userRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n earn server → http://localhost:${PORT}`);
  console.log(` Environment  → ${process.env.NODE_ENV}`);
  console.log(`  Database     → Neon PostgreSQL`);
  console.log(`\n Available routes:`);
  console.log(`   POST   /api/auth/nonce`);
  console.log(`   POST   /api/auth/verify`);
  console.log(`   POST   /api/auth/login`);
  console.log(`   GET    /api/contracts`);
  console.log(`   GET    /api/contracts/my`);
  console.log(`   GET    /api/contracts/:id`);
  console.log(`   POST   /api/contracts`);
  console.log(`   PATCH  /api/contracts/:id/milestone/:i/submit`);
  console.log(`   PATCH  /api/contracts/:id/milestone/:i/approve`);
  console.log(`   PATCH  /api/contracts/:id/dispute`);
  console.log(`   DELETE /api/contracts/:id`);
  console.log(`   GET    /api/submissions/:contractId`);
  console.log(`   POST   /api/submissions/:contractId`);
  console.log(`   PATCH  /api/submissions/:id/accept`);
  console.log(`   PATCH  /api/submissions/:id/reject`);
  console.log(`   DELETE /api/submissions/:id`);
  console.log(`   GET    /api/users/me`);
  console.log(`   PATCH  /api/users/me`);
  console.log(`   GET    /api/users/:wallet\n`);
});

export default app;