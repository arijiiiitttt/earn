import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { WalletProviderWrapper } from "./providers/WalletProvider";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <WalletProviderWrapper>
          <App />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#141414",
                color: "#fff",
                border: "1px solid #2A2A2A",
                fontFamily: "'DM Sans', sans-serif",
                borderRadius: "12px",
                fontSize: "14px",
              },
              success: { iconTheme: { primary: "#CAFF4D", secondary: "#141414" } },
              error: { iconTheme: { primary: "#ef4444", secondary: "#141414" } },
            }}
          />
        </WalletProviderWrapper>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);