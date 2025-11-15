# 🎫 SorteoHub

<div align="center">

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![PostgreSQL](https://img.shields.io/badge/postgresql-%3E%3D12.0.0-blue.svg)
![React](https://img.shields.io/badge/react-18.2.0-61dafb.svg)
![Stripe](https://img.shields.io/badge/stripe-integrated-635bff.svg)

**Plataforma profesional para crear, gestionar y vender rifas digitales sin fines de lucro**

[Características](#-características-principales) • [Instalación](#-instalación-rápida) • [Documentación](#-documentación) • [Stack Tecnológico](#-stack-tecnológico)

</div>

---

## 📖 Descripción

**SorteoHub** es una plataforma digital completa que permite a organizadores crear, gestionar y vender rifas por internet de manera automatizada y transparente. Diseñada específicamente para sorteos sin fines de lucro, ofrece control total sobre ventas, validación de tickets en tiempo real, selección transparente de ganadores y gestión completa de participantes y pagos.

### 🎯 ¿Para quién es SorteoHub?

- **Organizadores de rifas** que buscan profesionalizar sus sorteos
- **Negocios** que quieren monetizar productos o servicios
- **Eventos especiales** que requieren alcance geográfico ilimitado
- **Anunciantes** que buscan llegar a miles de participantes

---

## ✨ Características Principales

### 🎲 Gestión de Rifas
- ✅ Crear, editar y eliminar rifas (soft delete)
- ✅ Soporte para rifas numéricas y alfabéticas
- ✅ Elementos personalizados
- ✅ Múltiples premios con imágenes
- ✅ Control de alcance (local, estatal, nacional)
- ✅ Gestión de envíos

### 💳 Pagos y Transacciones
- ✅ **Pagos seguros con Stripe** (Tarjeta, OXXO)
- ✅ Procesamiento automático de pagos
- ✅ Comisiones configurables por plan
- ✅ Transferencias automáticas a creadores
- ✅ Historial de transacciones

### 👥 Participación
- ✅ Reserva temporal de números
- ✅ Validación en tiempo real
- ✅ Consulta de números ganadores
- ✅ Sistema de calificaciones
- ✅ Notificaciones por WhatsApp

### 📊 Dashboard y Analytics
- ✅ Dashboard completo para creadores
- ✅ Estadísticas detalladas (ventas, recaudación, participantes)
- ✅ Portal público con búsqueda y filtros avanzados
- ✅ Vista de tarjetas y tabla
- ✅ Paginación y ordenamiento

### 📣 Sistema de Anunciantes
- ✅ Portal completo de anunciantes
- ✅ Gestión de anuncios y cupones
- ✅ Sistema de créditos con Stripe
- ✅ Estadísticas de clicks y conversiones
- ✅ Perfil de negocio personalizable

### 💼 Planes de Creadores
- ✅ **Free**: $0/mes - 1 rifa activa, 6.5% comisión
- ✅ **Pro**: $29/mes - 10 rifas activas, 5.5% comisión
- ✅ **Business**: $49/mes - Rifas ilimitadas, 4.5% comisión

### 🌐 Internacionalización
- ✅ Soporte multi-idioma (Español/English)
- ✅ Detección automática de idioma
- ✅ Persistencia de preferencias

### 🔒 Seguridad
- ✅ Autenticación JWT
- ✅ Rate limiting por endpoint
- ✅ CSRF protection
- ✅ Sanitización de inputs
- ✅ Validación de archivos
- ✅ Headers de seguridad (Helmet)

### 🧪 Testing
- ✅ Suite de tests automatizados (Jest + Supertest)
- ✅ Base de datos de testing separada
- ✅ Coverage reports
- ✅ Tests de integración

### 📱 Progressive Web App
- ✅ Instalable en dispositivos móviles
- ✅ Service Worker para offline
- ✅ Optimizado para móviles

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 18.2.0** - Biblioteca UI
- **React Router 7.9.4** - Enrutamiento
- **React i18next** - Internacionalización
- **Stripe React** - Integración de pagos
- **SweetAlert2** - Alertas modernas
- **React Helmet Async** - SEO

### Backend
- **Node.js** - Runtime
- **Express 5.1.0** - Framework web
- **PostgreSQL** - Base de datos relacional
- **JWT** - Autenticación
- **Stripe** - Procesamiento de pagos
- **bcryptjs** - Encriptación de passwords
- **Multer** - Manejo de archivos
- **Winston** - Logging estructurado
- **Sentry** - Error tracking

### DevOps & Testing
- **Jest** - Framework de testing
- **Supertest** - Testing de APIs
- **Nodemon** - Desarrollo
- **Helmet** - Seguridad HTTP
- **CORS** - Cross-Origin Resource Sharing

---

## 🚀 Instalación Rápida

### Prerrequisitos

- **Node.js** >= 16.0.0
- **PostgreSQL** >= 12.0.0
- **npm** o **yarn**

### 1. Clonar el Repositorio

```bash
git clone https://github.com/jhleal91/rifas-app.git
cd rifas-app
```

### 2. Instalar Dependencias

```bash
# Frontend
npm install

# Backend
cd backend
npm install
cd ..
```

### 3. Configurar Base de Datos

```bash
# Crear base de datos
createdb rifas_digital

# Ejecutar migraciones (si aplica)
psql -d rifas_digital -f backend/migrations/init.sql
```

### 4. Configurar Variables de Entorno

**Backend** (`backend/config.env`):
```env
# Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rifas_digital
DB_USER=postgres
DB_PASSWORD=tu_password

# Servidor
PORT=5001
NODE_ENV=development

# Seguridad
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# CORS
FRONTEND_URL=http://localhost:3000
```

**Frontend** (`.env`):
```env
REACT_APP_API_BASE=http://localhost:5001/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 5. Ejecutar la Aplicación

```bash
# Terminal 1: Backend (puerto 5001)
cd backend
npm start

# Terminal 2: Frontend (puerto 3000)
npm start
```

La aplicación estará disponible en:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001/api

---

## 📁 Estructura del Proyecto

```
rifas-app/
├── backend/                 # API Node.js/Express
│   ├── routes/              # Endpoints de la API
│   │   ├── rifas.js        # Gestión de rifas
│   │   ├── auth.js         # Autenticación
│   │   ├── stripe.js       # Pagos Stripe
│   │   └── advertisers.js  # Sistema de anunciantes
│   ├── services/           # Servicios (Stripe, etc.)
│   ├── middleware/         # Middlewares (auth, rate limiting, etc.)
│   ├── migrations/         # Migraciones SQL
│   ├── tests/              # Tests automatizados
│   ├── config/             # Configuración (DB, logger, Sentry)
│   └── server.js           # Punto de entrada del servidor
│
├── src/                     # Frontend React
│   ├── components/         # Componentes React
│   │   ├── landing/        # Componentes de landing page
│   │   ├── modals/         # Modales (login, registro)
│   │   └── ...
│   ├── contexts/           # Context API (Auth, Rifas)
│   ├── services/           # Servicios frontend (API, analytics)
│   ├── utils/              # Utilidades (validación, swal)
│   ├── locales/            # Traducciones (ES/EN)
│   └── App.js              # Componente principal
│
├── public/                  # Archivos estáticos
│   └── sw.js               # Service Worker
│
└── docs/                    # Documentación
    ├── STRIPE_DOCUMENTATION.md
    ├── GUIA_TESTING.md
    └── ...
```

---

## 📚 Documentación

### 🚀 Inicio Rápido
- [Configuración del Proyecto](#-instalación-rápida)
- [Estructura del Proyecto](#-estructura-del-proyecto)

### 📖 Documentación Técnica
- [💳 Stripe](STRIPE_DOCUMENTATION.md) - Integración de pagos con Stripe
- [🧪 Testing](GUIA_TESTING.md) - Guía completa de testing
- [🗄️ Base de Datos](DATABASE_DOCUMENTATION.md) - Esquema y documentación de BD
- [🔒 Seguridad](SECURITY_SETUP.md) - Configuración de seguridad
- [📱 PWA](PWA_DOCUMENTATION.md) - Progressive Web App
- [🌐 i18n](I18N_GUIDE.md) - Guía de internacionalización

### 💡 Mejoras y Planes
- [💡 Ideas de Mejoras](IDEAS_MEJORAS_SORTEOHUB.md) - Lista de mejoras sugeridas
- [💰 Análisis de Comisiones](ANALISIS_COMISIONES_STRIPE.md) - Cálculo de comisiones y costos
- [📊 Revisión de Mercado](REVISION_MERCADO_SORTEOHUB.md) - Análisis de mercado y competencia
- [🗺️ Roadmap](ROADMAP_MEJORAS_PRIORITARIAS.md) - Mejoras prioritarias

### 🛠️ Utilidades
- [🗑️ Limpieza de BD](DATABASE_CLEANUP.md) - Scripts para limpiar datos

---

## 🧪 Testing

```bash
# Configurar base de datos de testing
cd backend
npm run test:setup:complete

# Ejecutar tests
npm test

# Tests en modo watch
npm run test:watch

# Coverage report
npm run test:coverage
```

Ver [GUIA_TESTING.md](GUIA_TESTING.md) para más detalles.

---

## 🚢 Scripts Disponibles

### Frontend
```bash
npm start          # Iniciar servidor de desarrollo
npm run build      # Build para producción
npm test           # Ejecutar tests
```

### Backend
```bash
npm start          # Iniciar servidor
npm run dev         # Desarrollo con nodemon
npm test           # Ejecutar tests
npm run test:coverage  # Coverage report
```

---

## 🔐 Seguridad

- ✅ Autenticación JWT con tokens seguros
- ✅ Rate limiting por tipo de endpoint
- ✅ CSRF protection en formularios
- ✅ Sanitización de inputs (SQL injection prevention)
- ✅ Validación estricta de archivos (tipo, tamaño)
- ✅ Headers de seguridad (Helmet)
- ✅ CORS configurado correctamente
- ✅ Password hashing con bcrypt

---

## 📊 Estado del Proyecto

**Versión Actual**: 0.1.0  
**Estado**: 🟢 En desarrollo activo  
**Cobertura de Tests**: ~60%  
**Listo para Producción**: ~85%

### ✅ Completado
- Sistema completo de rifas
- Integración Stripe
- Dashboard de anunciantes
- Planes de creadores
- Internacionalización (ES/EN)
- Testing básico
- Seguridad básica

### 🚧 En Progreso
- Optimización de performance
- Mejoras de UX
- Documentación adicional

### 📋 Próximas Mejoras
Ver [ROADMAP_MEJORAS_PRIORITARIAS.md](ROADMAP_MEJORAS_PRIORITARIAS.md)

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Licencia

Copyright © 2025 AureLA Solutions. Todos los derechos reservados.

Este proyecto es propietario y no está disponible bajo una licencia de código abierto.

---

## 📞 Soporte

Para soporte técnico, contacta a:
- **Email**: contacto@aurelasolutions.com
- **Repositorio**: [GitHub Issues](https://github.com/jhleal91/rifas-app/issues)

---

## 🙏 Agradecimientos

- [Stripe](https://stripe.com) - Procesamiento de pagos
- [React](https://reactjs.org) - Framework UI
- [PostgreSQL](https://www.postgresql.org) - Base de datos
- Todos los contribuidores y usuarios de SorteoHub

---

<div align="center">

**Hecho con ❤️ por AureLA Solutions**

[⭐ Star en GitHub](https://github.com/jhleal91/rifas-app) • [📖 Documentación](#-documentación) • [🐛 Reportar Bug](https://github.com/jhleal91/rifas-app/issues)

</div>
