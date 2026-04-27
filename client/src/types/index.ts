export type ContractStatus = "open" | "active" | "completed" | "cancelled" | "disputed";
export type SubmissionStatus = "pending" | "accepted" | "rejected";
export type MilestoneStatus = "pending" | "submitted" | "approved" | "disputed";

export interface User {
  id: string;
  walletAddress: string;
  username: string;
  bio?: string;
  skills?: string[];
  role: "client" | "freelancer" | "both";
  reputation: number;
  completedContracts: number;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  contractId: string;
  index: number;
  title: string;
  description: string;
  amount: number; // lamports
  status: MilestoneStatus;
  submissionNote?: string;
  submittedAt?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface Submission {
  id: string;
  contractId: string;
  walletAddress: string;
  coverLetter?: string;
  proposedAmount?: number;
  estimatedDays?: number;
  githubUrl?: string;
  portfolioUrl?: string;
  status: SubmissionStatus;
  createdAt: string;
  user?: User;
}

export interface Contract {
  id: string;
  contractId: string;
  title: string;
  description: string;
  requirements?: string;
  category?: string;
  tags?: string[];
  clientWallet: string;
  freelancerWallet?: string;
  totalAmount: number; // lamports
  deadline: string;
  onChainAddress?: string;
  txSignatures?: string[];
  status: ContractStatus;
  milestones: Milestone[];
  submissions?: Submission[];
  createdAt: string;
  updatedAt: string;
}
