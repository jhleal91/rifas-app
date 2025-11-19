/**
 * Servicio de Notificaciones en la Aplicación
 * Maneja la creación, almacenamiento y emisión de notificaciones
 */

const db = require('../config/database');
const logger = require('../config/logger');
const { emitNotification, emitUnreadCount } = require('../utils/socketNotifications');

/**
 * Tipos de notificaciones disponibles
 */
const NOTIFICATION_TYPES = {
  PARTICIPACION: 'participacion',
  PAGO_CONFIRMADO: 'pago_confirmado',
  PAGO_RECHAZADO: 'pago_rechazado',
  RIFA_ACTUALIZADA: 'rifa_actualizada',
  NUEVO_PARTICIPANTE: 'nuevo_participante',
  RIFA_FINALIZADA: 'rifa_finalizada',
  NUMERO_RESERVADO: 'numero_reservado',
  SORTEO_REALIZADO: 'sorteo_realizado',
  GANADOR_SELECCIONADO: 'ganador_seleccionado'
};

/**
 * Crear una nueva notificación
 * @param {Object} notificationData - Datos de la notificación
 * @param {number} notificationData.usuario_id - ID del usuario destinatario
 * @param {string} notificationData.tipo - Tipo de notificación
 * @param {string} notificationData.titulo - Título de la notificación
 * @param {string} notificationData.mensaje - Mensaje de la notificación
 * @param {Object} notificationData.datos_adicionales - Datos adicionales (opcional)
 * @returns {Promise<Object>} Notificación creada
 */
