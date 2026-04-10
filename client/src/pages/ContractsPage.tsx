import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, FileText } from "lucide-react";
import api from "../utils/api";
import { lamportsToSol } from "../utils/solana";
import { formatDistanceToNow } from "date-fns";
import { useAuthStore } from "../store/authStore";

export default function ContractsPage() {
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("");
  const wallet = useAuthStore((s) => s.user?.walletAddress);

  const { data, isLoading } = useQuery({
    queryKey: ["contracts", role, status],
    queryFn: () =>
      api.get(`/api/contracts?role=${role}&status=${status}&limit=20`).then((r) => r.data),
  });

  const contracts = data?.contracts || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl text-white">Contracts</h1>
          <p className="text-zinc-500 mt-1 text-sm">Manage all your agreements</p>
        </div>
        <Link to="/contracts/new" className="btn-accent flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> New Contract
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {["all", "client", "freelancer"].map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`px-4 py-2 rounded-xl text-sm font-display font-medium transition-all border ${
              role === r
                ? "bg-accent text-black border-accent"
                : "bg-dark-card border-dark-border text-zinc-500 hover:text-white hover:border-zinc-600"
            }`}
          >
            {r === "all" ? "All Roles" : r === "client" ? "As Client" : "As Freelancer"}
          </button>
        ))}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="input w-auto text-sm ml-auto py-2"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="disputed">Disputed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-20 text-zinc-600">Loading…</div>
      ) : contracts.length === 0 ? (
        <div className="card p-16 text-center">
          <FileText className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
          <p className="text-zinc-600 mb-5">No contracts found</p>
          <Link to="/contracts/new" className="btn-accent inline-flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Create Contract
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-dark-border">
            {["Contract", "Status", "Role", "Amount", "Milestones", "Created"].map((h) => (
              <div key={h} className={`text-xs font-display font-medium text-zinc-600 uppercase tracking-wider ${h === "Contract" ? "col-span-4" : "col-span-2"}`}>
                {h}
              </div>
            ))}
          </div>
          <div className="divide-y divide-dark-border">
            {contracts.map((c: any, i: number) => {
              const isClient = c.clientWallet === wallet;
              const approved = c.milestones.filter((m: any) => m.status === "approved").length;
              return (
                <motion.div
                  key={c.contractId}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    to={`/contracts/${c.contractId}`}
                    className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-dark-hover transition-colors items-center"
                  >
                    <div className="col-span-4">
                      <p className="font-display font-medium text-white text-sm truncate">{c.title}</p>
                      <p className="text-zinc-600 text-xs mt-0.5 truncate">{c.description}</p>
                    </div>
                    <div className="col-span-2">
                      <span className={`badge-${c.status}`}>{c.status}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs font-display text-zinc-500 border border-dark-border px-2 py-1 rounded-lg">
                        {isClient ? "Client" : "Freelancer"}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-mono text-accent text-sm font-semibold">
                        {lamportsToSol(c.totalAmount)} SOL
                      </span>
                    </div>
                    <div className="col-span-1">
                      <span className="text-zinc-500 text-xs font-mono">
                        {approved}/{c.milestones.length}
                      </span>
                    </div>
                    <div className="col-span-1">
                      <span className="text-zinc-600 text-xs">
                        {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}