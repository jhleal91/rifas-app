const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Util: generar token para anunciante
const generateAdvertiserToken = (advertiserId) => {
  return jwt.sign(
    { advertiserId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Middleware: autenticar anunciante
const authenticateAdvertiser = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await query(
      'SELECT id, nombre, email, telefono, categoria, presupuesto_mensual, activo, nombre_comercial, pagina_url, descripcion_negocio, logo_url, activo_sponsor, credito_actual FROM anunciantes WHERE id = $1 AND activo = true',
      [decoded.advertiserId]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Anunciante no encontrado o inactivo' });
    }
    req.advertiser = result.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

module.exports = {
  generateAdvertiserToken,
  authenticateAdvertiser
};

