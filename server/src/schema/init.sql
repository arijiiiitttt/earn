-- Users table
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(64) UNIQUE NOT NULL,
  username      VARCHAR(30) UNIQUE NOT NULL,
  email         VARCHAR(255),
  bio           VARCHAR(500),
  role          VARCHAR(20) DEFAULT 'both' CHECK (role IN ('client', 'freelancer', 'both')),
  skills        TEXT[] DEFAULT '{}',
  reputation    NUMERIC(3,2) DEFAULT 0 CHECK (reputation >= 0 AND reputation <= 5),
  completed_contracts INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id     VARCHAR(36) UNIQUE NOT NULL,
  title           VARCHAR(100) NOT NULL,
  description     TEXT NOT NULL,
  client_wallet   VARCHAR(64) NOT NULL,
  freelancer_wallet VARCHAR(64) NOT NULL,
  total_amount    NUMERIC(20,9) NOT NULL,
  deadline        TIMESTAMPTZ NOT NULL,
  status          VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'disputed', 'cancelled')),
  on_chain_address VARCHAR(100) NOT NULL,
  tx_signatures   TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id      VARCHAR(36) NOT NULL REFERENCES contracts(contract_id) ON DELETE CASCADE,
  index            INT NOT NULL,
  title            VARCHAR(100) NOT NULL,
  description      TEXT NOT NULL,
  amount           NUMERIC(20,9) NOT NULL,
  status           VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'disputed')),
  submission_note  TEXT,
  submitted_at     TIMESTAMPTZ,
  approved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Nonces table (replaces in-memory store)
CREATE TABLE IF NOT EXISTS nonces (
  wallet_address VARCHAR(64) PRIMARY KEY,
  nonce          TEXT NOT NULL,
  expires_at     TIMESTAMPTZ NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contracts_client   ON contracts(client_wallet);
CREATE INDEX IF NOT EXISTS idx_contracts_freelancer ON contracts(freelancer_wallet);
CREATE INDEX IF NOT EXISTS idx_contracts_status   ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_milestones_contract ON milestones(contract_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER contracts_updated_at
  BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at();