const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { validateUser, sanitizeInput } = require('../middleware/validation');

const router = express.Router();

// POST /api/auth/register - Registrar nuevo usuario
// Nota: authRateLimiter ya está aplicado en server.js a nivel de ruta /api/auth
router.post('/register', sanitizeInput, validateUser, async (req, res) => {
  try {
    const { email, password, nombre, telefono } = req.body;

    // Verificar si el email ya existe
    const existingUser = await query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'El email ya está registrado',
        code: 'EMAIL_EXISTS'
      });
    }

    // Encriptar password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const result = await query(
      `INSERT INTO usuarios (email, password_hash, nombre, telefono, rol) 
       VALUES ($1, $2, $3, $4, 'admin') 
       RETURNING id, email, nombre, telefono, rol, fecha_registro`,
      [email, passwordHash, nombre, telefono]
    );

    const user = result.rows[0];

    // Generar token
    const token = generateToken(user.id);

    // Actualizar último acceso
    await query(
      'UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Enviar email de bienvenida (no bloquea el registro si falla)
    try {
      const emailService = require('../config/email');
      const emailResult = await emailService.sendWelcomeEmail({
        nombre: user.nombre,
        email: user.email
      });
      
      if (emailResult.success) {
        console.log('✅ Email de bienvenida enviado al nuevo usuario:', user.email);
      } else {
        console.warn('⚠️  No se pudo enviar email de bienvenida:', emailResult.error || emailResult.message);
        if (emailResult.message) {
          console.warn('💡 Sugerencia:', emailResult.message);
        }
      }
    } catch (emailError) {
      console.error('❌ Error enviando email de bienvenida:', emailError);
      console.error('❌ Stack trace:', emailError.stack);
      // No fallar el registro por error de email
    }

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        telefono: user.telefono,
        rol: user.rol,
        fechaRegistro: user.fecha_registro
      },
      token
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/auth/login - Iniciar sesión
router.post('/login', sanitizeInput, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email y password son requeridos',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Buscar usuario
    const result = await query(
      'SELECT id, email, password_hash, nombre, telefono, rol, activo FROM usuarios WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = result.rows[0];

    // Verificar si el usuario está activo
    if (!user.activo) {
      return res.status(401).json({
        error: 'Cuenta desactivada',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // Verificar password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generar token
    const token = generateToken(user.id);

    // Actualizar último acceso
    await query(
      'UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    res.json({
      message: 'Login exitoso',
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        telefono: user.telefono,
        rol: user.rol
      },
      token
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});


// GET /api/auth/me - Obtener información del usuario actual
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // El usuario ya está disponible en req.user gracias al middleware authenticateToken
    const user = req.user;

    res.json({
      user: user
    });

  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;
