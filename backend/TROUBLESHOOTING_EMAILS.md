# 🔧 Troubleshooting - Sistema de Emails

## Problema: No recibo emails de bienvenida

### Posibles Causas y Soluciones

#### 1. **RESEND_API_KEY no configurada**
**Síntoma:** Verás en los logs: `⚠️ RESEND_API_KEY no está configurada`

**Solución:**
```bash
# Agrega a tu archivo backend/config.env:
RESEND_API_KEY=re_tu_api_key_aqui
FROM_EMAIL=SorteoHub <noreply@sorteohub.com>
```

#### 2. **Email no autorizado en modo desarrollo**
**Síntoma:** Verás en los logs: `⚠️ Modo desarrollo: Email [tu-email] no autorizado. Enviando a tiendaap25@gmail.com`

**Explicación:** 
- En modo desarrollo, Resend (plan gratuito) solo permite enviar a emails verificados
- Por defecto, solo `tiendaap25@gmail.com` está autorizado
- Si usas otro email, se redirige automáticamente a `tiendaap25@gmail.com`

**Soluciones:**

**Opción A: Agregar tu email a la lista de autorizados**
1. Edita `backend/config/email.js`
2. Agrega tu email a `AUTHORIZED_EMAILS`:
```javascript
const AUTHORIZED_EMAILS = ['tiendaap25@gmail.com', 'tu-email@gmail.com'];
```

**Opción B: Verificar tu email en Resend**
1. Ve a [resend.com](https://resend.com)
2. Verifica tu email en el dashboard
3. Luego agrega tu email a `AUTHORIZED_EMAILS`

**Opción C: Revisar el email de redirección**
- Si tu email no está autorizado, el email se envía a `tiendaap25@gmail.com`
- Revisa la bandeja de entrada (y spam) de ese correo

#### 3. **Email en carpeta de spam**
**Solución:** Revisa la carpeta de spam/correo no deseado

#### 4. **Error en el envío**
**Síntoma:** Verás en los logs: `❌ Error enviando email de bienvenida: [mensaje de error]`

**Solución:** Revisa los logs del servidor para ver el error específico

### Verificar Configuración

Ejecuta este comando para verificar tu configuración:
```bash
cd backend
grep -E "RESEND_API_KEY|FROM_EMAIL|NODE_ENV" config.env
```

Deberías ver:
```
RESEND_API_KEY=re_...
FROM_EMAIL=SorteoHub <...>
NODE_ENV=development
```

### Probar el Sistema

1. **Revisa los logs del servidor** cuando creas un usuario:
   - Deberías ver: `📧 Intentando enviar email de bienvenida a: [email]`
   - Si hay error, verás: `❌ Error enviando email de bienvenida: [error]`

2. **Verifica el email correcto:**
   - Si tu email no está autorizado, se enviará a `tiendaap25@gmail.com`
   - Revisa ese correo también

3. **En producción:**
   - Todos los emails se envían normalmente (sin restricciones)
   - Solo en desarrollo hay restricciones por el plan gratuito de Resend

### Agregar tu Email a la Lista de Autorizados

Edita `backend/config/email.js` y agrega tu email:

```javascript
const AUTHORIZED_EMAILS = [
  'tiendaap25@gmail.com',
  'tu-email@gmail.com'  // ← Agrega tu email aquí
];
```

Luego reinicia el servidor.

### Logs Útiles

Cuando creas un usuario, deberías ver en los logs:

```
✅ Email de bienvenida enviado al nuevo usuario: tu-email@gmail.com
```

O si hay problema:

```
⚠️  No se pudo enviar email de bienvenida: [razón]
💡 Sugerencia: [sugerencia]
```

