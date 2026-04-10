import { Router, Response } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { PublicKey } from "@solana/web3.js";
import { query } from "../config/db";
import { authenticate, AuthRequest } from "../middlewares/auth";

const router = Router();

const CreateContractSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  freelancerWallet: z.string(),
  deadline: z.string().datetime(),
  milestones: z
    .array(
      z.object({
        title: z.string().min(2).max(100),
        description: z.string().min(5).max(500),
        amount: z.number().positive(),
      })
    )
    .min(1)
    .max(10),
  onChainAddress: z.string(),
  txSignature: z.string(),
});

// Helper: get contract with milestones
async function getContractWithMilestones(contractId: string) {
  const contractRes = await query(
    `SELECT * FROM contracts WHERE contract_id = $1`,
    [contractId]
  );
  if (!contractRes.rows.length) return null;

  const contract = contractRes.rows[0];
  const milestoneRes = await query(
    `SELECT * FROM milestones WHERE contract_id = $1 ORDER BY index`,
    [contractId]
  );
  contract.milestones = milestoneRes.rows;
  return contract;
}

router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const wallet = req.user!.walletAddress;
    const { role, status, page = "1", limit = "10" } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let whereClause = "";
    const params: unknown[] = [wallet, wallet, limitNum, offset];

    if (role === "client") {
      whereClause = "WHERE c.client_wallet = $1";
      params.splice(1, 1); // remove second wallet
      params[0] = wallet;
    } else if (role === "freelancer") {
      whereClause = "WHERE c.freelancer_wallet = $1";
      params.splice(1, 1);
      params[0] = wallet;
    } else {
      whereClause = "WHERE (c.client_wallet = $1 OR c.freelancer_wallet = $2)";
    }

    // Rebuild params cleanly
    const queryParams: unknown[] = [];
    let sql = "";

    if (role === "client") {
      queryParams.push(wallet);
      sql = `WHERE c.client_wallet = $1`;
    } else if (role === "freelancer") {
      queryParams.push(wallet);
      sql = `WHERE c.freelancer_wallet = $1`;
    } else {
      queryParams.push(wallet, wallet);
      sql = `WHERE (c.client_wallet = $1 OR c.freelancer_wallet = $2)`;
    }

    if (status) {
      queryParams.push(status);
      sql += ` AND c.status = $${queryParams.length}`;
    }

    const totalRes = await query(
      `SELECT COUNT(*) FROM contracts c ${sql}`,
      queryParams
    );
    const total = parseInt(totalRes.rows[0].count);

    queryParams.push(limitNum, offset);
    const contractsRes = await query(
      `SELECT c.*, json_agg(m.* ORDER BY m.index) AS milestones
       FROM contracts c
       LEFT JOIN milestones m ON m.contract_id = c.contract_id
       ${sql}
       GROUP BY c.id
       ORDER BY c.created_at DESC
       LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
      queryParams
    );

    return res.json({
      contracts: contractsRes.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch contracts" });
  }
});

router.get(
  "/:contractId",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const contract = await getContractWithMilestones(req.params.contractId);
      if (!contract) return res.status(404).json({ error: "Not found" });

      const wallet = req.user!.walletAddress;
      if (
        contract.client_wallet !== wallet &&
        contract.freelancer_wallet !== wallet
      ) {
        return res.status(403).json({ error: "Access denied" });
      }

      return res.json(contract);
    } catch {
      return res.status(500).json({ error: "Failed to fetch contract" });
    }
  }
);

router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = CreateContractSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.flatten() });

    const data = parsed.data;
    const clientWallet = req.user!.walletAddress;

    try {
      new PublicKey(data.freelancerWallet);
    } catch {
      return res.status(400).json({ error: "Invalid freelancer wallet" });
    }

    const totalAmount = data.milestones.reduce((s, m) => s + m.amount, 0);
    const contractId = uuidv4();

    // Insert contract
    await query(
      `INSERT INTO contracts
         (contract_id, title, description, client_wallet, freelancer_wallet,
          total_amount, deadline, on_chain_address, tx_signatures)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        contractId,
        data.title,
        data.description,
        clientWallet.toLowerCase(),
        data.freelancerWallet.toLowerCase(),
        totalAmount,
        new Date(data.deadline),
        data.onChainAddress,
        [data.txSignature],
      ]
    );

    // Insert milestones
    for (let i = 0; i < data.milestones.length; i++) {
      const m = data.milestones[i];
      await query(
        `INSERT INTO milestones (contract_id, index, title, description, amount)
         VALUES ($1,$2,$3,$4,$5)`,
        [contractId, i, m.title, m.description, m.amount]
      );
    }

    const contract = await getContractWithMilestones(contractId);
    return res.status(201).json(contract);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to create contract" });
  }
});

