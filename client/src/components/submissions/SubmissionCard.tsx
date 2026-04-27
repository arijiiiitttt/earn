import { motion } from "framer-motion";
import { Globe, Calendar, X, User, Zap, ShieldCheck, AlertCircle, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { Submission, Contract } from "../../types";
import { lamportsToSol, shortenAddress, contractsApi, submissionsApi } from "../../lib/api";
import { StatusBadge } from "../ui/StatusBadge";
import { Spinner } from "../ui/Spinner";
import { createContractOnChain } from "../../lib/solana";
import { FaGithub } from "react-icons/fa6";
import { SiSolana } from "react-icons/si";


interface SubmissionCardProps {
  submission: Submission;
  contract: Contract;
  isClient: boolean;
  onRefresh: () => void;
  index?: number;
}

type AcceptStep = "idle" | "funding" | "saving" | "accepting" | "done";

export function SubmissionCard({ submission, contract, isClient, onRefresh, index = 0 }: SubmissionCardProps) {
  const wallet = useWallet();
  const [acceptStep, setAcceptStep] = useState<AcceptStep>("idle");
  const [rejectLoading, setRejectLoading] = useState(false);
  const [pendingTx, setPendingTx] = useState<{ txSignature: string; contractPDA: string } | null>(null);

  const stepLabel: Record<AcceptStep, string> = {
    idle: "Accept & Fund Vault",
    funding: "Sign tx in wallet...",
    saving: "Saving on-chain address...",
    accepting: "Assigning freelancer...",
    done: "Done!",
  };

  const handleAccept = async () => {
    if (!wallet.publicKey) {
      toast.error("Wallet not connected");
      return;
    }

    try {
      let txSignature: string;
      let contractPDA: string;

      if (pendingTx) {
        txSignature = pendingTx.txSignature;
        contractPDA = pendingTx.contractPDA;
        toast("Retrying DB sync from previous transaction...");
      } else {
        setAcceptStep("funding");
        const result = await createContractOnChain(
          wallet,
          contract.contractId,
          contract.title,
          submission.walletAddress,
          contract.milestones.map((m) => ({
            title: m.title,
            description: m.description,
            amount: m.amount,
          })),
          Math.floor(new Date(contract.deadline).getTime() / 1000)
        );
        txSignature = result.txSignature;
        contractPDA = result.contractPDA;

        if (result.alreadyExisted) toast("Contract already on-chain, syncing DB...");
        setPendingTx({ txSignature, contractPDA });
      }

      setAcceptStep("saving");
      try {
        await contractsApi.updateOnChainAddress(contract.contractId, contractPDA, txSignature);
      } catch (saveErr: any) {
        toast.error(`DB sync failed. Click Retry to try again.`);
        setAcceptStep("idle");
        return;
      }

      setAcceptStep("accepting");
      try {
        await submissionsApi.accept(submission.id);
      } catch (acceptErr: any) {
        toast.error(`Assign failed. Click Retry to try again.`);
        setAcceptStep("idle");
        return;
      }

      setPendingTx(null);
      setAcceptStep("done");
      toast.success(`Vault funded <SiSolana size={14} /> ${lamportsToSol(contract.totalAmount)} · Freelancer assigned!`);
      onRefresh();
    } catch (err: any) {
      toast.error(err?.message?.includes("User rejected") ? "Wallet signature cancelled" : "Failed to accept");
      setAcceptStep("idle");
    }
  };

  const handleReject = async () => {
    setRejectLoading(true);
    try {
      await submissionsApi.reject(submission.id);
      toast.success("Proposal rejected");
      onRefresh();
    } catch (err: any) {
      toast.error("Failed to reject");
    } finally {
      setRejectLoading(false);
    }
  };

  const isAccepting = acceptStep !== "idle" && acceptStep !== "done";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white border border-[#d0d7de] rounded-md overflow-hidden hover:border-[#8c959f] hover:shadow-sm transition-all"
    >
      <div className="px-4 py-3 bg-[#f6f8fa] border-b border-[#d0d7de] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#afb8c1] border border-[#d0d7de] flex items-center justify-center text-white shadow-inner">
            <User size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#1f2328]">
                {submission.user?.username || shortenAddress(submission.walletAddress)}
              </span>
              <StatusBadge status={submission.status} />
            </div>
            <p className="text-[11px] font-mono text-[#636c76]">{shortenAddress(submission.walletAddress)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm flex flex-row items-center gap-2 font-bold text-[#1f2328]"><SiSolana size={14} /> {submission.proposedAmount ? lamportsToSol(submission.proposedAmount) : "--"}</p>
          <p className="text-[10px] uppercase font-bold text-[#636c76] tracking-tighter">Proposed Bid</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {submission.coverLetter && (
          <div className="text-sm text-[#1f2328] bg-[#fcfcfc] p-4 border border-[#d0d7de] rounded-md leading-relaxed whitespace-pre-wrap">
            {submission.coverLetter}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 border-b border-[#d0d7de] pb-4">
          {submission.estimatedDays && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#636c76] bg-[#eff1f3] px-2 py-1 rounded-md">
              <Calendar size={14} /> {submission.estimatedDays} days
            </div>
          )}
          <div className="flex items-center gap-3 ml-auto">
            {submission.githubUrl && (
              <a href={submission.githubUrl} target="_blank" className="flex items-center gap-1 text-xs font-semibold text-[#0969da] hover:underline">
                <FaGithub size={14} /> Code
              </a>
            )}
            {submission.portfolioUrl && (
              <a href={submission.portfolioUrl} target="_blank" className="flex items-center gap-1 text-xs font-semibold text-[#0969da] hover:underline">
                <Globe size={14} /> Portfolio
              </a>
            )}
          </div>
        </div>

        {isClient && submission.status === "pending" && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap gap-2">
              <button
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-1.5 bg-[#1f883d] text-white rounded-md text-xs font-semibold hover:bg-[#1a7f37] border border-[#1b1f2326] shadow-sm transition-all disabled:opacity-50"
                onClick={handleAccept}
                disabled={isAccepting || rejectLoading}
              >
                {isAccepting ? <Spinner size="sm" /> : <Zap size={14} />}
                {isAccepting ? stepLabel[acceptStep] : pendingTx ? "Retry DB Sync" : "Accept & Fund Vault"}
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 px-4 py-1.5 bg-white text-[#cf222e] border border-[#d0d7de] rounded-md text-xs font-semibold hover:bg-[#faebec] transition-all disabled:opacity-50"
                onClick={handleReject}
                disabled={isAccepting || rejectLoading}
              >
                {rejectLoading ? <Spinner size="sm" /> : <X size={14} />} Reject
              </button>
            </div>

            {isAccepting && (
              <div className="bg-[#f6f8fa] rounded-md border border-[#d0d7de] p-3">
                <div className="flex items-center justify-between gap-1">
                  {[
                    { id: "funding", label: "Fund" },
                    { id: "saving", label: "Sync" },
                    { id: "accepting", label: "Assign" }
                  ].map((step, i, arr) => {
                    const stepOrder = ["funding", "saving", "accepting"];
                    const currentIdx = stepOrder.indexOf(acceptStep);
                    const isDone = i < currentIdx;
                    const isActive = i === currentIdx;

                    return (
                      <div key={step.id} className="flex-1 flex items-center gap-1">
                        <div className="flex flex-col gap-1.5 flex-1 text-center">
                          <div className={`h-1.5 w-full rounded-full transition-all duration-500 ${isDone ? "bg-[#1f883d]" : isActive ? "bg-[#0969da] animate-pulse" : "bg-[#d0d7de]"}`} />
                          <span className={`text-[9px] font-bold uppercase tracking-widest ${isActive ? "text-[#0969da]" : isDone ? "text-[#1f883d]" : "text-[#636c76]"}`}>{step.label}</span>
                        </div>
                        {i < arr.length - 1 && <ChevronRight size={12} className="text-[#d0d7de] mb-4" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className={`p-3 rounded-md border text-[11px] leading-relaxed flex gap-2.5 items-start ${pendingTx ? "bg-[#fff8c5] border-[#d4a72c] text-[#735c0f]" : "bg-[#ddf4ff] border-[#54aeff4d] text-[#0969da]"}`}>
              <div className="mt-0.5 shrink-0">{pendingTx ? <AlertCircle size={14} /> : <ShieldCheck size={14} />}</div>
              <p>{pendingTx ? "On-chain transaction succeeded. Click 'Retry' to sync your database records—no more SOL will be charged." : `Locking <SiSolana size={14} />
 ${lamportsToSol(contract.totalAmount)} SOL into escrow. Funds released only upon milestone approval.`}</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}