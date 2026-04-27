import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { db } from "../config/db";
import { users, nonces } from "../schema";
import { eq, and, gt } from "drizzle-orm";

const router = Router();

router.post("/nonce", async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.body;
 
    if (!walletAddress) {
      return res.status(400).json({ error: "walletAddress is required" });
    }
 
    try {
      new PublicKey(walletAddress);
    } catch {
      return res.status(400).json({ error: "Invalid Solana wallet address" });
    }
 
    const nonce = `Sign in to earn : ${Math.random().toString(36).slice(2)}_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
 
    await db.delete(nonces).where(eq(nonces.walletAddress, walletAddress));
 
    await db.insert(nonces).values({
      walletAddress, // store as-is, no lowercase
      nonce,
      expiresAt,
    });
 
    return res.json({ nonce });
  } catch (error) {
    console.error("Nonce error:", error);
    return res.status(500).json({
      error: "Failed to generate nonce",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});
 
router.post("/verify", async (req: Request, res: Response) => {
  try {
    const { walletAddress, signature, username } = req.body;

    if (!walletAddress || !signature) {
      return res.status(400).json({ error: "walletAddress and signature are required" });
    }

    const [stored] = await db
      .select()
      .from(nonces)
      .where(
        and(
          eq(nonces.walletAddress, walletAddress),
          gt(nonces.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!stored) {
      return res.status(401).json({
        error: "Nonce not found or expired. Request a new nonce.",
      });
    }

    const messageBytes = new TextEncoder().encode(stored.nonce);
    const publicKeyBytes = new PublicKey(walletAddress).toBytes();
    const signatureBytes = bs58.decode(signature);

    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );

    if (!isValid) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    await db.delete(nonces).where(eq(nonces.id, stored.id));

    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.walletAddress, walletAddress))
      .limit(1);

    if (!user) {
      const defaultUsername =
        username ||
        `user_${walletAddress.slice(0, 6)}${Math.floor(Math.random() * 9999)}`;

      const [newUser] = await db
        .insert(users)
        .values({
          walletAddress, // store as-is, no lowercase
          username: defaultUsername,
        })
        .returning();

      user = newUser;
    }

    const token = jwt.sign(
      { walletAddress: user.walletAddress, userId: user.id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    return res.json({ token, user });
  } catch (error: any) {
    console.error("Verify error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: "walletAddress is required" });
    }

    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.walletAddress, walletAddress))
      .limit(1);

    if (!user) {
      const [newUser] = await db
        .insert(users)
        .values({
          walletAddress, // store as-is, no lowercase
          username: `user_${walletAddress.slice(0, 6)}`,
        })
        .returning();
      user = newUser;
    }

    const token = jwt.sign(
      { walletAddress: user.walletAddress, userId: user.id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    return res.json({ token, user });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Login failed" });
  }
});

export default router;