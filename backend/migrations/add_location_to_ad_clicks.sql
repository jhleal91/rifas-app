-- Agregar columnas de ubicación a la tabla ad_clicks
ALTER TABLE ad_clicks 
ADD COLUMN IF NOT EXISTS ciudad VARCHAR(100),
ADD COLUMN IF NOT EXISTS estado VARCHAR(100),
ADD COLUMN IF NOT EXISTS pais VARCHAR(100),
ADD COLUMN IF NOT EXISTS pais_codigo VARCHAR(10);

CREATE INDEX IF NOT EXISTS idx_ad_clicks_pais ON ad_clicks(pais_codigo);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_estado ON ad_clicks(estado);

