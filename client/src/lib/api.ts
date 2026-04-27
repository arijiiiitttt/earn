import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token on each request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("earn_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("earn_token");
      localStorage.removeItem("earn_user");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  getNonce: (walletAddress: string) =>
    api.post<{ nonce: string }>("/auth/nonce", { walletAddress }),
  verify: (walletAddress: string, signature: string) =>
    api.post<{ token: string; user: any }>("/auth/verify", {
      walletAddress,
      signature,
    }),
};

// ── Contracts ─────────────────────────────────────────────────────────────────
export const contractsApi = {
  getAll: (params?: { status?: string; wallet?: string }) =>
    api.get<{ contracts: any[] }>("/contracts", { params }),
  getMy: () => api.get<{ contracts: any[] }>("/contracts/my"),
  getOne: (contractId: string) => api.get<any>(`/contracts/${contractId}`),
  create: (data: any) => api.post<any>("/contracts", data),
  // Saves the on-chain PDA address + funding tx signature after createContractOnChain succeeds
  updateOnChainAddress: (contractId: string, onChainAddress: string, txSignature: string) =>
    api.patch(`/contracts/${contractId}/onchain`, { onChainAddress, txSignature }),
  submitMilestone: (contractId: string, index: number, data: any) =>
    api.patch(`/contracts/${contractId}/milestone/${index}/submit`, data),
  approveMilestone: (contractId: string, index: number, data?: any) =>
    api.patch(`/contracts/${contractId}/milestone/${index}/approve`, data),
  dispute: (contractId: string, milestoneIndex: number) =>
    api.patch(`/contracts/${contractId}/dispute`, { milestoneIndex }),
  cancel: (contractId: string) => api.delete(`/contracts/${contractId}`),
};

// ── Submissions ───────────────────────────────────────────────────────────────
export const submissionsApi = {
  getForContract: (contractId: string) =>
    api.get<{ submissions: any[] }>(`/submissions/${contractId}`),
  submit: (contractId: string, data: any) =>
    api.post<any>(`/submissions/${contractId}`, data),
  accept: (submissionId: string) =>
    api.patch(`/submissions/${submissionId}/accept`),
  reject: (submissionId: string) =>
    api.patch(`/submissions/${submissionId}/reject`),
  withdraw: (submissionId: string) =>
    api.delete(`/submissions/${submissionId}`),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  getMe: () => api.get<any>("/users/me"),
  updateMe: (data: any) => api.patch<any>("/users/me", data),
  getByWallet: (wallet: string) => api.get<any>(`/users/${wallet}`),
};

// ── Utils ─────────────────────────────────────────────────────────────────────
export const LAMPORTS_PER_SOL = 1_000_000_000;

export function lamportsToSol(lamports: number): string {
  return (lamports / LAMPORTS_PER_SOL).toFixed(4);
}

export function solToLamports(sol: number): number {
  return Math.round(sol * LAMPORTS_PER_SOL);
}

export function shortenAddress(addr: string, chars = 4): string {
  return `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
}

export function timeUntil(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff < 0) return "Expired";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
