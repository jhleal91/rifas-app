-- =====================================================
-- MIGRACIÓN: ACTUALIZAR PRECIOS Y COMISIONES DE PLANES
-- =====================================================
-- Modelo propuesto:
-- - Free: $0, 1 rifa activa, 5% comisión
-- - Pro: $10/mes, 10 rifas activas, 4% comisión
-- - Business: $29/mes, ilimitadas, 2.5% comisión
-- =====================================================

-- Actualizar plan Free
UPDATE creator_plans 
SET 
  price_usd = 0,
  max_active_rifas = 1,
  commission_pct = 5.00,
  features = '["1 rifa activa","Comisión 5%","1 forma de pago","WhatsApp","Marca SorteoHub","Soporte por email"]'::jsonb
WHERE name = 'Free';

-- Actualizar plan Pro
UPDATE creator_plans 
SET 
  price_usd = 10.00,
  max_active_rifas = 10,
  commission_pct = 4.00,
  features = '["10 rifas activas","Comisión 4%","Múltiples formas de pago","CSV/Export","Cupones","Soporte prioritario","Sin marca SorteoHub"]'::jsonb
WHERE name = 'Pro';

-- Actualizar plan Business
UPDATE creator_plans 
SET 
  price_usd = 29.00,
  max_active_rifas = NULL, -- Ilimitadas
  commission_pct = 2.50,
  features = '["Rifas ilimitadas","Comisión 2.5%","Múltiples formas de pago","CSV/Export","Cupones","Reportes avanzados","Webhooks básicos","SLA","Soporte dedicado","Sin marca SorteoHub"]'::jsonb
WHERE name = 'Business';

-- Verificación
SELECT 
  name,
  price_usd,
  max_active_rifas,
  commission_pct,
  features
FROM creator_plans
ORDER BY price_usd;

