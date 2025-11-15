const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config({ path: './config.env' });

// Inicializar Sentry ANTES de cualquier otra importación
const { initSentry, sentryMiddleware, sentryErrorHandler } = require('./config/sentry');
initSentry();

// Importar logger y alertas
const logger = require('./config/logger');
const { alerts } = require('./config/alerts');

// Importar configuración de base de datos
const { testConnection } = require('./config/database');

// Importar middlewares de seguridad
const { 
  getCorsConfig, 
  validateJWTSecret, 
  validatePayloadSize,
  preventClickjacking,
  preventMimeSniffing,
  validateContentType
} = require('./middleware/security');

const {
  authRateLimiter,
  createContentRateLimiter,
  uploadRateLimiter,
  paymentRateLimiter,
  apiRateLimiter,
  publicRateLimiter,
  resetRateLimitStore,
  getRateLimitStats
} = require('./middleware/rateLimiter');

// Importar rutas
const authRoutes = require('./routes/auth');
const rifasRoutes = require('./routes/rifas');
const participantesRoutes = require('./routes/participantes');
const catalogosRoutes = require('./routes/catalogos');
const advertisersRoutes = require('./routes/advertisers');
const adsPublicRoutes = require('./routes/adsPublic');
const cuponesPublicRoutes = require('./routes/advertisers/cuponesPublic');
const ratingsRoutes = require('./routes/ratings');
const creatorPlansRoutes = require('./routes/creatorPlans');
const uploadRoutes = require('./routes/upload');
const stripeRoutes = require('./routes/stripe');

// Importar scheduler
const { startScheduler } = require('./scheduler/emailScheduler');

const app = express();
const PORT = process.env.PORT || 5000;

// Validar JWT_SECRET al iniciar (solo en producción)
if (process.env.NODE_ENV === 'production') {
  try {
    validateJWTSecret();
    logger.info('JWT_SECRET validado correctamente');
  } catch (error) {
    logger.error(error.message);
    logger.error('CRÍTICO: No se puede iniciar el servidor sin un JWT_SECRET válido');
    process.exit(1);
  }
}

// Middleware de seguridad Helmet (mejorado)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
    preload: true
  }
}));

// Middleware de seguridad adicional
app.use(preventClickjacking);
app.use(preventMimeSniffing);
app.use(validateContentType);
app.use(validatePayloadSize('10mb'));

// Middleware CORS (configurado según entorno)
const corsConfig = getCorsConfig();
app.use(cors(corsConfig));

// Logging de CORS
if (process.env.NODE_ENV === 'development') {
  logger.info('CORS configurado para desarrollo - permitiendo localhost');
} else {
  logger.info(`CORS configurado para producción - solo permitiendo: ${process.env.FRONTEND_URL || 'NO CONFIGURADO'}`);
  if (!process.env.FRONTEND_URL) {
    logger.warn('ADVERTENCIA: FRONTEND_URL no está configurado. CORS puede no funcionar correctamente.');
  }
}

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos de uploads
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware de logging
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Rutas de la API con rate limiting

// Endpoints de autenticación (rate limiting estricto - protección contra fuerza bruta)
app.use('/api/auth', authRateLimiter, authRoutes);

// Endpoints de rifas - Middleware inteligente que separa lectura y escritura
app.use('/api/rifas', (req, res, next) => {
  // Endpoints de lectura (GET) - rate limiting más permisivo
  if (req.method === 'GET' && req.path.includes('/verificar')) {
    return publicRateLimiter(req, res, next);
  }
  if (req.method === 'GET') {
    return apiRateLimiter(req, res, next);
  }
  // Endpoints de creación/modificación (POST, PUT, DELETE) - rate limiting más estricto
  return createContentRateLimiter(req, res, next);
}, rifasRoutes);
app.use('/api/participantes', createContentRateLimiter, participantesRoutes);

// Endpoints de anunciantes (rate limiting estándar)
app.use('/api/advertisers', apiRateLimiter, advertisersRoutes);

// Endpoints públicos (rate limiting general)
app.use('/api/ads', publicRateLimiter, adsPublicRoutes);
app.use('/api/cupones', publicRateLimiter, cuponesPublicRoutes); // Ruta pública para cupones

// Endpoints generales (rate limiting estándar)
app.use('/api/catalogos', apiRateLimiter, catalogosRoutes);
app.use('/api/ratings', apiRateLimiter, ratingsRoutes);
app.use('/api/creator-plans', apiRateLimiter, creatorPlansRoutes);
app.use('/api/upload', uploadRateLimiter, uploadRoutes);
app.use('/api/stripe', paymentRateLimiter, stripeRoutes);

// Ruta de administración para desarrollo - Resetear rate limit
if (process.env.NODE_ENV === 'development') {
  app.post('/api/admin/reset-rate-limit', (req, res) => {
    try {
      resetRateLimitStore();
      res.json({
        success: true,
        message: 'Rate limit store reseteado exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error reseteando rate limit',
        message: error.message
      });
    }
  });
  
  // También permitir GET para facilitar el reset
  app.get('/api/admin/reset-rate-limit', (req, res) => {
    try {
      resetRateLimitStore();
      res.json({
        success: true,
        message: 'Rate limit store reseteado exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error reseteando rate limit',
        message: error.message
      });
    }
  });

  // Ruta para ver estadísticas del rate limit (solo desarrollo)
  app.get('/api/admin/rate-limit-stats', (req, res) => {
    try {
      const stats = getRateLimitStats();
      res.json({
        success: true,
        stats
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error obteniendo estadísticas',
        message: error.message
      });
    }
  });
}

