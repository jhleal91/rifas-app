# 🧪 Guía de Prueba de Notificaciones

## Opción 1: Usar el archivo HTML de prueba

1. Abre `test-notification.html` en tu navegador
2. El archivo intentará obtener automáticamente tu token desde `localStorage`
3. Si no lo encuentra, inicia sesión en la aplicación principal primero
4. Haz clic en "Enviar Notificación de Prueba"
5. Deberías ver la notificación aparecer en tiempo real en la aplicación principal

## Opción 2: Desde la Consola del Navegador

1. Inicia sesión en la aplicación principal (http://localhost:3000)
2. Abre la consola del navegador (F12)
3. Ejecuta este código:

```javascript
const token = localStorage.getItem('token');

fetch('http://localhost:5001/api/notifications/test', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => {
  console.log('✅ Notificación enviada:', data);
  alert('Notificación enviada! Revisa el badge de notificaciones.');
})
.catch(err => {
  console.error('❌ Error:', err);
  alert('Error: ' + err.message);
});
```

## Opción 3: Desde cURL (Terminal)

```bash
# Primero obtén tu token (inicia sesión en la app y copia el token desde localStorage)
TOKEN="tu_token_aqui"

curl -X POST http://localhost:5001/api/notifications/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

## Verificar que Funciona

1. ✅ El badge de notificaciones debería mostrar un número (si no había notificaciones antes, ahora debería mostrar "1")
2. ✅ Al hacer clic en el badge, deberías ver el centro de notificaciones con la notificación de prueba
3. ✅ La notificación debería aparecer en tiempo real (sin necesidad de refrescar la página)

## Troubleshooting

### El badge no aparece
- Verifica que estés logueado como usuario (no como invitado)
- Revisa la consola del navegador por errores
- Verifica que Socket.io esté conectado (deberías ver "✅ Conectado a Socket.io" en la consola)

### La notificación no llega en tiempo real
- Verifica que el backend esté corriendo y muestre "Socket.io configurado y listo"
- Revisa la consola del backend por errores
- Verifica que el token sea válido

### Error "Token no proporcionado" o "Token inválido"
- Asegúrate de estar logueado en la aplicación principal
- Verifica que el token no haya expirado
- Intenta cerrar sesión y volver a iniciar sesión

