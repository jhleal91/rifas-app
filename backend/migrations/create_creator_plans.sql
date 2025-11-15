CREATE TABLE IF NOT EXISTS creator_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  price_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_active_rifas INTEGER,
  max_elements_per_rifa INTEGER,
  commission_pct NUMERIC(5,2) NOT NULL,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed plans (idempotent)
INSERT INTO creator_plans (name, price_usd, max_active_rifas, max_elements_per_rifa, commission_pct, features)
VALUES
  ('Free', 0, 3, 5000, 5.00, '["1 forma de pago","WhatsApp","Marca SorteoHub","Soporte por email"]'),
  ('Pro', 19, 10, 10000, 4.00, '["Múltiples formas de pago","CSV/Export","Cupones","Soporte prioritario"]'),
  ('Business', 79, NULL, 50000, 2.00, '["Rifas ilimitadas","Reportes avanzados","Webhooks básicos","SLA"]')
ON CONFLICT (name) DO UPDATE SET
  price_usd = EXCLUDED.price_usd,
  max_active_rifas = EXCLUDED.max_active_rifas,
  max_elements_per_rifa = EXCLUDED.max_elements_per_rifa,
  commission_pct = EXCLUDED.commission_pct,
  features = EXCLUDED.features;


