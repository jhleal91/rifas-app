# ✅ Checklist de Producción - SorteoHub

## 📋 Estado Actual

- [x] Base de datos de producción creada
- [ ] Variables de entorno configuradas
- [ ] Stripe en modo Live
- [ ] Resend configurado
- [ ] SSL/HTTPS configurado
- [ ] Servidor configurado
- [ ] Frontend deployado
- [ ] Monitoreo configurado

---

## 🔐 1. Configuración de Seguridad

### Variables de Entorno
- [ ] `config.production.env` creado y configurado
- [ ] `JWT_SECRET` generado (64+ caracteres)
- [ ] `DB_PASSWORD` seguro configurado
- [ ] Todas las claves API configuradas
- [ ] Archivo `.env.production` del frontend configurado

### Base de Datos
- [x] Base de datos creada
- [ ] Usuario de BD creado (no usar postgres)
- [ ] Permisos configurados correctamente
- [ ] SSL habilitado para conexiones
- [ ] Backups automáticos configurados

---

## 💳 2. Stripe (CRÍTICO)

- [ ] Cuenta Stripe en modo **Live**
- [ ] `STRIPE_SECRET_KEY` (sk_live_...) configurado
- [ ] `STRIPE_PUBLISHABLE_KEY` (pk_live_...) configurado
- [ ] Webhook de producción creado
- [ ] `STRIPE_WEBHOOK_SECRET` (whsec_...) configurado
- [ ] Webhook probado con evento de prueba
- [ ] Tarjeta de prueba real probada

**URL del Webhook:** `https://tu-dominio.com/api/stripe/webhook`

---

## 📧 3. Emails (Resend)

- [ ] Cuenta Resend creada
- [ ] Dominio verificado en Resend
- [ ] DNS records (SPF, DKIM) configurados
- [ ] `RESEND_API_KEY` configurado
- [ ] `FROM_EMAIL` configurado
- [ ] Email de prueba enviado y recibido

---

## 🌐 4. Dominio y SSL

- [ ] Dominio registrado
- [ ] DNS configurado
- [ ] SSL/HTTPS configurado (Let's Encrypt o similar)
- [ ] Redirección HTTP → HTTPS configurada
- [ ] Certificado válido verificado

---

## 🖥️ 5. Servidor Backend

- [ ] Servidor elegido (Railway, DigitalOcean, etc.)
- [ ] Node.js instalado (v18+)
- [ ] PostgreSQL instalado y configurado
- [ ] PM2 instalado y configurado
- [ ] Código deployado
- [ ] Variables de entorno configuradas en el servidor
- [ ] Servidor accesible vía HTTPS
- [ ] Health check funcionando (`/api/health`)

---

## 📱 6. Frontend

- [ ] Hosting elegido (Vercel, Netlify, etc.)
- [ ] Variables de entorno configuradas
- [ ] Build de producción creado
- [ ] Deploy realizado
- [ ] Dominio configurado
- [ ] SSL configurado
- [ ] Acceso verificado

---

## 🔍 7. Monitoreo

- [ ] Sentry configurado (opcional pero recomendado)
- [ ] `SENTRY_DSN` configurado
- [ ] Alertas de errores configuradas
- [ ] Logs configurados
- [ ] Métricas básicas configuradas

---

## 🧪 8. Testing Post-Deployment

### Funcionalidades Básicas
- [ ] Acceso a la aplicación funciona
- [ ] Login funciona
- [ ] Registro funciona
- [ ] Crear rifa funciona
- [ ] Ver rifas funciona
- [ ] Participar en rifa funciona

### Pagos
- [ ] Stripe Payment Element se muestra
- [ ] Pago de prueba funciona
- [ ] Webhook procesa pagos correctamente
- [ ] Números se marcan como vendidos
- [ ] Notificaciones se crean

### Emails
- [ ] Email de bienvenida se envía
- [ ] Email de confirmación de participación se envía
- [ ] Email de pago validado se envía
- [ ] Email al ganador se envía

### Notificaciones
- [ ] Notificaciones aparecen en la campana
- [ ] Socket.io funciona
- [ ] Contador de no leídas funciona

---

## 📊 9. Optimizaciones

- [ ] Imágenes optimizadas
- [ ] CSS/JS minificados
- [ ] Compresión gzip habilitada
- [ ] Caché configurado
- [ ] CDN configurado (opcional)

---

## 🔒 10. Seguridad Final

- [ ] Firewall configurado
- [ ] Rate limiting activo
- [ ] CORS configurado correctamente
- [ ] Headers de seguridad configurados
- [ ] No hay información sensible en logs
- [ ] Backups funcionando

---

## 📝 11. Documentación

- [ ] README actualizado
- [ ] Documentación de API actualizada
- [ ] Guía de deployment documentada
- [ ] Contacto de soporte configurado

---

## 🎉 Listo para Lanzar

Cuando todos los items críticos estén completados:

- [ ] Anunciar en redes sociales
- [ ] Enviar emails a usuarios beta (si aplica)
- [ ] Monitorear activamente los primeros días
- [ ] Recopilar feedback
- [ ] Iterar rápidamente

---

## 🆘 Problemas Comunes

### Stripe no funciona
- Verificar que esté en modo Live
- Verificar que las claves sean de producción
- Verificar que el webhook esté configurado

### Emails no llegan
- Verificar dominio en Resend
- Verificar DNS records
- Revisar spam folder

### Base de datos no conecta
- Verificar credenciales
- Verificar firewall
- Verificar SSL si es requerido

---

**Última actualización:** Después de crear BD de producción
