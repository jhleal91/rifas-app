-- Tabla de anuncios
CREATE TABLE IF NOT EXISTS anuncios (
  id SERIAL PRIMARY KEY,
  anunciante_id INTEGER NOT NULL REFERENCES anunciantes(id) ON DELETE CASCADE,
  titulo VARCHAR(120) NOT NULL,
  descripcion_corta VARCHAR(180),
  url_destino TEXT NOT NULL,
  imagen_url TEXT,
  categoria VARCHAR(100),
  ubicacion_display VARCHAR(40) NOT NULL, -- portal_top | portal_card | landing_inline
  pais VARCHAR(10),
  estado VARCHAR(10),
  ciudades JSONB,
  presupuesto_mensual NUMERIC(12,2) DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE,
  aprobado BOOLEAN DEFAULT TRUE,
  fecha_inicio DATE,
  fecha_fin DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_anuncios_anunciante ON anuncios(anunciante_id);
CREATE INDEX IF NOT EXISTS idx_anuncios_ubicacion ON anuncios(ubicacion_display);
CREATE INDEX IF NOT EXISTS idx_anuncios_activo ON anuncios(activo);

-- Tabla de impresiones de anuncios
CREATE TABLE IF NOT EXISTS ad_impressions (
  id BIGSERIAL PRIMARY KEY,
  anuncio_id INTEGER NOT NULL REFERENCES anuncios(id) ON DELETE CASCADE,
  path TEXT,
  ip VARCHAR(64),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_anuncio ON ad_impressions(anuncio_id);

-- Tabla de clicks de anuncios
CREATE TABLE IF NOT EXISTS ad_clicks (
  id BIGSERIAL PRIMARY KEY,
  anuncio_id INTEGER NOT NULL REFERENCES anuncios(id) ON DELETE CASCADE,
  path TEXT,
  ip VARCHAR(64),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_anuncio ON ad_clicks(anuncio_id);
