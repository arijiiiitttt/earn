import { Router, Request, Response } from "express";
import { query } from "../config/db";
import { authenticate, AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await query(
      `SELECT * FROM users WHERE wallet_address = $1`,
      [req.user!.walletAddress]
    );
    if (!rows.length) return res.status(404).json({ error: "User not found" });
    return res.json(rows[0]);
  } catch {
    return res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.patch("/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { username, bio, email, skills, role } = req.body;

    const { rows } = await query(
      `UPDATE users
       SET username = COALESCE($1, username),
           bio      = COALESCE($2, bio),
           email    = COALESCE($3, email),
           skills   = COALESCE($4, skills),
           role     = COALESCE($5, role)
       WHERE wallet_address = $6
       RETURNING *`,
      [username, bio, email, skills, role, req.user!.walletAddress]
    );

    return res.json(rows[0]);
  } catch (error: any) {
    if (error.code === "23505")
      return res.status(400).json({ error: "Username already taken" });
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

router.get("/:wallet", async (req: Request, res: Response) => {
  try {
    const { rows } = await query(
      `SELECT id, wallet_address, username, bio, role, skills,
              reputation, completed_contracts, created_at
       FROM users WHERE wallet_address = $1`,
      [req.params.wallet.toLowerCase()]
    );
    if (!rows.length) return res.status(404).json({ error: "User not found" });
    return res.json(rows[0]);
  } catch {
    return res.status(500).json({ error: "Failed to fetch user" });
  }
});

export default router;