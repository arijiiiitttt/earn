import type { ContractStatus, MilestoneStatus } from "../../types";

interface StatusBadgeProps {
  status: ContractStatus | MilestoneStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const map: Record<string, string> = {
    open: "status-open",
    active: "status-active",
    completed: "status-completed",
    cancelled: "status-cancelled",
    disputed: "status-disputed",
    pending: "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-xs font-mono bg-text-muted/10 text-text-muted border border-text-muted/20",
    submitted: "status-active",
    approved: "status-completed",
  };

  const dot: Record<string, string> = {
    open: "bg-acid animate-pulse-acid",
    active: "bg-blue-400 animate-pulse",
    completed: "bg-purple-400",
    cancelled: "bg-red-500",
    disputed: "bg-yellow-500",
    pending: "bg-text-muted",
    submitted: "bg-blue-400",
    approved: "bg-purple-400",
  };

  return (
    <span className={map[status] || "status-open"}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[status] || "bg-acid"}`} />
      {status}
    </span>
  );
}
