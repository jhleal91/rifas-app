-- =====================================================
-- CONSULTAS SQL COMUNES PARA EL SISTEMA DE RIFAS
-- =====================================================

-- =====================================================
-- 1. CONSULTAS DE USUARIOS
-- =====================================================

-- Obtener usuario por email (para login)
SELECT * FROM usuarios WHERE email = 'usuario@ejemplo.com' AND activo = true;

-- Crear nuevo usuario
INSERT INTO usuarios (email, password_hash, nombre, telefono, rol) 
VALUES ('nuevo@ejemplo.com', 'hash_password', 'Nombre Usuario', '1234567890', 'admin');

-- Actualizar último acceso
UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = 1;

-- Obtener rifas de un usuario
SELECT * FROM rifas WHERE usuario_id = 1 ORDER BY fecha_creacion DESC;

-- =====================================================
-- 2. CONSULTAS DE RIFAS
-- =====================================================

-- Crear nueva rifa
INSERT INTO rifas (id, usuario_id, nombre, descripcion, precio, fecha_fin, tipo, cantidad_elementos, elementos_personalizados, reglas, es_privada)
VALUES ('1234567890', 1, 'Rifa iPhone 15', 'Rifa del nuevo iPhone', 50.00, '2024-12-31 23:59:59', 'numeros', 100, '[]', 'Reglas de la rifa', false);

-- Obtener rifas públicas activas
SELECT * FROM rifas_con_estadisticas 
WHERE es_privada = false AND activa = true AND fecha_fin > CURRENT_TIMESTAMP
ORDER BY fecha_creacion DESC;

-- Obtener rifas de un usuario específico
SELECT * FROM rifas_con_estadisticas 
WHERE usuario_id = 1 
ORDER BY fecha_creacion DESC;

-- Obtener rifa por ID con todos sus detalles
SELECT 
    r.*,
    u.nombre as creador_nombre,
    u.email as creador_email,
    (SELECT json_agg(json_build_object('id', p.id, 'nombre', p.nombre, 'descripcion', p.descripcion, 'posicion', p.posicion)) 
     FROM premios p WHERE p.rifa_id = r.id) as premios,
    (SELECT json_agg(json_build_object('url_foto', f.url_foto, 'descripcion', f.descripcion, 'orden', f.orden)) 
     FROM fotos_premios f WHERE f.rifa_id = r.id ORDER BY f.orden) as fotos_premios,
    (SELECT json_agg(json_build_object('tipo_pago', fp.tipo_pago, 'banco', fp.banco, 'clabe', fp.clabe, 'numero_cuenta', fp.numero_cuenta, 'nombre_titular', fp.nombre_titular, 'telefono', fp.telefono, 'whatsapp', fp.whatsapp)) 
     FROM formas_pago fp WHERE fp.rifa_id = r.id) as formas_pago
FROM rifas r
JOIN usuarios u ON r.usuario_id = u.id
WHERE r.id = '1234567890';

-- =====================================================
-- 3. CONSULTAS DE PARTICIPANTES
-- =====================================================

-- Obtener participantes de una rifa
SELECT * FROM participantes_detallados 
WHERE rifa_id = '1234567890' 
ORDER BY fecha_participacion DESC;

-- Obtener participantes pendientes de validación
SELECT * FROM participantes_detallados 
WHERE rifa_id = '1234567890' AND estado = 'pendiente'
ORDER BY fecha_participacion ASC;

-- Crear nuevo participante
INSERT INTO participantes (rifa_id, nombre, telefono, email, numeros_seleccionados, total_pagado, estado, reserva_id, reserva_expiracion)
VALUES ('1234567890', 'Juan Pérez', '1234567890', 'juan@ejemplo.com', '["1", "5", "10"]', 150.00, 'pendiente', 'reserva_123', CURRENT_TIMESTAMP + INTERVAL '15 minutes');

-- Validar pago de participante
UPDATE participantes 
SET estado = 'confirmado', fecha_confirmacion = CURRENT_TIMESTAMP 
WHERE id = 1;

-- Rechazar participante
UPDATE participantes 
SET estado = 'rechazado', fecha_rechazo = CURRENT_TIMESTAMP, motivo_rechazo = 'Comprobante no válido'
WHERE id = 1;

