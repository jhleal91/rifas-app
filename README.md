# 🎫 SorteoHub

Plataforma profesional para crear, gestionar y vender rifas por internet de manera automatizada y transparente.

## 📋 Documentación

### 🚀 Inicio Rápido
- [Configuración del Proyecto](#configuración)
- [Estructura del Proyecto](#estructura)

### 📚 Documentación Técnica
- [💳 Stripe](STRIPE_DOCUMENTATION.md) - Integración de pagos con Stripe
- [🧪 Testing](GUIA_TESTING.md) - Guía completa de testing
- [🗄️ Base de Datos](DATABASE_DOCUMENTATION.md) - Esquema y documentación de BD
- [🔒 Seguridad](SECURITY_SETUP.md) - Configuración de seguridad
- [📱 PWA](PWA_DOCUMENTATION.md) - Progressive Web App

### 💡 Mejoras y Planes
- [💡 Ideas de Mejoras](IDEAS_MEJORAS_SORTEOHUB.md) - Lista de mejoras sugeridas
- [💰 Análisis de Comisiones](ANALISIS_COMISIONES_STRIPE.md) - Cálculo de comisiones y costos
- [📊 Revisión de Mercado](REVISION_MERCADO_SORTEOHUB.md) - Análisis de mercado y competencia

### 🛠️ Utilidades
- [🗑️ Limpieza de BD](DATABASE_CLEANUP.md) - Scripts para limpiar datos

---

## 🚀 Configuración

### Requisitos
- Node.js 16+
- PostgreSQL 12+
- npm o yarn

### Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd rifas-app

# Instalar dependencias frontend
npm install

# Instalar dependencias backend
cd backend
npm install
```

### Variables de Entorno

**Backend** (`backend/config.env`):
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rifas_digital
DB_USER=postgres
DB_PASSWORD=tu_password

JWT_SECRET=tu_secret_key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Frontend** (`.env`):
```env
REACT_APP_API_BASE=http://localhost:5001/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Ejecutar

```bash
# Backend (puerto 5001)
cd backend
npm start

# Frontend (puerto 3000)
npm start
```

---

## 📁 Estructura del Proyecto

```
rifas-app/
├── backend/              # API Node.js/Express
│   ├── routes/         # Endpoints de la API
│   ├── services/       # Servicios (Stripe, etc.)
│   ├── middleware/     # Middlewares (auth, rate limiting, etc.)
│   ├── migrations/     # Migraciones SQL
│   ├── tests/          # Tests automatizados
│   └── config/         # Configuración (DB, logger, etc.)
│
├── src/                 # Frontend React
│   ├── components/     # Componentes React
│   ├── contexts/       # Context API
│   ├── services/       # Servicios frontend
│   └── utils/         # Utilidades
│
└── public/             # Archivos estáticos
```

---

## 🎯 Características Principales

- ✅ Sistema completo de rifas (crear, editar, eliminar)
- ✅ Participación en rifas con reservas temporales
- ✅ Pagos seguros con Stripe (Tarjeta, OXXO)
- ✅ Dashboard de administración
- ✅ Portal público de rifas con búsqueda y filtros
- ✅ Sistema de anunciantes completo
- ✅ Planes de creadores (Free, Pro, Business)
- ✅ Estadísticas y reportes

---

## 📝 Licencia

Copyright © 2025 AureLA Solutions. Todos los derechos reservados.

---

## 📞 Soporte

Para soporte técnico, contacta a: contacto@aurelasolutions.com

