import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, Layers, User } from "lucide-react";
import type { Contract } from "../../types";
import { SiSolana } from "react-icons/si";
import { lamportsToSol, shortenAddress, timeUntil } from "../../lib/api";
import { StatusBadge } from "../ui/StatusBadge";

interface ContractCardProps {
  contract: Contract;
  index?: number;
}

export function ContractCard({ contract, index = 0 }: ContractCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02, duration: 0.15 }}
    >
      <div className="group border-b border-[#d0d7de] p-5 bg-white hover:bg-[#f6f8fa] transition-colors relative">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">

          <div className="flex-1 min-w-0">
            {/* Top Row: Title & Status */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Link
                to={`/contract/${contract.contractId}`}
                className="text-lg font-semibold text-[#0969da] hover:underline break-all"
              >
                {contract.title}
              </Link>
              <StatusBadge status={contract.status} />
            </div>

            {/* Middle Row: Description */}
            <p className="text-[#636c76] text-sm leading-snug line-clamp-2 mb-3 max-w-3xl">
              {contract.description}
            </p>

            {/* Metadata Row: GitHub Style Footer */}
            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-[#636c76]">
              {contract.category && (
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-[#3178c6] border border-[#d0d7de]" />
                  <span>{contract.category}</span>
                </div>
              )}

              {/* Tags as Labels */}
              {contract.tags && contract.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {contract.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0 font-medium bg-[#ddf4ff] text-[#0969da] border border-[#54aeff]/30 rounded-full text-[11px]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <span className="hidden sm:inline">·</span>

              <div className="flex items-center gap-1">
                <User size={14} className="shrink-0" />
                <span className="hover:text-[#0969da] cursor-pointer">
                  {shortenAddress(contract.clientWallet)}
                </span>
              </div>

              <span className="hidden sm:inline">·</span>

              <div className="flex items-center gap-1">
                <Layers size={14} className="shrink-0" />
                <span>{contract.milestones?.length || 0} milestones</span>
              </div>

              <span className="hidden sm:inline">·</span>

              <div className="flex items-center gap-1">
                <Clock size={14} className="shrink-0" />
                <span>Due {timeUntil(contract.deadline)}</span>
              </div>
            </div>
          </div>

          {/* Right Side: Budget Action (Star-like button) */}
          <div className="flex flex-col items-start md:items-end shrink-0 pt-1">
            <div className="flex items-center overflow-hidden border border-[#d0d7de] rounded-md shadow-sm w-fit">
              <div className="flex items-center gap-1.5 bg-[#f6f8fa] px-3 py-1 border-r border-[#d0d7de] text-[#1f2328] font-semibold text-xs">
                Budget
              </div>
              {/* Added flex and gap here */}
              <div className="flex items-center gap-1.5 bg-white px-3 py-1 font-mono text-xs font-bold text-[#1f2328]">
                <SiSolana size={12} />
                <span>{lamportsToSol(contract.totalAmount)}</span>
              </div>
            </div>
            <div className="mt-4 hidden md:block">
              <span className="text-[10px] font-mono text-[#636c76] border border-[#d0d7de] px-1.5 rounded-md uppercase">
                ID: {contract.contractId.slice(0, 7)}
              </span>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}