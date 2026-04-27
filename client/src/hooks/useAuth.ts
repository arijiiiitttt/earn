import { useCallback, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";
import toast from "react-hot-toast";
import { authApi, usersApi } from "../lib/api";
import { useAuthStore } from "../store/auth";

export function useAuth() {
  const { publicKey, signMessage, disconnect } = useWallet();
  const { setAuth, clearAuth, isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const login = useCallback(async () => {
    if (!publicKey || !signMessage) return;
    setLoading(true);

    try {
      // Step 1: Get nonce
      const { data } = await authApi.getNonce(publicKey.toBase58());
      const nonce = data.nonce;

      // Step 2: Sign the nonce
      const message = new TextEncoder().encode(nonce);
      const signatureBytes = await signMessage(message);
      const signature = bs58.encode(signatureBytes);

      // Step 3: Verify + get JWT
      const { data: authData } = await authApi.verify(
        publicKey.toBase58(),
        signature
      );

      setAuth(authData.token, authData.user);
      toast.success("Wallet connected & verified");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Authentication failed");
      await disconnect();
    } finally {
      setLoading(false);
    }
  }, [publicKey, signMessage, setAuth, disconnect]);

  const logout = useCallback(async () => {
    await disconnect();
    clearAuth();
    toast.success("Disconnected");
  }, [disconnect, clearAuth]);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await usersApi.getMe();
      useAuthStore.getState().updateUser(data);
    } catch {}
  }, []);

  return { login, logout, loading, isAuthenticated, user };
}
