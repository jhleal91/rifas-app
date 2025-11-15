// CSRF Protection Middleware
// Protege contra ataques Cross-Site Request Forgery

const csrf = require('csrf');
const tokens = new csrf();

// Secret para generar tokens CSRF (debe ser único por sesión)
// En producción, esto debería venir de una sesión o JWT
const getSecret = (req) => {
  // Usar JWT token si está disponible, sino usar IP + User-Agent
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    // Extraer parte del token para usar como secret
    const token = authHeader.split(' ')[1];
    if (token) {
      return token.substring(0, 32); // Usar primeros 32 caracteres
    }
  }
  
  // Fallback: usar IP + User-Agent
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('user-agent') || 'unknown';
  return `${ip}:${userAgent}`.substring(0, 32);
};

/**
 * Middleware para generar token CSRF
 * Debe usarse en endpoints GET que renderizan formularios
 */
const generateCSRFToken = (req, res, next) => {
  try {
    const secret = getSecret(req);
    const token = tokens.create(secret);
    
    // Guardar el secret en la sesión o en un cookie seguro
    // Por ahora, lo guardamos en un header personalizado
    res.setHeader('X-CSRF-Token', token);
    
    // También lo enviamos en el body si es una respuesta JSON
    if (req.accepts('json')) {
      res.locals.csrfToken = token;
    }
    
    next();
  } catch (error) {
    console.error('Error generando token CSRF:', error);
    next(); // Continuar sin token en caso de error (no bloquear)
  }
};

/**
 * Middleware para validar token CSRF
 * Debe usarse en endpoints POST/PUT/DELETE/PATCH
 */
const validateCSRFToken = (req, res, next) => {
  // Solo validar métodos que modifican datos
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return next();
  }

  // Excluir endpoints que no necesitan CSRF (APIs públicas con autenticación JWT)
  // JWT ya proporciona protección suficiente para APIs REST
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Si tiene JWT válido, no necesitamos CSRF (JWT es suficiente)
    return next();
  }

  try {
    const secret = getSecret(req);
    const token = req.headers['x-csrf-token'] || req.body?.csrfToken || req.query?.csrfToken;

    if (!token) {
      return res.status(403).json({
        error: 'Token CSRF requerido',
        code: 'CSRF_TOKEN_REQUIRED',
        message: 'Por favor, recarga la página e intenta nuevamente.'
      });
    }

    if (!tokens.verify(secret, token)) {
      return res.status(403).json({
        error: 'Token CSRF inválido',
        code: 'CSRF_TOKEN_INVALID',
        message: 'El token de seguridad ha expirado. Por favor, recarga la página.'
      });
    }

    next();
  } catch (error) {
    console.error('Error validando token CSRF:', error);
    return res.status(403).json({
      error: 'Error validando token CSRF',
      code: 'CSRF_VALIDATION_ERROR',
      message: 'Error de seguridad. Por favor, recarga la página.'
    });
  }
};

/**
 * Middleware opcional para endpoints que necesitan CSRF pero usan JWT
 * Útil para formularios web tradicionales
 */
const optionalCSRF = (req, res, next) => {
  // Si tiene JWT, no validar CSRF
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return next();
  }

  // Si no tiene JWT, validar CSRF
  return validateCSRFToken(req, res, next);
};

module.exports = {
  generateCSRFToken,
  validateCSRFToken,
  optionalCSRF
};

