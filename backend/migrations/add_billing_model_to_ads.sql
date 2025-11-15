-- =====================================================
-- MIGRACIÓN: Modelo de facturación híbrido (CPM + CPC)
-- =====================================================

-- Agregar columnas para modelo de facturación
ALTER TABLE anuncios
  ADD COLUMN IF NOT EXISTS modelo_facturacion VARCHAR(20) DEFAULT 'HYBRID',
  ADD COLUMN IF NOT EXISTS costo_por_mil NUMERIC(10, 2) DEFAULT 2.00,
  ADD COLUMN IF NOT EXISTS costo_por_click NUMERIC(10, 2) DEFAULT 0.50;

-- Comentarios para documentación
COMMENT ON COLUMN anuncios.modelo_facturacion IS 'Modelo: CPM (solo impresiones), CPC (solo clicks), HYBRID (ambos)';
COMMENT ON COLUMN anuncios.costo_por_mil IS 'Costo por cada 1,000 impresiones (en USD)';
COMMENT ON COLUMN anuncios.costo_por_click IS 'Costo por cada click (en USD)';

-- Actualizar valores por defecto para anuncios existentes
UPDATE anuncios 
SET 
  modelo_facturacion = 'HYBRID',
  costo_por_mil = 2.00,
  costo_por_click = 0.50
WHERE modelo_facturacion IS NULL OR costo_por_mil IS NULL OR costo_por_click IS NULL;

