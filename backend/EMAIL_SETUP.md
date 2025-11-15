# 📧 Configuración del Sistema de Emails - AureLA

## 🚀 Configuración con Resend

### 1. Crear cuenta en Resend
1. Ve a [resend.com](https://resend.com)
2. Crea una cuenta gratuita
3. Verifica tu email

### 2. Obtener API Key
1. En el dashboard de Resend, ve a "API Keys"
2. Crea una nueva API key
3. Copia la clave (empieza con `re_`)

### 3. Configurar variables de entorno
Agrega estas variables a tu archivo `config.env`:

```env
# Configuración de Email (Resend)
RESEND_API_KEY=re_tu_api_key_aqui
FROM_EMAIL=AureLA <noreply@aurela.com>
```

### 4. Para Railway/Producción
En Railway, agrega estas variables de entorno:
- `RESEND_API_KEY`: Tu API key de Resend
- `FROM_EMAIL`: El email remitente (debe estar verificado en Resend)

## 📧 Tipos de Emails Implementados

### 1. Confirmación de Participación
- **Cuándo se envía**: Cuando un administrador confirma la venta de un participante
- **Destinatario**: El participante
- **Contenido**: 
  - Números/elementos comprados
  - Total pagado
  - Información del sorteo
  - Link a la rifa

### 2. Rifa Agotada
- **Cuándo se envía**: Cuando se vende el último elemento de una rifa
- **Destinatario**: El dueño de la rifa
- **Contenido**:
  - Resumen de ventas
  - Total recaudado
  - Próximos pasos
  - Link para gestionar la rifa

### 3. Recordatorio de Sorteo
- **Cuándo se envía**: 1 hora antes del sorteo programado
- **Destinatario**: El dueño de la rifa
- **Contenido**:
  - Detalles del sorteo
  - Checklist pre-sorteo
  - Link para gestionar la rifa

## 🔧 Funcionalidades Técnicas

### Scheduler Automático
- **Frecuencia**: Cada 30 minutos
- **Función**: Verifica rifas que necesitan recordatorios de sorteo
- **Inicio**: Automático al iniciar el servidor

### Base de Datos
- **Tabla**: `rifa_notifications`
- **Función**: Evitar envío de emails duplicados
- **Tipos**: `sold_out`, `draw_reminder`

### Validaciones
- **Email obligatorio**: Los participantes deben proporcionar email
- **Verificación de duplicados**: No se envían emails repetidos
- **Manejo de errores**: Los emails fallidos no afectan la operación principal

## 🎨 Templates de Email

Los emails incluyen:
- ✅ **Diseño responsive** para móviles y desktop
- ✅ **Colores de marca** (azul #1e22aa)
- ✅ **Iconos y emojis** para mejor UX
- ✅ **Información completa** y organizada
- ✅ **Call-to-action** buttons
- ✅ **Footer profesional**

## 🚨 Troubleshooting

### Error: "Invalid API Key"
- Verifica que `RESEND_API_KEY` esté correctamente configurada
- Asegúrate de que la API key sea válida y activa

### Error: "Domain not verified"
- En Resend, verifica tu dominio
- O usa un email de dominio verificado por Resend

### Emails no se envían
- Revisa los logs del servidor
- Verifica la conexión a internet
- Confirma que las variables de entorno estén configuradas

### Emails duplicados
- La tabla `rifa_notifications` previene duplicados
- Si hay problemas, revisa la lógica de verificación

## 📊 Monitoreo

### Logs del Servidor
```
✅ Email de confirmación enviado al participante
🎉 ¡Rifa agotada! Enviando notificación...
✅ Notificación de rifa agotada enviada
⏰ Enviando recordatorio para rifa: [nombre]
✅ Recordatorio enviado para rifa: [nombre]
```

### Base de Datos
Consulta la tabla `rifa_notifications` para ver el historial de emails enviados:

```sql
SELECT * FROM rifa_notifications ORDER BY fecha_envio DESC;
```

## 🔒 Seguridad

- ✅ **API Keys**: Nunca commitees las API keys al repositorio
- ✅ **Variables de entorno**: Usa archivos `.env` para configuración local
- ✅ **Validación**: Todos los emails se validan antes del envío
- ✅ **Rate limiting**: Resend maneja automáticamente los límites

## 🚀 Próximos Pasos

1. **Configurar Resend** con tu API key
2. **Probar el sistema** creando una rifa y participando
3. **Verificar emails** en la bandeja de entrada
4. **Monitorear logs** para confirmar funcionamiento
5. **Configurar dominio personalizado** (opcional)

¡El sistema de emails está listo para usar! 🎉
