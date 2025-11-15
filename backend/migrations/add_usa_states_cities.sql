-- =====================================================
-- MIGRACIÓN: AGREGAR ESTADOS Y CIUDADES DE ESTADOS UNIDOS
-- =====================================================

-- Obtener el ID de Estados Unidos
DO $$
DECLARE
    usa_id INTEGER;
BEGIN
    -- Obtener el ID de Estados Unidos
    SELECT id INTO usa_id FROM paises WHERE codigo = 'USA';
    
    IF usa_id IS NULL THEN
        -- Si no existe, crearlo
        INSERT INTO paises (codigo, nombre, nombre_es) 
        VALUES ('USA', 'United States', 'Estados Unidos')
        RETURNING id INTO usa_id;
    END IF;

    -- =====================================================
    -- AGREGAR LOS 50 ESTADOS DE ESTADOS UNIDOS
    -- =====================================================
    INSERT INTO estados (pais_id, codigo, nombre, nombre_es) VALUES
    (usa_id, 'AL', 'Alabama', 'Alabama'),
    (usa_id, 'AK', 'Alaska', 'Alaska'),
    (usa_id, 'AZ', 'Arizona', 'Arizona'),
    (usa_id, 'AR', 'Arkansas', 'Arkansas'),
    (usa_id, 'CA', 'California', 'California'),
    (usa_id, 'CO', 'Colorado', 'Colorado'),
    (usa_id, 'CT', 'Connecticut', 'Connecticut'),
    (usa_id, 'DE', 'Delaware', 'Delaware'),
    (usa_id, 'FL', 'Florida', 'Florida'),
    (usa_id, 'GA', 'Georgia', 'Georgia'),
    (usa_id, 'HI', 'Hawaii', 'Hawái'),
    (usa_id, 'ID', 'Idaho', 'Idaho'),
    (usa_id, 'IL', 'Illinois', 'Illinois'),
    (usa_id, 'IN', 'Indiana', 'Indiana'),
    (usa_id, 'IA', 'Iowa', 'Iowa'),
    (usa_id, 'KS', 'Kansas', 'Kansas'),
    (usa_id, 'KY', 'Kentucky', 'Kentucky'),
    (usa_id, 'LA', 'Louisiana', 'Luisiana'),
    (usa_id, 'ME', 'Maine', 'Maine'),
    (usa_id, 'MD', 'Maryland', 'Maryland'),
    (usa_id, 'MA', 'Massachusetts', 'Massachusetts'),
    (usa_id, 'MI', 'Michigan', 'Míchigan'),
    (usa_id, 'MN', 'Minnesota', 'Minnesota'),
    (usa_id, 'MS', 'Mississippi', 'Misisipi'),
    (usa_id, 'MO', 'Missouri', 'Misuri'),
    (usa_id, 'MT', 'Montana', 'Montana'),
    (usa_id, 'NE', 'Nebraska', 'Nebraska'),
    (usa_id, 'NV', 'Nevada', 'Nevada'),
    (usa_id, 'NH', 'New Hampshire', 'New Hampshire'),
    (usa_id, 'NJ', 'New Jersey', 'New Jersey'),
    (usa_id, 'NM', 'New Mexico', 'Nuevo México'),
    (usa_id, 'NY', 'New York', 'Nueva York'),
    (usa_id, 'NC', 'North Carolina', 'Carolina del Norte'),
    (usa_id, 'ND', 'North Dakota', 'Dakota del Norte'),
    (usa_id, 'OH', 'Ohio', 'Ohio'),
    (usa_id, 'OK', 'Oklahoma', 'Oklahoma'),
    (usa_id, 'OR', 'Oregon', 'Oregón'),
    (usa_id, 'PA', 'Pennsylvania', 'Pensilvania'),
    (usa_id, 'RI', 'Rhode Island', 'Rhode Island'),
    (usa_id, 'SC', 'South Carolina', 'Carolina del Sur'),
    (usa_id, 'SD', 'South Dakota', 'Dakota del Sur'),
    (usa_id, 'TN', 'Tennessee', 'Tennessee'),
    (usa_id, 'TX', 'Texas', 'Texas'),
    (usa_id, 'UT', 'Utah', 'Utah'),
    (usa_id, 'VT', 'Vermont', 'Vermont'),
    (usa_id, 'VA', 'Virginia', 'Virginia'),
    (usa_id, 'WA', 'Washington', 'Washington'),
    (usa_id, 'WV', 'West Virginia', 'Virginia Occidental'),
    (usa_id, 'WI', 'Wisconsin', 'Wisconsin'),
    (usa_id, 'WY', 'Wyoming', 'Wyoming'),
    (usa_id, 'DC', 'District of Columbia', 'Distrito de Columbia')
    ON CONFLICT DO NOTHING;
