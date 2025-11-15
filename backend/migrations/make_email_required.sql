-- Hacer el campo email obligatorio en la tabla participantes
-- Primero actualizar registros existentes sin email
UPDATE participantes 
SET email = 'sin-email@ejemplo.com' 
WHERE email IS NULL OR email = '';

-- Luego hacer el campo obligatorio
ALTER TABLE participantes 
ALTER COLUMN email SET NOT NULL;

-- Agregar comentario
COMMENT ON COLUMN participantes.email IS 'Email del participante (obligatorio para notificaciones)';
