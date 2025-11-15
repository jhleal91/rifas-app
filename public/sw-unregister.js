// Script para desregistrar Service Workers
// Este archivo se puede cargar directamente en el navegador para limpiar Service Workers

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister().then((success) => {
        if (success) {
          console.log('✅ Service Worker desregistrado exitosamente');
        } else {
          console.log('❌ Error al desregistrar Service Worker');
        }
      });
    }
    
    // También limpiar cachés
    if ('caches' in window) {
      caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          caches.delete(cacheName);
          console.log('🗑️ Caché eliminado:', cacheName);
        });
      });
    }
  });
  
  console.log('🔄 Limpieza de Service Workers iniciada');
} else {
  console.log('ℹ️ Service Workers no están disponibles en este navegador');
}

