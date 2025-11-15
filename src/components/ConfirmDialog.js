import React, { useState, useEffect } from 'react';
import './ConfirmDialog.css';

let confirmCallback = null;

const ConfirmDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({
    title: 'Confirmar',
    message: '¿Estás seguro?',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    type: 'warning', // 'warning', 'danger', 'info'
    onConfirm: null,
    onCancel: null
  });

  useEffect(() => {
    const handleConfirm = (event) => {
      const { title, message, confirmText, cancelText, type, onConfirm, onCancel } = event.detail;
      setConfig({
        title: title || 'Confirmar',
        message: message || '¿Estás seguro?',
        confirmText: confirmText || 'Confirmar',
        cancelText: cancelText || 'Cancelar',
        type: type || 'warning',
        onConfirm,
        onCancel
      });
      setIsOpen(true);
    };

    window.addEventListener('showConfirm', handleConfirm);
    return () => window.removeEventListener('showConfirm', handleConfirm);
  }, []);

  const handleConfirm = () => {
    if (config.onConfirm) {
      config.onConfirm();
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    if (config.onCancel) {
      config.onCancel();
    }
    setIsOpen(false);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  if (!isOpen) return null;

  const getIcon = () => {
    switch (config.type) {
      case 'danger':
        return '🗑️';
      case 'info':
        return 'ℹ️';
      default:
        return '⚠️';
    }
  };

  return (
    <div className="confirm-dialog-overlay" onClick={handleOverlayClick}>
      <div className="confirm-dialog">
        <div className="confirm-dialog-header">
          <div className={`confirm-dialog-icon confirm-icon-${config.type}`}>
            {getIcon()}
          </div>
          <h3 className="confirm-dialog-title">{config.title}</h3>
        </div>
        
        <div className="confirm-dialog-body">
          <p className="confirm-dialog-message">{config.message}</p>
        </div>
        
        <div className="confirm-dialog-actions">
          <button
            className="confirm-dialog-btn confirm-dialog-btn-cancel"
            onClick={handleCancel}
          >
            {config.cancelText}
          </button>
          <button
            className={`confirm-dialog-btn confirm-dialog-btn-confirm confirm-btn-${config.type}`}
            onClick={handleConfirm}
          >
            {config.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Función helper para mostrar confirmación
export const showConfirm = (config) => {
  return new Promise((resolve) => {
    const handleConfirm = () => {
      resolve(true);
      window.removeEventListener('confirmResult', handleConfirm);
    };
    
    const handleCancel = () => {
      resolve(false);
      window.removeEventListener('confirmResult', handleCancel);
    };

    window.addEventListener('confirmResult', (e) => {
      if (e.detail.result) {
        handleConfirm();
      } else {
        handleCancel();
      }
    });

    window.dispatchEvent(new CustomEvent('showConfirm', {
      detail: {
        ...config,
        onConfirm: () => {
          if (config.onConfirm) config.onConfirm();
          window.dispatchEvent(new CustomEvent('confirmResult', { detail: { result: true } }));
        },
        onCancel: () => {
          if (config.onCancel) config.onCancel();
          window.dispatchEvent(new CustomEvent('confirmResult', { detail: { result: false } }));
        }
      }
    }));
  });
};

// Versión simple con Promise
export const confirm = (message, title = 'Confirmar', options = {}) => {
  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent('showConfirm', {
      detail: {
        title: title || 'Confirmar',
        message: message || '¿Estás seguro?',
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
        type: options.type || 'warning',
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false)
      }
    }));
  });
};

export default ConfirmDialog;

