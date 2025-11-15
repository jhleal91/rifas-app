-- =====================================================
-- MIGRACIÓN: AGREGAR UBICACIÓN GEOGRÁFICA A RIFAS
-- =====================================================

-- Agregar columnas de ubicación a la tabla rifas
ALTER TABLE rifas
ADD COLUMN IF NOT EXISTS pais VARCHAR(100),
ADD COLUMN IF NOT EXISTS estado VARCHAR(100),
ADD COLUMN IF NOT EXISTS ciudad VARCHAR(100),
ADD COLUMN IF NOT EXISTS maneja_envio BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS alcance VARCHAR(20) DEFAULT 'local' CHECK (alcance IN ('local', 'nacional', 'internacional'));

-- Crear índice para búsquedas por ubicación
CREATE INDEX IF NOT EXISTS idx_rifas_pais ON rifas(pais);
CREATE INDEX IF NOT EXISTS idx_rifas_estado ON rifas(estado);
CREATE INDEX IF NOT EXISTS idx_rifas_ciudad ON rifas(ciudad);
CREATE INDEX IF NOT EXISTS idx_rifas_alcance ON rifas(alcance);

-- =====================================================
-- CATÁLOGO DE PAÍSES
-- =====================================================
CREATE TABLE IF NOT EXISTS paises (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(3) UNIQUE NOT NULL, -- ISO 3166-1 alpha-3
    nombre VARCHAR(100) NOT NULL,
    nombre_es VARCHAR(100), -- Nombre en español
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- CATÁLOGO DE ESTADOS/PROVINCIAS
-- =====================================================
CREATE TABLE IF NOT EXISTS estados (
    id SERIAL PRIMARY KEY,
    pais_id INTEGER REFERENCES paises(id) ON DELETE CASCADE,
    codigo VARCHAR(10), -- Código ISO o interno
    nombre VARCHAR(100) NOT NULL,
    nombre_es VARCHAR(100), -- Nombre en español
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para estados
CREATE INDEX IF NOT EXISTS idx_estados_pais_id ON estados(pais_id);
CREATE INDEX IF NOT EXISTS idx_estados_activo ON estados(activo);

-- =====================================================
-- DATOS INICIALES: PAÍSES PRINCIPALES
-- =====================================================
INSERT INTO paises (codigo, nombre, nombre_es) VALUES
('MEX', 'Mexico', 'México'),
('USA', 'United States', 'Estados Unidos'),
('CAN', 'Canada', 'Canadá'),
('COL', 'Colombia', 'Colombia'),
('ARG', 'Argentina', 'Argentina'),
('CHL', 'Chile', 'Chile'),
('PER', 'Peru', 'Perú'),
('ESP', 'Spain', 'España'),
('BRA', 'Brazil', 'Brasil'),
('ECU', 'Ecuador', 'Ecuador')
ON CONFLICT (codigo) DO NOTHING;

-- =====================================================
-- DATOS INICIALES: ESTADOS DE MÉXICO
-- =====================================================
INSERT INTO estados (pais_id, codigo, nombre, nombre_es) 
SELECT p.id, e.codigo, e.nombre, e.nombre_es
FROM paises p,
(VALUES
    ('AGU', 'Aguascalientes', 'Aguascalientes'),
    ('BCN', 'Baja California', 'Baja California'),
    ('BCS', 'Baja California Sur', 'Baja California Sur'),
    ('CAM', 'Campeche', 'Campeche'),
    ('CHP', 'Chiapas', 'Chiapas'),
    ('CHH', 'Chihuahua', 'Chihuahua'),
    ('COA', 'Coahuila', 'Coahuila'),
    ('COL', 'Colima', 'Colima'),
    ('DIF', 'Ciudad de México', 'Ciudad de México'),
    ('DUR', 'Durango', 'Durango'),
    ('GUA', 'Guanajuato', 'Guanajuato'),
    ('GRO', 'Guerrero', 'Guerrero'),
    ('HID', 'Hidalgo', 'Hidalgo'),
    ('JAL', 'Jalisco', 'Jalisco'),
    ('MIC', 'Michoacán', 'Michoacán'),
    ('MOR', 'Morelos', 'Morelos'),
    ('NAY', 'Nayarit', 'Nayarit'),
    ('NLE', 'Nuevo León', 'Nuevo León'),
    ('OAX', 'Oaxaca', 'Oaxaca'),
    ('PUE', 'Puebla', 'Puebla'),
    ('QUE', 'Querétaro', 'Querétaro'),
    ('ROO', 'Quintana Roo', 'Quintana Roo'),
    ('SLP', 'San Luis Potosí', 'San Luis Potosí'),
    ('SIN', 'Sinaloa', 'Sinaloa'),
    ('SON', 'Sonora', 'Sonora'),
    ('TAB', 'Tabasco', 'Tabasco'),
    ('TAM', 'Tamaulipas', 'Tamaulipas'),
    ('TLA', 'Tlaxcala', 'Tlaxcala'),
    ('VER', 'Veracruz', 'Veracruz'),
    ('YUC', 'Yucatán', 'Yucatán'),
    ('ZAC', 'Zacatecas', 'Zacatecas')
) AS e(codigo, nombre, nombre_es)
WHERE p.codigo = 'MEX'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FUNCIÓN PARA OBTENER ESTADOS POR PAÍS
-- =====================================================
CREATE OR REPLACE FUNCTION obtener_estados_por_pais(pais_codigo VARCHAR(3))
RETURNS TABLE (
    id INTEGER,
    codigo VARCHAR(10),
    nombre VARCHAR(100),
    nombre_es VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT e.id, e.codigo, e.nombre, e.nombre_es
    FROM estados e
    JOIN paises p ON e.pais_id = p.id
    WHERE p.codigo = pais_codigo AND e.activo = true
    ORDER BY e.nombre_es;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VISTA PARA RIFAS CON UBICACIÓN
-- =====================================================
CREATE OR REPLACE VIEW rifas_con_ubicacion AS
SELECT 
    r.*,
    p.nombre_es as pais_nombre,
    e.nombre_es as estado_nombre
FROM rifas r
LEFT JOIN paises p ON r.pais = p.codigo
LEFT JOIN estados e ON r.estado = e.codigo AND e.pais_id = p.id;

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON TABLE paises IS 'Catálogo de países disponibles para rifas';
COMMENT ON TABLE estados IS 'Catálogo de estados/provincias por país';
COMMENT ON COLUMN rifas.pais IS 'Código ISO del país (ej: MEX, USA)';
COMMENT ON COLUMN rifas.estado IS 'Código del estado/provincia';
COMMENT ON COLUMN rifas.ciudad IS 'Nombre de la ciudad';
COMMENT ON COLUMN rifas.maneja_envio IS 'Indica si la rifa maneja envío de premios';
COMMENT ON COLUMN rifas.alcance IS 'Alcance de la rifa: local, nacional, internacional';
