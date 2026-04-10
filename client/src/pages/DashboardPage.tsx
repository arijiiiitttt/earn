import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FileText, CheckCircle, Clock, TrendingUp, ArrowUpRight, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import api from "../utils/api";
import { useAuthStore } from "../store/authStore";
import { lamportsToSol, shortAddr } from "../utils/solana";
import { formatDistanceToNow, format } from "date-fns";

const chartData = [
  { month: "Feb", value: 0 }, { month: "Mar", value: 0.5 },
  { month: "Apr", value: 0.3 }, { month: "May", value: 1.2 },
  { month: "Jun", value: 0.8 }, { month: "Jul", value: 2.1 },
  { month: "Aug", value: 1.9 }, { month: "Sep", value: 2.8 },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data, isLoading } = useQuery({
    queryKey: ["contracts", "dashboard"],
    queryFn: () => api.get("/api/contracts?limit=5").then((r) => r.data),
  });

  const contracts = data?.contracts || [];
  const active = contracts.filter((c: any) => c.status === "active").length;
  const completed = contracts.filter((c: any) => c.status === "completed").length;
  const totalVol = contracts.reduce((s: number, c: any) => s + c.totalAmount, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl text-white">
            Hello {user?.username} 👋
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">Welcome back</p>
        </div>
        <Link to="/contracts/new" className="btn-accent flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> New Contract
        </Link>
      </div>

      {/* Quick actions row */}
      <div className="flex gap-3 mb-8">
        {[
          { label: "Create", icon: Plus },
          { label: "Contracts", icon: FileText },
          { label: "History", icon: Clock },
          { label: "Profile", icon: TrendingUp },
        ].map((a) => (
          <button key={a.label} className="flex flex-col items-center gap-2 px-5 py-3 card hover:border-accent/20 transition-all">
            <div className="w-9 h-9 rounded-full bg-dark-elevated border border-dark-border flex items-center justify-center">
              <a.icon className="w-4 h-4 text-zinc-400" />
            </div>
            <span className="text-xs text-zinc-500 font-display">{a.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Left column */}
        <div className="col-span-8 space-y-5">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Active Contracts", value: active, icon: Clock, color: "text-accent", bg: "bg-accent/10" },
              { label: "Completed", value: completed, icon: CheckCircle, color: "text-blue-400", bg: "bg-blue-500/10" },
              { label: "Total Volume", value: `${lamportsToSol(totalVol)} SOL`, icon: TrendingUp, color: "text-purple-400", bg: "bg-purple-500/10" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="card p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-zinc-500 text-xs font-display">{stat.label}</span>
                  <div className={`w-8 h-8 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </div>
                <div className={`font-display font-bold text-2xl ${stat.color}`}>
                  {stat.value}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Chart */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display font-semibold text-white">Volume</h2>
                <p className="text-zinc-600 text-xs mt-0.5">SOL paid out over time</p>
              </div>
              <select className="text-xs bg-dark-elevated border border-dark-border text-zinc-400 px-3 py-1.5 rounded-lg font-display outline-none">
                <option>Monthly</option>
                <option>Weekly</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#CAFF4D" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#CAFF4D" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: "#52525b", fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#52525b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#141414", border: "1px solid #2A2A2A", borderRadius: "10px", fontSize: 12 }}
                  labelStyle={{ color: "#fff" }}
                  itemStyle={{ color: "#CAFF4D" }}
                />
                <Area type="monotone" dataKey="value" stroke="#CAFF4D" strokeWidth={2} fill="url(#colorVal)" dot={false} activeDot={{ r: 5, fill: "#CAFF4D" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Transactions */}
          <div className="card">
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border">
              <h2 className="font-display font-semibold text-white">Recent Contracts</h2>
              <Link to="/contracts" className="text-xs text-accent font-display flex items-center gap-1 hover:opacity-80">
                See all <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            {isLoading ? (
              <div className="px-6 py-10 text-center text-zinc-600 text-sm">Loading…</div>
            ) : contracts.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <FileText className="w-10 h-10 text-zinc-800 mx-auto mb-3" />
                <p className="text-zinc-600 text-sm mb-4">No contracts yet</p>
                <Link to="/contracts/new" className="btn-accent text-sm inline-flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5" /> Create Contract
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-dark-border">
                {contracts.map((c: any, i: number) => (
                  <Link
                    key={c.contractId}
                    to={`/contracts/${c.contractId}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-dark-hover transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-dark-elevated border border-dark-border flex items-center justify-center">
                        <FileText className="w-4 h-4 text-zinc-500" />
                      </div>
                      <div>
                        <p className="font-display font-medium text-white text-sm">{c.title}</p>
                        <p className="text-zinc-600 text-xs mt-0.5 font-mono">
                          {shortAddr(c.freelancerWallet)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-semibold text-accent text-sm">
                        {lamportsToSol(c.totalAmount)} SOL
                      </p>
                      <p className="text-zinc-600 text-xs mt-0.5">
                        {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="col-span-4 space-y-5">
          {/* Wallet card */}
          <div className="rounded-2xl bg-accent p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-black/10 translate-y-8 -translate-x-8" />
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-black" />
                </div>
                <span className="font-mono text-black/60 text-xs">•••• devnet</span>
              </div>
              <p className="font-display font-bold text-3xl text-black mb-1">
                {lamportsToSol(totalVol)} SOL
              </p>
              <p className="text-black/60 text-sm font-display">{user?.username}</p>
              <div className="flex gap-3 mt-5">
                <button className="flex-1 bg-black/20 text-black font-display font-semibold text-xs py-2 rounded-lg hover:bg-black/30 transition-colors">
                  Expenses
                </button>
                <button className="flex-1 bg-white/30 text-black font-display font-semibold text-xs py-2 rounded-lg hover:bg-white/40 transition-colors">
                  Income
                </button>
              </div>
            </div>
          </div>

          {/* History */}
          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-dark-border">
              <h3 className="font-display font-semibold text-white text-sm">History</h3>
              <button className="text-zinc-600 hover:text-white transition-colors">
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y divide-dark-border">
              {contracts.length === 0 ? (
                <div className="px-5 py-8 text-center text-zinc-700 text-xs font-display">
                  No history yet
                </div>
              ) : (
                contracts.slice(0, 4).map((c: any) => (
                  <div key={c.contractId} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="w-8 h-8 rounded-xl bg-dark-elevated flex items-center justify-center">
                      <FileText className="w-3.5 h-3.5 text-zinc-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-display font-medium truncate">{c.title}</p>
                      <p className="text-zinc-600 text-[10px] mt-0.5">
                        {format(new Date(c.createdAt), "dd MMM, yyyy")}
                      </p>
                    </div>
                    <span className={`text-xs font-mono font-semibold ${c.status === "completed" ? "text-accent" : "text-red-400"}`}>
                      {c.status === "completed" ? "+" : "-"}{lamportsToSol(c.totalAmount)} SOL
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}