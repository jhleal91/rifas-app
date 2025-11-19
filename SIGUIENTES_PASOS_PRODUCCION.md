# 🚀 Siguientes Pasos para Producción

## ✅ Completado
- [x] Base de datos de producción creada

## 📋 Próximos Pasos Inmediatos (En Orden de Prioridad)

### 1. 🔐 Configurar Variables de Entorno de Producción (CRÍTICO)

**Archivo:** `backend/config.production.env`

```bash
# Crear archivo de configuración de producción
cp backend/config.production.env backend/config.production.env.local
# Editar con tus valores reales
```

**Valores que DEBES configurar:**

1. **Base de Datos:**
   ```env
   DB_HOST=tu_host_produccion
   DB_PORT=5432
   DB_NAME=sorteohub_prod
   DB_USER=tu_usuario_bd
   DB_PASSWORD=tu_password_seguro
   ```

2. **JWT Secret (GENERAR UNO NUEVO Y SEGURO):**
   ```bash
   # Generar JWT secret seguro
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
   ```env
   JWT_SECRET=tu_jwt_secret_generado_aqui
   ```

3. **Frontend URL:**
   ```env
   FRONTEND_URL=https://tu-dominio.com
   ```

4. **Stripe (MODO LIVE - Obtener de dashboard.stripe.com):**
   ```env
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_... (del webhook de producción)
   ```

5. **Emails (Resend):**
   ```env
   RESEND_API_KEY=re_...
   FROM_EMAIL=SorteoHub <noreply@tu-dominio.com>
   ```

6. **Sentry (Monitoreo de errores):**
   ```env
   SENTRY_DSN=https://...@sentry.io/...
   ```

---

### 2. 💳 Configurar Stripe en Modo Live (CRÍTICO)

**Pasos:**

1. **Ir a Stripe Dashboard:**
   - https://dashboard.stripe.com
   - Cambiar de "Test mode" a **"Live mode"**

2. **Obtener API Keys:**
   - Developers → API keys
   - Copiar `Publishable key` (pk_live_...)
   - Copiar `Secret key` (sk_live_...)

3. **Configurar Webhook de Producción:**
   - Developers → Webhooks
   - Add endpoint
   - URL: `https://tu-dominio.com/api/stripe/webhook`
   - Eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copiar `Signing secret` (whsec_...)

4. **Actualizar variables de entorno:**
   ```env
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

---

### 3. 📧 Configurar Resend para Emails (CRÍTICO)

**Pasos:**

1. **Crear cuenta en Resend:**
   - https://resend.com
   - Crear cuenta y verificar email

2. **Verificar dominio:**
   - Settings → Domains
   - Agregar tu dominio (ej: sorteohub.com)
   - Configurar DNS records (SPF, DKIM)
   - Esperar verificación

3. **Obtener API Key:**
   - API Keys → Create API Key
   - Copiar API key (re_...)

4. **Actualizar variables de entorno:**
   ```env
   RESEND_API_KEY=re_...
   FROM_EMAIL=SorteoHub <noreply@tu-dominio.com>
   ```

---

### 4. 🌐 Configurar Dominio y SSL/HTTPS (CRÍTICO)

**Opciones:**

**Opción A: Let's Encrypt (Gratis)**
```bash
# Instalar certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Renovación automática
sudo certbot renew --dry-run
```

**Opción B: Cloudflare (Gratis)**
- Agregar dominio a Cloudflare
- Configurar DNS
- Activar SSL/TLS (modo Full)

**Opción C: Proveedor de hosting**
- Muchos proveedores (Vercel, Netlify, Railway) incluyen SSL automático

---

### 5. 🖥️ Configurar Servidor de Producción

**Opciones de Hosting:**

#### Opción A: Railway (Recomendado - Fácil)
1. Crear cuenta en https://railway.app
2. New Project → Deploy from GitHub
3. Conectar repositorio
4. Configurar variables de entorno
5. Deploy automático

#### Opción B: DigitalOcean (Más control)
1. Crear Droplet (Ubuntu 22.04)
2. Instalar Node.js, PostgreSQL, Nginx
3. Configurar PM2
4. Configurar Nginx como reverse proxy
5. Configurar SSL con Let's Encrypt

#### Opción C: Vercel/Netlify (Solo Frontend)
- Backend en Railway/Render
- Frontend en Vercel/Netlify

**Configuración mínima del servidor:**
```bash
# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2
sudo npm install -g pm2

# Instalar PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Configurar firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

---

### 6. 📱 Configurar Frontend de Producción

**Archivo:** `.env.production` (en la raíz del frontend)

```env
REACT_APP_API_URL=https://api.tu-dominio.com
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_...
REACT_APP_SOCKET_URL=https://api.tu-dominio.com
```

**Build de producción:**
```bash
npm run build
# Subir carpeta 'build' al hosting
```

---

### 7. 🔍 Configurar Sentry (Monitoreo de Errores)

**Pasos:**

1. **Crear cuenta en Sentry:**
   - https://sentry.io
   - Crear proyecto (Node.js)

2. **Obtener DSN:**
   - Settings → Client Keys (DSN)
   - Copiar DSN

3. **Actualizar variables de entorno:**
   ```env
   SENTRY_DSN=https://...@sentry.io/...
   ```

4. **Ya está configurado en el código** ✅

---

### 8. ✅ Checklist Pre-Deployment

Antes de hacer deploy, verificar:

- [ ] Base de datos creada y accesible
- [ ] Variables de entorno configuradas
- [ ] Stripe en modo Live configurado
- [ ] Webhook de Stripe configurado
- [ ] Resend configurado y dominio verificado
- [ ] SSL/HTTPS configurado
- [ ] Dominio apuntando al servidor
- [ ] Sentry configurado (opcional pero recomendado)
- [ ] Backups de BD configurados
- [ ] Logs configurados

---

### 9. 🚀 Deploy Inicial

**Backend:**
```bash
# En el servidor
cd /ruta/a/tu/proyecto
git pull origin main
npm install --production
npm run build  # Si hay build step
pm2 start server.js --name sorteohub-backend
pm2 save
pm2 startup  # Para iniciar automáticamente
```

**Frontend:**
```bash
# Build local o en CI/CD
npm run build
# Subir carpeta 'build' al hosting
```

---

### 10. 🧪 Testing Post-Deployment

Después del deploy, probar:

- [ ] Acceso a la aplicación (https://tu-dominio.com)
- [ ] Login/Registro funciona
- [ ] Crear rifa funciona
- [ ] Participar en rifa funciona
- [ ] Pago con Stripe funciona (usar tarjeta de prueba real)
- [ ] Webhook de Stripe funciona
- [ ] Emails se envían correctamente
- [ ] Notificaciones funcionan
- [ ] Publicar ganador funciona

---

## 🎯 Prioridades Inmediatas (Hacer HOY)

1. ✅ **Base de datos** - COMPLETADO
2. 🔐 **Variables de entorno** - SIGUIENTE
3. 💳 **Stripe Live** - CRÍTICO
4. 📧 **Resend** - CRÍTICO
5. 🌐 **Dominio y SSL** - CRÍTICO

---

## 📝 Notas Importantes

- **NO usar las mismas claves de desarrollo en producción**
- **Generar JWT_SECRET nuevo y seguro**
- **Verificar dominio en Resend antes de enviar emails**
- **Probar Stripe con tarjetas de prueba reales antes de lanzar**
- **Configurar backups automáticos de la BD**
- **Monitorear logs después del deploy**

---

## 🆘 ¿Necesitas Ayuda?

Si necesitas ayuda con algún paso específico, dime cuál y te ayudo a configurarlo.

