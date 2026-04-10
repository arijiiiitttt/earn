import { useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";
import toast from "react-hot-toast";
import api from "../utils/api";
import { useAuthStore } from "../store/authStore";

export function useAuth() {
  const { publicKey, signMessage, disconnect } = useWallet();
  const { token, user, setAuth, clearAuth } = useAuthStore();

  const login = useCallback(async () => {
    if (!publicKey || !signMessage) {
      toast.error("Connect your wallet first");
      return;
    }
    try {
      const { data: nonceData } = await api.post("/api/auth/nonce", {
        walletAddress: publicKey.toBase58(),
      });
      const messageBytes = new TextEncoder().encode(nonceData.nonce);
      const signature = await signMessage(messageBytes);
      const sigBase58 = bs58.encode(signature);
      const { data } = await api.post("/api/auth/verify", {
        walletAddress: publicKey.toBase58(),
        signature: sigBase58,
      });
      setAuth(data.token, data.user);
      toast.success(`Welcome, ${data.user.username}!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Authentication failed");
    }
  }, [publicKey, signMessage, setAuth]);

  const logout = useCallback(async () => {
    clearAuth();
    await disconnect();
    toast.success("Disconnected");
  }, [clearAuth, disconnect]);

  return { token, user, login, logout, isAuthenticated: !!token };
}