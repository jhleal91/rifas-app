-- =====================================================
-- MIGRACIÓN: ACTUALIZAR FEATURES CON OPCIONES REALES
-- =====================================================
-- Eliminar features que no existen o no aplican:
-- - CSV/Export: No implementado
-- - Cupones: Son para anunciantes, no para creadores
-- - Webhooks: No implementado para creadores
-- - SLA: No implementado
-- - Sin Marca SorteoHub: El producto siempre será de SorteoHub
-- =====================================================

-- Actualizar plan Free con features reales
UPDATE creator_plans 
SET features = '["1 rifa activa","Comisión 6.5%","Pago seguro con Stripe","WhatsApp para participantes","Soporte por email"]'::jsonb
WHERE name = 'Free';

-- Actualizar plan Pro con features reales
UPDATE creator_plans 
SET features = '["10 rifas activas","Comisión 5.5%","Pago seguro con Stripe","Soporte prioritario","Estadísticas detalladas"]'::jsonb
WHERE name = 'Pro';

-- Actualizar plan Business con features reales
UPDATE creator_plans 
SET features = '["Rifas ilimitadas","Comisión 4.5%","Pago seguro con Stripe","Soporte dedicado","Estadísticas avanzadas","Gestión de participantes"]'::jsonb
WHERE name = 'Business';

-- Verificación
SELECT 
  name,
  price_usd,
  commission_pct,
  features
FROM creator_plans
ORDER BY price_usd;

