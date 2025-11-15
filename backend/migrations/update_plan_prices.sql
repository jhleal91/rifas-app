-- =====================================================
-- MIGRACIÓN: ACTUALIZAR PRECIOS DE PLANES
-- =====================================================
-- Nuevos precios:
-- - Free: $0/mes (sin cambios)
-- - Pro: $29/mes (anteriormente $10)
-- - Business: $49/mes (anteriormente $29)
-- =====================================================

-- Actualizar plan Pro
UPDATE creator_plans 
SET price_usd = 29.00
WHERE name = 'Pro';

-- Actualizar plan Business
UPDATE creator_plans 
SET price_usd = 49.00
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

