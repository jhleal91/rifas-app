-- Tabla de anunciantes para portal de marketing
CREATE TABLE IF NOT EXISTS anunciantes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  telefono VARCHAR(50),
  password_hash VARCHAR(255) NOT NULL,
  categoria VARCHAR(100),
  presupuesto_mensual NUMERIC(12,2) DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultimo_acceso TIMESTAMP
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_anunciantes_email ON anunciantes(email);
