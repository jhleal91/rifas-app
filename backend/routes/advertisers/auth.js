const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../../config/database');
const { sanitizeInput } = require('../../middleware/validation');
const { generateAdvertiserToken, authenticateAdvertiser } = require('../../middleware/advertiserAuth');

const router = express.Router();

// POST /api/advertisers/register - Registro de anunciante
router.post('/register', sanitizeInput, async (req, res) => {
  try {
    const { nombre, email, telefono, password, categoria, presupuesto } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y password son requeridos' });
    }

    const existing = await query('SELECT id FROM anunciantes WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    // Guardar el nombre también en nombre_comercial para que esté disponible en el perfil
    const result = await query(
      `INSERT INTO anunciantes (nombre, email, telefono, password_hash, categoria, presupuesto_mensual, nombre_comercial)
       VALUES ($1, $2, $3, $4, $5, $6, $1) RETURNING id, nombre, email, telefono, categoria, presupuesto_mensual, activo, fecha_registro, nombre_comercial`,
      [nombre, email, telefono || '', passwordHash, categoria || null, presupuesto || 0]
    );

    const advertiser = result.rows[0];
    const token = generateAdvertiserToken(advertiser.id);

    res.status(201).json({
      message: 'Registro de anunciante exitoso',
      advertiser,
      token
    });
  } catch (error) {
    console.error('Error registrando anunciante:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/advertisers/login - Login anunciante
router.post('/login', sanitizeInput, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password son requeridos' });
    }

    const result = await query('SELECT id, nombre, email, telefono, categoria, presupuesto_mensual, activo, nombre_comercial, pagina_url, descripcion_negocio, logo_url, activo_sponsor FROM anunciantes WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const advertiser = result.rows[0];
    if (!advertiser.activo) {
      return res.status(401).json({ error: 'Cuenta desactivada' });
    }

    const isValid = await bcrypt.compare(password, advertiser.password_hash);
    if (!isValid) return res.status(401).json({ error: 'Credenciales inválidas' });

    await query('UPDATE anunciantes SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = $1', [advertiser.id]);

    const token = generateAdvertiserToken(advertiser.id);
    res.json({
      message: 'Login exitoso',
      advertiser: {
        id: advertiser.id,
        nombre: advertiser.nombre,
        nombre_comercial: advertiser.nombre_comercial || null,
        email: advertiser.email,
        telefono: advertiser.telefono,
        categoria: advertiser.categoria,
        presupuesto_mensual: advertiser.presupuesto_mensual,
        activo: advertiser.activo,
        pagina_url: advertiser.pagina_url,
        descripcion_negocio: advertiser.descripcion_negocio,
        logo_url: advertiser.logo_url,
        activo_sponsor: advertiser.activo_sponsor
      },
      token
    });
  } catch (error) {
    console.error('Error en login anunciante:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/advertisers/me - Obtener información del anunciante autenticado
router.get('/me', authenticateAdvertiser, async (req, res) => {
  try {
    res.json({ advertiser: req.advertiser });
  } catch (e) {
    console.error('Error obteniendo información del anunciante:', e);
    res.status(500).json({ error: 'Error obteniendo información del anunciante' });
  }
});

// PUT /api/advertisers/profile - Actualizar perfil de negocio
router.put('/profile', authenticateAdvertiser, sanitizeInput, async (req, res) => {
  try {
    const { nombre_comercial, pagina_url, descripcion_negocio, logo_url, activo_sponsor } = req.body;
    
    const updateFields = [];
    const values = [];
    let paramCount = 1;
    
    if (nombre_comercial !== undefined) {
      updateFields.push(`nombre_comercial = $${paramCount++}`);
      values.push(nombre_comercial);
    }
    
    if (pagina_url !== undefined) {
      updateFields.push(`pagina_url = $${paramCount++}`);
      values.push(pagina_url);
    }
    
    if (descripcion_negocio !== undefined) {
      updateFields.push(`descripcion_negocio = $${paramCount++}`);
      values.push(descripcion_negocio);
    }
    
    if (logo_url !== undefined) {
      updateFields.push(`logo_url = $${paramCount++}`);
      values.push(logo_url);
    }
    
    if (activo_sponsor !== undefined) {
      updateFields.push(`activo_sponsor = $${paramCount++}`);
      values.push(activo_sponsor);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }
    
    values.push(req.advertiser.id);
    
    await query(
      `UPDATE anunciantes 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramCount}`,
      values
    );
    
    // Obtener datos actualizados
    const updatedResult = await query(
      'SELECT id, nombre, nombre_comercial, categoria, descripcion_negocio, logo_url, pagina_url, activo_sponsor FROM anunciantes WHERE id = $1',
      [req.advertiser.id]
    );
    
    res.json({
      message: 'Perfil actualizado exitosamente',
      advertiser: updatedResult.rows[0]
    });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({ error: 'Error actualizando perfil' });
  }
});

module.exports = router;

