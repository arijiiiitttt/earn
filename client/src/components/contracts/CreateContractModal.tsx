import { useState } from "react";
import { Plus, Trash2, Zap, AlertCircle, Terminal, Clipboard } from "lucide-react";
import toast from "react-hot-toast";
import { useWallet } from "@solana/wallet-adapter-react";
import { Modal } from "../ui/Modal";
import { SiSolana } from "react-icons/si";
import { Spinner } from "../ui/Spinner";
import { contractsApi, solToLamports } from "../../lib/api";

interface MilestoneInput {
  title: string;
  description: string;
  amount: string;
}

interface CreateContractModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const CATEGORIES = [
  "Smart Contract", "Frontend", "Backend", "Full Stack",
  "Design", "Mobile", "DevOps", "Security Audit", "Documentation", "Other",
];

function generateShortId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 16; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function CreateContractModal({ open, onClose, onCreated }: CreateContractModalProps) {
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    requirements: "",
    category: "",
    tags: "",
    deadline: "",
  });

  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { title: "", description: "", amount: "" },
  ]);

  const totalSol = milestones.reduce(
    (acc, m) => acc + (parseFloat(m.amount) || 0),
    0
  );

  const updateMilestone = (idx: number, field: keyof MilestoneInput, value: string) => {
    setMilestones((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  };

  const addMilestone = () => {
    if (milestones.length >= 10) return;
    setMilestones((prev) => [...prev, { title: "", description: "", amount: "" }]);
  };

  const removeMilestone = (idx: number) => {
    if (milestones.length === 1) return;
    setMilestones((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!publicKey) return;
    if (!form.title || !form.description || !form.deadline) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (milestones.some((m) => !m.title || !m.description || !m.amount)) {
      toast.error("Please fill in all milestone fields");
      return;
    }
    if (totalSol <= 0) {
      toast.error("Total amount must be greater than 0");
      return;
    }

    setLoading(true);
    try {
      const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
      const milestonesPayload = milestones.map((m) => ({
        title: m.title,
        description: m.description,
        amount: solToLamports(parseFloat(m.amount)),
      }));

      const contractId = generateShortId();
      await contractsApi.create({
        contractId,
        title: form.title,
        description: form.description,
        requirements: form.requirements || undefined,
        category: form.category || undefined,
        tags,
        deadline: new Date(form.deadline).toISOString(),
        totalAmount: solToLamports(totalSol),
        milestones: milestonesPayload,
        onChainAddress: "pending",
        txSignature: "pending",
      });

      toast.success("Job posted successfully");
      onCreated();
      onClose();
      setForm({ title: "", description: "", requirements: "", category: "", tags: "", deadline: "" });
      setMilestones([{ title: "", description: "", amount: "" }]);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to create contract");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create New Job" size="xl">
      <div className="space-y-8 py-2 font-sans text-[#1f2328]">

        {/* Basic Information Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[#d0d7de] pb-2">
            <Clipboard size={18} className="text-[#636c76]" />
            <h3 className="text-sm font-semibold">Project specifications</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Title <span className="text-rose-500">*</span></label>
              <input
                className="w-full bg-[#f6f8fa] border border-[#d0d7de] rounded-md py-1.5 px-3 text-sm focus:bg-white focus:border-[#0969da] focus:ring-1 focus:ring-[#0969da] outline-none transition-all"
                placeholder="e.g. Audit Anchor smart contract"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Category</label>
                <select
                  className="w-full bg-[#f6f8fa] border border-[#d0d7de] rounded-md py-1.5 px-3 text-sm focus:bg-white focus:border-[#0969da] outline-none transition-all appearance-none cursor-pointer"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Deadline <span className="text-rose-500">*</span></label>
                <input
                  type="date"
                  className="w-full bg-[#f6f8fa] border border-[#d0d7de] rounded-md py-1.5 px-3 text-sm focus:bg-white focus:border-[#0969da] outline-none transition-all"
                  value={form.deadline}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Description <span className="text-rose-500">*</span></label>
              <textarea
                className="w-full bg-[#f6f8fa] border border-[#d0d7de] rounded-md py-2 px-3 text-sm focus:bg-white focus:border-[#0969da] outline-none min-h-[100px] resize-y font-sans leading-relaxed"
                placeholder="What are the goals of this project?"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Requirements</label>
                <textarea
                  className="w-full bg-[#f6f8fa] border border-[#d0d7de] rounded-md py-2 px-3 text-xs focus:bg-white focus:border-[#0969da] outline-none min-h-[60px] resize-none"
                  placeholder="Technical stacks or certifications..."
                  value={form.requirements}
                  onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Tags (Labels)</label>
                <textarea
                  className="w-full bg-[#f6f8fa] border border-[#d0d7de] rounded-md py-2 px-3 text-xs focus:bg-white focus:border-[#0969da] outline-none min-h-[60px] resize-none"
                  placeholder="rust, web3, backend"
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Milestones Section - GitHub-styled list */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#d0d7de] pb-2">
            <div className="flex items-center gap-2">
              <Terminal size={18} className="text-[#636c76]" />
              <h3 className="text-sm font-semibold">Milestones & roadmap</h3>
            </div>
            <button
              onClick={addMilestone}
              disabled={milestones.length >= 10}
              className="text-xs font-semibold text-[#0969da] hover:underline flex items-center gap-1 disabled:opacity-50"
            >
              <Plus size={14} /> Add another milestone
            </button>
          </div>

          <div className="space-y-3">
            {milestones.map((m, idx) => (
              <div key={idx} className="border border-[#d0d7de] rounded-md overflow-hidden shadow-sm">
                <div className="bg-[#f6f8fa] border-b border-[#d0d7de] px-4 py-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#1f2328]">Milestone #{idx + 1}</span>
                  {milestones.length > 1 && (
                    <button
                      onClick={() => removeMilestone(idx)}
                      className="text-[#636c76] hover:text-rose-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-9 space-y-1">
                    <label className="text-[10px] font-bold text-[#636c76] uppercase">Deliverable Title</label>
                    <input
                      className="w-full border border-[#d0d7de] rounded-md py-1.5 px-3 text-sm focus:border-[#0969da] outline-none"
                      placeholder="e.g. Initial Prototype"
                      value={m.title}
                      onChange={(e) => updateMilestone(idx, "title", e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-3 space-y-1">
                    <label className="text-[10px] font-bold text-[#636c76] uppercase tracking-wider">
                      Amount (SOL)
                    </label>
                    <div className="relative flex items-center">
                      {/* Icon Container */}
                      <div className="absolute left-2.5 flex items-center pointer-events-none text-[#636c76]">
                        <SiSolana size={14} />
                      </div>

                      <input
                        type="number"
                        step="any"
                        className="w-full border border-[#d0d7de] rounded-md py-1.5 pl-8 pr-3 text-sm focus:border-[#0969da] outline-none transition-colors"
                        placeholder="0.00"
                        value={m.amount}
                        onChange={(e) => updateMilestone(idx, "amount", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-12 space-y-1">
                    <label className="text-[10px] font-bold text-[#636c76] uppercase">Acceptance Criteria</label>
                    <textarea
                      className="w-full border border-[#d0d7de] rounded-md py-2 px-3 text-xs focus:border-[#0969da] outline-none min-h-[50px] resize-none"
                      placeholder="What defines this step as complete?"
                      value={m.description}
                      onChange={(e) => updateMilestone(idx, "description", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer: Budget & Submission */}
        <div className="bg-[#f6f8fa] border border-[#d0d7de] rounded-md p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-[#eff1f3] border border-[#d0d7de] p-2 rounded-md">
              <SiSolana size={20} className="text-black" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#636c76] uppercase tracking-wide">Total Contract Value</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">
{totalSol.toFixed(4)}</span>
                <span className="text-xs text-[#636c76] font-medium">SOL</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-[10px] text-[#636c76] font-medium">
              <AlertCircle size={12} />
              Funds are committed to escrow upon assignment
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full md:w-auto px-6 py-1.5 bg-[#1f883d] hover:bg-[#1a7f37] text-white rounded-md font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? <Spinner size="sm" /> : "Post contract"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}