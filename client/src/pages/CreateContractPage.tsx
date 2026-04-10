import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { motion } from "framer-motion";
import { Plus, Trash2, AlertCircle, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { solToLamports } from "../utils/solana";
import { v4 as uuidv4 } from "uuid";

interface MilestoneForm { title: string; description: string; amount: string; }

export default function CreateContractPage() {
  const navigate = useNavigate();
  const { publicKey } = useWallet();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [freelancerWallet, setFreelancerWallet] = useState("");
  const [deadline, setDeadline] = useState("");
  const [milestones, setMilestones] = useState<MilestoneForm[]>([{ title: "", description: "", amount: "" }]);
  const [loading, setLoading] = useState(false);

  const totalSOL = milestones.reduce((s, m) => s + (parseFloat(m.amount) || 0), 0);

  const addMilestone = () => { if (milestones.length < 10) setMilestones([...milestones, { title: "", description: "", amount: "" }]); };
  const removeMilestone = (i: number) => setMilestones(milestones.filter((_, idx) => idx !== i));
  const updateMilestone = (i: number, field: keyof MilestoneForm, value: string) => {
    const u = [...milestones]; u[i][field] = value; setMilestones(u);
  };

  const handleSubmit = async () => {
    if (!publicKey) { toast.error("Connect wallet first"); return; }
    if (!title || !description || !freelancerWallet || !deadline) { toast.error("Fill all fields"); return; }
    try { new PublicKey(freelancerWallet); } catch { toast.error("Invalid freelancer wallet"); return; }

    setLoading(true);
    try {
      // In production: call Anchor program here, then save to backend
      const contractId = uuidv4();
      await api.post("/api/contracts", {
        title, description, freelancerWallet,
        deadline: new Date(deadline).toISOString(),
        milestones: milestones.map((m) => ({
          title: m.title, description: m.description,
          amount: solToLamports(parseFloat(m.amount)),
        })),
        onChainAddress: "pending_deployment",
        txSignature: "pending_tx",
      });
      toast.success("Contract created!");
      navigate("/contracts");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to create contract");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/contracts" className="w-9 h-9 rounded-xl card flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-display font-bold text-3xl text-white">New Contract</h1>
          <p className="text-zinc-500 mt-0.5 text-sm">Funds will lock on Solana until milestones are approved</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Details */}
        <div className="card p-6 space-y-4">
          <h2 className="font-display font-semibold text-white text-sm uppercase tracking-wider text-zinc-400 pb-3 border-b border-dark-border">
            Contract Details
          </h2>
          <div>
            <label className="label">Project Title</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Build a Solana dApp" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-[90px] resize-none" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the project scope and deliverables…" />
          </div>
          <div>
            <label className="label">Freelancer Wallet Address</label>
            <input className="input font-mono text-sm" value={freelancerWallet} onChange={(e) => setFreelancerWallet(e.target.value)} placeholder="Solana public key…" />
          </div>
          <div>
            <label className="label">Project Deadline</label>
            <input type="datetime-local" className="input" value={deadline} onChange={(e) => setDeadline(e.target.value)} min={new Date().toISOString().slice(0, 16)} />
          </div>
        </div>

        {/* Milestones */}
        <div className="card p-6">
          <div className="flex items-center justify-between pb-3 border-b border-dark-border mb-4">
            <h2 className="font-display font-semibold text-white text-sm uppercase tracking-wider text-zinc-400">
              Milestones ({milestones.length}/10)
            </h2>
            <button onClick={addMilestone} disabled={milestones.length >= 10} className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          <div className="space-y-3">
            {milestones.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-dark-elevated rounded-xl p-4 space-y-3 border border-dark-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-display font-semibold text-zinc-500 uppercase tracking-wider">
                    Milestone {i + 1}
                  </span>
                  {milestones.length > 1 && (
                    <button onClick={() => removeMilestone(i)} className="text-zinc-700 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <input className="input text-sm" value={m.title} onChange={(e) => updateMilestone(i, "title", e.target.value)} placeholder="Milestone title" />
                <input className="input text-sm" value={m.description} onChange={(e) => updateMilestone(i, "description", e.target.value)} placeholder="What will be delivered?" />
                <div className="flex items-center gap-2">
                  <input type="number" step="0.01" min="0" className="input text-sm" value={m.amount} onChange={(e) => updateMilestone(i, "amount", e.target.value)} placeholder="0.00" />
                  <span className="text-zinc-500 font-mono font-medium text-sm">SOL</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-dark-border flex items-center justify-between">
            <span className="text-zinc-500 font-display text-sm">Total Escrow Amount</span>
            <span className="font-mono font-bold text-2xl text-accent">{totalSOL.toFixed(4)} SOL</span>
          </div>
        </div>

        {/* Warning */}
        <div className="flex gap-3 p-4 bg-yellow-500/5 border border-yellow-500/15 rounded-xl">
          <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-yellow-200/50 text-xs leading-relaxed">
            This will deposit <strong className="text-yellow-300">{totalSOL.toFixed(4)} SOL</strong> into a Solana smart contract escrow. Funds can only be released via milestone approvals or cancelled before work is submitted.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || totalSOL <= 0}
          className="btn-accent w-full py-4 text-base"
        >
          {loading ? "Creating contract…" : `Lock ${totalSOL.toFixed(4)} SOL in Escrow`}
        </button>
      </div>
    </div>
  );
}