import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, 
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const query = <T = any>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number | null }> =>
  pool.query(text, params);

export const connectDB = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
    console.log("NeonDB (PostgreSQL) connected");
  } finally {
    client.release();
  }
};