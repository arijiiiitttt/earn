import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Plus,
  User,
  LogOut,
  ShieldCheck,
  ChevronLeft,
  Bell,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useWallet } from "@solana/wallet-adapter-react";
import { shortAddr } from "../utils/solana";
import { useState } from "react";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/contracts", icon: FileText, label: "Contracts" },
  { to: "/contracts/new", icon: Plus, label: "New Contract" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { publicKey } = useWallet();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-dark-base">
      {/* ── Sidebar ── */}
      <aside
        className={`flex flex-col border-r border-dark-border bg-dark-card transition-all duration-300 ${
          collapsed ? "w-[72px]" : "w-[220px]"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-dark-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-4 h-4 text-black" strokeWidth={2.5} />
            </div>
            {!collapsed && (
              <span className="font-display font-bold text-white text-base">
                TrustPay
              </span>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-zinc-600 hover:text-white transition-colors p-1"
          >
            <ChevronLeft
              className={`w-4 h-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                isActive
                  ? `flex items-center gap-3 px-3 py-2.5 rounded-xl font-display font-semibold text-sm bg-accent text-black transition-all`
                  : `flex items-center gap-3 px-3 py-2.5 rounded-xl font-display font-medium text-sm text-zinc-500 hover:text-white hover:bg-dark-hover transition-all`
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-3 border-t border-dark-border space-y-2">
          {!collapsed && (
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-dark-elevated">
              <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-xs font-bold text-accent">
                {user?.username?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate font-display">
                  {user?.username}
                </p>
                <p className="text-[10px] text-zinc-600 font-mono truncate">
                  {publicKey ? shortAddr(publicKey.toBase58()) : "—"}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={async () => { await logout(); navigate("/"); }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition-all w-full font-display text-sm ${collapsed ? "justify-center" : ""}`}
            title="Logout"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between px-8 py-4 border-b border-dark-border bg-dark-card">
          <div />
          <div className="flex items-center gap-3">
            <button className="relative w-9 h-9 rounded-xl bg-dark-elevated border border-dark-border flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-dark-elevated border border-dark-border">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-mono text-zinc-400">devnet</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}