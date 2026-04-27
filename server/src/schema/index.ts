import {
  pgTable,
  text,
  bigint,
  timestamp,
  pgEnum,
  uuid,
  real,
  integer,
} from "drizzle-orm/pg-core";


export const contractStatusEnum = pgEnum("contract_status", [
  "open",       
  "active",     
  "completed",  
  "cancelled",  
  "disputed",   
]);

export const submissionStatusEnum = pgEnum("submission_status", [
  "pending",   
  "accepted",  
  "rejected",  
]);

export const milestoneStatusEnum = pgEnum("milestone_status", [
  "pending",  
  "submitted", 
  "approved",  
  "disputed",  
]);


export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  walletAddress: text("wallet_address").notNull().unique(),
  username: text("username").notNull().unique(),
  bio: text("bio"),
  skills: text("skills").array().default([]),
  role: text("role").default("both"), 
  reputation: real("reputation").default(0),
  completedContracts: integer("completed_contracts").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


export const contracts = pgTable("contracts", {
  id: uuid("id").defaultRandom().primaryKey(),
  contractId: text("contract_id").notNull().unique(),

  title: text("title").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements"),   
  category: text("category"),           
  tags: text("tags").array().default([]),

  clientWallet: text("client_wallet").notNull(),
  freelancerWallet: text("freelancer_wallet"), 

  totalAmount: bigint("total_amount", { mode: "number" }).notNull(), // in lamports
  deadline: timestamp("deadline").notNull(),

  onChainAddress: text("on_chain_address").default("pending"),
  txSignatures: text("tx_signatures").array().default([]),

  status: contractStatusEnum("status").default("open"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


export const milestones = pgTable("milestones", {
  id: uuid("id").defaultRandom().primaryKey(),
  contractId: text("contract_id").notNull(),  

  index: integer("index").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(), 

  status: milestoneStatusEnum("status").default("pending"),
  submissionNote: text("submission_note"),
  submittedAt: timestamp("submitted_at"),
  approvedAt: timestamp("approved_at"),

  createdAt: timestamp("created_at").defaultNow(),
});


export const submissions = pgTable("submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  contractId: text("contract_id").notNull(),  
  walletAddress: text("wallet_address").notNull(),  

  coverLetter: text("cover_letter"),    
  proposedAmount: bigint("proposed_amount", { mode: "number" }), 
  estimatedDays: integer("estimated_days"),
  githubUrl: text("github_url"),        
  portfolioUrl: text("portfolio_url"),  

  status: submissionStatusEnum("status").default("pending"),

  createdAt: timestamp("created_at").defaultNow(),
});


export const nonces = pgTable("nonces", {
  id: uuid("id").defaultRandom().primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  nonce: text("nonce").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});


export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Contract = typeof contracts.$inferSelect;
export type NewContract = typeof contracts.$inferInsert;
export type Milestone = typeof milestones.$inferSelect;
export type NewMilestone = typeof milestones.$inferInsert;
export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;