const express = require('express');
const { query } = require('../../config/database');

const router = express.Router();

// GET /api/advertisers/sponsors - Obtener negocios patrocinadores activos (público)
router.get('/sponsors', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        a.id,
        a.nombre,
        a.nombre_comercial,
        a.categoria,
        a.descripcion_negocio,
        a.logo_url,
        a.pagina_url,
        COUNT(an.id) FILTER (WHERE an.activo = true AND an.aprobado = true) as total_anuncios
      FROM anunciantes a
      LEFT JOIN anuncios an ON a.id = an.anunciante_id
      WHERE a.activo = true 
        AND a.activo_sponsor = true
        AND (a.nombre_comercial IS NOT NULL OR a.nombre IS NOT NULL)
      GROUP BY a.id, a.nombre, a.nombre_comercial, a.categoria, a.descripcion_negocio, a.logo_url, a.pagina_url
      HAVING COUNT(an.id) FILTER (WHERE an.activo = true AND an.aprobado = true) > 0
      ORDER BY total_anuncios DESC, a.fecha_registro DESC
      LIMIT 20
    `);
    
    res.json({ businesses: result.rows });
  } catch (error) {
    console.error('Error obteniendo sponsors:', error);
    res.status(500).json({ error: 'Error obteniendo negocios patrocinadores' });
  }
});


// GET /api/advertisers/:id/cupones/public - Obtener cupones públicos de un anunciante
router.get('/:id/cupones/public', async (req, res) => {
  try {
    const { id } = req.params;
    const hoy = new Date().toISOString().split('T')[0]; // Fecha actual en formato YYYY-MM-DD

    const result = await query(
      `SELECT c.*, 
       COUNT(cu.id) as usos_totales
       FROM cupones c
       LEFT JOIN cupon_usos cu ON c.id = cu.cupon_id
       WHERE c.anunciante_id = $1 
         AND c.activo = true
         AND c.fecha_inicio <= $2
         AND c.fecha_fin >= $2
         AND (c.usos_maximos IS NULL OR c.usos_actuales < c.usos_maximos)
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [id, hoy]
    );

    res.json({ cupones: result.rows });
  } catch (e) {
    console.error('Error obteniendo cupones públicos:', e);
    res.status(500).json({ error: 'Error obteniendo cupones' });
  }
});

// GET /api/advertisers/:id/public - Obtener perfil público del negocio
router.get('/:id/public', async (req, res) => {
  try {
    const { id } = req.params;
    
    const businessResult = await query(`
      SELECT 
        a.id,
        a.nombre,
        a.nombre_comercial,
        a.categoria,
        a.descripcion_negocio,
        a.logo_url,
        a.pagina_url,
        a.email,
        a.telefono,
        a.fecha_registro
      FROM anunciantes a
      WHERE a.id = $1 AND a.activo = true AND a.activo_sponsor = true
    `, [id]);
    
    if (businessResult.rows.length === 0) {
      return res.status(404).json({ error: 'Negocio no encontrado' });
    }
    
    const business = businessResult.rows[0];
    
    // Obtener anuncios activos del negocio
    const adsResult = await query(`
      SELECT 
        id,
        titulo,
        descripcion_corta,
        url_destino,
        imagen_url,
        categoria,
        created_at
      FROM anuncios
      WHERE anunciante_id = $1 
        AND activo = true 
        AND aprobado = true
      ORDER BY created_at DESC
      LIMIT 20
    `, [id]);
    
    // Obtener cupones activos del negocio
    const hoy = new Date().toISOString().split('T')[0];
    const cuponesResult = await query(`
      SELECT c.*, 
       COUNT(cu.id) as usos_totales
       FROM cupones c
       LEFT JOIN cupon_usos cu ON c.id = cu.cupon_id
       WHERE c.anunciante_id = $1 
         AND c.activo = true
         AND c.fecha_inicio <= $2
         AND c.fecha_fin >= $2
         AND (c.usos_maximos IS NULL OR c.usos_actuales < c.usos_maximos)
       GROUP BY c.id
       ORDER BY c.created_at DESC
    `, [id, hoy]);
    
    res.json({
      business: {
        ...business,
        ads: adsResult.rows,
        cupones: cuponesResult.rows
      }
    });
  } catch (error) {
    console.error('Error obteniendo perfil de negocio:', error);
    res.status(500).json({ error: 'Error obteniendo perfil de negocio' });
  }
});

module.exports = router;