// Ruta de salud del servidor
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0'
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'API de Rifas Digital',
    version: process.env.APP_VERSION || '1.0.0',
    endpoints: {
      auth: '/api/auth',
      rifas: '/api/rifas',
      participantes: '/api/participantes',
      catalogos: '/api/catalogos',
      advertisers: '/api/advertisers',
      health: '/api/health'
    },
    documentation: 'Ver documentación en /docs'
  });
});

// Middleware para manejar rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    message: `La ruta ${req.method} ${req.originalUrl} no existe`,
    availableEndpoints: [
      'GET /',
      'GET /api/health',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/auth/guest',
      'GET /api/auth/me',
      'GET /api/rifas',
      'GET /api/rifas/my',
      'GET /api/rifas/:id',
      'POST /api/rifas',
      'PUT /api/rifas/:id',
      'PUT /api/rifas/:id/formas-pago',
      'DELETE /api/rifas/:id',
      'GET /api/participantes/:rifaId',
      'POST /api/participantes/:rifaId',
      'PUT /api/participantes/:participanteId/validar',
      'PUT /api/participantes/:participanteId/rechazar',
      'GET /api/participantes/:rifaId/elementos',
      'POST /api/advertisers/register',
      'POST /api/advertisers/login',
      'GET /api/advertisers/me',
      'POST /api/ratings',
      'GET /api/ratings/rifa/:rifaId',
      'GET /api/ratings/creador/:creadorId'
      , 'GET /api/creator-plans'
      , 'GET /api/creator-plans/my'
    ]
  });
});

// Sentry error handler (debe ir antes del error handler final)
sentryErrorHandler(app);

// Middleware para manejar errores
app.use((error, req, res, next) => {
  logger.error('Error no manejado:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });
  
  // Capturar en Sentry
  const { captureException } = require('./config/sentry');
  captureException(error, {
    path: req.path,
    method: req.method,
    ip: req.ip
  });
  
  res.status(error.status || 500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Algo salió mal',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
});

// Función para iniciar el servidor
const startServer = async () => {
  try {
    logger.info('Iniciando servidor...');
    
    // Probar conexión a la base de datos con timeout
    logger.info('Probando conexión a la base de datos...');
    await Promise.race([
      testConnection(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout de conexión a BD')), 10000)
      )
    ]);
    logger.info('Conexión a base de datos exitosa');
    
    // Iniciar servidor
    server = app.listen(PORT, () => {
      logger.info('Servidor iniciado exitosamente', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        url: `http://localhost:${PORT}`
      });
      
      // Enviar alerta de inicio
      alerts.serverStarted(PORT, process.env.NODE_ENV || 'development');
      
      // Iniciar scheduler de emails
      try {
        startScheduler();
        logger.info('Scheduler de emails iniciado');
      } catch (schedulerError) {
        logger.warn('Error iniciando scheduler:', { error: schedulerError.message });
        // No detener el servidor por error del scheduler
      }
    });

    // Configurar timeouts del servidor
    server.keepAliveTimeout = 65000; // 65 segundos
    server.headersTimeout = 66000;   // 66 segundos
    
    // Manejar errores del servidor
    server.on('error', (error) => {
      logger.error('Error del servidor:', { error: error.message, code: error.code });
      const { captureException } = require('./config/sentry');
      captureException(error);
      
      if (error.code === 'EADDRINUSE') {
        logger.error(`Puerto ${PORT} ya está en uso`);
        process.exit(1);
      }
    });

    // Manejar conexiones cerradas inesperadamente
    server.on('close', () => {
      logger.info('Servidor cerrado');
    });

  } catch (error) {
    logger.error('Error crítico iniciando servidor:', {
      error: error.message,
      stack: error.stack
    });
    const { captureException } = require('./config/sentry');
    captureException(error);
    process.exit(1);
  }
};

// Variables globales para manejo graceful
let server = null;
let isShuttingDown = false;

// Función para cierre graceful
const gracefulShutdown = (signal) => {
  if (isShuttingDown) {
    logger.warn('Cierre ya en progreso, forzando salida...');
    process.exit(1);
  }
  
  isShuttingDown = true;
  logger.info(`Recibida señal ${signal}, iniciando cierre graceful...`);
  
  if (server) {
    server.close((err) => {
      if (err) {
        logger.error('Error cerrando servidor:', { error: err.message });
        process.exit(1);
      }
      
      logger.info('Servidor cerrado correctamente');
      alerts.serverShutdown(signal);
      process.exit(0);
    });
    
    // Forzar cierre después de 30 segundos
    setTimeout(() => {
      logger.warn('Timeout en cierre graceful, forzando salida...');
      process.exit(1);
    }, 30000);
  } else {
    process.exit(0);
  }
};

// Manejar señales del sistema
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Excepción no capturada:', error);
  console.error('📊 Stack trace:', error.stack);
  
  // Intentar cierre graceful
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promesa rechazada no manejada:', {
    reason: reason?.message || reason,
    promise: promise
  });
  
  const { captureException } = require('./config/sentry');
  if (reason instanceof Error) {
    captureException(reason);
  } else {
    captureException(new Error(String(reason)));
  }
  
  // En producción, no cerrar el servidor por promesas rechazadas
  if (process.env.NODE_ENV === 'production') {
    logger.warn('Continuando en producción después de unhandledRejection');
  } else {
    gracefulShutdown('unhandledRejection');
  }
});

// Iniciar servidor
startServer();
