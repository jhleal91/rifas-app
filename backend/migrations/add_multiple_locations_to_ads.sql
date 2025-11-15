-- =====================================================
-- MIGRACIÓN: Soporte para múltiples ubicaciones por anuncio
-- =====================================================

-- Cambiar ubicacion_display de VARCHAR a JSONB para soportar arrays
ALTER TABLE anuncios 
  ALTER COLUMN ubicacion_display TYPE JSONB 
  USING CASE 
    WHEN ubicacion_display IS NOT NULL THEN 
      jsonb_build_array(ubicacion_display)
    ELSE 
      '[]'::jsonb
  END;

-- Crear índice GIN para búsquedas eficientes en arrays JSONB
CREATE INDEX IF NOT EXISTS idx_anuncios_ubicacion_gin ON anuncios USING GIN (ubicacion_display);

-- Actualizar comentario de la columna
COMMENT ON COLUMN anuncios.ubicacion_display IS 'Array JSONB de ubicaciones: ["portal_top", "portal_card", "landing_inline", "dashboard_banner"]';

