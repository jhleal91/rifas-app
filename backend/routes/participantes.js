const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { validateParticipante, validateRifaId, sanitizeInput } = require('../middleware/validation');
const emailService = require('../config/email');
const { 
  generarEmailDefault, 
  esEmailReal, 
  crearParticipanteHibrido,
  obtenerHistorialParticipaciones
} = require('../utils/participanteUtils');
const { checkAndNotifySoldOut } = require('../utils/raffleUtils');

const router = express.Router();

// GET /api/participantes/:rifaId - Obtener participantes de una rifa
router.get('/:rifaId', validateRifaId, optionalAuth, async (req, res) => {
  try {
    const { rifaId } = req.params;

    // Verificar que la rifa existe y obtener información
    const rifaResult = await query(
      'SELECT * FROM rifas WHERE id = $1',
      [rifaId]
    );

    if (rifaResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Rifa no encontrada',
        code: 'RIFA_NOT_FOUND'
      });
    }

    const rifa = rifaResult.rows[0];

    // Verificar si es privada y si el usuario tiene acceso
    if (rifa.es_privada && (!req.user || req.user.id !== rifa.usuario_id)) {
      return res.status(403).json({
        error: 'Acceso denegado a rifa privada',
        code: 'PRIVATE_RIFA_ACCESS_DENIED'
      });
    }

    // Obtener participantes
    const result = await query(`
      SELECT * FROM participantes_detallados 
      WHERE rifa_id = $1 
      ORDER BY fecha_participacion DESC
    `, [rifaId]);

    res.json({
      participantes: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error obteniendo participantes:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/participantes/:rifaId - Participar en una rifa (Registro Obligatorio)
router.post('/:rifaId', validateRifaId, sanitizeInput, validateParticipante, async (req, res) => {
  try {
    const { rifaId } = req.params;
    const { nombre, telefono, email, numerosSeleccionados } = req.body;

    // Validar que se proporciona email (registro obligatorio)
    if (!email || !email.trim()) {
      return res.status(400).json({
        error: 'Email es obligatorio para participar',
        code: 'EMAIL_REQUIRED'
      });
    }

    // Verificar que la rifa existe y está activa
    const rifaResult = await query(
      'SELECT * FROM rifas WHERE id = $1 AND activa = true AND fecha_fin > CURRENT_TIMESTAMP',
      [rifaId]
    );

    if (rifaResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Rifa no encontrada o no está disponible',
        code: 'RIFA_NOT_AVAILABLE'
      });
    }

    const rifa = rifaResult.rows[0];

    // Verificar que los números seleccionados están disponibles
    const elementosDisponibles = await query(`
      SELECT elemento 
      FROM (
        SELECT jsonb_array_elements_text(elementos_personalizados) as elemento 
        FROM rifas 
        WHERE id = $1
      ) todos_elementos
      WHERE elemento NOT IN (
        SELECT elemento FROM elementos_vendidos WHERE rifa_id = $1
        UNION
        SELECT elemento FROM elementos_reservados WHERE rifa_id = $1 AND activo = true
      )
    `, [rifaId]);

    const disponibles = elementosDisponibles.rows.map(row => String(row.elemento));
    const noDisponibles = numerosSeleccionados.filter(num => !disponibles.includes(String(num)));

    if (noDisponibles.length > 0) {
      return res.status(400).json({
        error: 'Algunos números no están disponibles',
        details: {
          noDisponibles,
          disponibles: disponibles.slice(0, 10) // Mostrar solo los primeros 10 disponibles
        },
        code: 'NUMBERS_NOT_AVAILABLE'
      });
    }

    // Crear reserva temporal
    const reservaId = `reserva_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fechaExpiracion = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // Crear participante con sistema híbrido
    const participante = await crearParticipanteHibrido(
      { nombre, telefono, email, numerosSeleccionados },
      rifaId,
      rifa,
      'pendiente',
      reservaId,
      fechaExpiracion
    );

    // Reservar elementos temporalmente
    for (const elemento of numerosSeleccionados) {
      await query(`
        INSERT INTO elementos_reservados (
          rifa_id, participante_id, elemento, reserva_id, fecha_expiracion
        ) VALUES ($1, $2, $3, $4, $5)
      `, [rifaId, participante.id, elemento, reservaId, fechaExpiracion]);
    }

    // Enviar correo de confirmación (registro obligatorio)
    try {
      await emailService.sendParticipationConfirmation({
        participante: {
          nombre: participante.nombre,
          email: participante.email,
          numerosSeleccionados: participante.numeros_seleccionados,
          totalPagado: participante.total_pagado
        },
        rifa: {
          nombre: rifa.nombre,
          descripcion: rifa.descripcion,
          fechaFin: rifa.fecha_fin,
          url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/participante/${rifaId}/${participante.id}`
        }
      });
      console.log(`✅ Correo enviado a ${participante.email} para participación`);
    } catch (emailError) {
      console.error('❌ Error enviando correo de confirmación:', emailError);
      // No fallar la operación por error de correo
    }

    res.status(201).json({
      message: 'Participación registrada exitosamente',
      participante: {
        id: participante.id,
        nombre: participante.nombre,
        telefono: participante.telefono,
        numerosSeleccionados: participante.numeros_seleccionados,
        totalPagado: participante.total_pagado,
        estado: participante.estado,
        reservaId: participante.reserva_id,
        fechaExpiracion: participante.reserva_expiracion
      },
      instrucciones: {
        mensaje: 'Los números han sido apartados temporalmente por 15 minutos.',
        pasos: [
          '1. Realiza el pago según las instrucciones de la rifa',
          '2. Envía el comprobante al organizador',
          '3. El organizador validará tu pago',
          '4. Una vez validado, tu participación será confirmada'
        ]
      }
    });

  } catch (error) {
    console.error('Error registrando participación:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// PUT /api/participantes/:participanteId/validar - Validar pago de participante
router.put('/:participanteId/validar', authenticateToken, async (req, res) => {
  try {
    const { participanteId } = req.params;

    // Obtener participante y verificar que pertenece a una rifa del usuario
    const participanteResult = await query(`
      SELECT p.*, r.usuario_id, r.precio
      FROM participantes p
      JOIN rifas r ON p.rifa_id = r.id
      WHERE p.id = $1 AND p.estado = 'pendiente'
    `, [participanteId]);

    if (participanteResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Participante no encontrado o ya procesado',
        code: 'PARTICIPANTE_NOT_FOUND'
      });
    }

    const participante = participanteResult.rows[0];

    // Verificar que el usuario es el dueño de la rifa
    if (participante.usuario_id !== req.user.id) {
      return res.status(403).json({
        error: 'No tienes permisos para validar este participante',
        code: 'VALIDATION_ACCESS_DENIED'
      });
    }

    // Verificar que la reserva no ha expirado
    if (new Date() > new Date(participante.reserva_expiracion)) {
      return res.status(400).json({
        error: 'La reserva ha expirado',
        code: 'RESERVA_EXPIRED'
      });
    }

    // Iniciar transacción
    const client = await query.getClient();
    await client.query('BEGIN');

    try {
      // Actualizar participante a confirmado
      await client.query(`
        UPDATE participantes 
        SET estado = 'confirmado', fecha_confirmacion = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [participanteId]);

      // Mover elementos de reservados a vendidos
      const elementosReservados = await client.query(`
        SELECT elemento FROM elementos_reservados 
        WHERE participante_id = $1 AND activo = true
      `, [participanteId]);

      for (const row of elementosReservados.rows) {
        await client.query(`
          INSERT INTO elementos_vendidos (rifa_id, participante_id, elemento)
          VALUES ($1, $2, $3)
        `, [participante.rifa_id, participanteId, row.elemento]);
      }

      // Marcar elementos reservados como inactivos
      await client.query(`
        UPDATE elementos_reservados 
        SET activo = false 
        WHERE participante_id = $1
      `, [participanteId]);

      await client.query('COMMIT');

      res.json({
        message: 'Pago validado exitosamente',
        participante: {
          id: participante.id,
          nombre: participante.nombre,
          estado: 'confirmado',
          fechaConfirmacion: new Date().toISOString()
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error validando pago:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// PUT /api/participantes/:participanteId/rechazar - Rechazar participante
router.put('/:participanteId/rechazar', authenticateToken, async (req, res) => {
  try {
    const { participanteId } = req.params;
    const { motivo } = req.body;

    // Obtener participante y verificar que pertenece a una rifa del usuario
    const participanteResult = await query(`
      SELECT p.*, r.usuario_id
      FROM participantes p
      JOIN rifas r ON p.rifa_id = r.id
      WHERE p.id = $1 AND p.estado = 'pendiente'
    `, [participanteId]);

    if (participanteResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Participante no encontrado o ya procesado',
        code: 'PARTICIPANTE_NOT_FOUND'
      });
    }

    const participante = participanteResult.rows[0];

    // Verificar que el usuario es el dueño de la rifa
    if (participante.usuario_id !== req.user.id) {
      return res.status(403).json({
        error: 'No tienes permisos para rechazar este participante',
        code: 'REJECTION_ACCESS_DENIED'
      });
    }

    // Iniciar transacción
    const client = await query.getClient();
    await client.query('BEGIN');

    try {
      // Actualizar participante a rechazado
      await client.query(`
        UPDATE participantes 
        SET estado = 'rechazado', fecha_rechazo = CURRENT_TIMESTAMP, motivo_rechazo = $1
        WHERE id = $2
      `, [motivo || 'Sin motivo especificado', participanteId]);

      // Liberar elementos reservados
      await client.query(`
        UPDATE elementos_reservados 
        SET activo = false 
        WHERE participante_id = $1
      `, [participanteId]);

      await client.query('COMMIT');

      res.json({
        message: 'Participante rechazado exitosamente',
        participante: {
          id: participante.id,
          nombre: participante.nombre,
          estado: 'rechazado',
          motivoRechazo: motivo || 'Sin motivo especificado',
          fechaRechazo: new Date().toISOString()
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error rechazando participante:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/participantes/:rifaId/elementos - Obtener elementos disponibles de una rifa
router.get('/:rifaId/elementos', validateRifaId, async (req, res) => {
  try {
    const { rifaId } = req.params;
    const { estado } = req.query; // 'disponibles', 'vendidos', 'reservados', 'todos'

    // Verificar que la rifa existe
    const rifaResult = await query(
      'SELECT * FROM rifas WHERE id = $1',
      [rifaId]
    );

    if (rifaResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Rifa no encontrada',
        code: 'RIFA_NOT_FOUND'
      });
    }

    const rifa = rifaResult.rows[0];

    let elementos = [];

    if (estado === 'disponibles') {
      // Solo elementos disponibles
      const result = await query(`
        SELECT elemento 
        FROM (
          SELECT unnest(elementos_personalizados) as elemento 
          FROM rifas 
          WHERE id = $1
        ) todos_elementos
        WHERE elemento NOT IN (
          SELECT elemento FROM elementos_vendidos WHERE rifa_id = $1
          UNION
          SELECT elemento FROM elementos_reservados WHERE rifa_id = $1 AND activo = true
        )
        ORDER BY elemento
      `, [rifaId]);
      elementos = result.rows.map(row => ({ elemento: row.elemento, estado: 'disponible' }));

    } else if (estado === 'vendidos') {
      // Solo elementos vendidos
      const result = await query(`
        SELECT ev.elemento, ev.fecha_venta, p.nombre as participante_nombre
        FROM elementos_vendidos ev
        JOIN participantes p ON ev.participante_id = p.id
        WHERE ev.rifa_id = $1
        ORDER BY ev.fecha_venta DESC
      `, [rifaId]);
      elementos = result.rows.map(row => ({ 
        elemento: row.elemento, 
        estado: 'vendido',
        fechaVenta: row.fecha_venta,
        participanteNombre: row.participante_nombre
      }));

    } else if (estado === 'reservados') {
      // Solo elementos reservados
      const result = await query(`
        SELECT er.elemento, er.fecha_reserva, er.fecha_expiracion, p.nombre as participante_nombre
        FROM elementos_reservados er
        LEFT JOIN participantes p ON er.participante_id = p.id
        WHERE er.rifa_id = $1 AND er.activo = true
        ORDER BY er.fecha_reserva ASC
      `, [rifaId]);
      elementos = result.rows.map(row => ({ 
        elemento: row.elemento, 
        estado: 'reservado',
        fechaReserva: row.fecha_reserva,
        fechaExpiracion: row.fecha_expiracion,
        participanteNombre: row.participante_nombre
      }));

    } else {
      // Todos los elementos con su estado
      const todosResult = await query(`
        SELECT unnest(elementos_personalizados) as elemento 
        FROM rifas 
        WHERE id = $1
        ORDER BY elemento
      `, [rifaId]);

      const vendidosResult = await query(`
        SELECT elemento FROM elementos_vendidos WHERE rifa_id = $1
      `, [rifaId]);

      const reservadosResult = await query(`
        SELECT elemento FROM elementos_reservados WHERE rifa_id = $1 AND activo = true
      `, [rifaId]);

      const vendidos = new Set(vendidosResult.rows.map(row => row.elemento));
      const reservados = new Set(reservadosResult.rows.map(row => row.elemento));

      elementos = todosResult.rows.map(row => {
        const elemento = row.elemento;
        let estado = 'disponible';
        if (vendidos.has(elemento)) estado = 'vendido';
        else if (reservados.has(elemento)) estado = 'reservado';
        return { elemento, estado };
      });
    }

    res.json({
      rifaId,
      elementos,
      total: elementos.length,
      estadisticas: {
        disponibles: elementos.filter(e => e.estado === 'disponible').length,
        vendidos: elementos.filter(e => e.estado === 'vendido').length,
        reservados: elementos.filter(e => e.estado === 'reservado').length
      }
    });

  } catch (error) {
    console.error('Error obteniendo elementos:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/participantes/:rifaId/vender - Venta directa por administrador (Registro Obligatorio)
router.post('/:rifaId/vender', validateRifaId, authenticateToken, sanitizeInput, validateParticipante, async (req, res) => {
  try {
    const { rifaId } = req.params;
    const { nombre, telefono, email, numerosSeleccionados } = req.body;

    // Validar que se proporciona email (registro obligatorio)
    if (!email || !email.trim()) {
      return res.status(400).json({
        error: 'Email es obligatorio para participar',
        code: 'EMAIL_REQUIRED'
      });
    }

    // Verificar que la rifa existe y está activa
    const rifaResult = await query(
      'SELECT * FROM rifas WHERE id = $1 AND activa = true AND fecha_fin > CURRENT_TIMESTAMP',
      [rifaId]
    );

    if (rifaResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Rifa no encontrada o no está disponible',
        code: 'RIFA_NOT_AVAILABLE'
      });
    }

    const rifa = rifaResult.rows[0];

    // Verificar que el usuario es el creador de la rifa
    if (req.user.id !== rifa.usuario_id) {
      return res.status(403).json({
        error: 'Solo el creador de la rifa puede vender números directamente',
        code: 'UNAUTHORIZED_SALE'
      });
    }

    // Verificar que los números seleccionados están disponibles
    const elementosDisponibles = await query(`
      SELECT elemento 
      FROM (
        SELECT jsonb_array_elements_text(elementos_personalizados) as elemento 
        FROM rifas 
        WHERE id = $1
      ) todos_elementos
      WHERE elemento NOT IN (
        SELECT elemento FROM elementos_vendidos WHERE rifa_id = $1
        UNION
        SELECT elemento FROM elementos_reservados WHERE rifa_id = $1 AND activo = true
      )
    `, [rifaId]);

    const disponibles = elementosDisponibles.rows.map(row => String(row.elemento));
    const noDisponibles = numerosSeleccionados.filter(num => !disponibles.includes(String(num)));

    if (noDisponibles.length > 0) {
      return res.status(400).json({
        error: 'Algunos números no están disponibles',
        details: {
          noDisponibles,
          disponibles: disponibles.slice(0, 10) // Mostrar solo los primeros 10 disponibles
        },
        code: 'NUMBERS_NOT_AVAILABLE'
      });
    }

    // Crear participante con sistema híbrido (venta directa)
    const participante = await crearParticipanteHibrido(
      { nombre, telefono, email, numerosSeleccionados },
      rifaId,
      rifa,
      'confirmado'
    );

    // Marcar elementos como vendidos directamente (no reservados)
    for (const elemento of numerosSeleccionados) {
      await query(`
        INSERT INTO elementos_vendidos (
          rifa_id, participante_id, elemento, fecha_venta
        ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      `, [rifaId, participante.id, elemento]);
    }

    // Enviar correo de confirmación (registro obligatorio)
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const participanteUrl = `${frontendUrl}/participante/${rifaId}/${participante.id}`;
      
      await emailService.sendParticipationConfirmation({
        participante: {
          nombre: participante.nombre,
          email: participante.email,
          numerosSeleccionados: participante.numeros_seleccionados,
          totalPagado: participante.total_pagado
        },
        rifa: {
          nombre: rifa.nombre,
          descripcion: rifa.descripcion,
          fechaFin: rifa.fecha_fin,
          url: participanteUrl
        }
      });
      console.log(`✅ Correo enviado a ${participante.email} para venta directa`);
    } catch (emailError) {
      console.error('❌ Error enviando correo de confirmación:', emailError);
      // No fallar la operación por error de correo
    }

    res.status(201).json({
      message: 'Venta realizada exitosamente',
      participante: {
        id: participante.id,
        nombre: participante.nombre,
        telefono: participante.telefono,
        numerosSeleccionados: participante.numeros_seleccionados,
        totalPagado: participante.total_pagado,
        estado: participante.estado,
        fechaParticipacion: participante.fecha_participacion
      },
      venta: {
        tipo: 'directa',
        confirmada: true,
        mensaje: 'Los números han sido vendidos y confirmados automáticamente'
      }
    });

  } catch (error) {
    console.error('Error en venta directa:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/participantes/:rifaId/vender-admin - Venta directa por admin con email opcional (invitados)
router.post('/:rifaId/vender-admin', validateRifaId, authenticateToken, sanitizeInput, async (req, res) => {
  try {
    const { rifaId } = req.params;
    let { nombre, telefono, email, numerosSeleccionados } = req.body;

    // Normalizar entrada mínima
    if (!Array.isArray(numerosSeleccionados) || numerosSeleccionados.length === 0) {
      return res.status(400).json({
        error: 'Debes seleccionar al menos un elemento',
        code: 'NO_ELEMENTS_SELECTED'
      });
    }

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({
        error: 'El nombre del participante es obligatorio',
        code: 'NAME_REQUIRED'
      });
    }

    // Verificar que la rifa existe y está activa
    const rifaResult = await query(
      'SELECT * FROM rifas WHERE id = $1 AND activa = true AND fecha_fin > CURRENT_TIMESTAMP',
      [rifaId]
    );

    if (rifaResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Rifa no encontrada o no está disponible',
        code: 'RIFA_NOT_AVAILABLE'
      });
    }

    const rifa = rifaResult.rows[0];

    // Verificar que el usuario es el creador de la rifa
    if (req.user.id !== rifa.usuario_id) {
      return res.status(403).json({
        error: 'Solo el creador de la rifa puede vender números directamente',
        code: 'UNAUTHORIZED_SALE'
      });
    }

    // Verificar disponibilidad de elementos
    const elementosDisponibles = await query(`
      SELECT elemento 
      FROM (
        SELECT jsonb_array_elements_text(elementos_personalizados) as elemento 
        FROM rifas 
        WHERE id = $1
      ) todos_elementos
      WHERE elemento NOT IN (
        SELECT elemento FROM elementos_vendidos WHERE rifa_id = $1
        UNION
        SELECT elemento FROM elementos_reservados WHERE rifa_id = $1 AND activo = true
      )
    `, [rifaId]);

    const disponibles = elementosDisponibles.rows.map(row => String(row.elemento));
    const noDisponibles = numerosSeleccionados.filter(num => !disponibles.includes(String(num)));

    if (noDisponibles.length > 0) {
      return res.status(400).json({
        error: 'Algunos números no están disponibles',
        details: { noDisponibles, disponibles: disponibles.slice(0, 10) },
        code: 'NUMBERS_NOT_AVAILABLE'
      });
    }

    // Si el email no viene, generar uno default para invitado
    if (!email || !email.trim()) {
      email = generarEmailDefault(nombre, rifaId);
    }

    // Crear participante con sistema híbrido (venta directa)
    const participante = await crearParticipanteHibrido(
      { nombre, telefono: telefono || null, email, numerosSeleccionados },
      rifaId,
      rifa,
      'confirmado'
    );

    // Marcar elementos como vendidos directamente
    for (const elemento of numerosSeleccionados) {
      await query(`
        INSERT INTO elementos_vendidos (
          rifa_id, participante_id, elemento, fecha_venta
        ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      `, [rifaId, participante.id, elemento]);
    }

    // Enviar correo solo si es un email real (no default)
    try {
      if (esEmailReal(email)) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const participanteUrl = `${frontendUrl}/participante/${rifaId}/${participante.id}`;
        await emailService.sendParticipationConfirmation({
          participante: {
            nombre: participante.nombre,
            email: participante.email,
            numerosSeleccionados: participante.numeros_seleccionados,
            totalPagado: participante.total_pagado
          },
          rifa: {
            nombre: rifa.nombre,
            descripcion: rifa.descripcion,
            fechaFin: rifa.fecha_fin,
            url: participanteUrl
          }
        });
      }
    } catch (emailError) {
      console.error('❌ Error enviando correo (invitado permitido):', emailError);
    }

    res.status(201).json({
      message: 'Venta realizada exitosamente',
      participante: {
        id: participante.id,
        nombre: participante.nombre,
        email: participante.email,
        telefono: participante.telefono,
        numerosSeleccionados: participante.numeros_seleccionados,
        totalPagado: participante.total_pagado,
        estado: participante.estado
      },
      venta: { tipo: 'directa_admin', confirmada: true }
    });

  } catch (error) {
    console.error('Error en vender-admin:', error);
    res.status(500).json({ error: 'Error interno del servidor', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/participantes/:rifaId/confirmar-venta - Confirmar venta de administrador
router.post('/:rifaId/confirmar-venta', validateRifaId, authenticateToken, sanitizeInput, async (req, res) => {
  try {
    console.log('Confirmar venta - Iniciando...');
    const { rifaId } = req.params;
    const { participanteId } = req.body;
    console.log('RifaId:', rifaId, 'ParticipanteId:', participanteId);

    // Verificar que la rifa existe
    const rifaResult = await query(
      'SELECT * FROM rifas WHERE id = $1',
      [rifaId]
    );

    if (rifaResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Rifa no encontrada',
        code: 'RIFA_NOT_FOUND'
      });
    }

    const rifa = rifaResult.rows[0];

    // Verificar que el usuario es el creador de la rifa
    if (req.user.id !== rifa.usuario_id) {
      return res.status(403).json({
        error: 'Solo el creador de la rifa puede confirmar ventas',
        code: 'UNAUTHORIZED_CONFIRMATION'
      });
    }

    // Verificar que el participante existe
    const participanteResult = await query(
      'SELECT * FROM participantes WHERE id = $1 AND rifa_id = $2',
      [participanteId, rifaId]
    );

    if (participanteResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Participante no encontrado',
        code: 'PARTICIPANT_NOT_FOUND'
      });
    }

    const participante = participanteResult.rows[0];

    // Actualizar participante a confirmado
    await query(`
      UPDATE participantes 
      SET estado = 'confirmado', fecha_confirmacion = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [participanteId]);

    // Mover elementos de reservados a vendidos
    const numerosSeleccionados = participante.numeros_seleccionados;
    
    // Primero eliminar TODOS los elementos reservados de este participante
    await query(`
      DELETE FROM elementos_reservados 
      WHERE rifa_id = $1 AND participante_id = $2
    `, [rifaId, participanteId]);
    
    // Luego agregar todos los elementos a vendidos
    for (const elemento of numerosSeleccionados) {
      await query(`
        INSERT INTO elementos_vendidos (rifa_id, participante_id, elemento, fecha_venta)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (rifa_id, elemento) DO NOTHING
      `, [rifaId, participanteId, elemento]);
    }

    // Enviar email de confirmación al participante
    try {
      const participanteData = {
        nombre: participante.nombre,
        email: participante.email,
        numerosSeleccionados: numerosSeleccionados,
        totalPagar: (parseFloat(rifa.precio) * numerosSeleccionados.length).toFixed(2)
      };

      const rifaData = {
        id: rifa.id,
        nombre: rifa.nombre,
        fecha_sorteo: rifa.fecha_sorteo,
        plataforma_transmision: rifa.plataforma_transmision
      };

      await emailService.sendParticipationConfirmation(participanteData, rifaData);
      console.log('✅ Email de confirmación enviado al participante');
    } catch (emailError) {
      console.error('❌ Error enviando email de confirmación:', emailError);
      // No fallar la operación si el email falla
    }

    // Verificar si la rifa está agotada y enviar notificación al dueño
    try {
      await checkAndNotifySoldOut(rifaId);
    } catch (soldOutError) {
      console.error('❌ Error verificando rifa agotada:', soldOutError);
      // No fallar la operación si la verificación falla
    }

    res.json({
      message: 'Venta confirmada exitosamente',
      participante: {
        id: participante.id,
        nombre: participante.nombre,
        estado: 'confirmado',
        numerosSeleccionados: numerosSeleccionados
      }
    });

  } catch (error) {
    console.error('Error confirmando venta:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Endpoint para vista confidencial del participante
router.get('/:rifaId/participante/:participanteId', async (req, res) => {
  try {
    const { rifaId, participanteId } = req.params;

    // Obtener datos de la rifa
    const rifaResult = await query(`
      SELECT 
        r.*,
        u.nombre as creador_nombre,
        u.email as creador_email
      FROM rifas r
      LEFT JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.id = $1 AND r.activa = true
    `, [rifaId]);

    if (rifaResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Rifa no encontrada',
        code: 'RIFA_NOT_FOUND'
      });
    }

    const rifa = rifaResult.rows[0];

    // Obtener datos del participante
    const participanteResult = await query(`
      SELECT 
        p.*,
        array_agg(ev.elemento ORDER BY ev.elemento) as numeros_seleccionados
      FROM participantes p
      LEFT JOIN elementos_vendidos ev ON p.id = ev.participante_id
      WHERE p.id = $1 AND p.rifa_id = $2
      GROUP BY p.id
    `, [participanteId, rifaId]);

    if (participanteResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Participante no encontrado',
        code: 'PARTICIPANTE_NOT_FOUND'
      });
    }

    const participante = participanteResult.rows[0];

    // Obtener estadísticas de la rifa (sin datos confidenciales)
    const statsResult = await query(`
      SELECT 
        COUNT(DISTINCT p.id) as total_participantes,
        COUNT(ev.elemento) as elementos_vendidos,
        COALESCE(SUM(CASE WHEN p.estado = 'confirmado' THEN p.total_pagado ELSE 0 END), 0) as total_recaudado
      FROM participantes p
      LEFT JOIN elementos_vendidos ev ON p.id = ev.participante_id
      WHERE p.rifa_id = $1
    `, [rifaId]);

    const stats = statsResult.rows[0];

    // Calcular elementos disponibles
    const elementosDisponibles = rifa.cantidad_elementos - parseInt(stats.elementos_vendidos);

    res.json({
      rifa: {
        id: rifa.id,
        nombre: rifa.nombre,
        descripcion: rifa.descripcion,
        precio: rifa.precio,
        fecha_fin: rifa.fecha_fin,
        tipo: rifa.tipo,
        cantidad_elementos: rifa.cantidad_elementos,
        elementos_personalizados: rifa.elementos_personalizados,
        reglas: rifa.reglas,
        fecha_sorteo: rifa.fecha_sorteo,
        plataforma_transmision: rifa.plataforma_transmision,
        enlace_transmision: rifa.enlace_transmision,
        metodo_sorteo: rifa.metodo_sorteo,
        creador_nombre: rifa.creador_nombre
      },
      participante: {
        id: participante.id,
        nombre: participante.nombre,
        email: participante.email,
        telefono: participante.telefono,
        numeros_seleccionados: participante.numeros_seleccionados || [],
        total_pagado: participante.total_pagado,
        fecha_participacion: participante.fecha_participacion,
        estado: participante.estado
      },
      estadisticas: {
        total_participantes: parseInt(stats.total_participantes),
        elementos_vendidos: parseInt(stats.elementos_vendidos),
        elementos_disponibles: elementosDisponibles,
        total_recaudado: parseFloat(stats.total_recaudado || 0)
      }
    });

  } catch (error) {
    console.error('Error obteniendo datos del participante:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/participantes/historial/:email - Obtener historial de participaciones de un usuario registrado
router.get('/historial/:email', async (req, res) => {
  try {
    const { email } = req.params;

    // Verificar que el email es real (no default)
    if (!esEmailReal(email)) {
      return res.status(400).json({
        error: 'Email no válido para historial',
        code: 'INVALID_EMAIL'
      });
    }

    const participaciones = await obtenerHistorialParticipaciones(email);

    res.json({
      email,
      totalParticipaciones: participaciones.length,
      participaciones: participaciones.map(p => ({
        id: p.id,
        rifa: {
          id: p.rifa_id,
          nombre: p.rifa_nombre,
          descripcion: p.rifa_descripcion,
          precio: p.rifa_precio,
          fecha_fin: p.fecha_fin,
          tipo: p.rifa_tipo,
          activa: p.rifa_activa,
          creador: p.creador_nombre
        },
        numeros_seleccionados: p.numeros_seleccionados,
        total_pagado: p.total_pagado,
        estado: p.estado,
        fecha_participacion: p.fecha_participacion,
        fecha_confirmacion: p.fecha_confirmacion
      }))
    });

  } catch (error) {
    console.error('Error obteniendo historial de participaciones:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/participantes/registro - Registro de participante
router.post('/registro', async (req, res) => {
  try {
    const { nombre, email, telefono } = req.body;

    // Validar datos requeridos
    if (!nombre || !email || !telefono) {
      return res.status(400).json({
        error: 'Todos los campos son obligatorios',
        code: 'MISSING_FIELDS'
      });
    }

    // Verificar si el email ya existe
    const usuarioExistente = await query(
      'SELECT id FROM usuarios_participantes WHERE email = $1',
      [email]
    );

    if (usuarioExistente.rows.length > 0) {
      return res.status(409).json({
        error: 'Este email ya está registrado',
        code: 'EMAIL_EXISTS'
      });
    }

    // Crear nuevo usuario participante
    const nuevoUsuario = await query(`
      INSERT INTO usuarios_participantes (email, nombre, telefono)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [email, nombre, telefono]);

    res.status(201).json({
      message: 'Usuario participante registrado exitosamente',
      usuario: {
        id: nuevoUsuario.rows[0].id,
        nombre: nuevoUsuario.rows[0].nombre,
        email: nuevoUsuario.rows[0].email,
        telefono: nuevoUsuario.rows[0].telefono
      }
    });

  } catch (error) {
    console.error('Error registrando participante:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;
