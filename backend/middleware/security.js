// Middleware de Seguridad
// Configuración de CORS, validación de origen, y otras medidas de seguridad

/**
 * Configuración de CORS basada en entorno
 * - Desarrollo: Permite localhost
 * - Producción: Solo permite el dominio del frontend
 */
const getCorsConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  // En desarrollo, permitir localhost y el frontend configurado
  if (isDevelopment) {
    return {
      origin: function (origin, callback) {
        // Permitir requests sin origin (Postman, mobile apps, etc.)
        if (!origin) return callback(null, true);
        
        // Lista de orígenes permitidos en desarrollo
        const allowedOrigins = [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001',
          frontendUrl
        ];
        
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.warn(`⚠️ CORS bloqueado en desarrollo: ${origin}`);
          callback(null, true); // En desarrollo, permitir pero loguear
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With',
        'X-CSRF-Token',
        'Cache-Control',
        'Pragma',
        'Expires'
      ],
      exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
      maxAge: 86400 // 24 horas
    };
  }
  
  // En producción, solo permitir el dominio del frontend
  return {
    origin: function (origin, callback) {
      // Permitir requests sin origin (mobile apps, etc.) - evaluar caso por caso
      if (!origin) {
        // En producción, ser más estricto con requests sin origin
        return callback(new Error('Origin no permitido'));
      }
      
      // Verificar que el origin coincida con FRONTEND_URL
      const allowedOrigin = frontendUrl.replace(/\/$/, ''); // Remover trailing slash
      const originWithoutSlash = origin.replace(/\/$/, '');
      
      if (originWithoutSlash === allowedOrigin) {
        callback(null, true);
      } else {
        console.error(`🚫 CORS bloqueado en producción: ${origin} (esperado: ${allowedOrigin})`);
        callback(new Error('Origin no permitido por política CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'Cache-Control',
      'Pragma',
      'Expires'
    ],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    maxAge: 86400
  };
};

/**
 * Validar JWT Secret
 * Asegura que el JWT_SECRET sea fuerte en producción
 */
const validateJWTSecret = () => {
  const jwtSecret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!jwtSecret) {
    throw new Error('❌ JWT_SECRET no está configurado en las variables de entorno');
  }
  
  if (isProduction) {
    // En producción, validar que el secret sea fuerte
    if (jwtSecret.length < 32) {
      throw new Error('❌ JWT_SECRET debe tener al menos 32 caracteres en producción');
    }
    
    if (jwtSecret === 'tu_jwt_secret_muy_seguro_aqui_cambiar_en_produccion' ||
        jwtSecret === 'CHANGE_THIS_JWT_SECRET_IN_PRODUCTION_USE_STRONG_RANDOM_STRING') {
      throw new Error('❌ JWT_SECRET no ha sido cambiado del valor por defecto. CRÍTICO: Cambiar antes de producción');
    }
    
    // Verificar que tenga suficiente entropía (mezcla de caracteres)
    const hasUpper = /[A-Z]/.test(jwtSecret);
    const hasLower = /[a-z]/.test(jwtSecret);
    const hasNumber = /[0-9]/.test(jwtSecret);
    const hasSpecial = /[^A-Za-z0-9]/.test(jwtSecret);
    
    if (!(hasUpper && hasLower && hasNumber && hasSpecial)) {
      console.warn('⚠️ JWT_SECRET debería contener mayúsculas, minúsculas, números y caracteres especiales');
    }
  } else {
    // En desarrollo, solo advertir si es débil
    if (jwtSecret.length < 16) {
      console.warn('⚠️ JWT_SECRET es muy corto. Considera usar uno más largo.');
    }
  }
  
  return true;
};

/**
 * Middleware para validar tamaño de payload
 */
const validatePayloadSize = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = req.get('content-length');
    if (contentLength) {
      const sizeInBytes = parseInt(contentLength);
      const maxSizeInBytes = parseSize(maxSize);
      
      if (sizeInBytes > maxSizeInBytes) {
        return res.status(413).json({
          error: 'Payload demasiado grande',
          code: 'PAYLOAD_TOO_LARGE',
          maxSize,
          receivedSize: `${(sizeInBytes / 1024 / 1024).toFixed(2)}MB`
        });
      }
    }
    next();
  };
};

/**
 * Convertir tamaño de string a bytes
 */
const parseSize = (size) => {
  const units = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024
  };
  
  const match = size.toLowerCase().match(/^(\d+)([a-z]+)$/);
  if (!match) return 10 * 1024 * 1024; // Default 10MB
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  return value * (units[unit] || 1024 * 1024);
};

/**
 * Middleware para prevenir clickjacking
 */
const preventClickjacking = (req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
  next();
};

/**
 * Middleware para prevenir MIME type sniffing
 */
const preventMimeSniffing = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
};

/**
 * Middleware para validar Content-Type en requests POST/PUT
 */
const validateContentType = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // Permitir multipart/form-data para uploads
      if (contentType && contentType.includes('multipart/form-data')) {
        return next();
      }
      return res.status(400).json({
        error: 'Content-Type debe ser application/json',
        code: 'INVALID_CONTENT_TYPE'
      });
    }
  }
  next();
};

module.exports = {
  getCorsConfig,
  validateJWTSecret,
  validatePayloadSize,
  preventClickjacking,
  preventMimeSniffing,
  validateContentType
};

