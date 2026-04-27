import { useState } from "react";
import { Send, Globe, Clock, Wallet, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { Modal } from "../ui/Modal";
import { Spinner } from "../ui/Spinner";
import { submissionsApi, lamportsToSol } from "../../lib/api";
import type { Contract } from "../../types";
import { FaGithub } from "react-icons/fa";
import { SiSolana } from "react-icons/si";


interface ApplyModalProps {
  open: boolean;
  onClose: () => void;
  contract: Contract;
  onApplied: () => void;
}

export function ApplyModal({ open, onClose, contract, onApplied }: ApplyModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    coverLetter: "",
    proposedAmount: lamportsToSol(contract.totalAmount).toString(),
    estimatedDays: "",
    githubUrl: "",
    portfolioUrl: "",
  });

  const handleSubmit = async () => {
    if (form.coverLetter.length < 10) {
      toast.error("Cover letter must be at least 10 characters");
      return;
    }

    setLoading(true);
    try {
      await submissionsApi.submit(contract.contractId, {
        coverLetter: form.coverLetter,
        proposedAmount: form.proposedAmount
          ? Math.round(parseFloat(form.proposedAmount) * 1_000_000_000)
          : undefined,
        estimatedDays: form.estimatedDays ? parseInt(form.estimatedDays) : undefined,
        githubUrl: form.githubUrl || undefined,
        portfolioUrl: form.portfolioUrl || undefined,
      });
      toast.success("Proposal submitted successfully!");
      onApplied();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to submit proposal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Submit a Proposal" size="lg">
      <div className="space-y-6">
        {/* Context Banner: Styled like a GitHub Header */}
        <div className="bg-[#f6f8fa] border border-[#d0d7de] rounded-md p-4 flex items-start gap-3">
          <div className="mt-1 p-2 bg-white border border-[#d0d7de] rounded-md text-[#636c76] shadow-sm">
            <Wallet size={18} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#636c76] uppercase tracking-wide">Bounty Target</p>
            <h3 className="text-sm font-semibold text-[#1f2328]">{contract.title}</h3>
            <p className="text-xs text-[#0969da] font-mono flex gap-1 flex-row mt-0.5">
              Current Budget: <SiSolana  size={14}/>
 {lamportsToSol(contract.totalAmount)} SOL
            </p>
          </div>
        </div>

        {/* Cover Letter Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-[#1f2328]">Cover Letter</label>
            <span className="text-[11px] text-[#636c76] font-mono">{form.coverLetter.length}/1000</span>
          </div>
          <textarea
            className="w-full min-h-[160px] bg-[#f6f8fa] border border-[#d0d7de] rounded-md p-3 text-sm focus:bg-white focus:border-[#0969da] focus:ring-2 focus:ring-[#0969da1a] outline-none transition-all placeholder:text-[#8c959f] resize-none shadow-inner"
            placeholder="Describe your strategy, relevant experience, and why you're a good fit..."
            value={form.coverLetter}
            onChange={(e) => setForm((f) => ({ ...f, coverLetter: e.target.value }))}
          />
        </div>

        {/* Proposal Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-[#1f2328]">
              <Wallet size={14} className="text-[#636c76]" />
              Your Bid (SOL)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-[#636c76]"><SiSolana  size={14}/></span>
              <input
                type="number"
                step="0.01"
                className="w-full bg-[#f6f8fa] border border-[#d0d7de] rounded-md py-1.5 pl-8 pr-3 text-sm focus:bg-white focus:border-[#0969da] focus:ring-2 focus:ring-[#0969da1a] outline-none transition-all"
                placeholder="0.00"
                value={form.proposedAmount}
                onChange={(e) => setForm((f) => ({ ...f, proposedAmount: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-[#1f2328]">
              <Clock size={14} className="text-[#636c76]" />
              Estimated Timeline (Days)
            </label>
            <input
              type="number"
              className="w-full bg-[#f6f8fa] border border-[#d0d7de] rounded-md py-1.5 px-3 text-sm focus:bg-white focus:border-[#0969da] focus:ring-2 focus:ring-[#0969da1a] outline-none transition-all"
              placeholder="e.g. 14"
              value={form.estimatedDays}
              onChange={(e) => setForm((f) => ({ ...f, estimatedDays: e.target.value }))}
            />
          </div>
        </div>

        {/* Links Section */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-[#636c76] uppercase tracking-wider">Verification Links</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-[#1f2328]">
               <FaGithub size={14} /> GitHub Profile
              </label>
              <input
                className="w-full bg-[#f6f8fa] border border-[#d0d7de] rounded-md py-1.5 px-3 text-sm focus:bg-white focus:border-[#0969da] focus:ring-2 focus:ring-[#0969da1a] outline-none transition-all"
                placeholder="github.com/username"
                value={form.githubUrl}
                onChange={(e) => setForm((f) => ({ ...f, githubUrl: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-[#1f2328]">
                <Globe size={14} /> Portfolio / Site Link
              </label>
              <input
                className="w-full bg-[#f6f8fa] border border-[#d0d7de] rounded-md py-1.5 px-3 text-sm focus:bg-white focus:border-[#0969da] focus:ring-2 focus:ring-[#0969da1a] outline-none transition-all"
                placeholder="yourportfolio.com"
                value={form.portfolioUrl}
                onChange={(e) => setForm((f) => ({ ...f, portfolioUrl: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-[#d0d7de]">
          <div className="flex items-center gap-1.5 text-[11px] text-[#636c76] font-medium main">
            <AlertCircle size={12} className="text-[#8c959f]" />
            <span>Smart contract escrow ensures safety.</span>
          </div>
          <div className="flex gap-2">
            <button 
              className="px-4 py-1.5 text-sm font-semibold text-[#1f2328] bg-white border border-[#d0d7de] rounded-md hover:bg-[#f6f8fa] transition-colors shadow-sm"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold text-white bg-[#1f883d] border border-[#1b1f2326] rounded-md hover:bg-[#1a7f37] disabled:opacity-50 shadow-sm transition-all"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? <Spinner size="sm" /> : <Send size={14} />}
              Submit Proposal
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}