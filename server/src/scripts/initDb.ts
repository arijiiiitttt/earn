import fs from "fs";
import path from "path";
import { pool } from "../config/db";
import dotenv from "dotenv";

dotenv.config();

async function initDb() {
  const sql = fs.readFileSync(
    path.join(__dirname, "../schema/init.sql"),
    "utf-8"
  );
  try {
    await pool.query(sql);
    console.log("Database schema initialized successfully");
  } catch (err) {
    console.error("Schema init failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDb();