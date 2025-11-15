const express = require('express');
const { query } = require('../../config/database');
const { sanitizeInput } = require('../../middleware/validation');
const { authenticateAdvertiser } = require('../../middleware/advertiserAuth');

const router = express.Router();

// GET /api/advertisers/cupones - Obtener todos los cupones del anunciante
router.get('/cupones', authenticateAdvertiser, async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*, 
       COUNT(cu.id) as usos_totales
       FROM cupones c
       LEFT JOIN cupon_usos cu ON c.id = cu.cupon_id
       WHERE c.anunciante_id = $1
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [req.advertiser.id]
    );
    res.json({ cupones: result.rows });
  } catch (e) {
    console.error('Error obteniendo cupones:', e);
    res.status(500).json({ error: 'Error obteniendo cupones' });
  }
});

// POST /api/advertisers/cupones - Crear nuevo cupón
router.post('/cupones', authenticateAdvertiser, sanitizeInput, async (req, res) => {
  try {
    const {
      codigo,
      titulo,
      descripcion,
      descuento_tipo,
      descuento_valor,
      monto_minimo,
      fecha_inicio,
      fecha_fin,
      usos_maximos,
      imagen_url
    } = req.body;

    if (!codigo || !titulo || !descuento_tipo || !descuento_valor || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({ error: 'Campos requeridos: codigo, titulo, descuento_tipo, descuento_valor, fecha_inicio, fecha_fin' });
    }

    // Validar que el código no exista para este anunciante
    const existing = await query(
      'SELECT id FROM cupones WHERE anunciante_id = $1 AND codigo = $2',
      [req.advertiser.id, codigo.toUpperCase()]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Ya existe un cupón con este código' });
    }

    // Validar fechas
    const inicio = new Date(fecha_inicio);
    const fin = new Date(fecha_fin);
    if (fin < inicio) {
      return res.status(400).json({ error: 'La fecha de fin debe ser posterior a la fecha de inicio' });
    }

    // Validar descuento
    if (descuento_tipo === 'porcentaje' && (descuento_valor < 0 || descuento_valor > 100)) {
      return res.status(400).json({ error: 'El descuento porcentual debe estar entre 0 y 100' });
    }
    if (descuento_tipo === 'fijo' && descuento_valor < 0) {
      return res.status(400).json({ error: 'El descuento fijo debe ser mayor a 0' });
    }

    const result = await query(
      `INSERT INTO cupones (
        anunciante_id, codigo, titulo, descripcion, descuento_tipo, descuento_valor,
        monto_minimo, fecha_inicio, fecha_fin, usos_maximos, imagen_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        req.advertiser.id,
        codigo.toUpperCase(),
        titulo,
        descripcion || null,
        descuento_tipo,
        parseFloat(descuento_valor),
        parseFloat(monto_minimo || 0),
        fecha_inicio,
        fecha_fin,
        usos_maximos ? parseInt(usos_maximos) : null,
        imagen_url || null
      ]
    );

    res.status(201).json({ cupon: result.rows[0] });
  } catch (e) {
    console.error('Error creando cupón:', e);
    res.status(500).json({ error: 'Error creando cupón' });
  }
});

// PUT /api/advertisers/cupones/:id - Actualizar cupón
router.put('/cupones/:id', authenticateAdvertiser, sanitizeInput, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      codigo,
      titulo,
      descripcion,
      descuento_tipo,
      descuento_valor,
      monto_minimo,
      fecha_inicio,
      fecha_fin,
      usos_maximos,
      imagen_url,
      activo
    } = req.body;

    // Verificar que el cupón pertenece al anunciante
    const cuponCheck = await query(
      'SELECT id FROM cupones WHERE id = $1 AND anunciante_id = $2',
      [id, req.advertiser.id]
    );
    if (cuponCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Cupón no encontrado' });
    }

    // Si se cambia el código, verificar que no exista otro
    if (codigo) {
      const existing = await query(
        'SELECT id FROM cupones WHERE anunciante_id = $1 AND codigo = $2 AND id != $3',
        [req.advertiser.id, codigo.toUpperCase(), id]
      );
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Ya existe otro cupón con este código' });
      }
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (codigo) {
      updates.push(`codigo = $${paramCount++}`);
      values.push(codigo.toUpperCase());
    }
    if (titulo) {
      updates.push(`titulo = $${paramCount++}`);
      values.push(titulo);
    }
    if (descripcion !== undefined) {
      updates.push(`descripcion = $${paramCount++}`);
      values.push(descripcion);
    }
    if (descuento_tipo) {
      updates.push(`descuento_tipo = $${paramCount++}`);
      values.push(descuento_tipo);
    }
    if (descuento_valor !== undefined) {
      updates.push(`descuento_valor = $${paramCount++}`);
      values.push(parseFloat(descuento_valor));
    }
    if (monto_minimo !== undefined) {
      updates.push(`monto_minimo = $${paramCount++}`);
      values.push(parseFloat(monto_minimo));
    }
    if (fecha_inicio) {
      updates.push(`fecha_inicio = $${paramCount++}`);
      values.push(fecha_inicio);
    }
    if (fecha_fin) {
      updates.push(`fecha_fin = $${paramCount++}`);
      values.push(fecha_fin);
    }
    if (usos_maximos !== undefined) {
      updates.push(`usos_maximos = $${paramCount++}`);
      values.push(usos_maximos ? parseInt(usos_maximos) : null);
    }
    if (imagen_url !== undefined) {
      updates.push(`imagen_url = $${paramCount++}`);
      values.push(imagen_url);
    }
    if (activo !== undefined) {
      updates.push(`activo = $${paramCount++}`);
      values.push(activo);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, req.advertiser.id);

    const result = await query(
      `UPDATE cupones 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount++} AND anunciante_id = $${paramCount++}
       RETURNING *`,
      values
    );

    res.json({ cupon: result.rows[0] });
  } catch (e) {
    console.error('Error actualizando cupón:', e);
    res.status(500).json({ error: 'Error actualizando cupón' });
  }
});

// DELETE /api/advertisers/cupones/:id - Eliminar cupón
router.delete('/cupones/:id', authenticateAdvertiser, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM cupones WHERE id = $1 AND anunciante_id = $2 RETURNING id',
      [id, req.advertiser.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cupón no encontrado' });
    }

    res.json({ message: 'Cupón eliminado correctamente' });
  } catch (e) {
    console.error('Error eliminando cupón:', e);
    res.status(500).json({ error: 'Error eliminando cupón' });
  }
});

// GET /api/advertisers/cupones/:id/stats - Estadísticas de un cupón
router.get('/cupones/:id/stats', authenticateAdvertiser, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el cupón pertenece al anunciante
    const cuponCheck = await query(
      'SELECT * FROM cupones WHERE id = $1 AND anunciante_id = $2',
      [id, req.advertiser.id]
    );
    if (cuponCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Cupón no encontrado' });
    }

    const cupon = cuponCheck.rows[0];

    // Obtener estadísticas de uso
    const statsResult = await query(
      `SELECT 
        COUNT(*) as total_usos,
        COUNT(DISTINCT DATE(created_at)) as dias_con_usos,
        MIN(created_at) as primer_uso,
        MAX(created_at) as ultimo_uso
       FROM cupon_usos
       WHERE cupon_id = $1`,
      [id]
    );

    const stats = statsResult.rows[0] || {
      total_usos: 0,
      dias_con_usos: 0,
      primer_uso: null,
      ultimo_uso: null
    };

    res.json({
      cupon,
      stats: {
        total_usos: parseInt(stats.total_usos),
        usos_actuales: cupon.usos_actuales,
        usos_maximos: cupon.usos_maximos,
        dias_con_usos: parseInt(stats.dias_con_usos),
        primer_uso: stats.primer_uso,
        ultimo_uso: stats.ultimo_uso
      }
    });
  } catch (e) {
    console.error('Error obteniendo estadísticas del cupón:', e);
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
});

module.exports = router;

