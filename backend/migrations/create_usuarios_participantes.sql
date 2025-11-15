-- Crear tabla para usuarios participantes registrados
CREATE TABLE usuarios_participantes (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para optimizar consultas
CREATE INDEX idx_usuarios_participantes_email ON usuarios_participantes(email);
CREATE INDEX idx_usuarios_participantes_activo ON usuarios_participantes(activo);

-- Agregar columna a participantes para referenciar usuario registrado
ALTER TABLE participantes 
ADD COLUMN usuario_participante_id INTEGER REFERENCES usuarios_participantes(id);

-- Crear índice para la nueva columna
CREATE INDEX idx_participantes_usuario_id ON participantes(usuario_participante_id);

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_usuarios_participantes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_participantes_updated_at
  BEFORE UPDATE ON usuarios_participantes
  FOR EACH ROW
  EXECUTE FUNCTION update_usuarios_participantes_updated_at();