-- =====================================================
-- 4. CONSULTAS DE ELEMENTOS (NÚMEROS/CARTAS/ETC.)
-- =====================================================

-- Obtener elementos disponibles de una rifa
SELECT elemento 
FROM (
    SELECT unnest(elementos_personalizados) as elemento 
    FROM rifas 
    WHERE id = '1234567890'
) todos_elementos
WHERE elemento NOT IN (
    SELECT elemento FROM elementos_vendidos WHERE rifa_id = '1234567890'
    UNION
    SELECT elemento FROM elementos_reservados WHERE rifa_id = '1234567890' AND activo = true
);

-- Obtener elementos vendidos de una rifa
SELECT ev.*, p.nombre as participante_nombre, p.telefono as participante_telefono
FROM elementos_vendidos ev
JOIN participantes p ON ev.participante_id = p.id
WHERE ev.rifa_id = '1234567890'
ORDER BY ev.fecha_venta DESC;

-- Obtener elementos reservados de una rifa
SELECT er.*, p.nombre as participante_nombre, p.telefono as participante_telefono
FROM elementos_reservados er
LEFT JOIN participantes p ON er.participante_id = p.id
WHERE er.rifa_id = '1234567890' AND er.activo = true
ORDER BY er.fecha_reserva ASC;

-- Reservar elementos temporalmente
INSERT INTO elementos_reservados (rifa_id, participante_id, elemento, reserva_id, fecha_expiracion)
SELECT '1234567890', 1, elemento, 'reserva_123', CURRENT_TIMESTAMP + INTERVAL '15 minutes'
FROM unnest(ARRAY['1', '5', '10']) as elemento;

-- Confirmar venta de elementos (mover de reservados a vendidos)
WITH elementos_a_confirmar AS (
    SELECT elemento, participante_id
    FROM elementos_reservados 
    WHERE rifa_id = '1234567890' AND reserva_id = 'reserva_123' AND activo = true
)
INSERT INTO elementos_vendidos (rifa_id, participante_id, elemento)
SELECT '1234567890', participante_id, elemento
FROM elementos_a_confirmar;

-- Liberar reserva (rechazar participante)
UPDATE elementos_reservados 
SET activo = false 
WHERE rifa_id = '1234567890' AND reserva_id = 'reserva_123';

-- =====================================================
-- 5. CONSULTAS DE ESTADÍSTICAS
-- =====================================================

-- Obtener estadísticas de una rifa específica
SELECT * FROM obtener_estadisticas_rifa('1234567890');

-- Obtener estadísticas generales del sistema
SELECT 
    (SELECT COUNT(*) FROM usuarios WHERE activo = true) as total_usuarios,
    (SELECT COUNT(*) FROM rifas WHERE activa = true) as total_rifas_activas,
    (SELECT COUNT(*) FROM participantes WHERE estado = 'confirmado') as total_participantes_confirmados,
    (SELECT SUM(total_pagado) FROM participantes WHERE estado = 'confirmado') as total_recaudado;

-- Obtener estadísticas de un usuario
SELECT 
    u.nombre,
    COUNT(r.id) as total_rifas,
    COUNT(CASE WHEN r.activa = true THEN 1 END) as rifas_activas,
    COUNT(CASE WHEN r.es_privada = false THEN 1 END) as rifas_publicas,
    COUNT(CASE WHEN r.es_privada = true THEN 1 END) as rifas_privadas,
    COALESCE(SUM(p.total_pagado), 0) as total_recaudado
FROM usuarios u
LEFT JOIN rifas r ON u.id = r.usuario_id
LEFT JOIN participantes p ON r.id = p.rifa_id AND p.estado = 'confirmado'
WHERE u.id = 1
GROUP BY u.id, u.nombre;

-- Top 10 rifas con más participantes
SELECT 
    r.nombre,
    r.tipo,
    COUNT(p.id) as total_participantes,
    SUM(p.total_pagado) as total_recaudado
FROM rifas r
LEFT JOIN participantes p ON r.id = p.rifa_id AND p.estado = 'confirmado'
WHERE r.activa = true
GROUP BY r.id, r.nombre, r.tipo
ORDER BY total_participantes DESC
LIMIT 10;

-- =====================================================
-- 6. CONSULTAS DE MANTENIMIENTO
-- =====================================================

