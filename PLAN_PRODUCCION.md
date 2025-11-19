# 🚀 Plan de Acción para Producción - SorteoHub

## 📋 Checklist Pre-Producción

### 🔴 CRÍTICO (Antes de lanzar)

#### 1. **Configuración de Entorno de Producción**
- [ ] Crear base de datos de producción separada
- [ ] Configurar variables de entorno de producción
- [ ] Generar `JWT_SECRET` seguro (mínimo 32 caracteres)
- [ ] Configurar `NODE_ENV=production`
- [ ] Actualizar `FRONTEND_URL` con dominio real
- [ ] Configurar `DB_PASSWORD` seguro

#### 2. **Stripe - Cambiar a Producción**
- [ ] Obtener claves de producción de Stripe Dashboard
- [ ] Actualizar `STRIPE_SECRET_KEY` (sk_live_...)
- [ ] Actualizar `STRIPE_PUBLISHABLE_KEY` (pk_live_...)
- [ ] Configurar webhook de producción en Stripe Dashboard
- [ ] Actualizar `STRIPE_WEBHOOK_SECRET` (whsec_...)
- [ ] Probar flujo de pago completo en modo producción
- [ ] Configurar Stripe Connect para creadores (si aplica)

#### 3. **Seguridad**
- [ ] Verificar que `JWT_SECRET` no sea el valor por defecto
- [ ] Revisar rate limiting en producción
- [ ] Configurar HTTPS/SSL
- [ ] Verificar headers de seguridad (Helmet)
- [ ] Revisar CORS para producción
- [ ] Validar sanitización de inputs
- [ ] Revisar validación de archivos subidos

#### 4. **Base de Datos**
- [ ] Crear backup de base de datos de desarrollo
- [ ] Ejecutar todas las migraciones en producción
- [ ] Configurar backups automáticos
- [ ] Verificar índices y performance
- [ ] Configurar conexión pool optimizada

#### 5. **Monitoreo y Logging**
- [ ] Configurar Sentry DSN de producción
- [ ] Configurar Winston para producción
- [ ] Configurar alertas críticas
- [ ] Verificar que los logs no contengan información sensible

---

### 🟡 IMPORTANTE (Recomendado antes de lanzar)

#### 6. **Build y Optimización**
- [ ] Crear build de producción del frontend (`npm run build`)
- [ ] Verificar que no haya errores de compilación
- [ ] Optimizar imágenes y assets
- [ ] Verificar tamaño del bundle
- [ ] Configurar compresión (gzip/brotli)
- [ ] Configurar CDN para assets estáticos (opcional)

#### 7. **Testing**
- [ ] Ejecutar suite completa de tests
- [ ] Verificar que todos los tests pasen
- [ ] Realizar pruebas de integración
- [ ] Probar flujos críticos manualmente
- [ ] Probar en diferentes navegadores
- [ ] Probar en dispositivos móviles

#### 8. **Documentación**
- [ ] Actualizar README con instrucciones de producción
- [ ] Documentar proceso de deployment
- [ ] Documentar rollback procedure
- [ ] Documentar variables de entorno requeridas
- [ ] Crear guía de troubleshooting

#### 9. **Email y Notificaciones**
- [ ] Configurar servicio de email (Resend/SendGrid)
- [ ] Verificar que los emails se envíen correctamente
- [ ] Configurar templates de email
- [ ] Probar notificaciones por email
- [ ] Configurar dominio de email (SPF, DKIM)

---

### 🟢 OPCIONAL (Mejoras post-lanzamiento)

#### 10. **Performance**
- [ ] Configurar caching (Redis opcional)
- [ ] Optimizar queries de base de datos
- [ ] Implementar lazy loading
- [ ] Configurar service worker para offline
- [ ] Implementar paginación eficiente

#### 11. **CI/CD**
- [ ] Configurar pipeline de CI/CD
- [ ] Automatizar tests en cada commit
- [ ] Automatizar deployment
- [ ] Configurar staging environment

#### 12. **Analytics y Métricas**
- [ ] Integrar Google Analytics (opcional)
- [ ] Configurar métricas de negocio
- [ ] Dashboard de monitoreo
- [ ] Alertas de performance

---

## 📝 Guía Paso a Paso

### Paso 1: Preparar Variables de Entorno

#### Backend (`backend/config.env` para producción):
```env
# Base de Datos
DB_HOST=tu_servidor_db_produccion
DB_PORT=5432
DB_NAME=rifas_digital_prod
DB_USER=rifas_user_prod
DB_PASSWORD=TU_PASSWORD_SUPER_SEGURO_AQUI

# Servidor
PORT=5001
NODE_ENV=production

# JWT Secret (generar uno nuevo y seguro)
JWT_SECRET=GENERAR_NUEVO_SECRET_SEGURO_32_CARACTERES_MINIMO

# Frontend URL (tu dominio real)
FRONTEND_URL=https://sorteohub.com

# Stripe PRODUCCIÓN (obtener de Stripe Dashboard)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (si usas Resend)
RESEND_API_KEY=re_...
FROM_EMAIL=SorteoHub <noreply@sorteohub.com>

# Sentry (opcional pero recomendado)
SENTRY_DSN=https://...
```

