# 📊 Documentación de Base de Datos - Sistema de Rifas

## 🎯 Resumen del Sistema

Este sistema de rifas digitales permite a los usuarios crear y gestionar rifas de diferentes tipos, con un flujo completo de participación, reservas temporales, validación de pagos y gestión de premios.

## 🗄️ Base de Datos Recomendada: PostgreSQL

### ¿Por qué PostgreSQL?

- ✅ **Escalabilidad**: Maneja millones de registros eficientemente
- ✅ **JSON nativo**: Perfecto para elementos dinámicos de rifas
- ✅ **Transacciones ACID**: Garantiza integridad de datos
- ✅ **Gratuito y open source**
- ✅ **Excelente rendimiento para aplicaciones web**
- ✅ **Soporte para arrays y tipos complejos**
- ✅ **Índices avanzados y optimizaciones**

## 🏗️ Arquitectura de la Base de Datos

### Flujo Principal de Datos

```
1. Usuario se registra → tabla `usuarios`
2. Usuario crea rifa → tabla `rifas` + `premios` + `formas_pago`
3. Participante selecciona números → tabla `elementos_reservados`
4. Participante confirma pago → tabla `participantes` + `elementos_vendidos`
5. Organizador valida → actualiza estado en `participantes`
```

### Estructura de Tablas

#### 1. **usuarios** - Gestión de usuarios
- Autenticación y autorización
- Roles: `admin` (creador de rifas) y `invitado` (solo participante)
- Información de contacto y perfil

#### 2. **rifas** - Información principal de rifas
- Datos básicos: nombre, descripción, precio, fechas
- Tipos dinámicos: números, baraja, abecedario, animales, colores, equipos, emojis, países
- Configuración de sorteos en vivo
- Visibilidad: pública o privada

#### 3. **premios** - Premios de cada rifa
- Múltiples premios por rifa
- Posiciones (1er lugar, 2do lugar, etc.)
- Descripciones detalladas

#### 4. **fotos_premios** - Imágenes de premios
- URLs de imágenes
- Orden de visualización
- Descripciones opcionales

#### 5. **formas_pago** - Métodos de pago
- Transferencias bancarias
- Información de cuentas
- Datos de contacto

#### 6. **participantes** - Personas que participan
- Datos personales
- Números/elementos seleccionados (JSONB)
- Estados: `pendiente`, `confirmado`, `rechazado`
- Sistema de reservas temporales

#### 7. **elementos_vendidos** - Elementos ya vendidos
- Trazabilidad de ventas
- Relación con participantes

#### 8. **elementos_reservados** - Reservas temporales
- Sistema de timeouts (15 minutos por defecto)
- Limpieza automática de reservas expiradas

#### 9. **logs_sistema** - Auditoría completa
- Registro de todas las acciones
- Información de IP y user agent
- Detalles en formato JSON

#### 10. **configuracion_sistema** - Configuraciones globales
- Parámetros del sistema
- Versiones de términos y condiciones
- Configuraciones de comisiones

## 🔧 Características Técnicas

### Tipos de Datos Especiales

- **JSONB**: Para elementos personalizados y detalles de logs
- **SERIAL**: IDs auto-incrementales
- **TIMESTAMP**: Fechas con zona horaria
- **DECIMAL**: Precios con precisión
- **INET**: Direcciones IP
- **CHECK constraints**: Validación de datos

### Optimizaciones

- **Índices estratégicos**: En campos de búsqueda frecuente
- **Vistas materializadas**: Para consultas complejas
- **Triggers automáticos**: Para timestamps
- **Funciones auxiliares**: Para estadísticas y limpieza

### Seguridad

- **Foreign Keys**: Integridad referencial
- **Constraints**: Validación de datos
- **Roles y permisos**: Control de acceso
- **Auditoría completa**: Trazabilidad de acciones

## 🚀 Implementación Recomendada

### 1. Configuración Inicial

```bash
# Instalar PostgreSQL
brew install postgresql  # macOS
sudo apt-get install postgresql  # Ubuntu

# Crear base de datos
createdb rifas_digital

# Ejecutar schema
psql -d rifas_digital -f database-schema.sql
```

### 2. Backend API (Node.js + Express)

