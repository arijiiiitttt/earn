import { useEffect, useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { Plus, RefreshCw, Briefcase, LayoutDashboard, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { contractsApi } from "../lib/api";
import type { Contract } from "../types";
import { StatsRow } from "../components/dashboard/StatsRow";
import { ContractCard } from "../components/contracts/ContractCard";
import { CreateContractModal } from "../components/contracts/CreateContractModal";
import { Spinner } from "../components/ui/Spinner";
import { useBalance } from "../hooks/useBalance";

export function Dashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const { refresh: refreshBalance } = useBalance();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "client" | "freelancer">("all");

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    if (hour < 21) return "Good evening";
    return "Good Night";
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    loadContracts();
  }, [isAuthenticated, navigate]);

  const loadContracts = async () => {
    setLoading(true);
    try {
      const { data } = await contractsApi.getMy();
      setContracts(data.contracts || []);
    } catch {
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = contracts.filter((c) => {
    if (filter === "client") return c.clientWallet === user?.walletAddress;
    if (filter === "freelancer") return c.freelancerWallet === user?.walletAddress;
    return true;
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white text-[#1f2328] font-inter selection:bg-[#0969da22]">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        
        {/* Minimal Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-[#656d76]">
              <LayoutDashboard size={16} />
              <span className="hover:underline cursor-pointer">{user.username}</span>
              <span>/</span>
              <span className="font-semibold text-[#1f2328]">dashboard</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {greeting}, {user.username}
            </h1>
            <div className="flex items-center gap-3 pt-1">
              <code className="text-[11px] font-mono bg-[#f6f8fa] px-2 py-0.5 rounded border border-[#d0d7de] text-[#656d76]">
                {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
              </code>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { loadContracts(); refreshBalance(); }}
              className="p-1.5 rounded-md border border-[#d0d7de] bg-[#f6f8fa] hover:bg-[#f3f4f6] text-[#656d76] transition-all active:bg-[#ebecf0]"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1f883d] text-white rounded-md text-sm font-semibold hover:bg-[#1a7f37] transition-colors shadow-sm active:shadow-inner"
            >
              <Plus size={16} />
              <span>New Project</span>
            </button>
          </div>
        </header>

        {/* Account Stats Container */}
        <section className="border border-[#d0d7de] rounded-md overflow-hidden bg-white">
          <div className="bg-[#f6f8fa] border-b border-[#d0d7de] px-4 py-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[#1f2328]">Account Overview</h3>
            <span className="text-[10px] text-[#656d76] uppercase font-bold tracking-wider">Live Metrics</span>
          </div>
          <StatsRow user={user} />
        </section>

        {/* Project Management Area */}
        <div className="space-y-4">
          <div className="border-b border-[#d0d7de]">
            <nav className="flex gap-4">
              {(["all", "client", "freelancer"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`pb-3 px-1 text-sm capitalize transition-all relative ${
                    filter === f
                      ? "text-black font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#fd8c73]"
                      : "text-[#656d76] hover:text-black"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {f}
                    <span className="px-1.5 py-0.5 rounded-full bg-[#afb8c133] text-[11px] font-medium text-[#656d76]">
                      {f === "all" ? contracts.length : contracts.filter(c => 
                        f === "client" ? c.clientWallet === user.walletAddress : c.freelancerWallet === user.walletAddress
                      ).length}
                    </span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          <main className="min-h-[300px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 border border-[#d0d7de] rounded-md bg-[#f6f8fa]/50">
                <Spinner size="md" className="text-[#8c959f]" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="border border-[#d0d7de] border-dashed rounded-md p-16 text-center bg-white">
                <Briefcase size={32} className="text-[#8c959f] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-black">No {filter !== 'all' ? filter : ''} projects found</h3>
                <p className="text-[#656d76] mt-1 mb-6 text-sm">
                  You don't have any active contracts in this category.
                </p>
                <button
                  onClick={() => setCreateOpen(true)}
                  className="text-sm font-semibold text-[#0969da] hover:underline flex items-center justify-center gap-1 mx-auto"
                >
                  Get started by creating a new project <ArrowUpRight size={14} />
                </button>
              </div>
            ) : (
              <div className="border border-[#d0d7de] rounded-md divide-y divide-[#d0d7de] bg-white shadow-sm overflow-hidden">
                <AnimatePresence mode="popLayout">
                  {filtered.map((c, i) => (
                    <ContractCard key={c.contractId} contract={c} index={i} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </main>
        </div>

        <CreateContractModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={loadContracts}
        />
      </div>
    </div>
  );
}