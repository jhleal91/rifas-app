-- =====================================================
-- TABLA DE CALIFICACIONES (RATINGS)
-- Permite calificar rifas y creadores
-- =====================================================

CREATE TABLE IF NOT EXISTS calificaciones (
    id SERIAL PRIMARY KEY,
    rifa_id VARCHAR(50) REFERENCES rifas(id) ON DELETE CASCADE,
    creador_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    participante_id INTEGER REFERENCES participantes(id) ON DELETE SET NULL,
    calificacion_rifa INTEGER CHECK (calificacion_rifa >= 1 AND calificacion_rifa <= 5),
    calificacion_creador INTEGER CHECK (calificacion_creador >= 1 AND calificacion_creador <= 5),
    comentario_rifa TEXT,
    comentario_creador TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Un participante solo puede calificar una vez por rifa
    UNIQUE(rifa_id, participante_id)
);

-- Índices para optimizar consultas
CREATE INDEX idx_calificaciones_rifa_id ON calificaciones(rifa_id);
CREATE INDEX idx_calificaciones_creador_id ON calificaciones(creador_id);
CREATE INDEX idx_calificaciones_participante_id ON calificaciones(participante_id);
CREATE INDEX idx_calificaciones_activo ON calificaciones(activo);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_calificaciones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_calificaciones_updated_at
    BEFORE UPDATE ON calificaciones
    FOR EACH ROW
    EXECUTE FUNCTION update_calificaciones_updated_at();

-- Vista para estadísticas de calificaciones de rifas
CREATE OR REPLACE VIEW estadisticas_calificaciones_rifas AS
SELECT 
    r.id as rifa_id,
    r.nombre as rifa_nombre,
    COUNT(c.id) as total_calificaciones,
    ROUND(AVG(c.calificacion_rifa)::numeric, 2) as promedio_calificacion_rifa,
    COUNT(CASE WHEN c.calificacion_rifa = 5 THEN 1 END) as calificaciones_5,
    COUNT(CASE WHEN c.calificacion_rifa = 4 THEN 1 END) as calificaciones_4,
    COUNT(CASE WHEN c.calificacion_rifa = 3 THEN 1 END) as calificaciones_3,
    COUNT(CASE WHEN c.calificacion_rifa = 2 THEN 1 END) as calificaciones_2,
    COUNT(CASE WHEN c.calificacion_rifa = 1 THEN 1 END) as calificaciones_1
FROM rifas r
LEFT JOIN calificaciones c ON r.id = c.rifa_id AND c.activo = true AND c.calificacion_rifa IS NOT NULL
GROUP BY r.id, r.nombre;

-- Vista para estadísticas de calificaciones de creadores
CREATE OR REPLACE VIEW estadisticas_calificaciones_creadores AS
SELECT 
    u.id as creador_id,
    u.nombre as creador_nombre,
    COUNT(DISTINCT r.id) as total_rifas_creadas,
    COUNT(c.id) as total_calificaciones,
    ROUND(AVG(c.calificacion_creador)::numeric, 2) as promedio_calificacion_creador,
    COUNT(CASE WHEN c.calificacion_creador = 5 THEN 1 END) as calificaciones_5,
    COUNT(CASE WHEN c.calificacion_creador = 4 THEN 1 END) as calificaciones_4,
    COUNT(CASE WHEN c.calificacion_creador = 3 THEN 1 END) as calificaciones_3,
    COUNT(CASE WHEN c.calificacion_creador = 2 THEN 1 END) as calificaciones_2,
    COUNT(CASE WHEN c.calificacion_creador = 1 THEN 1 END) as calificaciones_1
FROM usuarios u
LEFT JOIN rifas r ON u.id = r.usuario_id
LEFT JOIN calificaciones c ON u.id = c.creador_id AND c.activo = true AND c.calificacion_creador IS NOT NULL
GROUP BY u.id, u.nombre;

