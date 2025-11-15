const express = require('express');
const { query } = require('../config/database');
const { optionalAuth, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/ratings - Crear calificación (rifa y/o creador)
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { rifa_id, participante_id, calificacion_rifa, calificacion_creador, comentario_rifa, comentario_creador } = req.body;

    // Validar que al menos una calificación esté presente
    if (!calificacion_rifa && !calificacion_creador) {
      return res.status(400).json({
        error: 'Debes proporcionar al menos una calificación (rifa o creador)',
        code: 'MISSING_RATING'
      });
    }

    // Validar que rifa_id y participante_id estén presentes
    if (!rifa_id || !participante_id) {
      return res.status(400).json({
        error: 'rifa_id y participante_id son obligatorios',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Verificar que la rifa existe
    const rifaResult = await query(
      'SELECT usuario_id as creador_id FROM rifas WHERE id = $1',
      [rifa_id]
    );

    if (rifaResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Rifa no encontrada',
        code: 'RIFA_NOT_FOUND'
      });
    }

    const creador_id = rifaResult.rows[0].creador_id;

    // Verificar que el participante existe y pertenece a la rifa
    const participanteResult = await query(
      'SELECT id, rifa_id FROM participantes WHERE id = $1 AND rifa_id = $2',
      [participante_id, rifa_id]
    );

    if (participanteResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Participante no encontrado o no pertenece a esta rifa',
        code: 'PARTICIPANT_NOT_FOUND'
      });
    }

    // Verificar si ya existe una calificación para este participante y rifa
    const existingRating = await query(
      'SELECT id FROM calificaciones WHERE rifa_id = $1 AND participante_id = $2',
      [rifa_id, participante_id]
    );

    if (existingRating.rows.length > 0) {
      // Actualizar calificación existente
      const updateResult = await query(`
        UPDATE calificaciones 
        SET 
          calificacion_rifa = COALESCE($3, calificacion_rifa),
          calificacion_creador = COALESCE($4, calificacion_creador),
          comentario_rifa = COALESCE($5, comentario_rifa),
          comentario_creador = COALESCE($6, comentario_creador),
          updated_at = CURRENT_TIMESTAMP
        WHERE rifa_id = $1 AND participante_id = $2
        RETURNING *
      `, [rifa_id, participante_id, calificacion_rifa || null, calificacion_creador || null, comentario_rifa || null, comentario_creador || null]);

      return res.json({
        message: 'Calificación actualizada exitosamente',
        calificacion: updateResult.rows[0]
      });
    }

    // Crear nueva calificación
    const insertResult = await query(`
      INSERT INTO calificaciones (
        rifa_id, creador_id, participante_id,
        calificacion_rifa, calificacion_creador,
        comentario_rifa, comentario_creador
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      rifa_id,
      creador_id,
      participante_id,
      calificacion_rifa || null,
      calificacion_creador || null,
      comentario_rifa || null,
      comentario_creador || null
    ]);

    res.status(201).json({
      message: 'Calificación creada exitosamente',
      calificacion: insertResult.rows[0]
    });

  } catch (error) {
    console.error('Error creando calificación:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
      details: error.message
    });
  }
});

// GET /api/ratings/rifa/:rifaId - Obtener calificaciones de una rifa
router.get('/rifa/:rifaId', optionalAuth, async (req, res) => {
  try {
    const { rifaId } = req.params;

    // Obtener calificaciones de la rifa
    const ratingsResult = await query(`
      SELECT 
        c.*,
        p.nombre as participante_nombre,
        p.email as participante_email
      FROM calificaciones c
      JOIN participantes p ON c.participante_id = p.id
      WHERE c.rifa_id = $1 AND c.activo = true
      ORDER BY c.created_at DESC
    `, [rifaId]);

    // Obtener estadísticas
    const statsResult = await query(`
      SELECT * FROM estadisticas_calificaciones_rifas WHERE rifa_id = $1
    `, [rifaId]);

    res.json({
      calificaciones: ratingsResult.rows,
      estadisticas: statsResult.rows[0] || {
        rifa_id: rifaId,
        total_calificaciones: 0,
        promedio_calificacion_rifa: null,
        calificaciones_5: 0,
        calificaciones_4: 0,
        calificaciones_3: 0,
        calificaciones_2: 0,
        calificaciones_1: 0
      }
    });

  } catch (error) {
    console.error('Error obteniendo calificaciones de rifa:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/ratings/creador/:creadorId - Obtener calificaciones de un creador
router.get('/creador/:creadorId', optionalAuth, async (req, res) => {
  try {
    const { creadorId } = req.params;

    // Obtener calificaciones del creador
    const ratingsResult = await query(`
      SELECT 
        c.*,
        r.nombre as rifa_nombre,
        p.nombre as participante_nombre
      FROM calificaciones c
      JOIN rifas r ON c.rifa_id = r.id
      JOIN participantes p ON c.participante_id = p.id
      WHERE c.creador_id = $1 AND c.activo = true AND c.calificacion_creador IS NOT NULL
      ORDER BY c.created_at DESC
    `, [creadorId]);

    // Obtener estadísticas
    const statsResult = await query(`
      SELECT * FROM estadisticas_calificaciones_creadores WHERE creador_id = $1
    `, [creadorId]);

    res.json({
      calificaciones: ratingsResult.rows,
      estadisticas: statsResult.rows[0] || {
        creador_id: creadorId,
        total_rifas_creadas: 0,
        total_calificaciones: 0,
        promedio_calificacion_creador: null,
        calificaciones_5: 0,
        calificaciones_4: 0,
        calificaciones_3: 0,
        calificaciones_2: 0,
        calificaciones_1: 0
      }
    });

  } catch (error) {
    console.error('Error obteniendo calificaciones de creador:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;

