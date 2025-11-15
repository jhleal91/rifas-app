# 🚀 Backend API - Sistema de Rifas Digitales

## 📋 Descripción

Backend API desarrollado en Node.js + Express + PostgreSQL para el sistema de rifas digitales. Proporciona endpoints para autenticación, gestión de rifas, participantes y elementos.

## 🛠️ Tecnologías

- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Base de datos
- **bcryptjs** - Encriptación de passwords
- **jsonwebtoken** - Autenticación JWT
- **cors** - Cross-Origin Resource Sharing
- **helmet** - Seguridad HTTP
- **dotenv** - Variables de entorno

## 🚀 Instalación y Configuración

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Base de Datos

Asegúrate de que PostgreSQL esté instalado y ejecutando:

```bash
# Crear base de datos
createdb rifas_digital

# Ejecutar schema
psql -d rifas_digital -f ../database-schema.sql
```

### 3. Configurar Variables de Entorno

Edita el archivo `config.env`:

```env
# Configuración de Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rifas_digital
DB_USER=tu_usuario
DB_PASSWORD=tu_password

# Configuración del Servidor
PORT=5001
NODE_ENV=development

# JWT Secret (cambiar en producción)
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui

# Configuración de CORS
FRONTEND_URL=http://localhost:3000
```

### 4. Ejecutar el Servidor

```bash
# Desarrollo (con nodemon)
npm run dev

# Producción
npm start
```

El servidor estará disponible en: `http://localhost:5001`

## 📚 API Endpoints

### 🔐 Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registrar nuevo usuario |
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/guest` | Login como invitado |
| GET | `/api/auth/me` | Obtener usuario actual |

### 🎯 Rifas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/rifas` | Obtener rifas públicas |
| GET | `/api/rifas/my` | Obtener mis rifas (admin) |
| GET | `/api/rifas/:id` | Obtener rifa por ID |
| POST | `/api/rifas` | Crear nueva rifa (admin) |
| PUT | `/api/rifas/:id` | Actualizar rifa (admin) |
| DELETE | `/api/rifas/:id` | Eliminar rifa (admin) |

### 👥 Participantes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/participantes/:rifaId` | Obtener participantes de una rifa |
| POST | `/api/participantes/:rifaId` | Participar en una rifa |
| PUT | `/api/participantes/:id/validar` | Validar pago (admin) |
| PUT | `/api/participantes/:id/rechazar` | Rechazar participante (admin) |
| GET | `/api/participantes/:rifaId/elementos` | Obtener elementos de una rifa |

### 🏥 Salud del Sistema

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/health` | Estado del servidor |
| GET | `/` | Información de la API |

## 🔧 Ejemplos de Uso

### Registrar Usuario

```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "password123",
    "nombre": "Juan Pérez",
    "telefono": "1234567890"
  }'
```

### Iniciar Sesión

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "password123"
  }'
```

### Crear Rifa

```bash
curl -X POST http://localhost:5001/api/rifas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_JWT_TOKEN" \
  -d '{
    "nombre": "Rifa iPhone 15",
    "descripcion": "Rifa del nuevo iPhone 15 Pro Max",
    "precio": 50.00,
    "fechaFin": "2024-12-31T23:59:59Z",
    "tipo": "numeros",
    "cantidadElementos": 100,
    "reglas": "Reglas de la rifa",
    "esPrivada": false
  }'
```

### Participar en Rifa

```bash
curl -X POST http://localhost:5001/api/participantes/1234567890 \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "María García",
    "telefono": "0987654321",
    "email": "maria@ejemplo.com",
    "numerosSeleccionados": ["1", "5", "10"]
  }'
```

## 🗄️ Estructura de Base de Datos

### Tablas Principales

- **usuarios** - Información de usuarios
- **rifas** - Datos de las rifas
- **premios** - Premios de cada rifa
- **fotos_premios** - Imágenes de premios
- **formas_pago** - Métodos de pago
- **participantes** - Participantes en rifas
- **elementos_vendidos** - Elementos ya vendidos
- **elementos_reservados** - Reservas temporales
- **logs_sistema** - Auditoría de acciones
- **configuracion_sistema** - Configuraciones globales

### Vistas Útiles

- **rifas_con_estadisticas** - Rifas con estadísticas completas
- **participantes_detallados** - Participantes con información detallada

## 🔒 Seguridad

- **JWT Tokens** para autenticación
- **bcrypt** para encriptación de passwords
- **Helmet** para headers de seguridad
- **CORS** configurado para el frontend
- **Validación** de datos de entrada
- **Sanitización** de inputs
- **Rate limiting** (recomendado para producción)

## 🧪 Testing

```bash
# Probar conexión a la base de datos
psql -d rifas_digital -c "SELECT 1;"

# Probar endpoint de salud
curl http://localhost:5001/api/health

# Probar endpoint raíz
curl http://localhost:5001/
```

## 📊 Monitoreo

### Logs del Servidor

El servidor registra:
- Peticiones HTTP con timestamp
- Errores de base de datos
- Queries ejecutadas con duración
- Errores de autenticación

### Métricas Importantes

- Tiempo de respuesta de queries
- Número de conexiones activas
- Errores por endpoint
- Uso de memoria y CPU

## 🚀 Despliegue en Producción

### Variables de Entorno de Producción

```env
NODE_ENV=production
PORT=5001
DB_HOST=tu_host_produccion
DB_PASSWORD=password_seguro
JWT_SECRET=secret_muy_seguro_y_largo
FRONTEND_URL=https://tu-dominio.com
```

### Recomendaciones

1. **Usar PM2** para gestión de procesos
2. **Nginx** como reverse proxy
3. **SSL/TLS** para HTTPS
4. **Backups** automáticos de la base de datos
5. **Monitoreo** con herramientas como New Relic
6. **Rate limiting** para prevenir abuso

## 🐛 Solución de Problemas

### Error de Conexión a Base de Datos

```bash
# Verificar que PostgreSQL esté corriendo
brew services list | grep postgresql

# Verificar conexión
psql -d rifas_digital -c "SELECT 1;"
```

### Puerto en Uso

```bash
# Verificar qué proceso usa el puerto
lsof -i :5001

# Cambiar puerto en config.env
PORT=5002
```

### Error de JWT

- Verificar que `JWT_SECRET` esté configurado
- Asegurar que el token no haya expirado
- Verificar formato del header Authorization

## 📞 Soporte

- **Documentación**: Ver archivos en `/docs`
- **Issues**: Reportar en GitHub
- **Email**: soporte@rifasdigital.com

---

*Última actualización: Octubre 2024*
