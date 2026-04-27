import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Clock, AlertTriangle, Upload, Check, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import type { Contract, Milestone } from "../../types";
import { lamportsToSol, contractsApi } from "../../lib/api";
import { StatusBadge } from "../ui/StatusBadge";
import { Spinner } from "../ui/Spinner";
import { useAuthStore } from "../../store/auth";
import { approveMilestoneOnChain, submitMilestoneOnChain } from "../../lib/solana";
import { useWallet } from "@solana/wallet-adapter-react";
import { SiSolana } from "react-icons/si";

interface MilestoneListProps {
  contract: Contract;
  onRefresh: () => void;
}

export function MilestoneList({ contract, onRefresh }: MilestoneListProps) {
  const { user } = useAuthStore();
  const wallet = useWallet();
  const [loading, setLoading] = useState<string | null>(null);
  const [submitNote, setSubmitNote] = useState<{ [idx: number]: string }>({});
  const [showSubmit, setShowSubmit] = useState<number | null>(null);

  const isClient = user?.walletAddress === contract.clientWallet;
  const isFreelancer = user?.walletAddress === contract.freelancerWallet;

  const handleSubmitMilestone = async (milestone: Milestone) => {
    if (!wallet.publicKey) return;
    setLoading(`submit-${milestone.index}`);
    try {
      const note = submitNote[milestone.index] || "";

      if (contract.onChainAddress && contract.onChainAddress !== "pending") {
        try {
          const txSig = await submitMilestoneOnChain(
            wallet,
            contract.contractId,
            contract.clientWallet,
            milestone.index,
            note
          );
          await contractsApi.submitMilestone(contract.contractId, milestone.index, {
            submissionNote: note,
            txSignature: txSig,
          });
        } catch (onChainErr: any) {
          const errMsg = onChainErr?.message || "";
          if (
            errMsg.includes("MilestoneAlreadySubmitted") ||
            errMsg.includes("already submitted") ||
            errMsg.includes("already been processed") ||
            errMsg.includes("This transaction has already")
          ) {
            toast("Already on-chain, syncing DB...");
            await contractsApi.submitMilestone(contract.contractId, milestone.index, {
              submissionNote: note,
            });
          } else {
            throw onChainErr;
          }
        }
      } else {
        await contractsApi.submitMilestone(contract.contractId, milestone.index, {
          submissionNote: note,
        });
      }

      toast.success("Milestone submitted!");
      setShowSubmit(null);
      onRefresh();
    } catch (err: any) {
      const msg = err?.message?.includes("ContractAccount not found")
        ? "Contract not found on-chain — was the vault funded correctly?"
        : err?.response?.data?.error || err?.message || "Failed to submit milestone";
      toast.error(msg);
    } finally {
      setLoading(null);
    }
  };

  const handleApproveMilestone = async (milestone: Milestone) => {
    if (!wallet.publicKey || !contract.freelancerWallet) return;
    setLoading(`approve-${milestone.index}`);
    try {
      let txSig: string | undefined;

      if (contract.onChainAddress && contract.onChainAddress !== "pending") {
        try {
          const result = await approveMilestoneOnChain(
            wallet,
            contract.contractId,
            contract.clientWallet,
            contract.freelancerWallet,
            milestone.index
          );
          txSig = result.txSignature;
          if (result.alreadyApproved) {
            toast("Already approved on-chain, syncing DB...");
          }
        } catch (onChainErr: any) {
          const errMsg = onChainErr?.message || "";
          if (
            errMsg.includes("ContractNotActive") ||
            errMsg.includes("MilestoneNotSubmitted") ||
            errMsg.includes("MilestoneAlreadyApproved") ||
            errMsg.includes("already approved") ||
            errMsg.includes("already been processed") ||
            errMsg.includes("This transaction has already")
          ) {
            toast("Already approved on-chain, syncing DB...");
          } else {
            throw onChainErr;
          }
        }
      }

      await contractsApi.approveMilestone(contract.contractId, milestone.index, {
        txSignature: txSig,
      });

      toast.success("Milestone approved! Payment released ◎");
      onRefresh();
    } catch (err: any) {
      const msg = err?.message?.includes("ContractAccount not found")
        ? "Contract not found on-chain — the vault may not have been funded."
        : err?.message?.includes("relations")
          ? "Wallet mismatch — are you connected with the correct client wallet?"
          : err?.response?.data?.error || err?.message || "Failed to approve milestone";
      toast.error(msg);
    } finally {
      setLoading(null);
    }
  };

  const handleDispute = async (milestone: Milestone) => {
    setLoading(`dispute-${milestone.index}`);
    try {
      await contractsApi.dispute(contract.contractId, milestone.index);
      toast.success("Dispute raised");
      onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to raise dispute");
    } finally {
      setLoading(null);
    }
  };

  const MilestoneIcon = ({ status }: { status: string }) => {
    const baseClass = "z-10 bg-white p-1 rounded-full border shadow-sm";
    if (status === "approved") return <div className={`${baseClass} border-[#1f883d]`}><CheckCircle size={16} className="text-[#1f883d]" /></div>;
    if (status === "submitted") return <div className={`${baseClass} border-[#0969da]`}><Upload size={16} className="text-[#0969da]" /></div>;
    if (status === "disputed") return <div className={`${baseClass} border-[#cf222e]`}><AlertTriangle size={16} className="text-[#cf222e]" /></div>;
    return <div className={`${baseClass} border-[#d0d7de]`}><Clock size={16} className="text-[#636c76]" /></div>;
  };

  return (
    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-[13px] before:w-[2px] before:bg-[#d0d7de] before:content-['']">
      {contract.milestones.map((milestone, i) => (
        <motion.div
          key={milestone.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="relative flex items-start gap-4"
        >
          <div className="mt-1">
            <MilestoneIcon status={milestone.status} />
          </div>

          <div className="flex-1 border border-[#d0d7de] rounded-md overflow-hidden bg-white shadow-sm">
            {/* Header */}
            <div className="bg-[#f6f8fa] border-b border-[#d0d7de] px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#636c76] border border-[#d0d7de] px-1.5 rounded-md uppercase">#{milestone.index + 1}</span>
                <h4 className="text-sm font-semibold text-[#1f2328]">{milestone.title}</h4>
                <StatusBadge status={milestone.status} />
              </div>
              <div className="text-xs flex flex-row items-center gap-2 font-mono font-bold text-[#1f2328]">
                <SiSolana size={14} />
                {lamportsToSol(milestone.amount)}
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-sm text-[#1f2328] leading-relaxed mb-4">
                {milestone.description}
              </p>

              {milestone.submissionNote && (
                <div className="mb-4 flex gap-3 p-3 bg-[#f6f8fa] rounded-md border border-[#d0d7de]">
                  <MessageSquare size={14} className="text-[#636c76] mt-1 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-[#636c76] main uppercase mb-1 tracking-tight">Freelancer Note</p>
                    <p className="text-xs text-[#1f2328] main">"{milestone.submissionNote}"</p>
                  </div>
                </div>
              )}

              {/* Functional Actions */}
              {contract.status === "active" && (
                <div className="flex flex-wrap items-center gap-2">
                  {isFreelancer && milestone.status === "pending" && (
                    <div className="w-full">
                      {showSubmit === milestone.index ? (
                        <div className="space-y-2">
                          <textarea
                            className="w-full text-sm border border-[#d0d7de] rounded-md p-3 focus:border-[#0969da] outline-none min-h-[100px] bg-[#f6f8fa] focus:bg-white transition-all"
                            placeholder="Add a link to the deliverable or a comment..."
                            value={submitNote[milestone.index] || ""}
                            onChange={(e) => setSubmitNote(prev => ({ ...prev, [milestone.index]: e.target.value }))}
                          />
                          <div className="flex gap-2">
                            <button
                              className="px-4 py-1.5 bg-[#1f883d] text-white text-xs font-semibold rounded-md hover:bg-[#1a7f37] flex items-center gap-2 transition-shadow shadow-sm"
                              onClick={() => handleSubmitMilestone(milestone)}
                              disabled={loading === `submit-${milestone.index}`}
                            >
                              {loading === `submit-${milestone.index}` ? <Spinner size="sm" /> : <Upload size={14} />}
                              Submit
                            </button>
                            <button
                              className="px-4 py-1.5 border border-[#d0d7de] text-[#1f2328] text-xs font-semibold rounded-md hover:bg-[#f6f8fa]"
                              onClick={() => setShowSubmit(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          className="px-4 py-1.5 border border-[#d0d7de] text-[#1f2328] text-xs font-semibold rounded-md hover:bg-[#f6f8fa] flex items-center gap-2 shadow-sm"
                          onClick={() => setShowSubmit(milestone.index)}
                        >
                          <Upload size={14} /> Submit Work
                        </button>
                      )}
                    </div>
                  )}

                  {isClient && milestone.status === "submitted" && (
                    <div className="flex gap-2">
                      <button
                        className="px-4 py-1.5 bg-[#1f883d] text-white text-xs font-semibold rounded-md hover:bg-[#1a7f37] flex items-center gap-2 shadow-sm"
                        onClick={() => handleApproveMilestone(milestone)}
                        disabled={loading === `approve-${milestone.index}`}
                      >
                        {loading === `approve-${milestone.index}` ? <Spinner size="sm" /> : <Check size={14} />}
                        Approve & Pay <SiSolana size={14} />
                        {lamportsToSol(milestone.amount)}
                      </button>
                      <button
                        className="px-4 py-1.5 border border-[#d0d7de] text-[#cf222e] text-xs font-semibold rounded-md hover:bg-[#f6f8fa] flex items-center gap-2 transition-colors"
                        onClick={() => handleDispute(milestone)}
                        disabled={loading === `dispute-${milestone.index}`}
                      >
                        <AlertTriangle size={14} /> Dispute
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}