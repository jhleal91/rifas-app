/**
 * Rutas para el sistema de notificaciones
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../services/notifications');
const logger = require('../config/logger');

/**
 * GET /api/notifications
 * Obtener notificaciones del usuario autenticado
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { solo_no_leidas, limit = 50, offset = 0 } = req.query;
    const usuario_id = req.user.id;
    
    const notifications = await getUserNotifications(usuario_id, {
      solo_no_leidas: solo_no_leidas === 'true',
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });
    
    res.json({
      success: true,
      notifications,
      count: notifications.length
    });
  } catch (error) {
    logger.error('Error obteniendo notificaciones', {
      error: error.message,
      userId: req.user.id
    });
    res.status(500).json({
      success: false,
      error: 'Error obteniendo notificaciones',
      message: error.message
    });
  }
});

/**
 * GET /api/notifications/unread-count
 * Obtener cantidad de notificaciones no leídas
 */
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const usuario_id = req.user.id;
    const count = await getUnreadCount(usuario_id);
    
    res.json({
      success: true,
      count
    });
  } catch (error) {
    logger.error('Error obteniendo contador de notificaciones', {
      error: error.message,
      userId: req.user.id
    });
    res.status(500).json({
      success: false,
      error: 'Error obteniendo contador',
      message: error.message
    });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Marcar notificación como leída
 */
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notificacion_id = parseInt(req.params.id, 10);
    const usuario_id = req.user.id;
    
    const notification = await markAsRead(notificacion_id, usuario_id);
    
    res.json({
      success: true,
      notification
    });
  } catch (error) {
    logger.error('Error marcando notificación como leída', {
      error: error.message,
      notificationId: req.params.id,
      userId: req.user.id
    });
    res.status(500).json({
      success: false,
      error: 'Error marcando notificación como leída',
      message: error.message
    });
  }
});

/**
 * PUT /api/notifications/read-all
 * Marcar todas las notificaciones como leídas
 */
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const usuario_id = req.user.id;
    const count = await markAllAsRead(usuario_id);
    
    res.json({
      success: true,
      count
    });
  } catch (error) {
    logger.error('Error marcando todas las notificaciones como leídas', {
      error: error.message,
      userId: req.user.id
    });
    res.status(500).json({
      success: false,
      error: 'Error marcando notificaciones como leídas',
      message: error.message
    });
  }
});

/**
 * DELETE /api/notifications/:id
 * Eliminar notificación
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notificacion_id = parseInt(req.params.id, 10);
    const usuario_id = req.user.id;
    
    await deleteNotification(notificacion_id, usuario_id);
    
    res.json({
      success: true,
      message: 'Notificación eliminada'
    });
  } catch (error) {
    logger.error('Error eliminando notificación', {
      error: error.message,
      notificationId: req.params.id,
      userId: req.user.id
    });
    res.status(500).json({
      success: false,
      error: 'Error eliminando notificación',
      message: error.message
    });
  }
});

/**
 * POST /api/notifications/test
 * Endpoint de prueba para enviar una notificación de prueba
 */
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const usuario_id = req.user.id;
    const io = req.app.get('io'); // Obtener instancia de Socket.io
    
    const { createNotification } = require('../services/notifications');
    
    // Crear notificación de prueba
    const notification = await createNotification({
      usuario_id,
      tipo: 'participacion',
      titulo: '🔔 Notificación de Prueba',
      mensaje: 'Esta es una notificación de prueba. El sistema de notificaciones en tiempo real está funcionando correctamente.',
      datos_adicionales: {
        test: true,
        timestamp: new Date().toISOString()
      },
      io // Pasar Socket.io para emitir en tiempo real
    });
    
    logger.info('Notificación de prueba enviada', {
      userId: usuario_id,
      notificationId: notification.id
    });
    
    res.json({
      success: true,
      message: 'Notificación de prueba enviada',
      notification
    });
  } catch (error) {
    logger.error('Error enviando notificación de prueba', {
      error: error.message,
      userId: req.user.id
    });
    res.status(500).json({
      success: false,
      error: 'Error enviando notificación de prueba',
      message: error.message
    });
  }
});

module.exports = router;

