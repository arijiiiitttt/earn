import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getWalletBalance } from "../lib/solana";

export function useBalance() {
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!publicKey) return;
    setLoading(true);
    try {
      const bal = await getWalletBalance(publicKey);
      setBalance(bal);
    } catch {
      setBalance(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15_000); // refresh every 15s
    return () => clearInterval(interval);
  }, [publicKey]);

  return { balance, loading, refresh };
}
