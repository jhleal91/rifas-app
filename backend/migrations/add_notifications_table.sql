-- Crear tabla para registrar notificaciones enviadas
CREATE TABLE IF NOT EXISTS rifa_notifications (
    id SERIAL PRIMARY KEY,
    rifa_id VARCHAR(50) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'sold_out', 'draw_reminder'
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'sent', -- 'sent', 'failed'
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices
    UNIQUE(rifa_id, tipo),
    FOREIGN KEY (rifa_id) REFERENCES rifas(id) ON DELETE CASCADE
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_rifa_notifications_rifa_id ON rifa_notifications(rifa_id);
CREATE INDEX IF NOT EXISTS idx_rifa_notifications_tipo ON rifa_notifications(tipo);
CREATE INDEX IF NOT EXISTS idx_rifa_notifications_fecha ON rifa_notifications(fecha_envio);

-- Comentarios
COMMENT ON TABLE rifa_notifications IS 'Registra las notificaciones por email enviadas para cada rifa';
COMMENT ON COLUMN rifa_notifications.tipo IS 'Tipo de notificación: sold_out, draw_reminder';
COMMENT ON COLUMN rifa_notifications.status IS 'Estado del envío: sent, failed';
