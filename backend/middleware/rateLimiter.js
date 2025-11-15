// Rate Limiting Middleware
// Protege endpoints contra abuso y ataques de fuerza bruta

const rateLimitStore = new Map();

// Limpiar entradas expiradas cada minuto
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    // Eliminar si el tiempo de reset ya pasó (con margen de 1 minuto)
    if (value.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Cada minuto

/**
 * Rate limiter genérico
 * @param {Object} options - Opciones de rate limiting
 * @param {number} options.windowMs - Ventana de tiempo en milisegundos (default: 15 minutos)
 * @param {number} options.maxRequests - Máximo de requests en la ventana (default: 100)
 * @param {string} options.message - Mensaje de error personalizado
 * @param {Function} options.keyGenerator - Función para generar clave única (default: IP)
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutos por defecto
    maxRequests = 100,
    message = 'Demasiadas solicitudes. Por favor, intente más tarde.',
    keyGenerator = (req) => {
      // Usar IP del cliente
      return req.ip || req.connection.remoteAddress || 'unknown';
    }
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    
    // Obtener registro existente
    let record = rateLimitStore.get(key);
    
    // Si no hay registro o el tiempo de reset ya pasó, crear uno nuevo
    if (!record || record.resetAt <= now) {
      record = {
        count: 1,
        resetAt: now + windowMs,
        expiresAt: now + windowMs + 60000 // Mantener 1 minuto extra para limpieza
      };
      rateLimitStore.set(key, record);
      
      // Agregar headers informativos
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
      res.setHeader('X-RateLimit-Reset', new Date(record.resetAt).toISOString());
      
      return next();
    }

    // Incrementar contador
    record.count++;

    // Verificar si excedió el límite
    if (record.count > maxRequests) {
      const retryAfter = Math.max(0, Math.ceil((record.resetAt - now) / 1000)); // Asegurar que nunca sea negativo
      
      return res.status(429).json({
        error: message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter,
        resetAt: new Date(record.resetAt).toISOString()
      });
    }

    // Agregar headers informativos
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', new Date(record.resetAt).toISOString());

    next();
  };
};

// Rate limiters específicos para diferentes endpoints

// Rate limiter estricto para login/registro (protección contra fuerza bruta)
// En desarrollo, límites más permisivos
const authRateLimiter = createRateLimiter({
  windowMs: process.env.NODE_ENV === 'development' ? 5 * 60 * 1000 : 15 * 60 * 1000, // 5 min en dev, 15 min en prod
  maxRequests: process.env.NODE_ENV === 'development' ? 20 : 5, // 20 intentos en dev, 5 en prod
  message: 'Demasiados intentos de autenticación. Por favor, espere antes de intentar nuevamente.',
  keyGenerator: (req) => {
    // Usar email + IP para identificar intentos de fuerza bruta
    const email = req.body?.email || 'unknown';
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return `auth:${email}:${ip}`;
  }
});

// Rate limiter para endpoints de creación (prevenir spam)
const createContentRateLimiter = createRateLimiter({
  windowMs: process.env.NODE_ENV === 'development' ? 15 * 60 * 1000 : 60 * 60 * 1000, // 15 min en dev, 1 hora en prod
  maxRequests: process.env.NODE_ENV === 'development' ? 50 : 20, // 50 en dev, 20 en prod
  message: 'Límite de creación alcanzado. Por favor, espere antes de crear más contenido.',
  keyGenerator: (req) => {
    // Usar user ID si está autenticado, sino IP
    const userId = req.user?.id || req.advertiser?.id || 'anonymous';
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return `create:${userId}:${ip}`;
  }
});

// Rate limiter específico para uploads (más restrictivo)
const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  maxRequests: process.env.NODE_ENV === 'development' ? 30 : 10, // 30 en dev, 10 en prod
  message: 'Límite de carga de archivos alcanzado. Por favor, espere antes de subir más archivos.',
  keyGenerator: (req) => {
    const userId = req.user?.id || req.advertiser?.id || 'anonymous';
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return `upload:${userId}:${ip}`;
  }
});

// Rate limiter para endpoints de pago/transacciones (muy restrictivo)
const paymentRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: process.env.NODE_ENV === 'development' ? 20 : 5, // 20 en dev, 5 en prod
  message: 'Demasiadas solicitudes de pago. Por favor, espere antes de continuar.',
  keyGenerator: (req) => {
    const userId = req.user?.id || req.advertiser?.id || 'anonymous';
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return `payment:${userId}:${ip}`;
  }
});

// Rate limiter general para API (más permisivo)
// En desarrollo, límites más permisivos
const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: process.env.NODE_ENV === 'development' ? 500 : 100, // 500 en dev, 100 en prod
  message: 'Demasiadas solicitudes. Por favor, reduzca la frecuencia de sus solicitudes.'
});

// Rate limiter para endpoints públicos
// En desarrollo, límites más permisivos
const publicRateLimiter = createRateLimiter({
  windowMs: process.env.NODE_ENV === 'development' ? 15 * 60 * 1000 : 60 * 60 * 1000, // 15 min en dev, 1 hora en prod
  maxRequests: process.env.NODE_ENV === 'development' ? 500 : 200, // 500 en dev, 200 en prod
  message: 'Límite de solicitudes alcanzado. Por favor, espere antes de continuar.'
});

// Log en desarrollo
if (process.env.NODE_ENV === 'development') {
  console.log('🔓 Modo desarrollo: Rate limiting más permisivo (500 req/15min)');
}

// Función para resetear el rate limit store (útil para desarrollo)
const resetRateLimitStore = () => {
  rateLimitStore.clear();
  console.log('🔄 Rate limit store reseteado');
};

// Función para obtener estadísticas del rate limit (útil para debugging)
const getRateLimitStats = () => {
  const stats = {
    totalKeys: rateLimitStore.size,
    keys: []
  };
  
  for (const [key, value] of rateLimitStore.entries()) {
    const now = Date.now();
    const timeUntilReset = Math.max(0, value.resetAt - now);
    stats.keys.push({
      key,
      count: value.count,
      resetAt: new Date(value.resetAt).toISOString(),
      timeUntilReset: Math.ceil(timeUntilReset / 1000) // en segundos
    });
  }
  
  return stats;
};

module.exports = {
  createRateLimiter, // Función genérica para crear rate limiters personalizados
  authRateLimiter, // Rate limiter estricto para autenticación
  createContentRateLimiter, // Rate limiter para creación de contenido
  uploadRateLimiter, // Rate limiter para uploads de archivos
  paymentRateLimiter, // Rate limiter para pagos/transacciones
  apiRateLimiter, // Rate limiter estándar para API
  publicRateLimiter, // Rate limiter para endpoints públicos
  resetRateLimitStore, // Función para resetear el store (solo desarrollo)
  getRateLimitStats, // Función para obtener estadísticas (solo desarrollo)
  rateLimitStore // Exportar el store para acceso directo si es necesario
};

