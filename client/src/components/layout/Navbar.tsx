import { Link, useLocation } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Store,
  User,
  LogOut,
  Zap,
  Menu,
  X
} from "lucide-react";
import { SiSolana } from "react-icons/si";
import { useState } from "react";
import { useAuthStore } from "../../store/auth";
import { useAuth } from "../../hooks/useAuth";
import { useBalance } from "../../hooks/useBalance";

export function Navbar() {
  const { pathname } = useLocation();
  const { connected } = useWallet();
  const { isAuthenticated, user } = useAuthStore();
  const { logout } = useAuth();
  const { balance } = useBalance();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, auth: true },
    { to: "/marketplace", label: "Marketplace", icon: Store, auth: false },
    { to: "/profile", label: "Profile", icon: User, auth: true },
  ];

  const active = (to: string) => pathname === to;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-[#d0d7de] bg-[#f6f8fa] text-[#1f2328]">
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
        
        {/* GitHub Style Breadcrumb Logo */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group">
              <img src="/images/earn.png" alt="Earn Logo" className="w-12 object-contain" />
            
           
              <p className="five text-[20px] font-semibold">earn</p>
          
          </Link>
        </div>

        {/* Desktop Nav - Tab Style */}
        <nav className="hidden md:flex items-center h-full">
          {navLinks
            .filter((l) => !l.auth || isAuthenticated)
            .map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`flex items-center gap-1.5 px-4 h-full text-sm transition-all relative ${
                  active(l.to)
                    ? "text-black font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#fd8c73]"
                    : "text-[#656d76] hover:bg-[#ebecf0] hover:text-black"
                }`}
              >
                <l.icon size={14} className={active(l.to) ? "text-black" : "text-[#656d76]"} />
                {l.label}
              </Link>
            ))}
        </nav>

        {/* Right side Actions */}
        <div className="flex items-center gap-2">
          {/* GitHub Style Balance Badge */}
          {isAuthenticated && balance !== null && (
            <div className="hidden md:flex items-center gap-1 px-2 py-0.5 bg-[#eff1f3] border border-[#d0d7de] rounded-full">
              <span className="text-[10px] font-bold text-[#656d76]"><SiSolana size={12} /></span>
              <span className="text-[11px] font-mono font-semibold text-black">
                {balance.toFixed(3)}
              </span>
            </div>
          )}

          {/* Wallet / Auth Section */}
          <div className="flex items-center gap-1 bg-white border border-[#d0d7de] rounded-md p-0.5">
            {!connected ? (
              <div className="custom-gh-wallet">
                <WalletMultiButton />
              </div>
            ) : isAuthenticated ? (
              <div className="flex items-center gap-2 pl-2 pr-1">
                <span className="text-xs font-semibold text-black">
                  {user?.username || "anon"}
                </span>
                <div className="w-[1px] h-4 bg-[#d0d7de]" />
                <button
                  onClick={logout}
                  className="p-1 rounded-md hover:bg-[#f6f8fa] text-[#656d76] hover:text-red-600 transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <div className="custom-gh-wallet">
                 <WalletMultiButton />
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-1.5 rounded-md hover:bg-[#ebecf0] text-[#656d76]"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="md:hidden border-t border-[#d0d7de] bg-white px-4 py-3 flex flex-col gap-1 shadow-lg"
        >
          {navLinks
            .filter((l) => !l.auth || isAuthenticated)
            .map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                  active(l.to)
                    ? "bg-[#f6f8fa] text-black font-semibold"
                    : "text-[#656d76] hover:bg-[#f6f8fa] hover:text-black"
                }`}
              >
                <l.icon size={14} />
                {l.label}
              </Link>
            ))}
          
          {balance !== null && (
            <div className="mt-2 pt-2 border-t border-[#d0d7de] flex items-center justify-between px-3">
              <span className="text-xs text-[#656d76]">Solana Balance</span>
              <span className="font-mono text-sm font-bold text-[#1f883d]">
                <SiSolana size={14} /> {balance.toFixed(3)}
              </span>
            </div>
          )}
        </motion.div>
      )}
    </header>
  );
}