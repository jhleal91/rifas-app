const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Middleware para verificar JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Token de acceso requerido',
      code: 'TOKEN_REQUIRED'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar que el usuario aún existe y está activo
    const result = await query(
      'SELECT id, email, nombre, rol, activo FROM usuarios WHERE id = $1 AND activo = true',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Usuario no encontrado o inactivo',
        code: 'USER_NOT_FOUND'
      });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token inválido',
        code: 'TOKEN_INVALID'
      });
    }
    
    console.error('Error en autenticación:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Middleware para verificar rol de admin
const requireAdmin = (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ 
      error: 'Acceso denegado. Se requiere rol de administrador',
      code: 'ADMIN_REQUIRED'
    });
  }
  next();
};

// Middleware opcional (no requiere token)
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await query(
      'SELECT id, email, nombre, rol, activo FROM usuarios WHERE id = $1 AND activo = true',
      [decoded.userId]
    );

    req.user = result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    req.user = null;
  }

  next();
};

// Función para generar JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // Token válido por 7 días
  );
};

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth,
  generateToken
};