-- Limpiar reservas expiradas
SELECT limpiar_reservas_expiradas();

-- Obtener rifas que terminan pronto (próximos 7 días)
SELECT * FROM rifas_con_estadisticas 
WHERE fecha_fin BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + INTERVAL '7 days'
AND activa = true
ORDER BY fecha_fin ASC;

-- Obtener rifas vencidas que necesitan ser desactivadas
SELECT * FROM rifas 
WHERE fecha_fin < CURRENT_TIMESTAMP AND activa = true;

-- Desactivar rifas vencidas
UPDATE rifas 
SET activa = false, updated_at = CURRENT_TIMESTAMP 
WHERE fecha_fin < CURRENT_TIMESTAMP AND activa = true;

-- =====================================================
-- 7. CONSULTAS DE BÚSQUEDA Y FILTROS
-- =====================================================

-- Buscar rifas por nombre
SELECT * FROM rifas_con_estadisticas 
WHERE nombre ILIKE '%iPhone%' AND es_privada = false AND activa = true
ORDER BY fecha_creacion DESC;

-- Filtrar rifas por tipo
SELECT * FROM rifas_con_estadisticas 
WHERE tipo = 'numeros' AND es_privada = false AND activa = true
ORDER BY fecha_creacion DESC;

-- Filtrar rifas por rango de precio
SELECT * FROM rifas_con_estadisticas 
WHERE precio BETWEEN 10 AND 100 AND es_privada = false AND activa = true
ORDER BY precio ASC;

-- Filtrar rifas por disponibilidad
SELECT * FROM rifas_con_estadisticas 
WHERE elementos_disponibles > 0 AND es_privada = false AND activa = true
ORDER BY elementos_disponibles DESC;

-- =====================================================
-- 8. CONSULTAS DE REPORTES
-- =====================================================

-- Reporte de ventas por período
SELECT 
    DATE_TRUNC('day', fecha_venta) as fecha,
    COUNT(*) as elementos_vendidos,
    COUNT(DISTINCT participante_id) as participantes_unicos,
    COUNT(DISTINCT rifa_id) as rifas_con_ventas
FROM elementos_vendidos
WHERE fecha_venta >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', fecha_venta)
ORDER BY fecha DESC;

-- Reporte de tipos de rifas más populares
SELECT 
    tipo,
    COUNT(*) as total_rifas,
    AVG(cantidad_elementos) as promedio_elementos,
    AVG(precio) as precio_promedio
FROM rifas
WHERE activa = true
GROUP BY tipo
ORDER BY total_rifas DESC;

-- Reporte de usuarios más activos
SELECT 
    u.nombre,
    u.email,
    COUNT(r.id) as total_rifas_creadas,
    COUNT(p.id) as total_participaciones,
    SUM(p.total_pagado) as total_gastado
FROM usuarios u
LEFT JOIN rifas r ON u.id = r.usuario_id
LEFT JOIN participantes p ON u.id = p.participante_id AND p.estado = 'confirmado'
WHERE u.activo = true
GROUP BY u.id, u.nombre, u.email
ORDER BY total_rifas_creadas DESC, total_participaciones DESC
LIMIT 20;

-- =====================================================
-- 9. CONSULTAS DE AUDITORÍA
-- =====================================================

-- Obtener logs de un usuario
SELECT * FROM logs_sistema 
WHERE usuario_id = 1 
ORDER BY created_at DESC 
LIMIT 50;

-- Obtener logs de una rifa
SELECT * FROM logs_sistema 
WHERE rifa_id = '1234567890' 
ORDER BY created_at DESC;

-- Obtener logs por tipo de acción
SELECT accion, COUNT(*) as total_veces
FROM logs_sistema
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY accion
ORDER BY total_veces DESC;

-- =====================================================
-- 10. CONSULTAS DE CONFIGURACIÓN
-- =====================================================

-- Obtener configuración del sistema
SELECT * FROM configuracion_sistema ORDER BY clave;

-- Actualizar configuración
UPDATE configuracion_sistema 
SET valor = '20', updated_at = CURRENT_TIMESTAMP 
WHERE clave = 'tiempo_reserva_minutos';

-- Obtener valor específico de configuración
SELECT valor FROM configuracion_sistema WHERE clave = 'comision_plataforma_porcentaje';
