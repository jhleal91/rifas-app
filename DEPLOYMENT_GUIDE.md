# 🚀 Guía de Deployment - SorteoHub

## 📋 Resumen Ejecutivo

Esta guía te llevará paso a paso desde el código actual hasta producción. Sigue el orden indicado para evitar problemas.

---

## 🔴 FASE 1: Preparación (1-2 días)

### 1.1 Configurar Variables de Entorno

#### Frontend (`.env.production` en la raíz del proyecto):
```env
REACT_APP_API_BASE=https://api.sorteohub.com/api
REACT_APP_SOCKET_URL=https://api.sorteohub.com
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

#### Backend (`backend/config.env`):
```env
# Base de Datos PRODUCCIÓN
DB_HOST=tu_servidor_db
DB_PORT=5432
DB_NAME=rifas_digital_prod
DB_USER=rifas_user_prod
DB_PASSWORD=GENERAR_PASSWORD_SEGURO

# Servidor
PORT=5001
NODE_ENV=production

# JWT Secret (GENERAR NUEVO - mínimo 32 caracteres)
JWT_SECRET=GENERAR_NUEVO_SECRET_SEGURO

# Frontend URL
FRONTEND_URL=https://sorteohub.com

# Stripe PRODUCCIÓN
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (opcional)
RESEND_API_KEY=re_...
FROM_EMAIL=SorteoHub <noreply@sorteohub.com>

# Sentry (recomendado)
SENTRY_DSN=https://...
```

### 1.2 Generar Secretos Seguros

```bash
# JWT_SECRET
openssl rand -base64 32

# DB_PASSWORD
openssl rand -base64 24
```

### 1.3 Configurar Stripe Producción

1. Ir a [Stripe Dashboard](https://dashboard.stripe.com)
2. Activar modo "Live" (toggle superior derecha)
3. Obtener claves:
   - `STRIPE_SECRET_KEY` (sk_live_...)
   - `STRIPE_PUBLISHABLE_KEY` (pk_live_...)
4. Configurar Webhook:
   - Developers > Webhooks > Add endpoint
   - URL: `https://api.sorteohub.com/api/stripe/webhook`
   - Eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copiar `STRIPE_WEBHOOK_SECRET` (whsec_...)

---

## 🟡 FASE 2: Servidor y Base de Datos (1 día)

### 2.1 Preparar Servidor

**Requisitos mínimos:**
- Ubuntu 20.04+ / Debian 11+
- 2GB RAM (4GB recomendado)
- 20GB disco
- Node.js 16+
- PostgreSQL 12+

### 2.2 Instalar Dependencias del Sistema

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Instalar Nginx
sudo apt install nginx -y

# Instalar PM2
sudo npm install -g pm2

# Instalar Certbot (SSL)
sudo apt install certbot python3-certbot-nginx -y
```

### 2.3 Configurar Base de Datos

```bash
# Crear usuario y base de datos
sudo -u postgres psql

# En psql:
CREATE USER rifas_user_prod WITH PASSWORD 'TU_PASSWORD_SEGURO';
CREATE DATABASE rifas_digital_prod OWNER rifas_user_prod;
GRANT ALL PRIVILEGES ON DATABASE rifas_digital_prod TO rifas_user_prod;
\q

# Ejecutar migraciones
psql -U rifas_user_prod -d rifas_digital_prod -f backend/migrations/init.sql
```

### 2.4 Configurar Backups Automáticos

```bash
# Crear script de backup
sudo nano /usr/local/bin/backup-rifas.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/rifas"
mkdir -p $BACKUP_DIR

# Backup de base de datos
PGPASSWORD='TU_PASSWORD' pg_dump -U rifas_user_prod -h localhost rifas_digital_prod > $BACKUP_DIR/rifas_$DATE.sql

# Mantener solo últimos 30 días
find $BACKUP_DIR -name "rifas_*.sql" -mtime +30 -delete

echo "Backup completado: rifas_$DATE.sql"
```

```bash
# Hacer ejecutable
sudo chmod +x /usr/local/bin/backup-rifas.sh

# Agregar a crontab (backup diario a las 2 AM)
sudo crontab -e
# Agregar:
0 2 * * * /usr/local/bin/backup-rifas.sh
```

---

## 🟢 FASE 3: Deployment (1 día)

### 3.1 Clonar y Configurar Código

```bash
# Clonar repositorio
cd /var/www
sudo git clone https://github.com/jhleal91/rifas-app.git sorteohub
cd sorteohub

# Instalar dependencias
npm install
cd backend
npm install --production
cd ..
```

### 3.2 Configurar Variables de Entorno

```bash
# Backend
cd backend
cp config.env.example config.env
nano config.env  # Editar con valores de producción

# Frontend
cd ..
cp .env.example .env.production
nano .env.production  # Editar con valores de producción
```

### 3.3 Build de Producción

```bash
# Frontend
npm run build

