-- Agregar columna premio_id a la tabla fotos_premios
-- Esto permite asociar cada foto a un premio específico

ALTER TABLE fotos_premios 
ADD COLUMN IF NOT EXISTS premio_id INTEGER REFERENCES premios(id) ON DELETE CASCADE;

-- Crear índice para mejorar las consultas
CREATE INDEX IF NOT EXISTS idx_fotos_premios_premio_id ON fotos_premios(premio_id);

-- Comentario
COMMENT ON COLUMN fotos_premios.premio_id IS 'ID del premio al que pertenece esta foto. NULL si la foto es general de la rifa.';

