-- =====================================================
-- ESTRUCTURA DE BASE DE DATOS PARA SISTEMA DE RIFAS
-- Base de Datos Recomendada: PostgreSQL
-- =====================================================

-- =====================================================
-- 1. TABLA DE USUARIOS
-- =====================================================
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    rol VARCHAR(20) DEFAULT 'admin' CHECK (rol IN ('admin', 'invitado')),
    activo BOOLEAN DEFAULT true,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. TABLA DE RIFAS
-- =====================================================
CREATE TABLE rifas (
    id VARCHAR(50) PRIMARY KEY, -- Usamos string para compatibilidad con Date.now().toString()
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('numeros', 'baraja', 'abecedario', 'animales', 'colores', 'equipos', 'emojis', 'paises')),
    cantidad_elementos INTEGER NOT NULL,
    elementos_personalizados JSONB, -- Para elementos editables (números, cartas, etc.)
    reglas TEXT,
    es_privada BOOLEAN DEFAULT false,
    activa BOOLEAN DEFAULT true,
    fecha_sorteo TIMESTAMP,
    plataforma_transmision VARCHAR(100),
    otra_plataforma VARCHAR(100),
    enlace_transmision TEXT,
    metodo_sorteo TEXT,
    testigos TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. TABLA DE PREMIOS
