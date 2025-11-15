-- =====================================================
-- MIGRACIÓN: ACTUALIZAR COMISIONES CONSIDERANDO COSTOS DE STRIPE
-- =====================================================
-- Stripe en México cobra: 3.6% + $3.00 MXN por transacción
-- 
-- Nueva estructura (Opción 1 - Recomendada):
-- - Free: 6.5% comisión (margen neto ~2.9%)
-- - Pro: 5.5% comisión (margen neto ~1.9%)
-- - Business: 4.5% comisión (margen neto ~0.9%)
--
-- Estas comisiones cubren el costo de Stripe y dejan un margen
-- razonable para la sostenibilidad del negocio.
-- =====================================================

-- Actualizar plan Free: 5.0% → 6.5%
UPDATE creator_plans 
SET 
  commission_pct = 6.50,
  features = jsonb_set(
    COALESCE(features, '[]'::jsonb),
    '{0}',
    '"Comisión 6.5%"'
  )
WHERE name = 'Free';

-- Actualizar plan Pro: 4.0% → 5.5%
UPDATE creator_plans 
SET 
  commission_pct = 5.50,
  features = (
    SELECT jsonb_agg(
      CASE 
        WHEN value::text LIKE '%Comisión%' THEN '"Comisión 5.5%"'::jsonb
        ELSE value
      END
    )
    FROM jsonb_array_elements(COALESCE(features, '[]'::jsonb))
  )
WHERE name = 'Pro';

-- Actualizar plan Business: 2.5% → 4.5%
UPDATE creator_plans 
SET 
  commission_pct = 4.50,
  features = (
    SELECT jsonb_agg(
      CASE 
        WHEN value::text LIKE '%Comisión%' THEN '"Comisión 4.5%"'::jsonb
        ELSE value
      END
    )
    FROM jsonb_array_elements(COALESCE(features, '[]'::jsonb))
  )
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

-- Nota: Los features se actualizan dinámicamente para reflejar las nuevas comisiones
-- Si prefieres mantener los features originales y solo cambiar la comisión,
-- puedes comentar las actualizaciones de features arriba.

