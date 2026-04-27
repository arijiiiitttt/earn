import {
  Connection,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import { Buffer } from "buffer";
import IDL from "./idl.json";

export const PROGRAM_ID = new PublicKey(
  "9P5As689sXoe2mJv4X3NAcgcQ8zbasg3Gf1vTWpB77BB"
);

export const connection = new Connection(
  import.meta.env.VITE_RPC_URL || "https://api.devnet.solana.com",
  "confirmed"
);

function getProvider(wallet: WalletContextState): AnchorProvider {
  return new AnchorProvider(connection, wallet as any, {
    commitment: "confirmed",
  });
}

function getProgram(wallet: WalletContextState) {
  return new Program(IDL as any, getProvider(wallet));
}

export function deriveContractPDA(
  clientPubkey: PublicKey,
  contractId: string
): PublicKey {
  const bytes = Buffer.from(contractId, "utf8");
  const seed = bytes.slice(0, Math.min(bytes.length, 32));
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("contract"),
      clientPubkey.toBuffer(),
      seed,
    ],
    PROGRAM_ID
  );
  return pda;
}

export function deriveVaultPDA(contractPDA: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), contractPDA.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

export async function assertContractAccountExists(
  contractPDA: PublicKey
): Promise<void> {
  const info = await connection.getAccountInfo(contractPDA);
  if (!info) {
    throw new Error(
      `ContractAccount not found on-chain at ${contractPDA.toBase58()}. ` +
        `Has the contract been funded yet?`
    );
  }
}

export async function createContractOnChain(
  wallet: WalletContextState,
  contractId: string,
  title: string,
  freelancerWallet: string,
  milestones: { title: string; description: string; amount: number }[],
  deadlineTimestamp: number
): Promise<{ txSignature: string; contractPDA: string; alreadyExisted: boolean }> {
  const program = getProgram(wallet);
  const client = wallet.publicKey!;
  const freelancer = new PublicKey(freelancerWallet);

  const contractPDA = deriveContractPDA(client, contractId);
  const vaultPDA = deriveVaultPDA(contractPDA);

  // ── If PDA already exists, tx was already sent — skip re-sending ───────────
  const existingAccount = await connection.getAccountInfo(contractPDA);
  if (existingAccount) {
    console.log("✅ Contract PDA already exists on-chain, skipping tx");
    return {
      txSignature: "already-funded",
      contractPDA: contractPDA.toBase58(),
      alreadyExisted: true,
    };
  }

  const milestonesInput = milestones.map((m) => ({
    title: m.title,
    description: m.description,
    amount: new BN(m.amount),
  }));

  const txSignature = await program.methods
    .createContract(
      contractId,
      title,
      milestonesInput,
      new BN(deadlineTimestamp)
    )
    .accounts({
      contract: contractPDA,
      vault: vaultPDA,
      client,
      freelancer,
      systemProgram: SystemProgram.programId,
    })
    .rpc({ commitment: "confirmed" });

  return { txSignature, contractPDA: contractPDA.toBase58(), alreadyExisted: false };
}

export async function submitMilestoneOnChain(
  wallet: WalletContextState,
  contractId: string,
  clientWallet: string,
  milestoneIndex: number,
  submissionNote: string
): Promise<string> {
  const program = getProgram(wallet);
  const freelancer = wallet.publicKey!;

  const clientPubkey = new PublicKey(clientWallet);
  const contractPDA = deriveContractPDA(clientPubkey, contractId);

  await assertContractAccountExists(contractPDA);

  const tx = await program.methods
    .submitMilestone(milestoneIndex, submissionNote)
    .accounts({
      contract: contractPDA,
      freelancer,
    })
    .rpc({ commitment: "confirmed" });

  return tx;
}

export async function approveMilestoneOnChain(
  wallet: WalletContextState,
  contractId: string,
  clientWallet: string,
  freelancerWallet: string,
  milestoneIndex: number
): Promise<{ txSignature: string; alreadyApproved: boolean }> {
  const program = getProgram(wallet);
  const client = wallet.publicKey!;

  const clientPubkey = new PublicKey(clientWallet);
  const contractPDA = deriveContractPDA(clientPubkey, contractId);
  const vaultPDA = deriveVaultPDA(contractPDA);

  // ── Check on-chain state before sending ────────────────────────────────────
  const accountInfo = await connection.getAccountInfo(contractPDA);
  if (!accountInfo) {
    throw new Error("ContractAccount not found on-chain. Has the vault been funded?");
  }

  // Fetch the contract account data to check milestone status
  const contractAccount = await program.account.contractAccount.fetch(contractPDA);
  const milestone = contractAccount.milestones[milestoneIndex];

  // Anchor serializes enums as objects: { approved: {} }, { pending: {} } etc.
  // If milestone already approved OR contract already completed — skip tx
  const milestoneAlreadyApproved = milestone?.status && (
    "approved" in milestone.status ||
    "disputed" in milestone.status
  );
  const contractAlreadyDone = contractAccount.status && (
    "completed" in contractAccount.status ||
    "cancelled" in contractAccount.status
  );

  if (milestoneAlreadyApproved || contractAlreadyDone) {
    console.log("✅ Milestone already approved on-chain, skipping tx");
    return { txSignature: "already-approved", alreadyApproved: true };
  }

  const freelancer = new PublicKey(freelancerWallet);

  const tx = await program.methods
    .approveMilestone(milestoneIndex)
    .accounts({
      contract: contractPDA,
      vault: vaultPDA,
      client,
      freelancer,
    })
    .rpc({ commitment: "confirmed" });

  return { txSignature: tx, alreadyApproved: false };
}

export async function cancelContractOnChain(
  wallet: WalletContextState,
  contractId: string,
  clientWallet: string
): Promise<string> {
  const program = getProgram(wallet);
  const client = wallet.publicKey!;

  const clientPubkey = new PublicKey(clientWallet);
  const contractPDA = deriveContractPDA(clientPubkey, contractId);
  const vaultPDA = deriveVaultPDA(contractPDA);

  await assertContractAccountExists(contractPDA);

  const tx = await program.methods
    .cancelContract()
    .accounts({
      contract: contractPDA,
      vault: vaultPDA,
      client,
    })
    .rpc({ commitment: "confirmed" });

  return tx;
}

export async function getWalletBalance(pubkey: PublicKey): Promise<number> {
  const lamports = await connection.getBalance(pubkey);
  return lamports / LAMPORTS_PER_SOL;
}