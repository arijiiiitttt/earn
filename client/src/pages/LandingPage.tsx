import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { ShieldCheck,ArrowRight } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useEffect } from "react";


export default function LandingPage() {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (isAuthenticated) navigate("/dashboard"); }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-dark-base flex flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-dark-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-black" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-white text-xl">TrustPay</span>
        </div>
        <button
          onClick={() => connected ? login() : setVisible(true)}
          className="btn-accent flex items-center gap-2"
        >
          {connected ? "Sign In" : "Connect Wallet"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
         
          
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => connected ? login() : setVisible(true)}
              className="btn-accent text-base px-8 py-3.5 flex items-center gap-2"
            >
              {connected ? "Enter App" : "Connect Wallet"}
              <ArrowRight className="w-4 h-4" />
            </button>
            <button className="btn-ghost text-base px-8 py-3.5">View Contract</button>
          </div>
        </motion.div>

        
      </section>

      
    </div>
  );
}