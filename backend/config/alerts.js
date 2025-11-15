// Sistema de Alertas Básico
// Envía alertas por email cuando ocurren eventos críticos

const logger = require('./logger');
const { captureMessage } = require('./sentry');

/**
 * Enviar alerta crítica
 * @param {string} type - Tipo de alerta (error, warning, info)
 * @param {string} message - Mensaje de la alerta
 * @param {Object} context - Contexto adicional
 */
const sendAlert = async (type, message, context = {}) => {
  const alertData = {
    type,
    message,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    ...context
  };

  // Log de la alerta
  if (type === 'error') {
    logger.error(`ALERTA: ${message}`, alertData);
  } else if (type === 'warning') {
    logger.warn(`ALERTA: ${message}`, alertData);
  } else {
    logger.info(`ALERTA: ${message}`, alertData);
  }

  // Enviar a Sentry (si está configurado)
  if (type === 'error' || type === 'warning') {
    captureMessage(message, type, alertData);
  }

  // Aquí puedes agregar integración con email (Resend, SendGrid, etc.)
  // Por ahora, solo logueamos y enviamos a Sentry
  if (process.env.ALERT_EMAIL && type === 'error') {
    // TODO: Implementar envío de email
    logger.info('Email de alerta debería enviarse aquí', { to: process.env.ALERT_EMAIL });
  }
};

/**
 * Alertas específicas
 */
const alerts = {
  // Error crítico del servidor
  serverError: (error, context) => {
    sendAlert('error', 'Error crítico del servidor', {
      error: error.message,
      stack: error.stack,
      ...context
    });
  },

  // Error de base de datos
  databaseError: (error, context) => {
    sendAlert('error', 'Error de base de datos', {
      error: error.message,
      ...context
    });
  },

  // Rate limit excedido (posible ataque)
  rateLimitExceeded: (ip, endpoint, context) => {
    sendAlert('warning', 'Rate limit excedido', {
      ip,
      endpoint,
      ...context
    });
  },

  // Error de autenticación múltiple (posible ataque)
  multipleAuthFailures: (email, ip, attempts) => {
    sendAlert('warning', 'Múltiples fallos de autenticación', {
      email,
      ip,
      attempts
    });
  },

  // Error en procesamiento de pago
  paymentError: (error, context) => {
    sendAlert('error', 'Error en procesamiento de pago', {
      error: error.message,
      ...context
    });
  },

  // Servidor iniciado
  serverStarted: (port, environment) => {
    sendAlert('info', 'Servidor iniciado', {
      port,
      environment
    });
  },

  // Servidor cerrado
  serverShutdown: (signal) => {
    sendAlert('info', 'Servidor cerrado', {
      signal
    });
  }
};

module.exports = {
  sendAlert,
  alerts
};