router.patch(
  "/:contractId/milestone/:index/submit",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { contractId, index } = req.params;
      const { txSignature, submissionNote } = req.body;

      const contractRes = await query(
        `SELECT * FROM contracts WHERE contract_id = $1`,
        [contractId]
      );
      if (!contractRes.rows.length)
        return res.status(404).json({ error: "Not found" });

      const contract = contractRes.rows[0];
      if (contract.freelancer_wallet !== req.user!.walletAddress)
        return res
          .status(403)
          .json({ error: "Only the freelancer can submit" });

      await query(
        `UPDATE milestones
         SET status = 'submitted', submission_note = $1, submitted_at = NOW()
         WHERE contract_id = $2 AND index = $3`,
        [submissionNote || null, contractId, parseInt(index)]
      );

      if (txSignature) {
        await query(
          `UPDATE contracts
           SET tx_signatures = array_append(tx_signatures, $1)
           WHERE contract_id = $2`,
          [txSignature, contractId]
        );
      }

      return res.json(await getContractWithMilestones(contractId));
    } catch {
      return res.status(500).json({ error: "Failed to submit milestone" });
    }
  }
);

router.patch(
  "/:contractId/milestone/:index/approve",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { contractId, index } = req.params;
      const { txSignature } = req.body;

      const contractRes = await query(
        `SELECT * FROM contracts WHERE contract_id = $1`,
        [contractId]
      );
      if (!contractRes.rows.length)
        return res.status(404).json({ error: "Not found" });

      if (contractRes.rows[0].client_wallet !== req.user!.walletAddress)
        return res
          .status(403)
          .json({ error: "Only the client can approve" });

      await query(
        `UPDATE milestones
         SET status = 'approved', approved_at = NOW()
         WHERE contract_id = $1 AND index = $2`,
        [contractId, parseInt(index)]
      );

      if (txSignature) {
        await query(
          `UPDATE contracts
           SET tx_signatures = array_append(tx_signatures, $1)
           WHERE contract_id = $2`,
          [txSignature, contractId]
        );
      }

      // Check if all milestones approved → mark contract complete
      const pending = await query(
        `SELECT COUNT(*) FROM milestones
         WHERE contract_id = $1 AND status != 'approved'`,
        [contractId]
      );
      if (parseInt(pending.rows[0].count) === 0) {
        await query(
          `UPDATE contracts SET status = 'completed' WHERE contract_id = $1`,
          [contractId]
        );
      }

      return res.json(await getContractWithMilestones(contractId));
    } catch {
      return res.status(500).json({ error: "Failed to approve milestone" });
    }
  }
);

router.patch(
  "/:contractId/dispute",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { contractId } = req.params;
      const { milestoneIndex, txSignature } = req.body;

      const contractRes = await query(
        `SELECT * FROM contracts WHERE contract_id = $1`,
        [contractId]
      );
      if (!contractRes.rows.length)
        return res.status(404).json({ error: "Not found" });

      if (contractRes.rows[0].client_wallet !== req.user!.walletAddress)
        return res
          .status(403)
          .json({ error: "Only the client can raise a dispute" });

      await query(
        `UPDATE milestones SET status = 'disputed'
         WHERE contract_id = $1 AND index = $2`,
        [contractId, milestoneIndex]
      );

      await query(
        `UPDATE contracts SET status = 'disputed' WHERE contract_id = $1`,
        [contractId]
      );

      if (txSignature) {
        await query(
          `UPDATE contracts
           SET tx_signatures = array_append(tx_signatures, $1)
           WHERE contract_id = $2`,
          [txSignature, contractId]
        );
      }

      return res.json(await getContractWithMilestones(contractId));
    } catch {
      return res.status(500).json({ error: "Failed to raise dispute" });
    }
  }
);

router.delete(
  "/:contractId",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { contractId } = req.params;
      const { txSignature } = req.body;

      const contractRes = await query(
        `SELECT * FROM contracts WHERE contract_id = $1`,
        [contractId]
      );
      if (!contractRes.rows.length)
        return res.status(404).json({ error: "Not found" });

      if (contractRes.rows[0].client_wallet !== req.user!.walletAddress)
        return res
          .status(403)
          .json({ error: "Only the client can cancel" });

      const submitted = await query(
        `SELECT COUNT(*) FROM milestones
         WHERE contract_id = $1 AND status != 'pending'`,
        [contractId]
      );
      if (parseInt(submitted.rows[0].count) > 0)
        return res
          .status(400)
          .json({ error: "Cannot cancel after work has been submitted" });

      await query(
        `UPDATE contracts SET status = 'cancelled' WHERE contract_id = $1`,
        [contractId]
      );

      if (txSignature) {
        await query(
          `UPDATE contracts
           SET tx_signatures = array_append(tx_signatures, $1)
           WHERE contract_id = $2`,
          [txSignature, contractId]
        );
      }

      return res.json({
        message: "Contract cancelled",
        contract: await getContractWithMilestones(contractId),
      });
    } catch {
      return res.status(500).json({ error: "Failed to cancel contract" });
    }
  }
);

export default router;