-- =====================================================
-- MIGRACIÓN: STRIPE CONNECT ACCOUNTS
-- =====================================================
-- Tabla para almacenar cuentas Stripe Connect de creadores
-- Permite que cada creador tenga su propia cuenta Stripe
-- y reciba pagos directamente con comisiones automáticas
-- =====================================================

CREATE TABLE IF NOT EXISTS stripe_connect_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  stripe_account_id VARCHAR(255) NOT NULL UNIQUE,
  account_type VARCHAR(50) DEFAULT 'express', -- express, standard, custom
  charges_enabled BOOLEAN DEFAULT FALSE,
  payouts_enabled BOOLEAN DEFAULT FALSE,
  details_submitted BOOLEAN DEFAULT FALSE,
  email VARCHAR(255),
  country VARCHAR(2) DEFAULT 'MX',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stripe_accounts_user ON stripe_connect_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_accounts_stripe_id ON stripe_connect_accounts(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_stripe_accounts_enabled ON stripe_connect_accounts(charges_enabled, payouts_enabled);

-- Tabla para registrar transacciones de Stripe
CREATE TABLE IF NOT EXISTS stripe_transactions (
  id SERIAL PRIMARY KEY,
  rifa_id VARCHAR(255) NOT NULL,
  participante_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  creador_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  stripe_payment_intent_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_account_id VARCHAR(255) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'MXN',
  commission_amount NUMERIC(12,2) NOT NULL,
  commission_pct NUMERIC(5,2) NOT NULL,
  amount_to_creator NUMERIC(12,2) NOT NULL,
  stripe_fee NUMERIC(12,2),
  status VARCHAR(50) DEFAULT 'pending', -- pending, succeeded, failed, refunded
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stripe_transactions_rifa ON stripe_transactions(rifa_id);
CREATE INDEX IF NOT EXISTS idx_stripe_transactions_creador ON stripe_transactions(creador_id);
CREATE INDEX IF NOT EXISTS idx_stripe_transactions_participante ON stripe_transactions(participante_id);
CREATE INDEX IF NOT EXISTS idx_stripe_transactions_status ON stripe_transactions(status);
CREATE INDEX IF NOT EXISTS idx_stripe_transactions_payment_intent ON stripe_transactions(stripe_payment_intent_id);

-- Comentarios
COMMENT ON TABLE stripe_connect_accounts IS 'Cuentas Stripe Connect de creadores para recibir pagos';
COMMENT ON TABLE stripe_transactions IS 'Registro de todas las transacciones procesadas por Stripe';