```javascript
// Estructura recomendada
const express = require('express');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'tu_usuario',
  host: 'localhost',
  database: 'rifas_digital',
  password: 'tu_password',
  port: 5432,
});

// Ejemplo de endpoint
app.get('/api/rifas/:id', async (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT * FROM rifas_con_estadisticas 
    WHERE id = $1
  `;
  const result = await pool.query(query, [id]);
  res.json(result.rows[0]);
});
```

### 3. ORM Recomendado: Prisma

```javascript
// schema.prisma
model Usuario {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  nombre    String
  telefono  String?
  rol       Rol      @default(ADMIN)
  activo    Boolean  @default(true)
  rifas     Rifa[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Rifa {
  id                    String   @id
  usuarioId             Int
  usuario               Usuario  @relation(fields: [usuarioId], references: [id])
  nombre                String
  descripcion           String?
  precio                Decimal
  fechaCreacion         DateTime @default(now())
  fechaFin              DateTime
  tipo                  TipoRifa
  cantidadElementos     Int
  elementosPersonalizados Json?
  reglas                String?
  esPrivada             Boolean  @default(false)
  activa                Boolean  @default(true)
  premios               Premio[]
  fotosPremios          FotoPremio[]
  formasPago            FormaPago[]
  participantes         Participante[]
  elementosVendidos     ElementoVendido[]
  elementosReservados   ElementoReservado[]
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

## 📈 Escalabilidad y Rendimiento

### Estrategias de Optimización

1. **Índices Compuestos**: Para consultas complejas
2. **Particionado**: Por fechas en tablas grandes
3. **Caché**: Redis para consultas frecuentes
4. **CDN**: Para imágenes de premios
5. **Load Balancing**: Para múltiples instancias

### Monitoreo Recomendado

- **pg_stat_statements**: Consultas lentas
- **pg_stat_activity**: Conexiones activas
- **Logs de aplicación**: Errores y rendimiento
- **Métricas de negocio**: Conversiones y engagement

## 🔒 Seguridad y Compliance

### Medidas de Seguridad

1. **Encriptación**: Passwords con bcrypt
2. **HTTPS**: Comunicación segura
3. **Rate Limiting**: Prevenir abuso
4. **Validación**: Input sanitization
5. **Backups**: Automáticos y encriptados

### Compliance Legal

- **GDPR**: Protección de datos personales
- **Términos y Condiciones**: Versiones y aceptación
- **Auditoría**: Logs completos de acciones
- **Retención de datos**: Políticas de eliminación

## 🧪 Testing y QA

### Estrategia de Testing

1. **Unit Tests**: Funciones de base de datos
2. **Integration Tests**: Flujos completos
3. **Load Tests**: Rendimiento bajo carga
4. **Security Tests**: Vulnerabilidades
5. **Data Tests**: Integridad de datos

### Datos de Prueba

```sql
-- Insertar usuario de prueba
INSERT INTO usuarios (email, password_hash, nombre, telefono, rol) 
VALUES ('admin@test.com', '$2b$10$...', 'Admin Test', '1234567890', 'admin');

-- Insertar rifa de prueba
INSERT INTO rifas (id, usuario_id, nombre, descripcion, precio, fecha_fin, tipo, cantidad_elementos, elementos_personalizados)
VALUES ('test123', 1, 'Rifa Test', 'Rifa de prueba', 50.00, '2024-12-31 23:59:59', 'numeros', 100, '["1","2","3","4","5"]');
```

## 📊 Métricas y Analytics

### KPIs Importantes

- **Usuarios activos**: Registros y logins
- **Rifas creadas**: Por tipo y usuario
- **Participaciones**: Conversión y engagement
- **Revenue**: Total recaudado
- **Retención**: Usuarios que regresan

### Reportes Automáticos

- **Diarios**: Actividad del día
- **Semanales**: Tendencias y crecimiento
- **Mensuales**: Análisis de negocio
- **Alertas**: Problemas y oportunidades

## 🚀 Próximos Pasos

### Fase 1: Implementación Básica
1. ✅ Crear estructura de base de datos
2. ✅ Implementar autenticación
3. ✅ CRUD básico de rifas
4. ✅ Sistema de participación

### Fase 2: Funcionalidades Avanzadas
1. 🔄 Sistema de reservas temporales
2. 🔄 Validación de pagos
3. 🔄 Notificaciones
4. 🔄 Reportes y analytics

### Fase 3: Optimización y Escala
1. ⏳ Caché y optimizaciones
2. ⏳ API pública
3. ⏳ Integraciones de pago
4. ⏳ Mobile app

## 📞 Soporte y Mantenimiento

### Tareas de Mantenimiento

- **Limpieza de reservas expiradas**: Automática
- **Backups**: Diarios y semanales
- **Actualizaciones**: Seguridad y features
- **Monitoreo**: 24/7 de disponibilidad

### Contacto

- **Email**: soporte@rifasdigital.com
- **Documentación**: [Wiki del proyecto]
- **Issues**: [GitHub Issues]
- **Discord**: [Canal de soporte]

---

*Esta documentación se actualiza regularmente. Última actualización: Diciembre 2024*
