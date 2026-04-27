import { Router, Response } from "express";
import { z } from "zod";
import { db } from "../config/db";
import { contracts, milestones, submissions, users } from "../schema";
import { authenticate, AuthRequest } from "../middlewares/auth";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

const MilestoneInputSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  amount: z.number().positive(),
});

const CreateContractSchema = z.object({
  contractId: z.string().min(1).max(32).optional(),
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  requirements: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  deadline: z.string(),
  totalAmount: z.number().positive(),
  milestones: z.array(MilestoneInputSchema).min(1).max(10),
  onChainAddress: z.string().optional().default("pending"),
  txSignature: z.string().optional().default("pending"),
});

router.get("/", async (req, res: Response) => {
  try {
    const { status, wallet } = req.query;

    if (status) {
      const allContracts = await db.select().from(contracts);
      const filtered = allContracts.filter((c) => c.status === status);
      const withMilestones = await Promise.all(
        filtered.map(async (c) => {
          const ms = await db
            .select()
            .from(milestones)
            .where(eq(milestones.contractId, c.contractId));
          return { ...c, milestones: ms };
        })
      );
      return res.json({ contracts: withMilestones });
    }

    if (wallet) {
      const all = await db.select().from(contracts);
      const w = wallet as string;
      const userContracts = all.filter(
        (c) =>
          c.clientWallet.toLowerCase() === w.toLowerCase() ||
          c.freelancerWallet?.toLowerCase() === w.toLowerCase()
      );
      const withMilestones = await Promise.all(
        userContracts.map(async (c) => {
          const ms = await db
            .select()
            .from(milestones)
            .where(eq(milestones.contractId, c.contractId));
          return { ...c, milestones: ms };
        })
      );
      return res.json({ contracts: withMilestones });
    }

    const allContracts = await db
      .select()
      .from(contracts)
      .orderBy(desc(contracts.createdAt));

    const withMilestones = await Promise.all(
      allContracts.map(async (c) => {
        const ms = await db
          .select()
          .from(milestones)
          .where(eq(milestones.contractId, c.contractId));
        return { ...c, milestones: ms };
      })
    );

    return res.json({ contracts: withMilestones });
  } catch (error) {
    console.error("GET /contracts error:", error);
    return res.status(500).json({ error: "Failed to fetch contracts" });
  }
});

router.get("/my", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const wallet = req.user!.walletAddress;

    const all = await db.select().from(contracts).orderBy(desc(contracts.createdAt));
    const mine = all.filter(
      (c) => c.clientWallet.toLowerCase() === wallet.toLowerCase() || c.freelancerWallet?.toLowerCase() === wallet.toLowerCase()
    );

    const withMilestones = await Promise.all(
      mine.map(async (c) => {
        const ms = await db
          .select()
          .from(milestones)
          .where(eq(milestones.contractId, c.contractId));
        return { ...c, milestones: ms };
      })
    );

    return res.json({ contracts: withMilestones });
  } catch (error) {
    console.error("GET /contracts/my error:", error);
    return res.status(500).json({ error: "Failed to fetch your contracts" });
  }
});

router.get("/:contractId", async (req, res: Response) => {
  try {
    const [contract] = await db
      .select()
      .from(contracts)
      .where(eq(contracts.contractId, req.params.contractId))
      .limit(1);

    if (!contract) {
      return res.status(404).json({ error: "Contract not found" });
    }

    const ms = await db
      .select()
      .from(milestones)
      .where(eq(milestones.contractId, contract.contractId));

    const subs = await db
      .select()
      .from(submissions)
      .where(eq(submissions.contractId, contract.contractId));

    return res.json({ ...contract, milestones: ms, submissions: subs });
  } catch (error) {
    console.error("GET /contracts/:id error:", error);
    return res.status(500).json({ error: "Failed to fetch contract" });
  }
});

