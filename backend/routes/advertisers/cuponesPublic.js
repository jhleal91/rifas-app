const express = require('express');
const { query } = require('../../config/database');

const router = express.Router();

// GET /public - Obtener todos los cupones públicos activos
// Esta ruta se monta en /api/cupones, así que la ruta completa es /api/cupones/public
router.get('/public', async (req, res) => {
  try {
    const hoy = new Date().toISOString().split('T')[0]; // Fecha actual en formato YYYY-MM-DD

    const result = await query(
      `SELECT 
        c.*,
        a.nombre_comercial as anunciante_nombre,
        a.nombre as anunciante_nombre_fallback,
        COUNT(cu.id) as usos_totales
       FROM cupones c
       INNER JOIN anunciantes a ON c.anunciante_id = a.id
       LEFT JOIN cupon_usos cu ON c.id = cu.cupon_id
       WHERE c.activo = true
         AND a.activo = true
         AND a.activo_sponsor = true
         AND c.fecha_inicio <= $1
         AND c.fecha_fin >= $1
         AND (c.usos_maximos IS NULL OR c.usos_actuales < c.usos_maximos)
       GROUP BY c.id, a.nombre_comercial, a.nombre
       ORDER BY c.created_at DESC
       LIMIT 50`,
      [hoy]
    );

    res.json({ cupones: result.rows });
  } catch (e) {
    console.error('Error obteniendo cupones públicos:', e);
    res.status(500).json({ error: 'Error obteniendo cupones' });
  }
});

module.exports = router;

