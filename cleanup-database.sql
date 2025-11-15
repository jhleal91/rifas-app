-- =====================================================
-- SCRIPT DE LIMPIEZA DE BASE DE DATOS
-- Elimina todas las rifas y datos relacionados
-- MANTIENE: usuarios, configuracion_sistema, logs_sistema
-- =====================================================

-- Deshabilitar triggers temporalmente para mejor rendimiento
SET session_replication_role = replica;

-- =====================================================
-- 1. ELIMINAR DATOS RELACIONADOS CON RIFAS
-- =====================================================

-- Eliminar elementos vendidos
DELETE FROM elementos_vendidos;

-- Eliminar elementos reservados
DELETE FROM elementos_reservados;

-- Eliminar participantes
DELETE FROM participantes;

-- Eliminar fotos de premios
DELETE FROM fotos_premios;

-- Eliminar premios
DELETE FROM premios;

-- Eliminar formas de pago
DELETE FROM formas_pago;

-- Eliminar rifas
DELETE FROM rifas;

-- =====================================================
-- 2. LIMPIAR LOGS RELACIONADOS CON RIFAS
-- =====================================================

-- Eliminar logs que referencian rifas (mantener logs de usuarios)
DELETE FROM logs_sistema WHERE rifa_id IS NOT NULL;

-- =====================================================
-- 3. RESETEAR SECUENCIAS (OPCIONAL)
-- =====================================================

-- Resetear secuencias de tablas eliminadas
ALTER SEQUENCE premios_id_seq RESTART WITH 1;
ALTER SEQUENCE fotos_premios_id_seq RESTART WITH 1;
ALTER SEQUENCE formas_pago_id_seq RESTART WITH 1;
ALTER SEQUENCE participantes_id_seq RESTART WITH 1;
ALTER SEQUENCE elementos_vendidos_id_seq RESTART WITH 1;
ALTER SEQUENCE elementos_reservados_id_seq RESTART WITH 1;

-- =====================================================
-- 4. VACUUM Y ANALYZE PARA OPTIMIZACIÓN
-- =====================================================

-- Nota: VACUUM debe ejecutarse fuera de transacción
-- Ejecutar manualmente después del script:
-- VACUUM ANALYZE;

-- =====================================================
-- 5. HABILITAR TRIGGERS NUEVAMENTE
-- =====================================================

SET session_replication_role = DEFAULT;

-- =====================================================
-- 6. VERIFICACIÓN
-- =====================================================

-- Mostrar conteos para verificar limpieza
SELECT 
    'usuarios' as tabla, 
    COUNT(*) as registros 
FROM usuarios
UNION ALL
SELECT 
    'rifas' as tabla, 
    COUNT(*) as registros 
FROM rifas
UNION ALL
SELECT 
    'participantes' as tabla, 
    COUNT(*) as registros 
FROM participantes
UNION ALL
SELECT 
    'premios' as tabla, 
    COUNT(*) as registros 
FROM premios
UNION ALL
SELECT 
    'elementos_vendidos' as tabla, 
    COUNT(*) as registros 
FROM elementos_vendidos
UNION ALL
SELECT 
    'elementos_reservados' as tabla, 
    COUNT(*) as registros 
FROM elementos_reservados
UNION ALL
SELECT 
    'configuracion_sistema' as tabla, 
    COUNT(*) as registros 
FROM configuracion_sistema
UNION ALL
SELECT 
    'logs_sistema' as tabla, 
    COUNT(*) as registros 
FROM logs_sistema;

-- =====================================================
-- MENSAJE DE CONFIRMACIÓN
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'LIMPIEZA COMPLETADA EXITOSAMENTE';
    RAISE NOTICE 'Se eliminaron todas las rifas y datos relacionados';
    RAISE NOTICE 'Se mantuvieron usuarios y configuraciones del sistema';
    RAISE NOTICE 'La base de datos está lista para uso en producción';
END $$;