async function createNotification({ usuario_id, tipo, titulo, mensaje, datos_adicionales = null, io = null }) {
  try {
    const query = `
      INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, datos_adicionales)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await db.query(query, [
      usuario_id,
      tipo,
      titulo,
      mensaje,
      datos_adicionales ? JSON.stringify(datos_adicionales) : null
    ]);

    const notification = result.rows[0];
    
    // Parsear datos_adicionales si existe
    if (notification.datos_adicionales) {
      notification.datos_adicionales = typeof notification.datos_adicionales === 'string' 
        ? JSON.parse(notification.datos_adicionales)
        : notification.datos_adicionales;
    }

    logger.info('Notificación creada en BD', {
      id: notification.id,
      usuario_id,
      tipo,
      titulo: notification.titulo
    });

    // Emitir notificación vía Socket.io si está disponible
    if (io) {
      logger.info('Emitiendo notificación vía Socket.io', {
        notificationId: notification.id,
        usuario_id,
        tipo
      });
      
      emitNotification(io, usuario_id, notification);
      
      // Actualizar contador de no leídas
      getUnreadCount(usuario_id).then(count => {
        logger.info('Contador de no leídas actualizado', {
          usuario_id,
          count
        });
        emitUnreadCount(io, usuario_id, count);
      }).catch(err => {
        logger.error('Error obteniendo contador de no leídas', { error: err.message });
      });
    } else {
      logger.warn('⚠️ Socket.io no disponible, notificación solo guardada en BD', {
        notificationId: notification.id,
        usuario_id
      });
    }

    return notification;
  } catch (error) {
    logger.error('Error creando notificación', {
      error: error.message,
      usuario_id,
      tipo
    });
    throw error;
  }
}

/**
 * Obtener notificaciones de un usuario
 * @param {number} usuario_id - ID del usuario
 * @param {Object} options - Opciones de consulta
 * @param {boolean} options.solo_no_leidas - Solo notificaciones no leídas
 * @param {number} options.limit - Límite de resultados
 * @param {number} options.offset - Offset para paginación
 * @returns {Promise<Array>} Lista de notificaciones
 */
async function getUserNotifications(usuario_id, options = {}) {
  try {
    const { solo_no_leidas = false, limit = 50, offset = 0 } = options;
    
    let query = `
      SELECT 
        id,
        tipo,
        titulo,
        mensaje,
        datos_adicionales,
        leida,
        leida_at,
        created_at
      FROM notificaciones
      WHERE usuario_id = $1
    `;
    
    const params = [usuario_id];
    
    if (solo_no_leidas) {
      query += ' AND leida = FALSE';
    }
    
    query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    // Parsear datos_adicionales
    const notifications = result.rows.map(notif => {
      if (notif.datos_adicionales) {
        notif.datos_adicionales = typeof notif.datos_adicionales === 'string'
          ? JSON.parse(notif.datos_adicionales)
          : notif.datos_adicionales;
      }
      return notif;
    });
    
    return notifications;
  } catch (error) {
    logger.error('Error obteniendo notificaciones', {
      error: error.message,
      usuario_id
    });
    throw error;
  }
}

/**
 * Contar notificaciones no leídas de un usuario
 * @param {number} usuario_id - ID del usuario
 * @returns {Promise<number>} Cantidad de notificaciones no leídas
 */
async function getUnreadCount(usuario_id) {
  try {
    const query = `
      SELECT COUNT(*) as count
      FROM notificaciones
      WHERE usuario_id = $1 AND leida = FALSE
    `;
    
    const result = await db.query(query, [usuario_id]);
    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    logger.error('Error contando notificaciones no leídas', {
      error: error.message,
      usuario_id
    });
    throw error;
  }
}

/**
 * Marcar notificación como leída
 * @param {number} notificacion_id - ID de la notificación
 * @param {number} usuario_id - ID del usuario (para validación)
 * @returns {Promise<Object>} Notificación actualizada
 */
async function markAsRead(notificacion_id, usuario_id) {
  try {
    const query = `
      UPDATE notificaciones
      SET leida = TRUE, leida_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND usuario_id = $2
      RETURNING *
    `;
    
    const result = await db.query(query, [notificacion_id, usuario_id]);
    
    if (result.rows.length === 0) {
      throw new Error('Notificación no encontrada o no pertenece al usuario');
    }
    
    const notification = result.rows[0];
    
    if (notification.datos_adicionales) {
      notification.datos_adicionales = typeof notification.datos_adicionales === 'string'
        ? JSON.parse(notification.datos_adicionales)
        : notification.datos_adicionales;
    }
    
    logger.info('Notificación marcada como leída', {
      id: notificacion_id,
      usuario_id
    });
    
    return notification;
  } catch (error) {
    logger.error('Error marcando notificación como leída', {
      error: error.message,
      notificacion_id,
      usuario_id
    });
    throw error;
  }
}

/**
 * Marcar todas las notificaciones de un usuario como leídas
 * @param {number} usuario_id - ID del usuario
 * @returns {Promise<number>} Cantidad de notificaciones actualizadas
 */
async function markAllAsRead(usuario_id) {
  try {
    const query = `
      UPDATE notificaciones
      SET leida = TRUE, leida_at = CURRENT_TIMESTAMP
      WHERE usuario_id = $1 AND leida = FALSE
      RETURNING id
    `;
    
    const result = await db.query(query, [usuario_id]);
    
    logger.info('Todas las notificaciones marcadas como leídas', {
      usuario_id,
      count: result.rows.length
    });
    
    return result.rows.length;
  } catch (error) {
    logger.error('Error marcando todas las notificaciones como leídas', {
      error: error.message,
      usuario_id
    });
    throw error;
  }
}

/**
 * Eliminar notificación
 * @param {number} notificacion_id - ID de la notificación
 * @param {number} usuario_id - ID del usuario (para validación)
 * @returns {Promise<boolean>} True si se eliminó correctamente
 */
async function deleteNotification(notificacion_id, usuario_id) {
  try {
    const query = `
      DELETE FROM notificaciones
      WHERE id = $1 AND usuario_id = $2
      RETURNING id
    `;
    
    const result = await db.query(query, [notificacion_id, usuario_id]);
    
    if (result.rows.length === 0) {
      throw new Error('Notificación no encontrada o no pertenece al usuario');
    }
    
    logger.info('Notificación eliminada', {
      id: notificacion_id,
      usuario_id
    });
    
    return true;
  } catch (error) {
    logger.error('Error eliminando notificación', {
      error: error.message,
      notificacion_id,
      usuario_id
    });
    throw error;
  }
}

/**
 * Notificar nueva participación en una rifa
 * @param {number} rifa_id - ID de la rifa
 * @param {number} creador_id - ID del creador de la rifa
 * @param {Object} participacionData - Datos de la participación
 * @param {Object} io - Instancia de Socket.io (opcional)
 */
async function notifyNewParticipation(rifa_id, creador_id, participacionData, io = null) {
  try {
    const { nombre_participante, numeros, total } = participacionData;
    
    const notification = await createNotification({
      usuario_id: creador_id,
      tipo: NOTIFICATION_TYPES.NUEVO_PARTICIPANTE,
      titulo: 'Nueva participación en tu rifa',
      mensaje: `${nombre_participante} ha participado con ${numeros.length} número(s) por un total de $${total}`,
      datos_adicionales: {
        rifa_id,
        participante_nombre: nombre_participante,
        numeros,
        total
      },
      io
    });
    
    return notification;
  } catch (error) {
    logger.error('Error notificando nueva participación', {
      error: error.message,
      rifa_id,
      creador_id
    });
    throw error;
  }
}

/**
 * Notificar confirmación de pago
 * @param {number} participante_id - ID del participante
 * @param {number} rifa_id - ID de la rifa
 * @param {Object} pagoData - Datos del pago
 * @param {number} creador_id - ID del creador de la rifa (opcional, se busca si no se proporciona)
 * @param {Object} io - Instancia de Socket.io (opcional)
 */
async function notifyPaymentConfirmed(participante_id, rifa_id, pagoData, creador_id = null, io = null) {
  try {
    // Notificar al participante (si tiene cuenta de usuario)
    const { usuario_id: participante_user_id, total } = pagoData;
    
    if (participante_user_id) {
      await createNotification({
        usuario_id: participante_user_id,
        tipo: NOTIFICATION_TYPES.PAGO_CONFIRMADO,
        titulo: 'Pago confirmado',
        mensaje: `Tu pago de $${total} ha sido confirmado. Tu participación está activa.`,
        datos_adicionales: {
          rifa_id,
          participante_id,
          total
        },
        io
      });
    }
    
    // Obtener creador_id si no se proporcionó
    if (!creador_id) {
      const rifaQuery = 'SELECT usuario_id FROM rifas WHERE id = $1';
      const rifaResult = await db.query(rifaQuery, [rifa_id]);
      
      if (rifaResult.rows.length > 0) {
        creador_id = rifaResult.rows[0].usuario_id;
      }
    }
    
    // Notificar al creador de la rifa
    if (creador_id) {
      logger.info('Creando notificación para creador', {
        creador_id,
        participante_id,
        rifa_id,
        total,
        ioAvailable: !!io
      });
      
      // Obtener información del participante para el mensaje
      const participanteQuery = 'SELECT nombre, numeros_seleccionados FROM participantes WHERE id = $1';
      const participanteResult = await db.query(participanteQuery, [participante_id]);
      
      let mensaje = `Se ha confirmado un pago de $${total} en tu rifa`;
      if (participanteResult.rows.length > 0) {
        const participante = participanteResult.rows[0];
        const numeros = participante.numeros_seleccionados || [];
        mensaje = `${participante.nombre} ha pagado $${total} por ${numeros.length} número(s): ${numeros.join(', ')}`;
      }
      
      const notification = await createNotification({
        usuario_id: creador_id,
        tipo: NOTIFICATION_TYPES.PAGO_CONFIRMADO,
        titulo: '💳 Pago confirmado en tu rifa',
        mensaje: mensaje,
        datos_adicionales: {
          rifa_id,
          participante_id,
          total,
          numeros: participanteResult.rows[0]?.numeros_seleccionados || []
        },
        io
      });
      
      logger.info('✅ Notificación creada exitosamente', {
        notificationId: notification.id,
        creador_id,
        tipo: notification.tipo
      });
    } else {
      logger.warn('⚠️ No se puede crear notificación: creador_id no proporcionado', {
        participante_id,
        rifa_id
      });
    }
  } catch (error) {
    logger.error('Error notificando confirmación de pago', {
      error: error.message,
      participante_id,
      rifa_id
    });
    throw error;
  }
}

/**
 * Notificar cuando se selecciona un ganador
 * @param {number} rifa_id - ID de la rifa
 * @param {string} numero_ganador - Número ganador
 * @param {Object} io - Instancia de Socket.io (opcional)
 */
async function notifyWinnerSelected(rifa_id, numero_ganador, io = null) {
  try {
    // Obtener información de la rifa y el ganador
    const rifaQuery = `
      SELECT r.id, r.nombre, r.usuario_id as creador_id,
             p.id as participante_id, p.nombre as participante_nombre, p.email as participante_email
      FROM rifas r
      LEFT JOIN elementos_vendidos ev ON ev.rifa_id = r.id AND ev.elemento = $2
      LEFT JOIN participantes p ON p.id = ev.participante_id
      WHERE r.id = $1
    `;
    const rifaResult = await db.query(rifaQuery, [rifa_id, numero_ganador]);
    
    if (rifaResult.rows.length === 0) {
      logger.warn('Rifa no encontrada para notificar ganador', { rifa_id });
      return;
    }
    
    const rifa = rifaResult.rows[0];
    
    // Notificar al creador
    if (rifa.creador_id) {
      await createNotification({
        usuario_id: rifa.creador_id,
        tipo: NOTIFICATION_TYPES.GANADOR_SELECCIONADO,
        titulo: '🎉 Ganador seleccionado en tu rifa',
        mensaje: `El número ganador ${numero_ganador} ha sido seleccionado en la rifa "${rifa.nombre}"`,
        datos_adicionales: {
          rifa_id,
          numero_ganador,
          participante_id: rifa.participante_id,
          participante_nombre: rifa.participante_nombre
        },
        io
      });
    }
    
    // Notificar al ganador (si tiene cuenta de usuario)
    if (rifa.participante_id && rifa.participante_email) {
      // Buscar si el participante tiene cuenta de usuario
      const usuarioQuery = `
        SELECT u.id FROM usuarios u
        WHERE u.email = $1
      `;
      const usuarioResult = await db.query(usuarioQuery, [rifa.participante_email]);
      
      if (usuarioResult.rows.length > 0) {
        const usuario_id = usuarioResult.rows[0].id;
        await createNotification({
          usuario_id: usuario_id,
          tipo: NOTIFICATION_TYPES.GANADOR_SELECCIONADO,
          titulo: '🎉 ¡Felicidades! Eres el ganador',
          mensaje: `Has ganado la rifa "${rifa.nombre}" con el número ${numero_ganador}`,
          datos_adicionales: {
            rifa_id,
            numero_ganador,
            participante_id: rifa.participante_id
          },
          io
        });
      }
    }
    
    logger.info('Notificaciones de ganador enviadas', {
      rifa_id,
      numero_ganador,
      creador_id: rifa.creador_id
    });
  } catch (error) {
    logger.error('Error notificando ganador seleccionado', {
      error: error.message,
      rifa_id,
      numero_ganador
    });
    throw error;
  }
}

/**
 * Notificar cuando una rifa está cerca de finalizar (24 horas antes)
 * @param {number} rifa_id - ID de la rifa
 * @param {Object} io - Instancia de Socket.io (opcional)
 */
async function notifyRaffleEndingSoon(rifa_id, io = null) {
  try {
    const rifaQuery = `
      SELECT id, nombre, usuario_id, fecha_fin
      FROM rifas
      WHERE id = $1 AND activa = true
    `;
    const rifaResult = await db.query(rifaQuery, [rifa_id]);
    
    if (rifaResult.rows.length === 0) {
      logger.warn('Rifa no encontrada para notificar finalización', { rifa_id });
      return;
    }
    
    const rifa = rifaResult.rows[0];
    
    // Notificar al creador
    if (rifa.usuario_id) {
      const fechaFin = new Date(rifa.fecha_fin);
      const fechaFinFormateada = fechaFin.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      await createNotification({
        usuario_id: rifa.usuario_id,
        tipo: NOTIFICATION_TYPES.RIFA_FINALIZADA,
        titulo: '⏰ Tu rifa finaliza pronto',
        mensaje: `La rifa "${rifa.nombre}" finaliza el ${fechaFinFormateada}. ¡Asegúrate de realizar el sorteo!`,
        datos_adicionales: {
          rifa_id,
          fecha_fin: rifa.fecha_fin
        },
        io
      });
    }
    
    logger.info('Notificación de rifa por finalizar enviada', {
      rifa_id,
      creador_id: rifa.usuario_id
    });
  } catch (error) {
    logger.error('Error notificando rifa por finalizar', {
      error: error.message,
      rifa_id
    });
    throw error;
  }
}

module.exports = {
  NOTIFICATION_TYPES,
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  notifyNewParticipation,
  notifyPaymentConfirmed,
  notifyWinnerSelected,
  notifyRaffleEndingSoon
};