router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log("Create contract body:", JSON.stringify(req.body, null, 2));

    const parsed = CreateContractSchema.safeParse(req.body);
    if (!parsed.success) {
      console.error("Validation error:", parsed.error.flatten());
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten(),
      });
    }

    const data = parsed.data;
    const clientWallet = req.user!.walletAddress; // no lowercase — store as-is

    const contractId = data.contractId || Math.random().toString(36).slice(2, 18);

    let deadlineDate: Date;
    try {
      deadlineDate = new Date(data.deadline);
      if (isNaN(deadlineDate.getTime())) throw new Error("bad date");
    } catch {
      return res.status(400).json({ error: "Invalid deadline format" });
    }

    console.log("Creating contract:", contractId);

    const [contract] = await db
      .insert(contracts)
      .values({
        contractId,
        title: data.title,
        description: data.description,
        requirements: data.requirements,
        category: data.category,
        tags: data.tags,
        clientWallet, // no lowercase
        totalAmount: data.totalAmount,
        deadline: deadlineDate,
        status: "open",
        onChainAddress: data.onChainAddress,
        txSignatures: [data.txSignature],
      })
      .returning();

    const insertedMilestones = await db
      .insert(milestones)
      .values(
        data.milestones.map((m, i) => ({
          contractId,
          index: i,
          title: m.title,
          description: m.description,
          amount: m.amount,
          status: "pending" as const,
        }))
      )
      .returning();

    console.log("Contract saved:", contractId);

    return res.status(201).json({
      ...contract,
      milestones: insertedMilestones,
    });
  } catch (error: any) {
    console.error("POST /contracts error:", error);
    return res.status(500).json({
      error: "Failed to create contract",
      message: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.patch(
  "/:contractId/onchain",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { contractId } = req.params;
      const { onChainAddress, txSignature } = req.body;

      if (!onChainAddress || !txSignature) {
        return res.status(400).json({ error: "onChainAddress and txSignature are required" });
      }

      const [contract] = await db
        .select()
        .from(contracts)
        .where(eq(contracts.contractId, contractId))
        .limit(1);

      if (!contract) return res.status(404).json({ error: "Contract not found" });

      if (contract.clientWallet.toLowerCase() !== req.user!.walletAddress.toLowerCase()) {
        return res.status(403).json({ error: "Only the client can update on-chain data" });
      }

      const [updated] = await db
        .update(contracts)
        .set({
          onChainAddress,
          txSignatures: [...(contract.txSignatures ?? []), txSignature],
          updatedAt: new Date(),
        })
        .where(eq(contracts.contractId, contractId))
        .returning();

      console.log(`On-chain address saved for ${contractId}: ${onChainAddress}`);
      return res.json(updated);
    } catch (error) {
      console.error("PATCH /onchain error:", error);
      return res.status(500).json({ error: "Failed to save on-chain address" });
    }
  }
);

router.patch(
  "/:contractId/milestone/:index/submit",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { contractId, index } = req.params;
      const { submissionNote, txSignature } = req.body;

      const [contract] = await db
        .select()
        .from(contracts)
        .where(eq(contracts.contractId, contractId))
        .limit(1);

      if (!contract) return res.status(404).json({ error: "Contract not found" });

      if (contract.freelancerWallet?.toLowerCase() !== req.user!.walletAddress.toLowerCase()) {
        return res.status(403).json({ error: "Only the assigned freelancer can submit" });
      }

      const mIndex = parseInt(index);
      const [milestone] = await db
        .select()
        .from(milestones)
        .where(
          and(
            eq(milestones.contractId, contractId),
            eq(milestones.index, mIndex)
          )
        )
        .limit(1);

      if (!milestone) return res.status(404).json({ error: "Milestone not found" });

      if (milestone.status !== "pending" && milestone.status !== "submitted") {
        return res.status(400).json({ error: "Milestone already submitted" });
      }

      if (milestone.status === "pending") {
        await db
          .update(milestones)
          .set({
            status: "submitted",
            submissionNote: submissionNote || "",
            submittedAt: new Date(),
          })
          .where(eq(milestones.id, milestone.id));
      }

      if (txSignature) {
        await db
          .update(contracts)
          .set({
            txSignatures: [...(contract.txSignatures || []), txSignature],
          })
          .where(eq(contracts.contractId, contractId));
      }

      const updated = await _getContractWithDetails(contractId);
      return res.json(updated);
    } catch (error) {
      console.error("Submit milestone error:", error);
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

      const [contract] = await db
        .select()
        .from(contracts)
        .where(eq(contracts.contractId, contractId))
        .limit(1);

      if (!contract) return res.status(404).json({ error: "Contract not found" });

      if (contract.clientWallet.toLowerCase() !== req.user!.walletAddress.toLowerCase()) {
        return res.status(403).json({ error: "Only the client can approve" });
      }

      const mIndex = parseInt(index);
      const [milestone] = await db
        .select()
        .from(milestones)
        .where(
          and(
            eq(milestones.contractId, contractId),
            eq(milestones.index, mIndex)
          )
        )
        .limit(1);

      if (!milestone) return res.status(404).json({ error: "Milestone not found" });

      if (milestone.status !== "submitted" && milestone.status !== "approved") {
        return res.status(400).json({ error: "Milestone has not been submitted" });
      }

      if (milestone.status === "submitted") {
        await db
          .update(milestones)
          .set({ status: "approved", approvedAt: new Date() })
          .where(eq(milestones.id, milestone.id));
      }

      const allMs = await db
        .select()
        .from(milestones)
        .where(eq(milestones.contractId, contractId));

      const allApproved = allMs.every((m) =>
        m.id === milestone.id ? true : m.status === "approved"
      );

      if (allApproved && contract.status !== "completed") {
        await db
          .update(contracts)
          .set({ status: "completed" })
          .where(eq(contracts.contractId, contractId));

        if (contract.freelancerWallet) {
          const [freelancer] = await db
            .select()
            .from(users)
            .where(eq(users.walletAddress, contract.freelancerWallet))
            .limit(1);

          if (freelancer) {
            const newReputation = Math.min(
              5.0,
              parseFloat(((freelancer.reputation || 0) + 0.5).toFixed(1))
            );
            const newCompleted = (freelancer.completedContracts || 0) + 1;

            await db
              .update(users)
              .set({
                reputation: newReputation,
                completedContracts: newCompleted,
                updatedAt: new Date(),
              })
              .where(eq(users.walletAddress, contract.freelancerWallet));

            console.log(`Reputation updated for ${contract.freelancerWallet}: ${newReputation}`);
          }
        }
      }

      if (txSignature) {
        await db
          .update(contracts)
          .set({
            txSignatures: [...(contract.txSignatures || []), txSignature],
          })
          .where(eq(contracts.contractId, contractId));
      }

      const updated = await _getContractWithDetails(contractId);
      return res.json(updated);
    } catch (error) {
      console.error("Approve milestone error:", error);
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
      const { milestoneIndex } = req.body;

      const [contract] = await db
        .select()
        .from(contracts)
        .where(eq(contracts.contractId, contractId))
        .limit(1);

      if (!contract) return res.status(404).json({ error: "Contract not found" });

      if (contract.clientWallet.toLowerCase() !== req.user!.walletAddress.toLowerCase()) {
        return res.status(403).json({ error: "Only the client can raise a dispute" });
      }

      await db
        .update(milestones)
        .set({ status: "disputed" })
        .where(
          and(
            eq(milestones.contractId, contractId),
            eq(milestones.index, milestoneIndex)
          )
        );

      await db
        .update(contracts)
        .set({ status: "disputed" })
        .where(eq(contracts.contractId, contractId));

      const updated = await _getContractWithDetails(contractId);
      return res.json(updated);
    } catch (error) {
      console.error("Dispute error:", error);
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

      const [contract] = await db
        .select()
        .from(contracts)
        .where(eq(contracts.contractId, contractId))
        .limit(1);

      if (!contract) return res.status(404).json({ error: "Contract not found" });

      if (contract.clientWallet.toLowerCase() !== req.user!.walletAddress.toLowerCase()) {
        return res.status(403).json({ error: "Only the client can cancel" });
      }

      const ms = await db
        .select()
        .from(milestones)
        .where(eq(milestones.contractId, contractId));

      const hasSubmitted = ms.some((m) => m.status !== "pending");
      if (hasSubmitted) {
        return res.status(400).json({
          error: "Cannot cancel after work has been submitted",
        });
      }

      await db
        .update(contracts)
        .set({ status: "cancelled" })
        .where(eq(contracts.contractId, contractId));

      return res.json({ message: "Contract cancelled successfully" });
    } catch (error) {
      console.error("Cancel error:", error);
      return res.status(500).json({ error: "Failed to cancel" });
    }
  }
);

async function _getContractWithDetails(contractId: string) {
  const [contract] = await db
    .select()
    .from(contracts)
    .where(eq(contracts.contractId, contractId))
    .limit(1);

  const ms = await db
    .select()
    .from(milestones)
    .where(eq(milestones.contractId, contractId));

  const subs = await db
    .select()
    .from(submissions)
    .where(eq(submissions.contractId, contractId));

  return { ...contract, milestones: ms, submissions: subs };
}

export default router;