import { Router, Response } from "express";
import { z } from "zod";
import { db } from "../config/db";
import { submissions, contracts, users } from "../schema";
import { authenticate, AuthRequest } from "../middlewares/auth";
import { eq, and } from "drizzle-orm";

const router = Router();


const SubmitSchema = z.object({
  coverLetter: z.string().min(10, "Cover letter too short").max(1000),
  proposedAmount: z.number().positive().optional(),
  estimatedDays: z.number().positive().int().optional(),
  githubUrl: z.string().url().optional().or(z.literal("")),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
});


router.get(
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

      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }

      
      const isClient = contract.clientWallet.toLowerCase() === req.user!.walletAddress.toLowerCase();

      if (isClient) {
        const subs = await db
          .select()
          .from(submissions)
          .where(eq(submissions.contractId, contractId));

        const withUsers = await Promise.all(
          subs.map(async (sub) => {
            const [user] = await db
              .select()
              .from(users)
              .where(eq(users.walletAddress, sub.walletAddress))
              .limit(1);
            return { ...sub, user: user || null };
          })
        );

        return res.json({ submissions: withUsers });
      } else {
        const [mySub] = await db
          .select()
          .from(submissions)
          .where(
            and(
              eq(submissions.contractId, contractId),
              eq(submissions.walletAddress, req.user!.walletAddress)
            )
          )
          .limit(1);

        return res.json({ submissions: mySub ? [mySub] : [] });
      }
    } catch (error) {
      console.error("GET submissions error:", error);
      return res.status(500).json({ error: "Failed to fetch submissions" });
    }
  }
);

router.post(
  "/:contractId",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { contractId } = req.params;
      const walletAddress = req.user!.walletAddress;

      console.log(
        `Submission from ${walletAddress} for contract ${contractId}`
      );

      // Validate body
      const parsed = SubmitSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
      }

      const data = parsed.data;

      const [contract] = await db
        .select()
        .from(contracts)
        .where(eq(contracts.contractId, contractId))
        .limit(1);

      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }

      if (contract.status !== "open") {
        return res.status(400).json({
          error: `Cannot apply — contract is ${contract.status}`,
        });
      }

      if (contract.clientWallet.toLowerCase() === walletAddress.toLowerCase()) {
        return res.status(400).json({
          error: "You cannot apply to your own contract",
        });
      }

      const [existing] = await db
        .select()
        .from(submissions)
        .where(
          and(
            eq(submissions.contractId, contractId),
            eq(submissions.walletAddress, walletAddress)
          )
        )
        .limit(1);

      if (existing) {
        return res.status(409).json({
          error: "You have already applied to this contract",
        });
      }

      const [sub] = await db
        .insert(submissions)
        .values({
          contractId,
          walletAddress,
          coverLetter: data.coverLetter,
          proposedAmount: data.proposedAmount,
          estimatedDays: data.estimatedDays,
          githubUrl: data.githubUrl || null,
          portfolioUrl: data.portfolioUrl || null,
          status: "pending",
        })
        .returning();

      console.log(`Submission created: ${sub.id}`);

      return res.status(201).json(sub);
    } catch (error: any) {
      console.error("POST submission error:", error);
      return res.status(500).json({ error: "Failed to submit application" });
    }
  }
);

router.patch(
  "/:id/accept",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const [sub] = await db
        .select()
        .from(submissions)
        .where(eq(submissions.id, id))
        .limit(1);

      if (!sub) {
        return res.status(404).json({ error: "Submission not found" });
      }

      const [contract] = await db
        .select()
        .from(contracts)
        .where(eq(contracts.contractId, sub.contractId))
        .limit(1);

      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }

      if (contract.clientWallet.toLowerCase() !== req.user!.walletAddress.toLowerCase()) {
        return res.status(403).json({ error: "Only the client can accept submissions" });
      }

      if (contract.status !== "open" && contract.status !== "active") {
        return res.status(400).json({
          error: "Contract is no longer open for acceptance",
        });
      }

      await db
        .update(submissions)
        .set({ status: "accepted" })
        .where(eq(submissions.id, id));

      await db
        .update(submissions)
        .set({ status: "rejected" })
        .where(
          and(
            eq(submissions.contractId, sub.contractId),
            eq(submissions.status, "pending")
          )
        );

      await db
        .update(contracts)
        .set({
          freelancerWallet: sub.walletAddress,
          status: "active",
        })
        .where(eq(contracts.contractId, sub.contractId));

      console.log(
        `Submission ${id} accepted — freelancer: ${sub.walletAddress}`
      );

      return res.json({
        message: "Submission accepted. Freelancer assigned.",
        freelancerWallet: sub.walletAddress,
        contractId: sub.contractId,
      });
    } catch (error) {
      console.error("Accept submission error:", error);
      return res.status(500).json({ error: "Failed to accept submission" });
    }
  }
);

router.patch(
  "/:id/reject",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const [sub] = await db
        .select()
        .from(submissions)
        .where(eq(submissions.id, id))
        .limit(1);

      if (!sub) return res.status(404).json({ error: "Submission not found" });

      const [contract] = await db
        .select()
        .from(contracts)
        .where(eq(contracts.contractId, sub.contractId))
        .limit(1);

      if (!contract) return res.status(404).json({ error: "Contract not found" });

      if (contract.clientWallet.toLowerCase() !== req.user!.walletAddress.toLowerCase()) {
        return res.status(403).json({ error: "Only the client can reject submissions" });
      }

      await db
        .update(submissions)
        .set({ status: "rejected" })
        .where(eq(submissions.id, id));

      return res.json({ message: "Submission rejected" });
    } catch (error) {
      console.error("Reject submission error:", error);
      return res.status(500).json({ error: "Failed to reject submission" });
    }
  }
);

router.delete(
  "/:id",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const [sub] = await db
        .select()
        .from(submissions)
        .where(eq(submissions.id, id))
        .limit(1);

      if (!sub) return res.status(404).json({ error: "Submission not found" });

      if (sub.walletAddress !== req.user!.walletAddress) {
        return res.status(403).json({ error: "You can only delete your own submission" });
      }

      if (sub.status !== "pending") {
        return res.status(400).json({ error: "Cannot delete a processed submission" });
      }

      await db.delete(submissions).where(eq(submissions.id, id));

      return res.json({ message: "Submission withdrawn" });
    } catch (error) {
      console.error("Delete submission error:", error);
      return res.status(500).json({ error: "Failed to delete submission" });
    }
  }
);

export default router;