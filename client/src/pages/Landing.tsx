import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { CircleUserRound, HandCoins, WalletCards, ShieldCheck, Trophy, Building } from 'lucide-react';
import { Plus, Minus } from 'lucide-react'
import { useAuth } from "../hooks/useAuth";
import { useAuthStore } from "../store/auth";
import Footer from "../components/layout/Footer";
import { Wallet, Clock, Star } from 'lucide-react';


export function Landing() {
  const { connected } = useWallet();
  const { isAuthenticated } = useAuthStore();
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    if (connected && !isAuthenticated) {
      login();
    }
  }, [connected]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated]);

  const items = [
    { icon: <Wallet size={18} />, label: 'No banks involved' },
    { icon: <ShieldCheck size={18} />, label: 'Funds always safe' },
    { icon: <Clock size={18} />, label: 'Pay in seconds' },
    { icon: <Star size={18} />, label: 'On chain reputation' },
  ];

  const faqs = [
    {
      question: "How does the escrow system work?",
      answer:
        "When a client posts a job and hires a freelancer, funds are locked in an on chain vault. Neither party can touch the funds until milestones are approved no middlemen, no trust required.",
    },
    {
      question: "What happens if a milestone is disputed?",
      answer:
        "If a client doesn't approve a milestone, the freelancer can raise a dispute. Our on chain arbitration process reviews the submission and releases or refunds funds based on the outcome.",
    },
    {
      question: "Do I need a Phantom wallet to get started?",
      answer:
        "Yes, we use Phantom for authentication. Just sign a message with your wallet—no passwords, no email signups. Your wallet is your identity on the platform.",
    },
    {
      question: "How quickly do I receive payment after milestone approval?",
      answer:
        "Instantly. The moment a client approves a milestone, SOL is transferred directly to your wallet on-chain. No delays, no bank transfers, no fees.",
    },
    {
      question: "How does on chain reputation work?",
      answer:
        "Every completed job, approval, and dispute is recorded on-chain. Your reputation score is public, tamper proof, and travels with your wallet across every platform that supports it.",
    },
  ];

  const features = [
    {
      icon: <Building className="w-6 h-6" />,
      title: "Open Marketplace",
      description: "Post jobs. Submit proposals. Build your on chain reputation."
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: "Trustless Escrow",
      description: "Funds locked in on-chain vault. No middlemen only on milestone approval"
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      title: "Milestone Payments",
      description: "Break work into milestones and automatic SOLs are transfered.",
    },
    {
      icon: <HandCoins className="w-6 h-6" />,
      title: "Instant Payouts",
      description: "Work approved? SOL hits your wallet in seconds.",
    },
    {
      icon: <WalletCards className="w-6 h-6" />,
      title: "Wallet Auth",
      description: "No passwords. Sign a message with Phantom. That's it.",
    }
  ];

  return (
    <>
      {/* ROOT: pattern background */}
      <div
        className="min-h-screen five flex flex-col"
        style={{
          backgroundColor: '#ffffff',
          position: 'relative',
        }}
      >
        {/* Vertical line overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(90deg, #ccc 1px, transparent 1px)',
            backgroundSize: '50px 100%',
            pointerEvents: 'none',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%)',
            zIndex: 0,
          }}
        />

        {/* All content above the overlay */}
        <div className="relative z-10 max-w-5xl mx-auto w-full flex flex-col min-h-screen">

          {/* NAV */}
          <nav className="max-w-5xl mx-auto w-full flex items-center justify-between px-8 py-3">
            <div className="flex items-center gap-3">
              <img src="/images/earn.png" alt="Earn Logo" className="w-12 object-contain" />
              <p className="text-[20px] font-semibold">earn</p>
            </div>
            <div className="flex items-center gap-6 text-[14px] font-semibold text-gray-500">
              <a href="/about" className="hover:text-black">About</a>
              <button
                onClick={() => navigate("/marketplace")}
                className="bg-[#E5E7EB] cursor-pointer px-5 py-2 rounded-full text-black hover:bg-gray-300 transition-all">
                Marketplace
              </button>
            </div>
          </nav>

          {/* HERO */}
          <main className="max-w-6xl mx-auto w-full px-8 pt-14 mb-10 flex flex-col items-start">
            <div className="inline-flex items-center gap-2 mb-8 bg-[#F3F4F6] text-[#6B7280] px-3 py-1.5 rounded-full border border-[#E5E7EB]">
              <span className="text-[14px] gap-1 flex flex-row tracking-wide">
                <CircleUserRound size={20} /> For freelancers & gig workers
              </span>
            </div>

            <h1 className="text-[50px] font-semibold text-gray-950 tracking-[-0.05em] leading-[1.02] mb-3">
              Your on chain work layer.
            </h1>

            <p className="text-[26px] text-[#6B7280] max-w-3xl mb-6 leading-[1.35] tracking-tight font-medium">
              A trustless platform for finding work, locking funds,<br />
              and getting paid all on Solana.
            </p>

            {/* WALLET PILL */}
            <div className="flex flex-col items-start gap-10">
              <div className="flex items-center bg-[#F3F4F6] rounded-full p-1 group transition-all">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="flex flex-col items-center gap-4"
                >
                  {!connected ? (
                    <div className="flex flex-col items-center gap-3">
                      <WalletMultiButton />
                    </div>
                  ) : loading ? (
                    <div className="flex items-center gap-2 text-sm text-acid">
                      <div className="w-4 h-4 border-2 border-acid/30 border-t-acid rounded-full animate-spin" />
                      Verifying wallet...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-acid">
                      <div className="w-4 h-4 border-2 border-acid/30 border-t-acid rounded-full animate-spin" />
                      Signing in...
                    </div>
                  )}
                </motion.div>

                <div className="pl-6 pr-12">
                  <div className="text-[13px] font-bold text-black leading-tight">Log in to your wallet</div>
                  <div className="text-[13px] font-medium text-[#9CA3AF] leading-tight mt-0.5">and start earning faster</div>
                </div>
              </div>
            </div>
          </main>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="bg-gray-200 rounded-2xl pt-8 pl-8 pb-1 mb-4 pr-1">
            <div className="w-full aspect-video border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <iframe
                className="w-full h-full"
                src="https://youtube.com/embed/"
                title="Earn - How it works"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </motion.div>



          <div className="max-w-5xl mx-auto  text-slate-900">
            <div className="flex five flex-wrap pb-8 items-center justify-start gap-x-10 gap-y-4 px-6 py-4 border-b border-gray-100">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-gray-800 cursor-pointer hover:text-black transition-colors"
                >
                  <p className="opacity-90">{item.icon}</p>
                  <p className="text-lg font-semibold tracking-tight">{item.label}</p>
                </div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="card p-5 hover:border-border-bright transition-all"
            >
              <h1 className="text-[31px] font-semibold mb-10 leading-tight">
                Great ideas start in quiet places, <br /> welcome to your private think space.
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="bg-gray-200 p-4 rounded-[24px] min-h-[220px] flex flex-col justify-start"
                  >
                    <div className="mb-8 text-slate-700">{feature.icon}</div>
                    <div className="mt-auto">
                      <h3 className="text-lg font-semibold mb-1">{feature.title}</h3>
                      <p className="text-slate-500 text-sm leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* FAQ */}
          <section className="mt-8 mb-20 text-slate-900">
            <div className="max-w-5xl p-2 mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="md:col-span-1">
                <h2 className="text-3xl font-semibold tracking-tight leading-tight">
                  Frequently <br /> asked questions.
                </h2>
              </div>

              <div className="md:col-span-2 divide-y divide-slate-200 border-t border-slate-200">
                {faqs.map((faq, index) => (
                  <div key={index} className="py-6">
                    <button
                      onClick={() => setOpenIndex(openIndex === index ? null : index)}
                      className="flex w-full items-center justify-between text-left group"
                    >
                      <span className="text-lg font-medium text-slate-800 group-hover:text-black transition-colors">
                        {faq.question}
                      </span>
                      <span className="ml-6 flex-shrink-0 text-slate-400">
                        {openIndex === index ? <Minus size={20} /> : <Plus size={20} />}
                      </span>
                    </button>

                    {openIndex === index && (
                      <div className="mt-4 pr-12 transition-all duration-300 ease-in-out">
                        <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
                <div className="border-b border-slate-200" />
              </div>
            </div>
          </section>
          <Footer />
        </div>
      </div>

    </>
  );
}