-- =====================================================
-- MIGRACIÓN: Sistema de créditos pre-pago para anunciantes
-- =====================================================

-- Agregar columna de crédito/balance al anunciante
ALTER TABLE anunciantes
  ADD COLUMN IF NOT EXISTS credito_actual NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS credito_total_acumulado NUMERIC(12, 2) DEFAULT 0.00;

-- Comentarios para documentación
COMMENT ON COLUMN anunciantes.credito_actual IS 'Crédito disponible actual (en USD). Se descuenta automáticamente con cada impresión/click';
COMMENT ON COLUMN anunciantes.credito_total_acumulado IS 'Total de crédito que el anunciante ha cargado históricamente';

-- Tabla de transacciones de crédito (historial de pagos)
CREATE TABLE IF NOT EXISTS advertiser_credit_transactions (
  id SERIAL PRIMARY KEY,
  anunciante_id INTEGER NOT NULL REFERENCES anunciantes(id) ON DELETE CASCADE,
  monto NUMERIC(12, 2) NOT NULL,
  tipo VARCHAR(20) NOT NULL, -- 'carga', 'gasto', 'reembolso', 'ajuste'
  descripcion TEXT,
  referencia_pago VARCHAR(255), -- ID de transacción de pago externo
  anuncio_id INTEGER REFERENCES anuncios(id) ON DELETE SET NULL, -- Para gastos específicos
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_anunciante ON advertiser_credit_transactions(anunciante_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_anuncio ON advertiser_credit_transactions(anuncio_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_tipo ON advertiser_credit_transactions(tipo);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created ON advertiser_credit_transactions(created_at);

-- Comentarios
COMMENT ON TABLE advertiser_credit_transactions IS 'Historial de todas las transacciones de crédito (cargas, gastos, reembolsos)';
COMMENT ON COLUMN advertiser_credit_transactions.tipo IS 'Tipo: carga (depósito), gasto (consumo), reembolso, ajuste (manual)';

