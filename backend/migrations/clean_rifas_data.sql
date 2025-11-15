-- =====================================================
-- SCRIPT DE LIMPIEZA: ELIMINAR RIFAS, ANUNCIANTES, ANUNCIOS Y CUPONES
-- =====================================================
-- Este script elimina:
--   - Todas las rifas y datos relacionados
--   - Todos los anunciantes y datos relacionados
--   - Todos los anuncios y datos relacionados
--   - Todos los cupones y datos relacionados
--
-- NO elimina:
--   - Usuarios (tabla usuarios)
--   - Catálogos (paises, estados)
--   - Planes (creator_plans, ad_plans)
--   - Suscripciones (user_plan_subscriptions)
--   - Usuarios participantes registrados
-- =====================================================

BEGIN;

-- Desactivar temporalmente las restricciones de foreign key para evitar problemas de orden
SET session_replication_role = 'replica';

-- 1. Eliminar notificaciones de rifas
DELETE FROM rifa_notifications;

-- 2. Eliminar calificaciones de rifas (solo las que tienen rifa_id, mantener las de creadores)
DELETE FROM calificaciones WHERE rifa_id IS NOT NULL;

-- 3. Eliminar elementos vendidos
DELETE FROM elementos_vendidos;

-- 4. Eliminar elementos reservados
DELETE FROM elementos_reservados;

-- 5. Eliminar participantes (todos están relacionados con rifas)
DELETE FROM participantes;

-- 6. Eliminar formas de pago de rifas
DELETE FROM formas_pago;

-- 7. Eliminar fotos de premios
DELETE FROM fotos_premios;

-- 8. Eliminar premios
DELETE FROM premios;

-- 9. Eliminar todas las rifas
DELETE FROM rifas;

-- =====================================================
-- LIMPIEZA DE ANUNCIANTES, ANUNCIOS Y CUPONES
-- =====================================================

-- 10. Eliminar usos de cupones (tracking)
DELETE FROM cupon_usos;

-- 11. Eliminar cupones
DELETE FROM cupones;

-- 12. Eliminar impresiones de anuncios
DELETE FROM ad_impressions;

-- 13. Eliminar clicks de anuncios
DELETE FROM ad_clicks;

-- 14. Eliminar transacciones de crédito de anunciantes
DELETE FROM advertiser_credit_transactions;

-- 15. Eliminar planes de anuncios
DELETE FROM ad_plans;

-- 16. Eliminar anuncios
DELETE FROM anuncios;

-- 17. Eliminar anunciantes
DELETE FROM anunciantes;

-- Reactivar restricciones de foreign key
SET session_replication_role = 'origin';

-- Reiniciar secuencias (opcional, para empezar desde 1)
-- ALTER SEQUENCE IF EXISTS rifas_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS premios_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS fotos_premios_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS formas_pago_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS participantes_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS elementos_vendidos_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS elementos_reservados_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS calificaciones_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS rifa_notifications_id_seq RESTART WITH 1;

COMMIT;

-- =====================================================
-- VERIFICACIÓN: Mostrar conteo de registros restantes
-- =====================================================
SELECT 
    'rifas' as tabla, COUNT(*)::int as registros FROM rifas
UNION ALL
SELECT 'premios', COUNT(*)::int FROM premios
UNION ALL
SELECT 'fotos_premios', COUNT(*)::int FROM fotos_premios
UNION ALL
SELECT 'formas_pago', COUNT(*)::int FROM formas_pago
UNION ALL
SELECT 'participantes', COUNT(*)::int FROM participantes
UNION ALL
SELECT 'elementos_vendidos', COUNT(*)::int FROM elementos_vendidos
UNION ALL
SELECT 'elementos_reservados', COUNT(*)::int FROM elementos_reservados
UNION ALL
SELECT 'calificaciones (con rifa_id)', COUNT(*)::int FROM calificaciones WHERE rifa_id IS NOT NULL
UNION ALL
SELECT 'rifa_notifications', COUNT(*)::int FROM rifa_notifications
UNION ALL
SELECT 'anunciantes', COUNT(*)::int FROM anunciantes
UNION ALL
SELECT 'anuncios', COUNT(*)::int FROM anuncios
UNION ALL
SELECT 'ad_impressions', COUNT(*)::int FROM ad_impressions
UNION ALL
SELECT 'ad_clicks', COUNT(*)::int FROM ad_clicks
UNION ALL
SELECT 'advertiser_credit_transactions', COUNT(*)::int FROM advertiser_credit_transactions
UNION ALL
SELECT 'ad_plans', COUNT(*)::int FROM ad_plans
UNION ALL
SELECT 'cupones', COUNT(*)::int FROM cupones
UNION ALL
SELECT 'cupon_usos', COUNT(*)::int FROM cupon_usos
UNION ALL
SELECT 'usuarios (MANTENIDOS)', COUNT(*)::int FROM usuarios
UNION ALL
SELECT 'paises (MANTENIDOS)', COUNT(*)::int FROM paises
UNION ALL
SELECT 'estados (MANTENIDOS)', COUNT(*)::int FROM estados
UNION ALL
SELECT 'creator_plans (MANTENIDOS)', COUNT(*)::int FROM creator_plans
UNION ALL
SELECT 'user_plan_subscriptions (MANTENIDOS)', COUNT(*)::int FROM user_plan_subscriptions
UNION ALL
SELECT 'usuarios_participantes (MANTENIDOS)', COUNT(*)::int FROM usuarios_participantes
ORDER BY tabla;

