import { Router, Request, Response } from "express";
import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import { db } from "../config/db";
import { users } from "../schema";
import { authenticate, AuthRequest } from "../middlewares/auth";
import { eq } from "drizzle-orm";

const router = Router();

const UpdateProfileSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  bio: z.string().max(500).optional(),
  skills: z.array(z.string()).optional(),
  role: z.enum(["client", "freelancer", "both"]).optional(),
});

router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.walletAddress, req.user!.walletAddress))
      .limit(1);

    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json(user);
  } catch (error) {
    console.error("GET /users/me error:", error);
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
});

router.patch("/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = UpdateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten(),
      });
    }

    const data = parsed.data;
    const updates: Record<string, any> = {};

    if (data.username !== undefined) updates.username = data.username;
    if (data.bio !== undefined) updates.bio = data.bio;
    if (data.skills !== undefined) updates.skills = data.skills;
    if (data.role !== undefined) updates.role = data.role;
    updates.updatedAt = new Date();

    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.walletAddress, req.user!.walletAddress))
      .returning();

    return res.json(updated);
  } catch (error: any) {
    console.error("PATCH /users/me error:", error);
    if (error.message?.includes("unique")) {
      return res.status(409).json({ error: "Username already taken" });
    }
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

router.get("/:wallet", async (req: Request, res: Response) => {
  try {
    let canonicalWallet: string;
    try {
      canonicalWallet = new PublicKey(req.params.wallet).toBase58();
    } catch {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    const [user] = await db
      .select({
        id: users.id,
        walletAddress: users.walletAddress,
        username: users.username,
        bio: users.bio,
        skills: users.skills,
        role: users.role,
        reputation: users.reputation,
        completedContracts: users.completedContracts,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.walletAddress, canonicalWallet))
      .limit(1);

    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json(user);
  } catch (error) {
    console.error("GET /users/:wallet error:", error);
    return res.status(500).json({ error: "Failed to fetch user" });
  }
});

export default router;