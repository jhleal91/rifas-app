# 🎯 Próximos Pasos para Producción - SorteoHub

## ⚠️ ACCIÓN INMEDIATA REQUERIDA

### 🔴 CRÍTICO - Hacer AHORA (antes de cualquier deployment)

#### 1. Proteger Archivos Sensibles en Git
**PROBLEMA DETECTADO**: Tu `.gitignore` es muy básico y no protege archivos sensibles.

**ACCIÓN:**
```bash
# Actualizar .gitignore para incluir:
- .env
- .env.production
- .env.local
- backend/config.env
- backend/.env
- *.log
- node_modules/
- build/
- .DS_Store
```

**⚠️ IMPORTANTE**: Tu `backend/config.env` contiene passwords en texto plano. Si ya está en Git, necesitas:
1. Cambiar el password inmediatamente
2. Remover el archivo del historial de Git
3. Agregar a `.gitignore`

#### 2. Verificar que NO hay Secrets en el Repositorio
```bash
# Buscar posibles secrets en el código
grep -r "Master123" .
grep -r "sk_test_" .
grep -r "sk_live_" .
grep -r "re_D1jQkXHX" .
```

Si encuentras algo, **cámbialo inmediatamente** y remueve del historial de Git.

---

## 📋 CHECKLIST PRIORIZADO

### 🔴 FASE 1: Seguridad y Preparación (HOY - 2 horas)

#### Paso 1.1: Proteger Secrets (15 min)
- [ ] Actualizar `.gitignore` (ver abajo)
- [ ] Verificar que `config.env` NO esté en Git
- [ ] Si está en Git, remover del historial
- [ ] Cambiar todos los passwords/keys que estén expuestos

#### Paso 1.2: Generar Secretos Seguros (10 min)
```bash
# JWT_SECRET (mínimo 32 caracteres)
openssl rand -base64 32

# DB_PASSWORD
openssl rand -base64 24

# Guardar estos valores en un lugar SEGURO (password manager)
```

#### Paso 1.3: Configurar Stripe Producción (30 min)
- [ ] Ir a https://dashboard.stripe.com
- [ ] Activar modo "Live" (toggle superior derecha)
- [ ] Obtener claves de producción:
  - `STRIPE_SECRET_KEY` (sk_live_...)
  - `STRIPE_PUBLISHABLE_KEY` (pk_live_...)
- [ ] Configurar Webhook:
  - URL: `https://api.sorteohub.com/api/stripe/webhook`
  - Eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`
  - Copiar `STRIPE_WEBHOOK_SECRET` (whsec_...)

#### Paso 1.4: Crear Archivos de Configuración (15 min)
- [ ] Crear `.env.production` en raíz (usar `.env.example` como base)
- [ ] Crear `backend/config.env.production` (copiar de `config.env.example`)
- [ ] Configurar TODAS las variables con valores de producción

---

### 🟡 FASE 2: Servidor y Base de Datos (Mañana - 4 horas)

#### Paso 2.1: Provisionar Servidor (1 hora)
- [ ] Elegir proveedor (AWS, DigitalOcean, Linode, etc.)
- [ ] Crear instancia (mínimo 2GB RAM, Ubuntu 20.04+)
- [ ] Configurar firewall (solo puertos 22, 80, 443)
- [ ] Configurar acceso SSH con keys

#### Paso 2.2: Instalar Dependencias (1 hora)
```bash
# En el servidor:
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql postgresql-contrib nginx
sudo npm install -g pm2
sudo apt install certbot python3-certbot-nginx -y
```

#### Paso 2.3: Configurar Base de Datos (30 min)
```bash
# Crear usuario y BD
sudo -u postgres psql
CREATE USER rifas_user_prod WITH PASSWORD 'TU_PASSWORD_SEGURO';
CREATE DATABASE rifas_digital_prod OWNER rifas_user_prod;
GRANT ALL PRIVILEGES ON DATABASE rifas_digital_prod TO rifas_user_prod;
\q

