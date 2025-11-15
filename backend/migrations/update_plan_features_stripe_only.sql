-- =====================================================
-- MIGRACIÓN: ACTUALIZAR FEATURES DE PLANES
-- =====================================================
-- Actualizar referencias a "Múltiples formas de pago" 
-- por "Pago seguro con Stripe" ya que solo usamos Stripe
-- =====================================================

-- Actualizar plan Free
UPDATE creator_plans 
SET features = '["1 rifa activa","Comisión 6.5%","Pago seguro con Stripe","WhatsApp","Marca SorteoHub","Soporte por email"]'::jsonb
WHERE name = 'Free';

-- Actualizar plan Pro
UPDATE creator_plans 
SET features = '["10 rifas activas","Comisión 5.5%","Pago seguro con Stripe","CSV/Export","Cupones","Soporte prioritario","Sin marca SorteoHub"]'::jsonb
WHERE name = 'Pro';

-- Actualizar plan Business
UPDATE creator_plans 
SET features = '["Rifas ilimitadas","Comisión 4.5%","Pago seguro con Stripe","CSV/Export","Cupones","Reportes avanzados","Webhooks básicos","SLA","Soporte dedicado","Sin marca SorteoHub"]'::jsonb
WHERE name = 'Business';

-- Verificación
SELECT 
  name,
  price_usd,
  commission_pct,
  features
FROM creator_plans
ORDER BY price_usd;

