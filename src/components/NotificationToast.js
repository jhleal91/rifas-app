import React, { useState, useEffect } from 'react';
import './NotificationToast.css';

const NotificationToast = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Escuchar eventos de notificación
    const handleNotification = (event) => {
      const { type, message, title, duration = 4000 } = event.detail;
      const id = Date.now() + Math.random();
      
      setNotifications(prev => [...prev, { id, type, title, message, duration }]);
      
      // Auto-remover después de la duración
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
    };

    window.addEventListener('showNotification', handleNotification);
    return () => window.removeEventListener('showNotification', handleNotification);
  }, []);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification-toast notification-${notification.type}`}
          onClick={() => removeNotification(notification.id)}
        >
          <div className="notification-content">
            <div className="notification-icon">{getIcon(notification.type)}</div>
            <div className="notification-text">
              {notification.title && (
                <div className="notification-title">{notification.title}</div>
              )}
              <div className="notification-message">{notification.message}</div>
            </div>
            <button 
              className="notification-close"
              onClick={(e) => {
                e.stopPropagation();
                removeNotification(notification.id);
              }}
            >
              ×
            </button>
          </div>
          <div className="notification-progress">
            <div 
              className="notification-progress-bar"
              style={{ 
                animationDuration: `${notification.duration}ms`,
                animationName: 'notificationProgress'
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// Función helper para mostrar notificaciones
export const showNotification = (type, message, title = null, duration = 4000) => {
  window.dispatchEvent(new CustomEvent('showNotification', {
    detail: { type, message, title, duration }
  }));
};

// Funciones de conveniencia
export const showSuccess = (message, title = 'Éxito', duration = 3000) => {
  showNotification('success', message, title, duration);
};

export const showError = (message, title = 'Error', duration = 5000) => {
  showNotification('error', message, title, duration);
};

export const showWarning = (message, title = 'Advertencia', duration = 4000) => {
  showNotification('warning', message, title, duration);
};

export const showInfo = (message, title = 'Información', duration = 4000) => {
  showNotification('info', message, title, duration);
};

export default NotificationToast;

