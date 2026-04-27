CREATE TYPE "public"."contract_status" AS ENUM('open', 'active', 'completed', 'cancelled', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."milestone_status" AS ENUM('pending', 'submitted', 'approved', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('pending', 'accepted', 'rejected');--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"requirements" text,
	"category" text,
	"tags" text[] DEFAULT '{}',
	"client_wallet" text NOT NULL,
	"freelancer_wallet" text,
	"total_amount" bigint NOT NULL,
	"deadline" timestamp NOT NULL,
	"on_chain_address" text DEFAULT 'pending',
	"tx_signatures" text[] DEFAULT '{}',
	"status" "contract_status" DEFAULT 'open',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "contracts_contract_id_unique" UNIQUE("contract_id")
);
--> statement-breakpoint
CREATE TABLE "milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" text NOT NULL,
	"index" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"amount" bigint NOT NULL,
	"status" "milestone_status" DEFAULT 'pending',
	"submission_note" text,
	"submitted_at" timestamp,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "nonces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_address" text NOT NULL,
	"nonce" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" text NOT NULL,
	"wallet_address" text NOT NULL,
	"cover_letter" text,
	"proposed_amount" bigint,
	"estimated_days" integer,
	"github_url" text,
	"portfolio_url" text,
	"status" "submission_status" DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_address" text NOT NULL,
	"username" text NOT NULL,
	"bio" text,
	"skills" text[] DEFAULT '{}',
	"role" text DEFAULT 'both',
	"reputation" real DEFAULT 0,
	"completed_contracts" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_wallet_address_unique" UNIQUE("wallet_address"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