# Ejecutar migraciones
psql -U rifas_user_prod -d rifas_digital_prod -f backend/migrations/init.sql
```

#### Paso 2.4: Configurar Backups (30 min)
- [ ] Crear script de backup (ver `DEPLOYMENT_GUIDE.md`)
- [ ] Configurar crontab para backups diarios
- [ ] Probar restauración de backup

---

### 🟢 FASE 3: Deployment (Día 3 - 3 horas)

#### Paso 3.1: Clonar y Configurar Código (30 min)
```bash
cd /var/www
sudo git clone https://github.com/jhleal91/rifas-app.git sorteohub
cd sorteohub
npm install
cd backend && npm install --production && cd ..
```

#### Paso 3.2: Configurar Variables de Entorno (15 min)
- [ ] Copiar `.env.production` a servidor
- [ ] Copiar `backend/config.env.production` a servidor
- [ ] Verificar que todas las variables estén configuradas

#### Paso 3.3: Build de Producción (15 min)
```bash
npm run build
# Verificar que build/ se creó correctamente
ls -la build/
```

#### Paso 3.4: Configurar PM2 (15 min)
```bash
cd backend
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
pm2 status
```

#### Paso 3.5: Configurar Nginx (1 hora)
- [ ] Crear configuración de Nginx (ver `DEPLOYMENT_GUIDE.md`)
- [ ] Configurar SSL con Let's Encrypt
- [ ] Verificar que HTTPS funciona

---

### 🔵 FASE 4: Testing y Monitoreo (Día 4 - 4 horas)

#### Paso 4.1: Testing Funcional (2 horas)
- [ ] Registro y login
- [ ] Crear rifa
- [ ] Participar en rifa
- [ ] Pago con Stripe (modo producción)
- [ ] Notificaciones
- [ ] Cambio de idioma
- [ ] Portal de anunciantes

#### Paso 4.2: Testing Cross-Browser (1 hora)
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Móvil (iOS/Android)

#### Paso 4.3: Configurar Monitoreo (1 hora)
- [ ] Configurar Sentry
- [ ] Verificar que los errores se capturen
- [ ] Configurar alertas
- [ ] Verificar logs de PM2

---

## 🚨 PROBLEMAS CRÍTICOS DETECTADOS

### 1. `.gitignore` Incompleto
**Riesgo**: Archivos sensibles pueden subirse a Git.

**Solución**: Actualizar `.gitignore` (ver abajo).

### 2. Password en `config.env`
**Riesgo**: Password `Master123*` está en texto plano y puede estar en Git.

**Solución**: 
- Cambiar password inmediatamente
- Remover del historial de Git si está commitado
- Usar password seguro generado

### 3. API Keys Expuestas
**Riesgo**: Claves de Stripe y Resend pueden estar en el repositorio.

**Solución**:
- Verificar que NO estén en Git
- Si están, revocar y generar nuevas
- Usar solo variables de entorno

---

## 📝 ACCIONES INMEDIATAS

### 1. Actualizar `.gitignore`
Agregar al final de `.gitignore`:

```
# Environment variables
.env
.env.local
.env.production
.env.development
.env.test
*.env

# Backend config
backend/config.env
backend/.env
backend/config.env.production

# Logs
*.log
logs/
backend/logs/

# Build
build/
dist/

# Dependencies
node_modules/
backend/node_modules/

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Temporary files
*.tmp
*.temp
.cache/

# Backups
*.sql
backups/
backend/backups/
```

### 2. Verificar Estado de Git
```bash
# Ver qué archivos están siendo trackeados
git status

# Ver si config.env está en Git
git ls-files | grep config.env

# Si está, removerlo (pero mantenerlo localmente)
git rm --cached backend/config.env
git commit -m "Remove sensitive config.env from git"
```

### 3. Cambiar Secrets Expuestos
Si `config.env` está en Git o tiene passwords débiles:
- [ ] Cambiar `DB_PASSWORD`
- [ ] Cambiar `JWT_SECRET`
- [ ] Revocar y regenerar `RESEND_API_KEY` si está expuesto
- [ ] Revocar y regenerar claves de Stripe si están expuestas

---

## ✅ VERIFICACIÓN PRE-DEPLOYMENT

Antes de hacer deployment, verifica:

```bash
# 1. No hay secrets en el código
grep -r "Master123" . --exclude-dir=node_modules
grep -r "sk_test_51STPDgABU839iIC0" . --exclude-dir=node_modules
grep -r "re_D1jQkXHX" . --exclude-dir=node_modules

# 2. .gitignore está actualizado
cat .gitignore | grep -E "(\.env|config\.env)"

# 3. Build funciona
npm run build

# 4. Tests pasan
cd backend && npm test && cd ..
```

---

## 🎯 ORDEN DE EJECUCIÓN RECOMENDADO

### HOY (2-3 horas)
1. ✅ Actualizar `.gitignore`
2. ✅ Verificar y limpiar secrets en Git
3. ✅ Generar secretos seguros
4. ✅ Configurar Stripe producción
5. ✅ Crear archivos `.env.production`

### MAÑANA (4-5 horas)
1. Provisionar servidor
2. Instalar dependencias
3. Configurar base de datos
4. Configurar backups

### DÍA 3 (3-4 horas)
1. Deployment del código
2. Configurar PM2
3. Configurar Nginx y SSL

### DÍA 4 (4-5 horas)
1. Testing completo
2. Configurar monitoreo
3. Verificación final
4. **LANZAMIENTO** 🚀

---

## 📞 Si Necesitas Ayuda

- **Git Security**: Ver `SECURITY_SETUP.md`
- **Deployment**: Ver `DEPLOYMENT_GUIDE.md`
- **Checklist**: Ver `CHECKLIST_PRODUCCION.md`
- **Plan Completo**: Ver `PLAN_PRODUCCION.md`

---

## ⚡ Quick Start

```bash
# 1. Actualizar .gitignore (CRÍTICO)
# (Ver sección arriba)

# 2. Generar secretos
openssl rand -base64 32  # JWT_SECRET
openssl rand -base64 24  # DB_PASSWORD

# 3. Configurar Stripe
# Ir a https://dashboard.stripe.com → Activar Live mode

# 4. Crear archivos de producción
cp .env.example .env.production
cp backend/config.env.example backend/config.env.production

# 5. Editar con valores de producción
nano .env.production
nano backend/config.env.production
```

---

**¡Empieza con la Fase 1 HOY para proteger tu aplicación! 🔒**

