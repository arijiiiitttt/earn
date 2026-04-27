import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { useMemo } from "react";

import "@solana/wallet-adapter-react-ui/styles.css";

import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Marketplace } from "./pages/Marketplace";
import { ContractPage } from "./pages/ContractPage";
import { Profile } from "./pages/Profile";
import { useAuthStore } from "./store/auth";
import { Landing } from "./pages/Landing";
import About from "./pages/about/About";
import Pricing from "./pages/pricing/Pricing";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const endpoint =
    import.meta.env.VITE_RPC_URL || "https://api.devnet.solana.com";

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/about" element={<About />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route element={<Layout />}>
                  <Route path="/marketplace" element={<Marketplace />} />
                  <Route path="/contract/:id" element={<ContractPage />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>

            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: "#111820",
                  color: "#e8f0fe",
                  border: "1px solid #1e2d3d",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "12px",
                  borderRadius: "2px",
                },
                success: {
                  iconTheme: { primary: "#00ff88", secondary: "#111820" },
                },
                error: {
                  iconTheme: { primary: "#ef4444", secondary: "#111820" },
                },
              }}
            />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </QueryClientProvider>
  );
}
