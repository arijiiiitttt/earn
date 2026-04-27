import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
   Clock, User, ExternalLink, Hash, CheckCircle2, ShieldCheck, 
  Users, Calendar, GitPullRequest, AlertCircle, FileText, Code
} from "lucide-react";
import { SiSolana } from "react-icons/si";
import toast from "react-hot-toast";
import { contractsApi, lamportsToSol, shortenAddress, timeUntil, formatDate } from "../lib/api";
import type { Contract, Submission } from "../types";
import { submissionsApi } from "../lib/api";
import { useAuthStore } from "../store/auth";
import { StatusBadge } from "../components/ui/StatusBadge";
import { MilestoneList } from "../components/contracts/MilestoneList";
import { SubmissionCard } from "../components/submissions/SubmissionCard";
import { ApplyModal } from "../components/submissions/ApplyModal";
import { Spinner } from "../components/ui/Spinner";
import { cancelContractOnChain } from "../lib/solana";
import { useWallet } from "@solana/wallet-adapter-react";
import { FaChalkboardUser } from "react-icons/fa6";


export function ContractPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const wallet = useWallet();

  const [contract, setContract] = useState<Contract | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [tab, setTab] = useState<"milestones" | "proposals">("milestones");
  const [mySubmission, setMySubmission] = useState<Submission | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    if (id) loadContract();
  }, [id]);

  const loadContract = async () => {
    setLoading(true);
    try {
      const { data } = await contractsApi.getOne(id!);
      setContract(data);

      if (isAuthenticated) {
        try {
          const { data: subData } = await submissionsApi.getForContract(id!);
          const subs = subData.submissions || [];
          setSubmissions(subs);
          // ── RE-ADDED LOGIC: Logic to detect if the logged-in user already applied ──
          setMySubmission(
            subs.find((s: Submission) => s.walletAddress === user?.walletAddress) || null
          );
        } catch (e) {
          console.error("Failed to fetch submissions", e);
        }
      }
    } catch (err) {
      toast.error("Contract not found");
      navigate("/marketplace");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!contract || !wallet.publicKey) return;
    if (!confirm("Are you sure? This will cancel the contract and refund the SOL from the vault.")) return;

    setCancelLoading(true);
    try {
      // ── RE-ADDED LOGIC: On-chain cancellation check ──
      if (contract.onChainAddress && contract.onChainAddress !== "pending") {
        await cancelContractOnChain(wallet, contract.contractId, contract.clientWallet);
      }
      await contractsApi.cancel(contract.contractId);
      toast.success("Contract cancelled and SOL refunded.");
      loadContract();
    } catch (err: any) {
      toast.error(err?.message || "Cancellation failed");
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" /></div>;
  if (!contract) return null;

  const isClient = user?.walletAddress === contract.clientWallet;
  const isFreelancer = user?.walletAddress === contract.freelancerWallet;
  const canApply = isAuthenticated && !isClient && !isFreelancer && contract.status === "open" && !mySubmission;

  return (
    <div className="min-h-screen bg-white text-[#1f2328] font-inter selection:bg-[#b3d4fc]">
      {/* GitHub Repository-style Header */}
      <div className="bg-[#f6f8fa] border-b -mt-2 border-[#d0d7de] pt-6">
        <div className="max-w-7xl mx-auto px-6">
          

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-[#636c76]" />
                <h1 className="text-xl font-semibold tracking-tight">
                  {contract.title}
                </h1>
                <StatusBadge status={contract.status} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {contract.onChainAddress && contract.onChainAddress !== "pending" && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#dafbe1] text-[#1a7f37] rounded-full border border-[#1a7f371a] text-[11px] font-bold uppercase tracking-wide shadow-sm">
                  <ShieldCheck size={14} /> Escrow Verified
                </div>
              )}
              <div className="px-3 py-1 bg-white border border-[#d0d7de] rounded-md text-[11px] font-mono font-bold text-[#636c76] shadow-sm">
                REF: {contract.contractId.slice(0, 8)}
              </div>
            </div>
          </div>

          {/* GitHub Tabs Navigation */}
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => setTab("milestones")}
              className={`flex items-center gap-2 px-4 py-2 text-sm border-b-2 transition-all ${
                tab === "milestones" 
                ? "border-[#fd8c73] font-semibold text-[#1f2328]" 
                : "border-transparent text-[#636c76] hover:bg-[#eaeef2]"
              }`}
            >
              <Code size={16} className={tab === "milestones" ? "text-[#1f2328]" : "text-[#636c76]"} /> 
              Roadmap
            </button>
            {(isClient || contract.status !== "open") && (
              <button
                onClick={() => setTab("proposals")}
                className={`flex items-center gap-2 px-4 py-2 text-sm border-b-2 transition-all ${
                  tab === "proposals" 
                  ? "border-[#fd8c73] font-semibold text-[#1f2328]" 
                  : "border-transparent text-[#636c76] hover:bg-[#eaeef2]"
                }`}
              >
                <FaChalkboardUser size={16} className={tab === "proposals" ? "text-[#1f2328]" : "text-[#636c76]"} /> 
                Proposals 
                <span className="ml-1 px-1.5 py-0.5 bg-[#afb8c133] rounded-full text-[10px] font-bold">{submissions.length}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content (Left) */}
          <div className="lg:col-span-9 space-y-6">
            <div className="border border-[#d0d7de] rounded-md overflow-hidden bg-white shadow-sm">
              <div className="bg-[#f6f8fa] border-b border-[#d0d7de] px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#1f2328]">
                  <FileText size={14} className="text-[#636c76]" />
                  Job's Description
                </div>
                <div className="text-[10px] text-[#636c76] font-sans">
Last updated {formatDate(contract.createdAt?.toString() || new Date().toISOString())}
                </div>
              </div>
              <div className="p-6 md:p-8">
                <div className="prose prose-sm max-w-none">
                  <h3 className="text-lg font-semibold mb-3 border-b border-[#d0d7de] pb-1">Brief</h3>
                  <p className="text-[#1f2328] leading-relaxed whitespace-pre-wrap mb-6 text-[15px]">
                    {contract.description}
                  </p>

                  {contract.requirements && (
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold mb-3 border-b border-[#d0d7de] pb-1">Technical Stack & Requirements</h3>
                      <div className="bg-[#f6f8fa] p-4 rounded-md border border-[#d0d7de] font-mono text-sm text-[#1f2328] leading-6">
                        {contract.requirements}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-8">
                  {contract.tags?.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-[#ddf4ff] text-[#0969da] rounded-md text-[11px] font-bold border border-[#54aeff4d]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                {tab === "milestones" ? (
                  <MilestoneList contract={contract} onRefresh={loadContract} />
                ) : (
                  <div className="space-y-3">
                    {submissions.length === 0 ? (
                      <div className="border border-[#d0d7de] rounded-md p-16 text-center bg-[#f6f8fa]">
                        <Users size={32} className="mx-auto text-[#8c959f] mb-2" />
                        <h3 className="font-semibold text-[#1f2328]">No active proposals</h3>
                        <p className="text-sm text-[#636c76]">This contract is currently waiting for contributors.</p>
                      </div>
                    ) : (
                      submissions.map((sub, i) => (
                        <SubmissionCard key={sub.id} submission={sub} contract={contract} isClient={isClient} onRefresh={loadContract} index={i} />
                      ))
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
<p className="text-xs font-bold text-[#1f2328]">{formatDate(contract.deadline?.toString() || "")}</p>
          {/* Sidebar (Right) */}
          <div className="lg:col-span-3 space-y-6">
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-[#1f2328] flex items-center gap-2">
                Deployment Details
              </h3>
              
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-[#636c76] font-medium">Bounty Amount</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl  flex flex-row items-center gap-2 font-bold tracking-tight text-[#1f2328]"><SiSolana size={24} />
 {lamportsToSol(contract.totalAmount)}</span>
                    <span className="text-xs font-bold text-[#636c76]">SOL</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#d0d7de] space-y-3">
                  <div className="flex items-start gap-3">
                    <Clock size={16} className="text-[#636c76] mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-[#1f2328]">{timeUntil(contract.deadline)}</p>
                      <p className="text-[10px] text-[#636c76]">Time remaining</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar size={16} className="text-[#636c76] mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-[#1f2328]">{formatDate(contract.deadline)}</p>
                      <p className="text-[10px] text-[#636c76]">Due date</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User size={16} className="text-[#636c76] mt-0.5" />
                    <div>
                      <p className="text-xs font-mono font-bold text-[#0969da]">{shortenAddress(contract.clientWallet)}</p>
                      <p className="text-[10px] text-[#636c76]">Owner</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  {canApply && (
                    <button
                      onClick={() => setApplyOpen(true)}
                      className="w-full py-2 bg-[#1f883d] text-white rounded-md text-sm font-semibold hover:bg-[#1a7f37] border border-[#1b1f2326] shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                      <GitPullRequest size={16} /> Submit Proposal
                    </button>
                  )}

                  {mySubmission && !isClient && !isFreelancer && (
                    <div className="w-full py-2 bg-[#f6f8fa] text-[#1f2328] rounded-md text-sm font-semibold border border-[#d0d7de] flex items-center justify-center gap-2">
                      <CheckCircle2 size={16} className="text-[#1a7f37]" /> Applied
                    </div>
                  )}

                  {isClient && contract.status === "open" && (
                    <button
                      onClick={handleCancel}
                      disabled={cancelLoading}
                      className="w-full mt-2 py-2 text-[#cf222e] hover:bg-[#faebec] rounded-md text-sm font-semibold border border-[#d0d7de] transition-all flex items-center justify-center gap-2"
                    >
                      {cancelLoading ? <Spinner size="sm" /> : <><AlertCircle size={14} /> Terminate</>}
                    </button>
                  )}
                </div>
              </div>
            </section>

            {contract.onChainAddress && contract.onChainAddress !== "pending" && (
              <section className="pt-6 border-t border-[#d0d7de] space-y-3">
                <h3 className="text-sm font-semibold text-[#1f2328]">On-chain Metadata</h3>
                <div className="bg-[#f6f8fa] p-3 rounded-md border border-[#d0d7de] group">
                  <div className="flex items-center gap-2 text-[10px] text-[#636c76] mb-1 font-bold uppercase tracking-wider">
                    <Hash size={12} /> PDA Instance
                  </div>
                  <p className="font-mono text-[10px] break-all text-[#636c76] leading-relaxed selection:bg-[#cee4ff]">{contract.onChainAddress}</p>
                </div>
                <a
                  href={`https://explorer.solana.com/address/${contract.onChainAddress}?cluster=devnet`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-1.5 text-xs font-semibold text-[#0969da] hover:bg-[#0969da12] rounded-md border border-[#d0d7de] transition-all"
                >
                  <ExternalLink size={14} /> Open in Explorer
                </a>
              </section>
            )}
          </div>
        </div>

        <ApplyModal
          open={applyOpen}
          onClose={() => setApplyOpen(false)}
          contract={contract}
          onApplied={loadContract}
        />
      </div>
    </div>
  );
}