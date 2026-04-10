import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { query } from "../config/db";

const router = Router();

router.post("/nonce", async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress)
      return res.status(400).json({ error: "walletAddress is required" });

    try {
      new PublicKey(walletAddress);
    } catch {
      return res.status(400).json({ error: "Invalid Solana wallet address" });
    }

    const nonce = `Sign in to TrustPay: ${Math.random()
      .toString(36)
      .slice(2)}_${Date.now()}`;

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    await query(
      `INSERT INTO nonces (wallet_address, nonce, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (wallet_address)
       DO UPDATE SET nonce = $2, expires_at = $3, created_at = NOW()`,
      [walletAddress.toLowerCase(), nonce, expiresAt]
    );

    return res.json({ nonce });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to generate nonce" });
  }
});

router.post("/verify", async (req: Request, res: Response) => {
  try {
    const { walletAddress, signature, username } = req.body;

    if (!walletAddress || !signature)
      return res
        .status(400)
        .json({ error: "walletAddress and signature are required" });

    // Fetch nonce from DB
    const { rows } = await query(
      `SELECT nonce, expires_at FROM nonces WHERE wallet_address = $1`,
      [walletAddress.toLowerCase()]
    );

    if (!rows.length)
      return res
        .status(401)
        .json({ error: "Nonce not found. Request a new one." });

    const { nonce, expires_at } = rows[0];

    if (new Date() > new Date(expires_at)) {
      await query(`DELETE FROM nonces WHERE wallet_address = $1`, [
        walletAddress.toLowerCase(),
      ]);
      return res.status(401).json({ error: "Nonce expired. Try again." });
    }

    // Verify signature
    const messageBytes = new TextEncoder().encode(nonce);
    const publicKeyBytes = new PublicKey(walletAddress).toBytes();
    const signatureBytes = bs58.decode(signature);

    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );

    if (!isValid)
      return res.status(401).json({ error: "Invalid signature" });

    // Delete nonce after use
    await query(`DELETE FROM nonces WHERE wallet_address = $1`, [
      walletAddress.toLowerCase(),
    ]);

    // Find or create user
    let userRow = (
      await query(
        `SELECT * FROM users WHERE wallet_address = $1`,
        [walletAddress.toLowerCase()]
      )
    ).rows[0];

    if (!userRow) {
      const defaultUsername =
        username ||
        `user_${walletAddress.slice(0, 6).toLowerCase()}${Math.floor(
          Math.random() * 1000
        )}`;

      const result = await query(
        `INSERT INTO users (wallet_address, username)
         VALUES ($1, $2)
         RETURNING *`,
        [walletAddress.toLowerCase(), defaultUsername]
      );
      userRow = result.rows[0];
    }

    const token = jwt.sign(
      { walletAddress: userRow.wallet_address, userId: userRow.id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    return res.json({ token, user: userRow });
  } catch (error: any) {
    console.error(error);
    if (error.code === "23505")
      return res.status(400).json({ error: "Username already taken" });
    return res.status(500).json({ error: "Authentication failed" });
  }
});

export default router;