# 🔗 Guía de Configuración del Webhook de Stripe

## 📋 Resumen

El webhook de Stripe está **completamente implementado** y funcionando. Cuando un pago es exitoso, automáticamente:

1. ✅ Actualiza el participante de "pendiente" a "confirmado"
2. ✅ Mueve los números de "reservados" a "vendidos"
3. ✅ Envía email de confirmación al participante
4. ✅ Notifica al creador de la rifa
5. ✅ Actualiza la transacción en la base de datos

## 🔧 Configuración del Webhook en Stripe

### Paso 1: Acceder al Dashboard de Stripe

1. Ve a [dashboard.stripe.com](https://dashboard.stripe.com)
2. Inicia sesión con tu cuenta
3. Asegúrate de estar en el **modo de prueba** (Test mode) para desarrollo

### Paso 2: Crear el Webhook

1. En el menú lateral, ve a **Developers** → **Webhooks**
2. Haz clic en **"Add endpoint"**
3. Configura el webhook:
   - **Endpoint URL**: `http://localhost:5001/api/stripe/webhook` (desarrollo)
   - **Description**: "SorteoHub - Webhook para pagos de rifas"
   - **Events to send**: Selecciona estos eventos:
     - `payment_intent.succeeded` ✅ (CRÍTICO)
     - `payment_intent.payment_failed` ✅
     - `account.updated` (opcional, para Stripe Connect)

### Paso 3: Obtener el Webhook Secret

1. Después de crear el webhook, haz clic en él
2. En la sección **"Signing secret"**, haz clic en **"Reveal"**
3. Copia el secret (empieza con `whsec_...`)

### Paso 4: Configurar en el Backend

Agrega el secret a tu archivo `backend/config.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_tu_webhook_secret_aqui
```

### Paso 5: Reiniciar el Servidor

```bash
cd backend
npm run dev
```

## 🧪 Probar el Webhook

### Opción 1: Usar Stripe CLI (Recomendado para desarrollo)

1. **Instalar Stripe CLI:**
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # O descargar desde: https://stripe.com/docs/stripe-cli
   ```

2. **Autenticar:**
   ```bash
   stripe login
   ```

3. **Reenviar eventos a tu servidor local:**
   ```bash
   stripe listen --forward-to localhost:5001/api/stripe/webhook
   ```

4. **Obtener el webhook secret para desarrollo:**
   ```bash
   stripe listen --print-secret
   ```
   Copia el secret que empieza con `whsec_...` y úsalo en `config.env`

5. **Probar un pago:**
   ```bash
   stripe trigger payment_intent.succeeded
   ```

### Opción 2: Usar el Dashboard de Stripe

1. Ve a **Developers** → **Webhooks**
2. Selecciona tu webhook
3. Haz clic en **"Send test webhook"**
4. Selecciona `payment_intent.succeeded`
5. Haz clic en **"Send test webhook"**

## 🔍 Verificar que Funciona

### En los Logs del Backend

Cuando el webhook funciona correctamente, verás:

```
✅ Webhook recibido: payment_intent.succeeded
✅ Auto-registrando participación desde webhook Stripe
✅ Participación auto-registrada exitosamente desde webhook
✅ Email de pago validado enviado al participante
```

### En la Base de Datos

Verifica que los números se marcaron como vendidos:

```sql
-- Ver participantes confirmados
SELECT * FROM participantes WHERE estado = 'confirmado' ORDER BY fecha_confirmacion DESC LIMIT 5;

-- Ver números vendidos
SELECT * FROM elementos_vendidos WHERE rifa_id = 'TU_RIFA_ID' ORDER BY fecha_venta DESC;
```

## 🚨 Troubleshooting

### Problema: "Webhook secret no configurado"

**Solución:** Agrega `STRIPE_WEBHOOK_SECRET` a `backend/config.env`

### Problema: "Webhook signature verification failed"

**Solución:** 
- Verifica que el secret sea correcto
- Asegúrate de usar el secret correcto (desarrollo vs producción)
- Si usas Stripe CLI, usa el secret que te da `stripe listen`

### Problema: "Participante no encontrado o ya procesado"

**Causa:** El participante ya fue procesado o no existe

**Solución:** Esto es normal si:
- El webhook se ejecutó dos veces (Stripe puede reenviar eventos)
- El participante ya fue confirmado manualmente

### Problema: Los números no se marcan como vendidos

**Verificar:**
1. ¿El webhook está recibiendo eventos? (revisa logs)
2. ¿El `participante_id` está en el metadata del Payment Intent?
3. ¿El participante existe y está en estado "pendiente"?

## 📝 Flujo Completo

1. **Usuario completa datos** → Se registra el participante (estado: "pendiente")
2. **Se crea Payment Intent** → Incluye `participante_id` en metadata
3. **Usuario paga con Stripe** → Stripe procesa el pago
4. **Stripe envía webhook** → `payment_intent.succeeded`
5. **Backend procesa webhook**:
   - Busca participante por `participante_id`
   - Actualiza estado a "confirmado"
   - Mueve números de reservados a vendidos
   - Envía email de confirmación
   - Notifica al creador

## 🌐 Producción

Para producción, configura el webhook con:

- **Endpoint URL**: `https://tu-dominio.com/api/stripe/webhook`
- **Webhook Secret**: Obtén uno nuevo del dashboard de Stripe (modo Live)
- **Variables de entorno**: Usa las claves de producción

## ✅ Checklist

- [ ] Webhook creado en Stripe Dashboard
- [ ] `STRIPE_WEBHOOK_SECRET` configurado en `config.env`
- [ ] Servidor reiniciado
- [ ] Webhook probado con Stripe CLI o Dashboard
- [ ] Verificado en logs que funciona
- [ ] Verificado en BD que los números se marcan como vendidos

---

**Nota:** El webhook ya está completamente implementado en el código. Solo necesitas configurarlo en Stripe y agregar el secret al archivo de configuración.

