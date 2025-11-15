-- =====================================================
-- MIGRACIÓN: Sistema de Cupones para Anunciantes
-- =====================================================

-- Tabla de cupones
CREATE TABLE IF NOT EXISTS cupones (
  id SERIAL PRIMARY KEY,
  anunciante_id INTEGER NOT NULL REFERENCES anunciantes(id) ON DELETE CASCADE,
  codigo VARCHAR(50) NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  descripcion TEXT,
  descuento_tipo VARCHAR(20) NOT NULL DEFAULT 'porcentaje', -- 'porcentaje' o 'fijo'
  descuento_valor NUMERIC(10, 2) NOT NULL, -- Porcentaje (0-100) o monto fijo
  monto_minimo NUMERIC(10, 2) DEFAULT 0, -- Monto mínimo de compra para usar el cupón
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  usos_maximos INTEGER DEFAULT NULL, -- NULL = ilimitado
  usos_actuales INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE,
  imagen_url TEXT, -- Imagen opcional del cupón
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT cupon_codigo_unique UNIQUE (anunciante_id, codigo)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cupones_anunciante ON cupones(anunciante_id);
CREATE INDEX IF NOT EXISTS idx_cupones_codigo ON cupones(codigo);
CREATE INDEX IF NOT EXISTS idx_cupones_activo ON cupones(activo);
CREATE INDEX IF NOT EXISTS idx_cupones_fechas ON cupones(fecha_inicio, fecha_fin);

-- Tabla de uso de cupones (para tracking)
CREATE TABLE IF NOT EXISTS cupon_usos (
  id BIGSERIAL PRIMARY KEY,
  cupon_id INTEGER NOT NULL REFERENCES cupones(id) ON DELETE CASCADE,
  usuario_email VARCHAR(150), -- Email del usuario que usó el cupón (opcional)
  ip VARCHAR(64),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cupon_usos_cupon ON cupon_usos(cupon_id);
CREATE INDEX IF NOT EXISTS idx_cupon_usos_fecha ON cupon_usos(created_at);

-- Comentarios
COMMENT ON TABLE cupones IS 'Cupones de descuento creados por anunciantes';
COMMENT ON COLUMN cupones.descuento_tipo IS 'Tipo de descuento: porcentaje o fijo';
COMMENT ON COLUMN cupones.descuento_valor IS 'Valor del descuento: porcentaje (0-100) o monto fijo en USD';
COMMENT ON COLUMN cupones.usos_maximos IS 'Número máximo de usos permitidos. NULL = ilimitado';
COMMENT ON TABLE cupon_usos IS 'Registro de cada uso de un cupón para tracking y analytics';

