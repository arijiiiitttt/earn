import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  import.meta.env.VITE_PROGRAM_ID || "11111111111111111111111111111111"
);
export const LAMPORTS = 1_000_000_000;
export const lamportsToSol = (l: number) => (l / LAMPORTS).toFixed(4);
export const solToLamports = (s: number) => Math.round(s * LAMPORTS);
export const shortAddr = (a: string, c = 4) => `${a.slice(0, c)}…${a.slice(-c)}`;
export const explorerUrl = (sig: string) =>
  `https://explorer.solana.com/tx/${sig}?cluster=${import.meta.env.VITE_SOLANA_NETWORK || "devnet"}`;

export function getContractPDA(clientPubkey: PublicKey, contractId: string) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("contract"), clientPubkey.toBuffer(), Buffer.from(contractId)],
    PROGRAM_ID
  );
}
export function getVaultPDA(contractPDA: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), contractPDA.toBuffer()],
    PROGRAM_ID
  );
}