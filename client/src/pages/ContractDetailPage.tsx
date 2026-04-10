import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CheckCircle, Send, AlertTriangle, ExternalLink, ArrowLeft, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";
import api from "../utils/api";
import { lamportsToSol, shortAddr, explorerUrl } from "../utils/solana";
import { useAuthStore } from "../store/authStore";
import { format, formatDistanceToNow } from "date-fns";

export default function ContractDetailPage() {
  const { contractId } = useParams<{ contractId: string }>();
  const wallet = useAuthStore((s) => s.user?.walletAddress);
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const { data: contract, isLoading } = useQuery({
    queryKey: ["contract", contractId],
    queryFn: () => api.get(`/api/contracts/${contractId}`).then((r) => r.data),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["contract", contractId] });

  const submitMutation = useMutation({
    mutationFn: ({ index, note }: { index: number; note: string }) =>
      api.patch(`/api/contracts/${contractId}/milestone/${index}/submit`, { submissionNote: note }),
    onSuccess: () => { toast.success("Milestone submitted!"); setActiveModal(null); invalidate(); },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed"),
  });

  const approveMutation = useMutation({
    mutationFn: (index: number) =>
      api.patch(`/api/contracts/${contractId}/milestone/${index}/approve`, {}),
    onSuccess: () => { toast.success("Payment released! ✅"); invalidate(); },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed"),
  });

  if (isLoading) return <div className="text-zinc-600 py-20 text-center">Loading…</div>;
  if (!contract) return <div className="text-zinc-600 py-20 text-center">Contract not found</div>;

  const isClient = contract.clientWallet === wallet;
  const isFreelancer = contract.freelancerWallet === wallet;
  const progress = contract.milestones.filter((m: any) => m.status === "approved").length;
  const total = contract.milestones.length;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/contracts" className="w-9 h-9 rounded-xl card flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display font-bold text-2xl text-white">{contract.title}</h1>
            <span className={`badge-${contract.status}`}>{contract.status}</span>
          </div>
          <p className="text-zinc-500 text-sm mt-0.5">{contract.description}</p>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Value", val: `${lamportsToSol(contract.totalAmount)} SOL`, mono: true, accent: true },
          { label: "Deadline", val: format(new Date(contract.deadline), "MMM dd, yyyy") },
          { label: "Client", val: shortAddr(contract.clientWallet) },
          { label: "Freelancer", val: shortAddr(contract.freelancerWallet) },
        ].map((item) => (
          <div key={item.label} className="card p-4">
            <div className="text-xs text-zinc-600 font-display mb-1">{item.label}</div>
            <div className={`font-semibold text-sm ${item.accent ? "font-mono text-accent text-base" : "text-white"}`}>
              {item.val}
            </div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="card p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-display font-semibold text-white text-sm">Progress</span>
          <span className="text-zinc-600 text-xs font-mono">{progress}/{total} milestones approved</span>
        </div>
        <div className="h-2 bg-dark-elevated rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-accent rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${total > 0 ? (progress / total) * 100 : 0}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Milestones */}
      <div className="space-y-3 mb-6">
        <h2 className="font-display font-semibold text-white">Milestones</h2>
        {contract.milestones.map((m: any, i: number) => (
          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
            className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-display font-semibold text-white text-sm">{m.title}</span>
                  <span className={`badge-${m.status}`}>{m.status}</span>
                </div>
                <p className="text-zinc-500 text-xs">{m.description}</p>
                {m.submissionNote && (
                  <p className="text-zinc-400 text-xs mt-2 italic bg-dark-elevated px-3 py-2 rounded-lg">
                    "{m.submissionNote}"
                  </p>
                )}
                {m.submittedAt && (
                  <p className="text-zinc-700 text-xs mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Submitted {formatDistanceToNow(new Date(m.submittedAt), { addSuffix: true })}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-mono font-bold text-accent">{lamportsToSol(m.amount)} SOL</div>
                <div className="flex gap-2 mt-2 justify-end">
                  {isFreelancer && m.status === "pending" && (
                    <button onClick={() => setActiveModal(`submit-${i}`)}
                      className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5">
                      <Send className="w-3 h-3" /> Submit
                    </button>
                  )}
                  {isClient && m.status === "submitted" && (
                    <>
                      <button onClick={() => approveMutation.mutate(i)} disabled={approveMutation.isPending}
                        className="btn-accent text-xs px-3 py-1.5 flex items-center gap-1.5">
                        <CheckCircle className="w-3 h-3" />
                        {approveMutation.isPending ? "…" : "Approve"}
                      </button>
                      <button className="btn-danger text-xs px-3 py-1.5 flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3" /> Dispute
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {activeModal === `submit-${i}` && (
              <div className="mt-4 pt-4 border-t border-dark-border space-y-3">
                <textarea className="input resize-none text-sm" rows={2}
                  placeholder="Add a note about your submission…"
                  value={note} onChange={(e) => setNote(e.target.value)} />
                <div className="flex gap-2">
                  <button onClick={() => submitMutation.mutate({ index: i, note })}
                    disabled={submitMutation.isPending} className="btn-accent text-sm">
                    {submitMutation.isPending ? "Submitting…" : "Confirm Submit"}
                  </button>
                  <button onClick={() => setActiveModal(null)} className="btn-ghost text-sm">Cancel</button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* TX signatures */}
      {contract.txSignatures?.length > 0 && (
        <div className="card p-5">
          <h3 className="font-display font-semibold text-white text-sm mb-3">Transactions</h3>
          <div className="space-y-2">
            {contract.txSignatures.map((sig: string, i: number) => (
              <a key={i} href={explorerUrl(sig)} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-xs text-zinc-600 hover:text-accent transition-colors font-mono">
                <ExternalLink className="w-3 h-3" /> {shortAddr(sig, 8)}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}