-- Agrega campos para publicar resultados de una rifa
ALTER TABLE rifas
  ADD COLUMN IF NOT EXISTS numero_ganador TEXT,
  ADD COLUMN IF NOT EXISTS resultado_publicado BOOLEAN DEFAULT false;

COMMENT ON COLUMN rifas.numero_ganador IS 'Número ganador publicado';
COMMENT ON COLUMN rifas.resultado_publicado IS 'Indica si el resultado está publicado';


