/**
 * Utilidad para emitir notificaciones a través de Socket.io
 */

const logger = require('../config/logger');

/**
 * Emitir notificación a un usuario específico
 * @param {Object} io - Instancia de Socket.io
 * @param {number} userId - ID del usuario destinatario
 * @param {Object} notification - Objeto de notificación
 */
function emitNotification(io, userId, notification) {
  try {
    if (!io) {
      logger.warn('⚠️ Socket.io no está disponible, no se puede emitir notificación');
      return;
    }
    
    // Verificar que el usuario esté conectado
    const room = `user:${userId}`;
    const socketsInRoom = io.sockets.adapter.rooms.get(room);
    const connectedUsers = socketsInRoom ? socketsInRoom.size : 0;
    
    logger.info('Emitiendo notificación', {
      userId,
      notificationId: notification.id,
      tipo: notification.tipo,
      room,
      connectedUsers
    });
    
    // Emitir a la sala del usuario
    io.to(room).emit('notification', notification);
    
    // También emitir globalmente por si acaso (para debugging)
    logger.info('✅ Notificación emitida vía Socket.io', {
      userId,
      notificationId: notification.id,
      tipo: notification.tipo,
      connectedUsers
    });
  } catch (error) {
    logger.error('❌ Error emitiendo notificación vía Socket.io', {
      error: error.message,
      stack: error.stack,
      userId
    });
  }
}

/**
 * Emitir actualización del contador de notificaciones no leídas
 * @param {Object} io - Instancia de Socket.io
 * @param {number} userId - ID del usuario
 * @param {number} count - Cantidad de notificaciones no leídas
 */
function emitUnreadCount(io, userId, count) {
  try {
    if (!io) {
      return;
    }
    
    io.to(`user:${userId}`).emit('unread-count', { count });
    logger.debug('Contador de notificaciones no leídas emitido', {
      userId,
      count
    });
  } catch (error) {
    logger.error('Error emitiendo contador de notificaciones', {
      error: error.message,
      userId
    });
  }
}

module.exports = {
  emitNotification,
  emitUnreadCount
};

