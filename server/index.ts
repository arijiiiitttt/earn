import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { connectDB } from "./src/config/db";
import authRoutes from "./src/routes/auth";
import contractRoutes from "./src/routes/contracts";
import userRoutes from "./src/routes/users";
import { errorHandler } from "./src/middlewares/errorHandler";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "https://your-domain.com"
        : ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);

app.use(
  "/api/",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Too many requests, please try again later." },
  })
);

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", async (_, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/users", userRoutes);

app.use(errorHandler);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n TrustPay Server running at http://localhost:${PORT}`);
    console.log(`Network: ${process.env.NODE_ENV}\n`);
  });
});

export default app;