END $$;

-- =====================================================
-- TABLA DE CIUDADES (OPCIONAL)
-- =====================================================
CREATE TABLE IF NOT EXISTS ciudades (
    id SERIAL PRIMARY KEY,
    estado_id INTEGER REFERENCES estados(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    nombre_es VARCHAR(100), -- Nombre en español
    codigo_postal VARCHAR(20), -- Código postal principal
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para ciudades
CREATE INDEX IF NOT EXISTS idx_ciudades_estado_id ON ciudades(estado_id);
CREATE INDEX IF NOT EXISTS idx_ciudades_activo ON ciudades(activo);
CREATE INDEX IF NOT EXISTS idx_ciudades_nombre ON ciudades(nombre);

-- =====================================================
-- AGREGAR CIUDADES PRINCIPALES DE ESTADOS UNIDOS
-- =====================================================
DO $$
DECLARE
    estado_rec RECORD;
    ciudades_data TEXT[][];
    ciudad_data TEXT[];
BEGIN
    -- Array de ciudades principales por estado (nombre, nombre_es, codigo_postal)
    -- Solo agregamos las ciudades más importantes de cada estado
    
    FOR estado_rec IN SELECT id, codigo FROM estados WHERE pais_id = (SELECT id FROM paises WHERE codigo = 'USA') LOOP
        CASE estado_rec.codigo
            WHEN 'CA' THEN -- California
                ciudades_data := ARRAY[
                    ['Los Angeles', 'Los Ángeles', '90001'],
                    ['San Francisco', 'San Francisco', '94102'],
                    ['San Diego', 'San Diego', '92101'],
                    ['Sacramento', 'Sacramento', '95814'],
                    ['San Jose', 'San José', '95110']
                ];
            WHEN 'NY' THEN -- New York
                ciudades_data := ARRAY[
                    ['New York', 'Nueva York', '10001'],
                    ['Buffalo', 'Búfalo', '14201'],
                    ['Rochester', 'Rochester', '14604'],
                    ['Albany', 'Albany', '12207']
                ];
            WHEN 'TX' THEN -- Texas
                ciudades_data := ARRAY[
                    ['Houston', 'Houston', '77001'],
                    ['Dallas', 'Dallas', '75201'],
                    ['Austin', 'Austin', '78701'],
                    ['San Antonio', 'San Antonio', '78201']
                ];
            WHEN 'FL' THEN -- Florida
                ciudades_data := ARRAY[
                    ['Miami', 'Miami', '33101'],
                    ['Tampa', 'Tampa', '33601'],
                    ['Orlando', 'Orlando', '32801'],
                    ['Jacksonville', 'Jacksonville', '32201']
                ];
            WHEN 'IL' THEN -- Illinois
                ciudades_data := ARRAY[
                    ['Chicago', 'Chicago', '60601'],
                    ['Aurora', 'Aurora', '60502'],
                    ['Naperville', 'Naperville', '60540']
                ];
            WHEN 'PA' THEN -- Pennsylvania
                ciudades_data := ARRAY[
                    ['Philadelphia', 'Filadelfia', '19101'],
                    ['Pittsburgh', 'Pittsburgh', '15201']
                ];
            WHEN 'OH' THEN -- Ohio
                ciudades_data := ARRAY[
                    ['Columbus', 'Columbus', '43201'],
                    ['Cleveland', 'Cleveland', '44101'],
                    ['Cincinnati', 'Cincinnati', '45201']
                ];
            WHEN 'GA' THEN -- Georgia
                ciudades_data := ARRAY[
                    ['Atlanta', 'Atlanta', '30301']
                ];
            WHEN 'NC' THEN -- North Carolina
                ciudades_data := ARRAY[
                    ['Charlotte', 'Charlotte', '28201'],
                    ['Raleigh', 'Raleigh', '27601']
                ];
            WHEN 'MI' THEN -- Michigan
                ciudades_data := ARRAY[
                    ['Detroit', 'Detroit', '48201'],
                    ['Grand Rapids', 'Grand Rapids', '49501']
                ];
            WHEN 'NJ' THEN -- New Jersey
                ciudades_data := ARRAY[
                    ['Newark', 'Newark', '07101'],
                    ['Jersey City', 'Ciudad de Jersey', '07302']
                ];
            WHEN 'VA' THEN -- Virginia
                ciudades_data := ARRAY[
                    ['Virginia Beach', 'Virginia Beach', '23451'],
                    ['Norfolk', 'Norfolk', '23501']
                ];
            WHEN 'WA' THEN -- Washington
                ciudades_data := ARRAY[
                    ['Seattle', 'Seattle', '98101'],
                    ['Spokane', 'Spokane', '99201']
                ];
            WHEN 'AZ' THEN -- Arizona
                ciudades_data := ARRAY[
                    ['Phoenix', 'Phoenix', '85001'],
                    ['Tucson', 'Tucson', '85701']
                ];
            WHEN 'MA' THEN -- Massachusetts
                ciudades_data := ARRAY[
                    ['Boston', 'Boston', '02101']
                ];
            WHEN 'TN' THEN -- Tennessee
                ciudades_data := ARRAY[
                    ['Nashville', 'Nashville', '37201'],
                    ['Memphis', 'Memphis', '38101']
                ];
            WHEN 'IN' THEN -- Indiana
                ciudades_data := ARRAY[
                    ['Indianapolis', 'Indianápolis', '46201']
                ];
            WHEN 'MO' THEN -- Missouri
                ciudades_data := ARRAY[
                    ['Kansas City', 'Kansas City', '64101'],
                    ['St. Louis', 'San Luis', '63101']
                ];
            WHEN 'MD' THEN -- Maryland
                ciudades_data := ARRAY[
                    ['Baltimore', 'Baltimore', '21201']
                ];
            WHEN 'WI' THEN -- Wisconsin
                ciudades_data := ARRAY[
                    ['Milwaukee', 'Milwaukee', '53201']
                ];
            WHEN 'CO' THEN -- Colorado
                ciudades_data := ARRAY[
                    ['Denver', 'Denver', '80201']
                ];
            WHEN 'MN' THEN -- Minnesota
                ciudades_data := ARRAY[
                    ['Minneapolis', 'Minneapolis', '55401']
                ];
            WHEN 'SC' THEN -- South Carolina
                ciudades_data := ARRAY[
                    ['Charleston', 'Charleston', '29401']
                ];
            WHEN 'AL' THEN -- Alabama
                ciudades_data := ARRAY[
                    ['Birmingham', 'Birmingham', '35201']
                ];
            WHEN 'LA' THEN -- Louisiana
                ciudades_data := ARRAY[
                    ['New Orleans', 'Nueva Orleans', '70112']
                ];
            WHEN 'KY' THEN -- Kentucky
                ciudades_data := ARRAY[
                    ['Louisville', 'Louisville', '40201']
                ];
            WHEN 'OR' THEN -- Oregon
                ciudades_data := ARRAY[
                    ['Portland', 'Portland', '97201']
                ];
            WHEN 'OK' THEN -- Oklahoma
                ciudades_data := ARRAY[
                    ['Oklahoma City', 'Ciudad de Oklahoma', '73101']
                ];
            WHEN 'CT' THEN -- Connecticut
                ciudades_data := ARRAY[
                    ['Hartford', 'Hartford', '06101']
                ];
            WHEN 'UT' THEN -- Utah
                ciudades_data := ARRAY[
                    ['Salt Lake City', 'Salt Lake City', '84101']
                ];
            WHEN 'IA' THEN -- Iowa
                ciudades_data := ARRAY[
                    ['Des Moines', 'Des Moines', '50301']
                ];
            WHEN 'AR' THEN -- Arkansas
                ciudades_data := ARRAY[
                    ['Little Rock', 'Little Rock', '72201']
                ];
            WHEN 'NV' THEN -- Nevada
                ciudades_data := ARRAY[
                    ['Las Vegas', 'Las Vegas', '89101'],
                    ['Reno', 'Reno', '89501']
                ];
            WHEN 'MS' THEN -- Mississippi
                ciudades_data := ARRAY[
                    ['Jackson', 'Jackson', '39201']
                ];
            WHEN 'KS' THEN -- Kansas
                ciudades_data := ARRAY[
                    ['Wichita', 'Wichita', '67201']
                ];
            WHEN 'NM' THEN -- New Mexico
                ciudades_data := ARRAY[
                    ['Albuquerque', 'Albuquerque', '87101']
                ];
            WHEN 'NE' THEN -- Nebraska
                ciudades_data := ARRAY[
                    ['Omaha', 'Omaha', '68101']
                ];
            WHEN 'WV' THEN -- West Virginia
                ciudades_data := ARRAY[
                    ['Charleston', 'Charleston', '25301']
                ];
            WHEN 'ID' THEN -- Idaho
                ciudades_data := ARRAY[
                    ['Boise', 'Boise', '83701']
                ];
            WHEN 'HI' THEN -- Hawaii
                ciudades_data := ARRAY[
                    ['Honolulu', 'Honolulu', '96801']
                ];
            WHEN 'NH' THEN -- New Hampshire
                ciudades_data := ARRAY[
                    ['Manchester', 'Manchester', '03101']
                ];
            WHEN 'ME' THEN -- Maine
                ciudades_data := ARRAY[
                    ['Portland', 'Portland', '04101']
                ];
            WHEN 'RI' THEN -- Rhode Island
                ciudades_data := ARRAY[
                    ['Providence', 'Providence', '02901']
                ];
            WHEN 'MT' THEN -- Montana
                ciudades_data := ARRAY[
                    ['Billings', 'Billings', '59101']
                ];
            WHEN 'DE' THEN -- Delaware
                ciudades_data := ARRAY[
                    ['Wilmington', 'Wilmington', '19801']
                ];
            WHEN 'SD' THEN -- South Dakota
                ciudades_data := ARRAY[
                    ['Sioux Falls', 'Sioux Falls', '57101']
                ];
            WHEN 'ND' THEN -- North Dakota
                ciudades_data := ARRAY[
                    ['Fargo', 'Fargo', '58101']
                ];
            WHEN 'AK' THEN -- Alaska
                ciudades_data := ARRAY[
                    ['Anchorage', 'Anchorage', '99501']
                ];
            WHEN 'VT' THEN -- Vermont
                ciudades_data := ARRAY[
                    ['Burlington', 'Burlington', '05401']
                ];
            WHEN 'WY' THEN -- Wyoming
                ciudades_data := ARRAY[
                    ['Cheyenne', 'Cheyenne', '82001']
                ];
            WHEN 'DC' THEN -- District of Columbia
                ciudades_data := ARRAY[
                    ['Washington', 'Washington', '20001']
                ];
            ELSE
                ciudades_data := ARRAY[]::TEXT[][];
        END CASE;
        
        -- Insertar ciudades para este estado
        FOREACH ciudad_data SLICE 1 IN ARRAY ciudades_data LOOP
            INSERT INTO ciudades (estado_id, nombre, nombre_es, codigo_postal)
            VALUES (
                estado_rec.id,
                ciudad_data[1],
                ciudad_data[2],
                ciudad_data[3]
            )
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON TABLE ciudades IS 'Catálogo de ciudades por estado';
COMMENT ON COLUMN ciudades.estado_id IS 'ID del estado al que pertenece la ciudad';
COMMENT ON COLUMN ciudades.codigo_postal IS 'Código postal principal de la ciudad';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
SELECT 
    'Estados de USA' as tipo,
    COUNT(*)::int as total
FROM estados e
JOIN paises p ON e.pais_id = p.id
WHERE p.codigo = 'USA'
UNION ALL
SELECT 
    'Ciudades de USA',
    COUNT(*)::int
FROM ciudades c
JOIN estados e ON c.estado_id = e.id
JOIN paises p ON e.pais_id = p.id
WHERE p.codigo = 'USA';

