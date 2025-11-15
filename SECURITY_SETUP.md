# 🔒 Guía de Configuración de Seguridad - SorteoHub

## ✅ Mejoras Implementadas

### 1. **Rate Limiting**
- ✅ Implementado sistema de rate limiting
- ✅ Protección estricta para login/registro (5 intentos / 15 min)
- ✅ Protección moderada para creación de contenido (20 / hora)
- ✅ Protección general para API (100 requests / 15 min)

### 2. **CORS Configurado Correctamente**
- ✅ Desarrollo: Permite localhost y frontend configurado
- ✅ Producción: Solo permite el dominio del frontend
- ✅ Validación automática según `NODE_ENV`

### 3. **Sanitización Mejorada**
- ✅ Sanitización robusta de inputs (XSS protection)
- ✅ Limite de longitud de strings
- ✅ Sanitización recursiva de objetos y arrays
- ✅ Sanitización de query params y route params

### 4. **Validación de JWT_SECRET**
- ✅ Validación automática en producción
- ✅ Verifica longitud mínima (32 caracteres)
- ✅ Previene uso de valores por defecto
- ✅ Advertencias sobre entropía

### 5. **Headers de Seguridad**
- ✅ Helmet configurado con CSP
- ✅ HSTS habilitado
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff

---

## 🚀 Configuración para Producción

### Paso 1: Generar JWT_SECRET Fuerte

```bash
# Opción 1: Usando OpenSSL
openssl rand -base64 32

# Opción 2: Usando Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Opción 3: Usando Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Ejemplo de output:**
```
Kx9mP2vL8qR5tY3wZ6nB4cD7fG1hJ0kL9mN2pQ5rS8tU1vW4xY7zA0bC3dE6f
```

### Paso 2: Configurar Variables de Entorno

Crear archivo `backend/config.env` (o usar variables de entorno del sistema):

```bash
# Base de Datos
DB_HOST=tu_servidor_db
DB_PORT=5432
DB_NAME=rifas_digital_prod
DB_USER=rifas_user
DB_PASSWORD=TU_PASSWORD_SEGURO_AQUI

# Servidor
PORT=5001
NODE_ENV=production

# JWT Secret (usar el generado en Paso 1)
JWT_SECRET=Kx9mP2vL8qR5tY3wZ6nB4cD7fG1hJ0kL9mN2pQ5rS8tU1vW4xY7zA0bC3dE6f

# CORS - URL completa del frontend
FRONTEND_URL=https://sorteohub.com

# Aplicación
APP_NAME=SorteoHub
APP_VERSION=1.0.0

# Email
RESEND_API_KEY=tu_api_key_de_resend
FROM_EMAIL=SorteoHub <noreply@sorteohub.com>
```

### Paso 3: Verificar Configuración

El servidor validará automáticamente:
- ✅ JWT_SECRET tiene al menos 32 caracteres
- ✅ JWT_SECRET no es el valor por defecto
- ✅ FRONTEND_URL está configurado

Si algo falla, el servidor **NO iniciará** y mostrará un error claro.

---

## 📊 Rate Limiting Configurado

### Endpoints de Autenticación
- **Ruta:** `/api/auth/*`
- **Límite:** 5 requests / 15 minutos
- **Por:** Email + IP
- **Protege:** Login, registro, recuperación de contraseña

### Endpoints de Creación
- **Rutas:** `/api/rifas`, `/api/participantes`
- **Límite:** 20 requests / hora
- **Por:** User ID + IP
- **Protege:** Creación de rifas, participantes

### Endpoints Públicos
- **Rutas:** `/api/ads`, `/api/cupones`
- **Límite:** 200 requests / hora
- **Por:** IP
- **Protege:** Endpoints públicos

### Endpoints Generales
- **Rutas:** Resto de la API
- **Límite:** 100 requests / 15 minutos
- **Por:** IP
- **Protege:** Uso general de la API

---

## 🔐 Headers de Seguridad

Los siguientes headers se agregan automáticamente:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Content-Security-Policy: [configurado]
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-RateLimit-Limit: [límite]
X-RateLimit-Remaining: [restante]
X-RateLimit-Reset: [timestamp]
```

---

## ⚠️ Checklist Pre-Producción

Antes de lanzar a producción, verificar:

- [ ] JWT_SECRET generado y configurado (mínimo 32 caracteres)
- [ ] FRONTEND_URL configurado con URL completa (https://)
- [ ] DB_PASSWORD seguro y único
- [ ] NODE_ENV=production
- [ ] Variables de entorno no expuestas en código
- [ ] SSL/HTTPS configurado
- [ ] Firewall configurado (solo puertos necesarios)
- [ ] Backups automatizados
- [ ] Logs configurados
- [ ] Monitoreo activo

---

## 🧪 Probar en Desarrollo

### Verificar Rate Limiting

```bash
# Hacer 6 requests rápidas a /api/auth/login
# La 6ta debería fallar con 429
for i in {1..6}; do
  curl -X POST http://localhost:5001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}'
  echo ""
done
```

### Verificar CORS

```bash
# En desarrollo, debería permitir localhost:3000
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:5001/api/auth/login \
     -v
```

### Verificar Sanitización

```bash
# Intentar enviar script malicioso
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","nombre":"<script>alert(1)</script>"}'

# El <script> debería ser removido
```

---

## 📝 Notas Importantes

1. **CORS en Desarrollo:**
   - Permite localhost:3000, localhost:3001, 127.0.0.1
   - Logs de intentos bloqueados (solo advertencia, no bloquea)

2. **CORS en Producción:**
   - Solo permite el dominio configurado en `FRONTEND_URL`
   - Bloquea cualquier otro origen
   - Logs de intentos bloqueados

3. **Rate Limiting:**
   - Usa memoria en el servidor (Map)
   - Se limpia automáticamente cada minuto
   - Para alta escala, considerar Redis

4. **JWT_SECRET:**
   - Nunca commitear en git
   - Usar variables de entorno
   - Rotar periódicamente (cada 6-12 meses)

---

## 🔄 Próximos Pasos Recomendados

1. **Implementar Redis para Rate Limiting** (escalabilidad)
2. **Agregar CAPTCHA** en login/registro después de 3 intentos fallidos
3. **Implementar 2FA** para cuentas admin
4. **Agregar logging de seguridad** (intentos fallidos, IPs sospechosas)
5. **Implementar WAF** (Web Application Firewall) si es necesario

---

**Última actualización:** $(date)  
**Versión:** 1.0

