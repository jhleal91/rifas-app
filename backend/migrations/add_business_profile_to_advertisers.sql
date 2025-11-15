-- =====================================================
-- MIGRACIÓN: Perfil de negocio para anunciantes
-- =====================================================

-- Agregar columnas para perfil de negocio
ALTER TABLE anunciantes
  ADD COLUMN IF NOT EXISTS nombre_comercial VARCHAR(150),
  ADD COLUMN IF NOT EXISTS pagina_url TEXT,
  ADD COLUMN IF NOT EXISTS descripcion_negocio TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS activo_sponsor BOOLEAN DEFAULT FALSE;

-- Comentarios para documentación
COMMENT ON COLUMN anunciantes.nombre_comercial IS 'Nombre comercial del negocio (ej: AlvarezLA, LealStore, CocaCola)';
COMMENT ON COLUMN anunciantes.pagina_url IS 'URL de la página/perfil del negocio';
COMMENT ON COLUMN anunciantes.descripcion_negocio IS 'Descripción del negocio para mostrar en Negocios Patrocinadores';
COMMENT ON COLUMN anunciantes.logo_url IS 'URL del logo del negocio';
COMMENT ON COLUMN anunciantes.activo_sponsor IS 'Si el negocio aparece en la sección Negocios Patrocinadores';

-- Índice para búsqueda rápida de sponsors activos
CREATE INDEX IF NOT EXISTS idx_anunciantes_sponsor ON anunciantes(activo_sponsor) WHERE activo_sponsor = TRUE;

