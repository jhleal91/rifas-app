/**
 * Helper para SweetAlert2
 * Facilita el uso de SweetAlert en toda la aplicación
 */
import Swal from 'sweetalert2';

// Configuración por defecto
const defaultConfig = {
  confirmButtonColor: '#3b82f6',
  cancelButtonColor: '#6b7280',
  buttonsStyling: true,
  allowOutsideClick: false,
  allowEscapeKey: true
};

/**
 * Mostrar alerta de éxito
 */
export const showSuccess = (title, message = '', options = {}) => {
  return Swal.fire({
    icon: 'success',
    title,
    text: message,
    confirmButtonText: options.confirmText || 'Entendido',
    confirmButtonColor: '#10b981',
    ...defaultConfig,
    ...options
  });
};

/**
 * Mostrar alerta de error
 */
export const showError = (title, message = '', options = {}) => {
  return Swal.fire({
    icon: 'error',
    title,
    text: message,
    confirmButtonText: options.confirmText || 'Entendido',
    confirmButtonColor: '#ef4444',
    ...defaultConfig,
    ...options
  });
};

/**
 * Mostrar alerta de advertencia
 */
export const showWarning = (title, message = '', options = {}) => {
  return Swal.fire({
    icon: 'warning',
    title,
    text: message,
    confirmButtonText: options.confirmText || 'Entendido',
    confirmButtonColor: '#f59e0b',
    ...defaultConfig,
    ...options
  });
};

/**
 * Mostrar alerta informativa
 */
export const showInfo = (title, message = '', options = {}) => {
  return Swal.fire({
    icon: 'info',
    title,
    text: message,
    confirmButtonText: options.confirmText || 'Entendido',
    confirmButtonColor: '#3b82f6',
    ...defaultConfig,
    ...options
  });
};

/**
 * Mostrar loading
 */
export const showLoading = (title = 'Procesando...', message = '') => {
  return Swal.fire({
    title,
    text: message,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
};

/**
 * Confirmación con SweetAlert
 * Retorna Promise<boolean>
 */
export const showConfirm = (title, message = '', options = {}) => {
  return Swal.fire({
    icon: options.icon || 'warning',
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: options.confirmText || 'Confirmar',
    cancelButtonText: options.cancelText || 'Cancelar',
    confirmButtonColor: options.confirmColor || '#3b82f6',
    cancelButtonColor: '#6b7280',
    reverseButtons: options.reverseButtons || false,
    ...defaultConfig,
    ...options
  }).then((result) => {
    return result.isConfirmed;
  });
};

/**
 * Confirmación de peligro (rojo)
 */
export const showDangerConfirm = (title, message = '', options = {}) => {
  return showConfirm(title, message, {
    icon: 'warning',
    confirmButtonColor: '#ef4444',
    confirmText: options.confirmText || 'Eliminar',
    ...options
  });
};

/**
 * Alerta con HTML personalizado
 */
export const showHtml = (title, html, options = {}) => {
  return Swal.fire({
    title,
    html,
    icon: options.icon || 'info',
    confirmButtonText: options.confirmText || 'Entendido',
    confirmButtonColor: options.confirmColor || '#3b82f6',
    ...defaultConfig,
    ...options
  });
};

/**
 * Cerrar cualquier SweetAlert abierto
 */
export const close = () => {
  Swal.close();
};

