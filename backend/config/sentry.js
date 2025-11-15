// Configuración de Sentry para Error Tracking
const Sentry = require('@sentry/node');

const initSentry = () => {
  // Solo inicializar en producción o si hay DSN configurado
  const dsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';

  if (!dsn) {
    console.log('⚠️ Sentry DSN no configurado. Error tracking deshabilitado.');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    
    // Performance monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // 10% en prod, 100% en dev
    
    // Integrations
    integrations: [
      // Capturar errores no manejados
      new Sentry.Integrations.OnUncaughtException({
        exitEvenIfOtherHandlersAreRegistered: false
      }),
      new Sentry.Integrations.OnUnhandledRejection({
        mode: 'warn'
      }),
      // Capturar errores de Express
      new Sentry.Integrations.Http({ tracing: true })
    ],

    // Filtros
    beforeSend(event, hint) {
      // Filtrar errores de desarrollo
      if (environment === 'development' && event.exception) {
        const error = hint.originalException;
        // No enviar errores de validación comunes
        if (error && error.status && error.status < 500) {
          return null; // No enviar errores 4xx
        }
      }
      return event;
    },

    // Ignorar ciertos errores
    ignoreErrors: [
      'Unauthorized',
      'Forbidden',
      'Not Found',
      // Errores de rate limiting
      'RATE_LIMIT_EXCEEDED',
      // Errores de validación
      'VALIDATION_ERROR'
    ]
  });

  console.log('✅ Sentry inicializado correctamente');
};

// Middleware de Sentry para Express
const sentryMiddleware = (app) => {
  if (process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.tracingHandler());
  }
};

// Error handler de Sentry
const sentryErrorHandler = (app) => {
  if (process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.errorHandler());
  }
};

// Función helper para capturar errores manualmente
const captureException = (error, context = {}) => {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context
    });
  }
};

// Función helper para capturar mensajes
const captureMessage = (message, level = 'info', context = {}) => {
  if (process.env.SENTRY_DSN) {
    Sentry.captureMessage(message, {
      level,
      extra: context
    });
  }
};

module.exports = {
  initSentry,
  sentryMiddleware,
  sentryErrorHandler,
  captureException,
  captureMessage,
  Sentry
};

