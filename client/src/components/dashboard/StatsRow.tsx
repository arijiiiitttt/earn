import { motion } from "framer-motion";
import { TrendingUp, Briefcase, Star } from "lucide-react";
import type { User } from "../../types";
import { useBalance } from "../../hooks/useBalance";
import { SiSolana } from "react-icons/si";

interface StatsRowProps {
  user: User;
}

export function StatsRow({ user }: StatsRowProps) {
  const { balance, loading } = useBalance();

  const stats = [
    {
      label: "SOL Balance",
      value: balance !== null ? balance.toFixed(4) : "---",
      sub: loading ? "updating..." : "devnet",
      icon: <SiSolana size={14} />,
      color: "text-[#1f2328]",
    },
    {
      label: "Reputation",
      value: user.reputation?.toFixed(1) ?? "0.0",
      sub: "/ 5.0 rating",
      icon: <Star size={14} />,
      color: "text-[#1f2328]",
    },
    {
      label: "Completed",
      value: user.completedContracts ?? 0,
      sub: "contracts",
      icon: <Briefcase size={14} />,
      color: "text-[#1f2328]",
    },
    {
      label: "Account Role",
      value: user.role ?? "Both",
      sub: "standard",
      icon: <TrendingUp size={14} />,
      color: "text-[#1f2328]",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-[#d0d7de] rounded-md overflow-hidden bg-white shadow-sm">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          className={`p-4 flex flex-col justify-center border-[#d0d7de] ${
            i !== stats.length - 1 ? "md:border-r" : ""
          } ${i % 2 === 0 ? "border-r md:border-r" : ""} ${
            i < 2 ? "border-b md:border-b-0" : ""
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[#636c76]">{stat.icon}</span>
            <p className="text-[11px] font-bold text-[#636c76] uppercase tracking-wide">
              {stat.label}
            </p>
          </div>
          
          <div className="flex items-baseline gap-1">
            <p className={`text-xl font-bold ${stat.color} tracking-tight`}>
              {stat.value}
            </p>
            {stat.label === "SOL Balance" && (
              <span className="text-[10px] font-bold text-[#636c76] ml-1">SOL</span>
            )}
          </div>
          
          <p className="text-[10px] font-medium text-[#636c76] mt-0.5">
            {stat.sub}
          </p>
        </motion.div>
      ))}
    </div>
  );
}