# Verificar que se creó build/
ls -la build/
```

### 3.4 Configurar PM2

```bash
cd backend

# Crear ecosystem.config.js (ya existe, verificar configuración)
pm2 start ecosystem.config.js --env production

# Configurar inicio automático
pm2 startup
pm2 save

# Verificar estado
pm2 status
pm2 logs sorteohub-api
```

---

## 🔵 FASE 4: Nginx y SSL (2-3 horas)

### 4.1 Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/sorteohub
```

```nginx
# Redirección HTTP a HTTPS
server {
    listen 80;
    server_name sorteohub.com www.sorteohub.com;
    return 301 https://$server_name$request_uri;
}

# Configuración HTTPS
server {
    listen 443 ssl http2;
    server_name sorteohub.com www.sorteohub.com;

    # SSL (se configurará con Certbot)
    ssl_certificate /etc/letsencrypt/live/sorteohub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sorteohub.com/privkey.pem;

    # Configuración SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Frontend (React build)
    root /var/www/sorteohub/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache para assets estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket para notificaciones
    location /socket.io {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

```bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/sorteohub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4.2 Configurar SSL con Let's Encrypt

```bash
# Obtener certificado
sudo certbot --nginx -d sorteohub.com -d www.sorteohub.com

# Verificar renovación automática
sudo certbot renew --dry-run
```

---

## 🟣 FASE 5: Monitoreo y Testing (1 día)

### 5.1 Configurar Sentry

1. Crear cuenta en [Sentry](https://sentry.io)
2. Crear proyecto Node.js
3. Copiar DSN
4. Agregar a `backend/config.env`:
   ```env
   SENTRY_DSN=https://...
   ```

### 5.2 Testing Final

**Checklist de pruebas:**
- [ ] Registro de usuario
- [ ] Login
- [ ] Crear rifa
- [ ] Participar en rifa
- [ ] Pago con Stripe (modo producción)
- [ ] Notificaciones en tiempo real
- [ ] Cambio de idioma
- [ ] Portal de anunciantes
- [ ] Cargar créditos (anunciantes)
- [ ] Verificar logs en Sentry
- [ ] Verificar que los backups funcionen

### 5.3 Monitoreo

```bash
# PM2
pm2 monit

# Logs
pm2 logs sorteohub-api

# Estado
pm2 status

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

---

## 🔧 Scripts Útiles

### Script de Deployment

```bash
#!/bin/bash
# deploy.sh

echo "🚀 Iniciando deployment..."

# Pull latest code
git pull origin main

# Install dependencies
npm install
cd backend
npm install --production
cd ..

# Build frontend
npm run build

# Restart PM2
pm2 restart sorteohub-api

echo "✅ Deployment completado"
```

### Script de Rollback

```bash
#!/bin/bash
# rollback.sh

echo "⏪ Iniciando rollback..."

# Restaurar código anterior
git checkout <commit-anterior>

# Rebuild
npm run build
cd backend
npm install --production
cd ..

# Restart
pm2 restart sorteohub-api

echo "✅ Rollback completado"
```

---

## 📊 Checklist Final Pre-Lanzamiento

### Seguridad
- [ ] JWT_SECRET generado y seguro
- [ ] DB_PASSWORD seguro
- [ ] HTTPS configurado
- [ ] Rate limiting activo
- [ ] CORS configurado correctamente
- [ ] Headers de seguridad activos

### Configuración
- [ ] Variables de entorno configuradas
- [ ] Stripe en modo producción
- [ ] Base de datos migrada
- [ ] Backups configurados
- [ ] SSL/HTTPS funcionando

### Funcionalidad
- [ ] Build sin errores
- [ ] Tests pasando
- [ ] Flujos críticos probados
- [ ] Notificaciones funcionan
- [ ] Pagos funcionan

### Monitoreo
- [ ] Sentry configurado
- [ ] Logs funcionando
- [ ] Alertas configuradas
- [ ] PM2 monitoreando

---

## 🚨 Troubleshooting

### Error: "Cannot connect to database"
- Verificar que PostgreSQL esté corriendo: `sudo systemctl status postgresql`
- Verificar credenciales en `config.env`
- Verificar que el usuario tenga permisos

### Error: "Port 5001 already in use"
- Verificar procesos: `lsof -i :5001`
- Detener proceso: `pm2 stop sorteohub-api`

### Error: "Stripe webhook not working"
- Verificar que la URL del webhook sea accesible públicamente
- Verificar `STRIPE_WEBHOOK_SECRET`
- Revisar logs de Stripe Dashboard

### Error: "Build fails"
- Verificar Node.js version: `node -v` (debe ser 16+)
- Limpiar cache: `rm -rf node_modules package-lock.json && npm install`
- Verificar variables de entorno

---

## 📞 Soporte

- **Stripe**: https://support.stripe.com
- **Sentry**: https://sentry.io/support
- **Nginx**: https://nginx.org/en/docs/

---

**¡Listo para producción! 🚀**

