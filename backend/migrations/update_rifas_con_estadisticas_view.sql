-- =====================================================
-- MIGRACIÓN: ACTUALIZAR VISTA rifas_con_estadisticas
-- Para filtrar rifas eliminadas (soft delete)
-- =====================================================

-- Eliminar la vista existente y recrearla
DROP VIEW IF EXISTS rifas_con_estadisticas CASCADE;

-- Recrear la vista para incluir filtro de deleted_at
CREATE VIEW rifas_con_estadisticas AS
SELECT 
    r.*,
    u.nombre as creador_nombre,
    u.email as creador_email,
    COALESCE(ev.count, 0) as elementos_vendidos,
    COALESCE(er.count, 0) as elementos_reservados,
    r.cantidad_elementos - COALESCE(ev.count, 0) - COALESCE(er.count, 0) as elementos_disponibles,
    COALESCE(p.count, 0) as total_participantes,
    COALESCE(tr.total, 0) as total_recaudado
FROM rifas r
JOIN usuarios u ON r.usuario_id = u.id
LEFT JOIN (
    SELECT rifa_id, COUNT(*) as count
    FROM elementos_vendidos
    GROUP BY rifa_id
) ev ON r.id = ev.rifa_id
LEFT JOIN (
    SELECT rifa_id, COUNT(*) as count
    FROM elementos_reservados
    WHERE activo = true
    GROUP BY rifa_id
) er ON r.id = er.rifa_id
LEFT JOIN (
    SELECT rifa_id, COUNT(*) as count
    FROM participantes
    GROUP BY rifa_id
) p ON r.id = p.rifa_id
LEFT JOIN (
    SELECT rifa_id, SUM(total_pagado) as total
    FROM participantes
    WHERE estado = 'confirmado'
    GROUP BY rifa_id
) tr ON r.id = tr.rifa_id
WHERE r.deleted_at IS NULL;

