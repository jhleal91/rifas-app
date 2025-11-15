-- =====================================================
-- MIGRACIÓN: AGREGAR SOFT DELETE (BAJA LÓGICA) A RIFAS
-- =====================================================

-- Agregar columna deleted_at para baja lógica
ALTER TABLE rifas 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;

-- Crear índice para mejorar consultas que filtran rifas no eliminadas
CREATE INDEX IF NOT EXISTS idx_rifas_deleted_at ON rifas(deleted_at);

-- Comentario
COMMENT ON COLUMN rifas.deleted_at IS 'Fecha y hora de eliminación (baja lógica). NULL = rifa activa, TIMESTAMP = rifa eliminada';

