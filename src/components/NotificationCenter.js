import React from 'react';
import { useNotifications } from '../contexts/NotificationsContext';
import { useTranslation } from 'react-i18next';
import './NotificationCenter.css';

const NotificationCenter = ({ onClose }) => {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();
  const { t } = useTranslation();

  // Formatear fecha relativa
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return t('notifications.justNow');
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return t('notifications.minutesAgo', { count: minutes });
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return t('notifications.hoursAgo', { count: hours });
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return t('notifications.daysAgo', { count: days });
    } else {
      return date.toLocaleDateString();
    }
  };

  // Obtener icono y color según tipo
  const getNotificationConfig = (tipo) => {
    const configs = {
      participacion: { icon: '🎫', color: 'blue-500' },
      pago_confirmado: { icon: '✅', color: 'blue-400' },
      pago_rechazado: { icon: '❌', color: 'orange-400' },
      rifa_actualizada: { icon: '📝', color: 'blue-600' },
      nuevo_participante: { icon: '👤', color: 'orange-500' },
      rifa_finalizada: { icon: '🏁', color: 'blue-500' },
      numero_reservado: { icon: '🔒', color: 'blue-400' },
      sorteo_realizado: { icon: '🎲', color: 'blue-500' },
      ganador_seleccionado: { icon: '🏆', color: 'orange-500' }
    };
    return configs[tipo] || { icon: '🔔', color: 'blue-500' };
  };

  // Manejar click en notificación
  const handleNotificationClick = (notification) => {
    if (!notification.leida) {
      markAsRead(notification.id);
    }
  };

  if (loading) {
    return (
      <div className="notification-dropdown">
        <div className="notification-dropdown-content">
          <div className="notification-loading">
            <div className="notification-spinner"></div>
            <p>{t('notifications.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-dropdown">
      <div className="notification-dropdown-content">
        {/* Header con gradiente azul */}
        <div className="notification-dropdown-header">
          <h2 className="notification-dropdown-title">
            {t('notifications.title')}
          </h2>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="notification-mark-all-read"
            >
              <svg className="notification-check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>{t('notifications.markAllRead')}</span>
            </button>
          )}
        </div>

        {/* Lista de notificaciones */}
        <div className="notification-dropdown-list">
          {notifications.length === 0 ? (
            <div className="notification-empty">
              <svg className="notification-empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <p>{t('notifications.noNotifications')}</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const config = getNotificationConfig(notification.tipo);
              return (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.leida ? 'notification-unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-item-content">
                    {/* Icono con fondo de color */}
                    <div className={`notification-icon-wrapper notification-icon-${config.color}`}>
                      <span className="notification-icon-emoji">{config.icon}</span>
                    </div>

                    {/* Contenido */}
                    <div className="notification-item-text">
                      <div className="notification-item-header">
                        <h3 className="notification-item-title">
                          {notification.titulo}
                        </h3>
                        <div className="notification-item-actions">
                          {!notification.leida && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="notification-action-btn notification-action-check"
                              title={t('notifications.markAllRead')}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="notification-action-btn notification-action-delete"
                            title={t('notifications.delete')}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p className="notification-item-description">
                        {notification.mensaje}
                      </p>
                      <p className="notification-item-time">
                        {formatRelativeTime(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="notification-dropdown-footer">
            <button className="notification-view-all">
              {t('notifications.viewAll') || 'Ver todas las notificaciones'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
