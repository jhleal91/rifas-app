# 🚀 Guía de Despliegue en Producción - AureLA Rifas

## 📋 Prerrequisitos

### Sistema Operativo
- Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- Mínimo 2GB RAM, 4GB recomendado
- Mínimo 20GB espacio en disco

### Software Requerido
- Docker 20.10+
- Docker Compose 2.0+
- Git
- curl

## 🛠️ Instalación

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/rifas-app.git
cd rifas-app/backend
```

### 2. Configurar Variables de Entorno
```bash
# Copiar archivo de ejemplo
cp env.production.example .env.production

# Editar variables de entorno
nano .env.production
```

**Variables importantes a cambiar:**
- `DB_PASSWORD`: Contraseña segura para PostgreSQL
- `JWT_SECRET`: Clave secreta para JWT (mínimo 32 caracteres)
- `FRONTEND_URL`: URL de tu frontend en producción
- `RESEND_API_KEY`: API key de Resend para emails
- `GRAFANA_PASSWORD`: Contraseña para Grafana

### 3. Desplegar
```bash
# Despliegue en staging
./deploy.sh staging

# Despliegue en producción
./deploy.sh production
```

## 🔧 Configuración Avanzada

### PM2 (Alternativa a Docker)
```bash
# Instalar PM2
npm install -g pm2

# Iniciar con PM2
pm2 start ecosystem.config.js --env production

# Configurar inicio automático
pm2 startup
pm2 save
```

### Monitoreo Manual
```bash
# Verificar estado
./monitor.sh status

# Ver logs
./monitor.sh logs

# Reiniciar si es necesario
./monitor.sh restart
```

## 📊 Monitoreo y Logs

### Health Checks
- **Backend**: `http://tu-servidor:5001/api/health`
- **Base de datos**: Verificado automáticamente
- **Nginx**: Verificado automáticamente

### Logs
```bash
# Logs del backend
docker-compose logs -f backend

# Logs de la base de datos
docker-compose logs -f postgres

# Logs de Nginx
docker-compose logs -f nginx
```

### Métricas
- **Prometheus**: `http://tu-servidor:9090`
- **Grafana**: `http://tu-servidor:3001`

## 🔒 Seguridad

### Configuración de Firewall
```bash
# Permitir solo puertos necesarios
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw allow 5001  # Backend (solo si es necesario)
ufw enable
```

### SSL/TLS
1. Obtener certificados SSL (Let's Encrypt recomendado)
2. Colocar certificados en `./ssl/`
3. Configurar Nginx para HTTPS

### Base de Datos
- Cambiar contraseñas por defecto
- Configurar backup automático
- Restringir acceso por IP

## 🚨 Solución de Problemas

### Servidor No Responde
```bash
# Verificar estado
./monitor.sh status

# Reiniciar servicios
./monitor.sh restart

# Ver logs de error
./monitor.sh logs
```

### Base de Datos No Conecta
```bash
# Verificar estado de PostgreSQL
docker-compose exec postgres pg_isready -U rifas_user

# Ver logs de la base de datos
docker-compose logs postgres
```

### Memoria Alta
```bash
# Verificar uso de memoria
docker stats

# Reiniciar servicios
docker-compose restart
```

### Backup y Restauración
```bash
# Crear backup
./monitor.sh backup

# Restaurar desde backup
docker-compose exec postgres psql -U rifas_user -d rifas_digital_prod < backup.sql
```

## 📈 Escalabilidad

### Horizontal Scaling
- Usar load balancer (Nginx/HAProxy)
- Múltiples instancias del backend
- Base de datos con réplicas de lectura

### Vertical Scaling
- Aumentar RAM del servidor
- Usar SSD para mejor I/O
- Optimizar configuración de PostgreSQL

## 🔄 Actualizaciones

### Actualización de Código
```bash
# Hacer backup
./monitor.sh backup

# Actualizar código
git pull origin main

# Redesplegar
./deploy.sh production
```

### Actualización de Base de Datos
```bash
# Ejecutar migraciones
docker-compose exec backend npm run migrate

# Verificar integridad
docker-compose exec postgres psql -U rifas_user -d rifas_digital_prod -c "SELECT version();"
```

## 📞 Soporte

### Logs Importantes
- `/app/logs/error.log` - Errores del backend
- `/app/logs/combined.log` - Logs combinados
- `docker-compose logs` - Logs de Docker

### Comandos de Diagnóstico
```bash
# Estado general
./monitor.sh status

# Salud del servidor
./monitor.sh health

# Logs en tiempo real
./monitor.sh logs

# Limpiar logs antiguos
./monitor.sh cleanup
```

### Contacto
- **Email**: soporte@tu-dominio.com
- **Documentación**: [Enlace a docs]
- **Issues**: [Enlace a GitHub Issues]

## 📝 Notas de Producción

### Mejores Prácticas
1. **Siempre hacer backup** antes de cambios importantes
2. **Monitorear logs** regularmente
3. **Mantener actualizado** el sistema operativo
4. **Usar HTTPS** en producción
5. **Configurar alertas** para problemas críticos

### Configuración Recomendada
- **RAM**: 4GB mínimo, 8GB recomendado
- **CPU**: 2 cores mínimo, 4 cores recomendado
- **Disco**: SSD recomendado
- **Red**: Conexión estable con buen ancho de banda

### Mantenimiento Regular
- **Diario**: Verificar logs de error
- **Semanal**: Revisar métricas de rendimiento
- **Mensual**: Actualizar dependencias
- **Trimestral**: Revisar configuración de seguridad
