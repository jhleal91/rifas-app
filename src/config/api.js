/**
 * Configuración centralizada de la API
 * Todas las URLs y configuraciones de API deben venir de aquí
 */

// API Base URL - Usa variable de entorno en producción
export const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001/api';

// Socket.io URL - Usa variable de entorno en producción
export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';

// Stripe Publishable Key
export const STRIPE_PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '';

// Validar configuración en producción
if (process.env.NODE_ENV === 'production') {
  if (!process.env.REACT_APP_API_BASE) {
    console.error('❌ REACT_APP_API_BASE no está configurado en producción');
  }
  if (!process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY) {
    console.error('❌ REACT_APP_STRIPE_PUBLISHABLE_KEY no está configurado en producción');
  }
}

const apiConfig = {
  API_BASE,
  SOCKET_URL,
  STRIPE_PUBLISHABLE_KEY
};

export default apiConfig;