-- =====================================================
CREATE TABLE premios (
    id SERIAL PRIMARY KEY,
    rifa_id VARCHAR(50) REFERENCES rifas(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    posicion INTEGER NOT NULL, -- 1er lugar, 2do lugar, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. TABLA DE FOTOS DE PREMIOS
-- =====================================================
CREATE TABLE fotos_premios (
    id SERIAL PRIMARY KEY,
    rifa_id VARCHAR(50) REFERENCES rifas(id) ON DELETE CASCADE,
    url_foto TEXT NOT NULL,
    descripcion VARCHAR(255),
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 5. TABLA DE FORMAS DE PAGO
-- =====================================================
CREATE TABLE formas_pago (
    id SERIAL PRIMARY KEY,
    rifa_id VARCHAR(50) REFERENCES rifas(id) ON DELETE CASCADE,
    tipo_pago VARCHAR(50) NOT NULL CHECK (tipo_pago IN ('transferencia', 'efectivo', 'otro')),
    banco VARCHAR(100),
    clabe VARCHAR(18),
    numero_cuenta VARCHAR(50),
    nombre_titular VARCHAR(255),
    telefono VARCHAR(20),
    whatsapp VARCHAR(20),
    otros_detalles TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 6. TABLA DE PARTICIPANTES
-- =====================================================
CREATE TABLE participantes (
    id SERIAL PRIMARY KEY,
    rifa_id VARCHAR(50) REFERENCES rifas(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    numeros_seleccionados JSONB NOT NULL, -- Array de números/elementos seleccionados
    total_pagado DECIMAL(10,2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmado', 'rechazado')),
    fecha_participacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_confirmacion TIMESTAMP,
    fecha_rechazo TIMESTAMP,
    motivo_rechazo TEXT,
    comprobante_pago TEXT, -- URL o path del comprobante
    reserva_id VARCHAR(50), -- Para manejar reservas temporales
    reserva_expiracion TIMESTAMP, -- Tiempo límite de la reserva
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 7. TABLA DE NÚMEROS/ELEMENTOS VENDIDOS
-- =====================================================
CREATE TABLE elementos_vendidos (
    id SERIAL PRIMARY KEY,
    rifa_id VARCHAR(50) REFERENCES rifas(id) ON DELETE CASCADE,
    participante_id INTEGER REFERENCES participantes(id) ON DELETE CASCADE,
    elemento VARCHAR(100) NOT NULL, -- El número, carta, emoji, etc.
    fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 8. TABLA DE NÚMEROS/ELEMENTOS RESERVADOS
-- =====================================================
CREATE TABLE elementos_reservados (
    id SERIAL PRIMARY KEY,
    rifa_id VARCHAR(50) REFERENCES rifas(id) ON DELETE CASCADE,
    participante_id INTEGER REFERENCES participantes(id) ON DELETE SET NULL,
    elemento VARCHAR(100) NOT NULL,
    reserva_id VARCHAR(50) NOT NULL,
    fecha_reserva TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP NOT NULL,
    activo BOOLEAN DEFAULT true
);

-- =====================================================
-- 9. TABLA DE AUDITORÍA/LOGS
-- =====================================================
CREATE TABLE logs_sistema (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    rifa_id VARCHAR(50) REFERENCES rifas(id) ON DELETE SET NULL,
    accion VARCHAR(100) NOT NULL,
    detalles JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 10. TABLA DE CONFIGURACIÓN DEL SISTEMA
-- =====================================================
CREATE TABLE configuracion_sistema (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    descripcion TEXT,
    tipo VARCHAR(50) DEFAULT 'string' CHECK (tipo IN ('string', 'number', 'boolean', 'json')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para usuarios
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_usuarios_activo ON usuarios(activo);

-- Índices para rifas
CREATE INDEX idx_rifas_usuario_id ON rifas(usuario_id);
CREATE INDEX idx_rifas_tipo ON rifas(tipo);
CREATE INDEX idx_rifas_activa ON rifas(activa);
CREATE INDEX idx_rifas_es_privada ON rifas(es_privada);
CREATE INDEX idx_rifas_fecha_fin ON rifas(fecha_fin);
CREATE INDEX idx_rifas_fecha_creacion ON rifas(fecha_creacion);

-- Índices para participantes
CREATE INDEX idx_participantes_rifa_id ON participantes(rifa_id);
CREATE INDEX idx_participantes_estado ON participantes(estado);
CREATE INDEX idx_participantes_fecha_participacion ON participantes(fecha_participacion);
CREATE INDEX idx_participantes_reserva_id ON participantes(reserva_id);

-- Índices para elementos vendidos
CREATE INDEX idx_elementos_vendidos_rifa_id ON elementos_vendidos(rifa_id);
CREATE INDEX idx_elementos_vendidos_participante_id ON elementos_vendidos(participante_id);
CREATE INDEX idx_elementos_vendidos_elemento ON elementos_vendidos(elemento);

-- Índices para elementos reservados
CREATE INDEX idx_elementos_reservados_rifa_id ON elementos_reservados(rifa_id);
CREATE INDEX idx_elementos_reservados_reserva_id ON elementos_reservados(reserva_id);
CREATE INDEX idx_elementos_reservados_activo ON elementos_reservados(activo);
CREATE INDEX idx_elementos_reservados_fecha_expiracion ON elementos_reservados(fecha_expiracion);

-- Índices para logs
CREATE INDEX idx_logs_usuario_id ON logs_sistema(usuario_id);
CREATE INDEX idx_logs_rifa_id ON logs_sistema(rifa_id);
CREATE INDEX idx_logs_accion ON logs_sistema(accion);
CREATE INDEX idx_logs_created_at ON logs_sistema(created_at);

-- =====================================================
-- TRIGGERS PARA ACTUALIZAR updated_at
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rifas_updated_at BEFORE UPDATE ON rifas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participantes_updated_at BEFORE UPDATE ON participantes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuracion_sistema_updated_at BEFORE UPDATE ON configuracion_sistema
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCIONES AUXILIARES
-- =====================================================

-- Función para limpiar reservas expiradas
CREATE OR REPLACE FUNCTION limpiar_reservas_expiradas()
RETURNS INTEGER AS $$
DECLARE
    reservas_limpiadas INTEGER;
BEGIN
    -- Marcar reservas como inactivas
    UPDATE elementos_reservados 
    SET activo = false 
    WHERE fecha_expiracion < CURRENT_TIMESTAMP AND activo = true;
    
    GET DIAGNOSTICS reservas_limpiadas = ROW_COUNT;
    
    -- Eliminar participantes con reservas expiradas
    DELETE FROM participantes 
    WHERE reserva_id IN (
        SELECT reserva_id 
        FROM elementos_reservados 
        WHERE fecha_expiracion < CURRENT_TIMESTAMP AND activo = false
    );
    
    RETURN reservas_limpiadas;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas de una rifa
CREATE OR REPLACE FUNCTION obtener_estadisticas_rifa(rifa_id_param VARCHAR(50))
RETURNS JSON AS $$
DECLARE
    resultado JSON;
BEGIN
    SELECT json_build_object(
        'total_elementos', r.cantidad_elementos,
        'elementos_vendidos', COALESCE(ev.count, 0),
        'elementos_reservados', COALESCE(er.count, 0),
        'elementos_disponibles', r.cantidad_elementos - COALESCE(ev.count, 0) - COALESCE(er.count, 0),
        'total_participantes', COALESCE(p.count, 0),
        'participantes_confirmados', COALESCE(pc.count, 0),
        'participantes_pendientes', COALESCE(pp.count, 0),
        'total_recaudado', COALESCE(tr.total, 0)
    ) INTO resultado
    FROM rifas r
    LEFT JOIN (
        SELECT rifa_id, COUNT(*) as count
        FROM elementos_vendidos
        WHERE rifa_id = rifa_id_param
        GROUP BY rifa_id
    ) ev ON r.id = ev.rifa_id
    LEFT JOIN (
        SELECT rifa_id, COUNT(*) as count
        FROM elementos_reservados
        WHERE rifa_id = rifa_id_param AND activo = true
        GROUP BY rifa_id
    ) er ON r.id = er.rifa_id
    LEFT JOIN (
        SELECT rifa_id, COUNT(*) as count
        FROM participantes
        WHERE rifa_id = rifa_id_param
        GROUP BY rifa_id
    ) p ON r.id = p.rifa_id
    LEFT JOIN (
        SELECT rifa_id, COUNT(*) as count
        FROM participantes
        WHERE rifa_id = rifa_id_param AND estado = 'confirmado'
        GROUP BY rifa_id
    ) pc ON r.id = pc.rifa_id
    LEFT JOIN (
        SELECT rifa_id, COUNT(*) as count
        FROM participantes
        WHERE rifa_id = rifa_id_param AND estado = 'pendiente'
        GROUP BY rifa_id
    ) pp ON r.id = pp.rifa_id
    LEFT JOIN (
        SELECT rifa_id, SUM(total_pagado) as total
        FROM participantes
        WHERE rifa_id = rifa_id_param AND estado = 'confirmado'
        GROUP BY rifa_id
    ) tr ON r.id = tr.rifa_id
    WHERE r.id = rifa_id_param;
    
    RETURN resultado;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Insertar configuración inicial del sistema
INSERT INTO configuracion_sistema (clave, valor, descripcion, tipo) VALUES
('tiempo_reserva_minutos', '15', 'Tiempo en minutos para reservas temporales', 'number'),
('comision_plataforma_porcentaje', '5', 'Porcentaje de comisión de la plataforma', 'number'),
('max_elementos_por_rifa', '1000', 'Máximo número de elementos por rifa', 'number'),
('max_rifas_por_usuario', '50', 'Máximo número de rifas activas por usuario', 'number'),
('soporte_email', 'soporte@rifasdigital.com', 'Email de soporte técnico', 'string'),
('terminos_version', '1.0', 'Versión actual de términos y condiciones', 'string');

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista para rifas con estadísticas
CREATE VIEW rifas_con_estadisticas AS
SELECT 
    r.*,
    u.nombre as creador_nombre,
    u.email as creador_email,
    COALESCE(ev.count, 0) as elementos_vendidos,
    COALESCE(er.count, 0) as elementos_reservados,
    r.cantidad_elementos - COALESCE(ev.count, 0) - COALESCE(er.count, 0) as elementos_disponibles,
    COALESCE(p.count, 0) as total_participantes,
    COALESCE(tr.total, 0) as total_recaudado
FROM rifas r
JOIN usuarios u ON r.usuario_id = u.id
LEFT JOIN (
    SELECT rifa_id, COUNT(*) as count
    FROM elementos_vendidos
    GROUP BY rifa_id
) ev ON r.id = ev.rifa_id
LEFT JOIN (
    SELECT rifa_id, COUNT(*) as count
    FROM elementos_reservados
    WHERE activo = true
    GROUP BY rifa_id
) er ON r.id = er.rifa_id
LEFT JOIN (
    SELECT rifa_id, COUNT(*) as count
    FROM participantes
    GROUP BY rifa_id
) p ON r.id = p.rifa_id
LEFT JOIN (
    SELECT rifa_id, SUM(total_pagado) as total
    FROM participantes
    WHERE estado = 'confirmado'
    GROUP BY rifa_id
) tr ON r.id = tr.rifa_id;

-- Vista para participantes con detalles
CREATE VIEW participantes_detallados AS
SELECT 
    p.*,
    r.nombre as rifa_nombre,
    r.precio as precio_por_elemento,
    u.nombre as creador_nombre,
    jsonb_array_length(p.numeros_seleccionados) as cantidad_elementos
FROM participantes p
JOIN rifas r ON p.rifa_id = r.id
JOIN usuarios u ON r.usuario_id = u.id;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
ESTRUCTURA DE DATOS EXPLICADA:

1. USUARIOS: Maneja autenticación y roles
2. RIFAS: Información principal de cada rifa
3. PREMIOS: Premios asociados a cada rifa
4. FOTOS_PREMIOS: Imágenes de los premios
5. FORMAS_PAGO: Métodos de pago por rifa
6. PARTICIPANTES: Personas que participan en rifas
7. ELEMENTOS_VENDIDOS: Números/elementos ya vendidos
8. ELEMENTOS_RESERVADOS: Números/elementos temporalmente reservados
9. LOGS_SISTEMA: Auditoría de acciones
10. CONFIGURACION_SISTEMA: Configuraciones globales

CARACTERÍSTICAS CLAVE:
- Soporte para elementos dinámicos (JSONB)
- Sistema de reservas temporales
- Auditoría completa
- Optimización con índices
- Funciones auxiliares para estadísticas
- Triggers automáticos para timestamps
- Vistas para consultas complejas

FLUJO DE DATOS:
1. Usuario se registra → tabla usuarios
2. Usuario crea rifa → tabla rifas + premios + formas_pago
3. Participante selecciona números → tabla elementos_reservados
4. Participante confirma pago → tabla participantes + elementos_vendidos
5. Organizador valida → actualiza estado en participantes
*/
