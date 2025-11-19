import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';
import NotificationCenter from './NotificationCenter';
import './NotificationBadge.css';

const NotificationBadge = () => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const badgeRef = useRef(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!user) return; // Si no hay usuario, no hacer nada
    
    const handleClickOutside = (event) => {
      if (badgeRef.current && !badgeRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, user]);

  // Solo mostrar si el usuario está autenticado
  if (!user) {
    return null;
  }

  const toggleCenter = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="notification-badge-wrapper" ref={badgeRef}>
      <button
        onClick={toggleCenter}
        className="notification-badge-button"
        aria-label="Notificaciones"
      >
        <svg
          className="notification-bell-icon"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge-count">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {isOpen && <NotificationCenter onClose={() => setIsOpen(false)} />}
    </div>
  );
};

export default NotificationBadge;