#### Frontend (`.env.production`):
```env
REACT_APP_API_BASE=https://api.sorteohub.com/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Paso 2: Generar JWT_SECRET Seguro

```bash
# Opción 1: OpenSSL
openssl rand -base64 32

# Opción 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Opción 3: Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Paso 3: Configurar Stripe para Producción

1. Ir a [Stripe Dashboard](https://dashboard.stripe.com)
2. Cambiar a modo "Live" (toggle en la esquina superior derecha)
3. Obtener claves de API:
   - `STRIPE_SECRET_KEY` (sk_live_...)
   - `STRIPE_PUBLISHABLE_KEY` (pk_live_...)
4. Configurar Webhook:
   - Ir a Developers > Webhooks
   - Agregar endpoint: `https://api.sorteohub.com/api/stripe/webhook`
   - Seleccionar eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copiar `STRIPE_WEBHOOK_SECRET` (whsec_...)

### Paso 4: Build de Producción

```bash
# Frontend
npm run build

# Verificar que se creó la carpeta build/
ls -la build/

# Backend (verificar que no haya errores)
cd backend
npm install --production
npm start
```

### Paso 5: Configurar Base de Datos de Producción

```bash
# Crear base de datos
createdb rifas_digital_prod

# Ejecutar migraciones
psql -d rifas_digital_prod -f backend/migrations/init.sql

# (Si hay migraciones adicionales, ejecutarlas)
# psql -d rifas_digital_prod -f backend/migrations/nombre_migracion.sql
```

### Paso 6: Configurar Servidor Web (Nginx)

```nginx
# /etc/nginx/sites-available/sorteohub
server {
    listen 80;
    server_name sorteohub.com www.sorteohub.com;
    
    # Redirigir a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name sorteohub.com www.sorteohub.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend (React build)
    location / {
        root /var/www/sorteohub/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket para notificaciones
    location /socket.io {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Paso 7: Configurar SSL (Let's Encrypt)

```bash
# Instalar Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d sorteohub.com -d www.sorteohub.com

# Renovación automática
sudo certbot renew --dry-run
```

### Paso 8: Configurar PM2 (Process Manager)

```bash
# Instalar PM2
npm install -g pm2

# Iniciar backend
cd backend
pm2 start server.js --name sorteohub-api --env production

# Configurar inicio automático
pm2 startup
pm2 save

# Monitoreo
pm2 monit
```

### Paso 9: Configurar Backups

```bash
# Script de backup diario
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump rifas_digital_prod > /backups/rifas_$DATE.sql

# Agregar a crontab
# 0 2 * * * /path/to/backup.sh
```

### Paso 10: Testing Final

- [ ] Probar registro de usuario
- [ ] Probar login
- [ ] Probar creación de rifa
- [ ] Probar participación en rifa
- [ ] Probar pago con Stripe (modo producción)
- [ ] Probar notificaciones
- [ ] Probar cambio de idioma
- [ ] Probar en móvil
- [ ] Verificar que los logs funcionen
- [ ] Verificar que Sentry capture errores

---

## 🔍 Verificaciones Finales

### Seguridad
- [ ] No hay passwords hardcodeados
- [ ] JWT_SECRET es seguro y único
- [ ] HTTPS está configurado
- [ ] Rate limiting activo
- [ ] CORS configurado correctamente
- [ ] Headers de seguridad activos

### Performance
- [ ] Build de producción optimizado
- [ ] Imágenes optimizadas
- [ ] Queries de BD optimizadas
- [ ] Caching configurado (si aplica)

### Funcionalidad
- [ ] Todos los tests pasan
- [ ] Flujos críticos funcionan
- [ ] Stripe funciona en producción
- [ ] Notificaciones funcionan
- [ ] Emails funcionan (si aplica)

---

## 🚨 Rollback Plan

Si algo sale mal:

1. **Detener aplicación:**
   ```bash
   pm2 stop sorteohub-api
   ```

2. **Restaurar base de datos:**
   ```bash
   psql -d rifas_digital_prod < /backups/rifas_backup.sql
   ```

3. **Revertir código:**
   ```bash
   git checkout <commit-anterior>
   npm install
   npm run build
   pm2 restart sorteohub-api
   ```

---

## 📞 Contactos de Emergencia

- **Stripe Support**: https://support.stripe.com
- **Sentry Support**: https://sentry.io/support
- **Hosting Provider**: [Tu proveedor]

---

## 📊 Métricas a Monitorear

- Tiempo de respuesta de API
- Tasa de error
- Uso de CPU/Memoria
- Conexiones a base de datos
- Transacciones de Stripe
- Usuarios activos
- Rifas creadas/participaciones

---

## ✅ Checklist Final Pre-Lanzamiento

- [ ] Todas las variables de entorno configuradas
- [ ] Stripe en modo producción
- [ ] Base de datos de producción creada y migrada
- [ ] Build de producción sin errores
- [ ] SSL/HTTPS configurado
- [ ] Backups configurados
- [ ] Monitoreo activo (Sentry)
- [ ] Tests pasando
- [ ] Documentación actualizada
- [ ] Plan de rollback preparado
- [ ] Equipo notificado del lanzamiento

---

**¡Listo para producción! 🚀**

