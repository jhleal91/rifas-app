-- Tabla de planes contratados por anunciantes
CREATE TABLE IF NOT EXISTS ad_plans (
  id SERIAL PRIMARY KEY,
  anunciante_id INTEGER NOT NULL REFERENCES anunciantes(id) ON DELETE CASCADE,
  plan_type VARCHAR(50) NOT NULL, -- 'basico', 'profesional', 'enterprise'
  precio_mensual NUMERIC(12,2) NOT NULL,
  ubicaciones_incluidas INTEGER DEFAULT 1,
  impresiones_maximas INTEGER,
  activo BOOLEAN DEFAULT TRUE,
  fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin DATE,
  fecha_contratacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ad_plans_anunciante ON ad_plans(anunciante_id);
CREATE INDEX IF NOT EXISTS idx_ad_plans_activo ON ad_plans(activo);

