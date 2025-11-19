# 🧪 Simular Pagos para Testing

Como Stripe no está completamente implementado, puedes usar este endpoint para simular pagos confirmados y probar las notificaciones.

## 📍 Endpoint

```
POST /api/stripe/simulate-payment
```

**Autenticación:** Requerida (Bearer Token)

**Solo disponible en:** Desarrollo (no funciona en producción)

---

## 📝 Parámetros

### Body (JSON)

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `rifa_id` | string/number | ✅ Sí | ID de la rifa |
| `participante_id` | number | ✅ Sí | ID del participante |
| `numeros` | array/string | ❌ No | Números seleccionados (array o string separado por comas). Si no se proporciona, usa los del participante |
| `monto` | number | ❌ No | Monto total. Si no se proporciona, se calcula automáticamente |

---

## 🔄 Qué hace este endpoint

1. ✅ Actualiza el estado del participante a `confirmado`
2. ✅ Mueve los números de `reservados` a `vendidos`
3. ✅ Registra una transacción simulada en `stripe_transactions`
4. ✅ **Envía notificación de pago confirmado** al creador de la rifa
5. ✅ Emite notificación en tiempo real vía Socket.io

---

## 📋 Ejemplo de Uso

### Con cURL

```bash
curl -X POST http://localhost:5001/api/stripe/simulate-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_JWT" \
  -d '{
    "rifa_id": "1762781174116",
    "participante_id": 123,
    "numeros": ["1", "2", "3"],
    "monto": 750.00
  }'
```

### Con JavaScript/Fetch

```javascript
const token = localStorage.getItem('token'); // O donde guardes el token

const response = await fetch('http://localhost:5001/api/stripe/simulate-payment', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    rifa_id: '1762781174116',
    participante_id: 123,
    numeros: ['1', '2', '3'],
    monto: 750.00
  })
});

const result = await response.json();
console.log(result);
```

### Con Postman

1. Método: `POST`
2. URL: `http://localhost:5001/api/stripe/simulate-payment`
3. Headers:
   - `Content-Type: application/json`
   - `Authorization: Bearer TU_TOKEN_JWT`
4. Body (raw JSON):
```json
{
  "rifa_id": "1762781174116",
  "participante_id": 123,
  "numeros": ["1", "2", "3"],
  "monto": 750.00
}
```

---

## ✅ Respuesta Exitosa

```json
{
  "success": true,
  "message": "Pago simulado exitosamente",
  "data": {
    "rifa_id": "1762781174116",
    "participante_id": 123,
    "total": "750.00",
    "numeros": ["1", "2", "3"],
    "rifa_nombre": "iPhone 15",
    "participante_nombre": "Juan Pérez"
  }
}
```

---

## ❌ Errores Comunes

### 400 - Faltan parámetros
```json
{
  "success": false,
  "error": "Faltan parámetros requeridos: rifa_id y participante_id son obligatorios"
}
```

### 403 - Solo desarrollo
```json
{
  "success": false,
  "error": "Este endpoint solo está disponible en desarrollo"
}
```

### 404 - Participante no encontrado
```json
{
  "success": false,
  "error": "Participante no encontrado"
}
```

---

## 🎯 Casos de Uso

### 1. Probar notificaciones de pago
Simula un pago confirmado y verifica que el creador de la rifa reciba la notificación en tiempo real.

### 2. Probar flujo completo
Simula el flujo completo desde participación hasta pago confirmado, incluyendo:
- Actualización de estado
- Movimiento de números
- Notificaciones

### 3. Testing de integración
Usa este endpoint para probar la integración entre:
- Backend (actualización de BD)
- Notificaciones (Socket.io)
- Frontend (actualización de UI)

---

## 🔍 Cómo obtener los IDs necesarios

### Obtener `rifa_id`
- Ve a tu dashboard: `http://localhost:3000`
- Abre la consola del navegador
- Busca en la respuesta de `/api/rifas/my` el `id` de la rifa

### Obtener `participante_id`
1. Participa en una rifa (o crea una participación manualmente)
2. Ve a la base de datos y consulta:
```sql
SELECT id, nombre, rifa_id, estado 
FROM participantes 
WHERE rifa_id = 'TU_RIFA_ID';
```

O desde el backend, después de crear una participación, el `id` viene en la respuesta.

---

## ⚠️ Notas Importantes

1. **Solo desarrollo**: Este endpoint está deshabilitado en producción por seguridad
2. **Requiere autenticación**: Debes estar logueado para usarlo
3. **No afecta Stripe real**: No hace llamadas a Stripe, solo simula el flujo
4. **Transacciones simuladas**: Las transacciones se guardan con `stripe_payment_intent_id` que empieza con `simulated_`

---

## 🚀 Próximos Pasos

Una vez que tengas Stripe completamente implementado, puedes:
1. Eliminar este endpoint
2. Usar el webhook real de Stripe: `POST /api/stripe/webhook`
3. Las notificaciones funcionarán automáticamente cuando Stripe confirme un pago

---

**¿Necesitas ayuda?** Revisa los logs del backend para ver detalles de la simulación.

