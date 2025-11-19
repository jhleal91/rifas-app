# 📊 Instrucciones para Crear Base de Datos de Producción

## 🎯 Objetivo
Crear la base de datos de producción para SorteoHub con toda la estructura necesaria.

## 📋 Requisitos Previos

1. **PostgreSQL instalado** (versión 12 o superior)
2. **Acceso a servidor de producción** o base de datos local
3. **Credenciales de administrador** de PostgreSQL

## 🚀 Pasos para Crear la Base de Datos

### Opción 1: Desde la Línea de Comandos (Recomendado)

```bash
# 1. Conectar a PostgreSQL como superusuario
psql -U postgres

# 2. Crear base de datos
CREATE DATABASE sorteohub_prod;

# 3. Crear usuario para la aplicación (opcional pero recomendado)
CREATE USER sorteohub_user WITH PASSWORD 'tu_password_seguro_aqui';
GRANT ALL PRIVILEGES ON DATABASE sorteohub_prod TO sorteohub_user;

# 4. Salir de psql
\q

# 5. Conectar a la nueva base de datos
psql -U sorteohub_user -d sorteohub_prod

# 6. Ejecutar el script de creación
\i database-production.sql

# 7. Verificar que todo se creó correctamente
\dt  -- Listar todas las tablas
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
```

### Opción 2: Desde un Script

```bash
# Crear y ejecutar todo en un comando
psql -U postgres -c "CREATE DATABASE sorteohub_prod;"
psql -U postgres -c "CREATE USER sorteohub_user WITH PASSWORD 'tu_password_seguro';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE sorteohub_prod TO sorteohub_user;"
psql -U sorteohub_user -d sorteohub_prod -f database-production.sql
```

### Opción 3: Desde pgAdmin o DBeaver

1. Abrir pgAdmin o DBeaver
2. Conectar al servidor PostgreSQL
3. Crear nueva base de datos: `sorteohub_prod`
4. Abrir el archivo `database-production.sql`
5. Ejecutar el script completo

## ✅ Verificación

Después de ejecutar el script, verifica que todo esté correcto:

```sql
-- Verificar tablas principales
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Deberías ver estas tablas principales:
-- - usuarios
-- - rifas
-- - participantes
-- - notificaciones
-- - stripe_connect_accounts
-- - stripe_transactions
-- - creator_plans
-- - anunciantes
-- - anuncios
-- - cupones
-- - ratings
-- - paises
-- - estados
-- etc.

-- Verificar datos iniciales
SELECT * FROM creator_plans;
SELECT * FROM paises WHERE codigo = 'MEX';
SELECT * FROM configuracion_sistema;

-- Verificar índices
SELECT COUNT(*) as total_indices 
FROM pg_indexes 
WHERE schemaname = 'public';

-- Verificar funciones
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public';
```

## 🔧 Configuración en el Backend

Después de crear la base de datos, actualiza el archivo `backend/config.env` o `backend/config.production.env`:

```env
# Base de Datos de Producción
DB_HOST=tu_host_produccion
DB_PORT=5432
DB_NAME=sorteohub_prod
DB_USER=sorteohub_user
DB_PASSWORD=tu_password_seguro_aqui

# O si usas una URL completa:
DATABASE_URL=postgresql://sorteohub_user:tu_password_seguro_aqui@tu_host_produccion:5432/sorteohub_prod?sslmode=require
```

## 🔒 Seguridad Recomendada

1. **Usar SSL para conexiones:**
   ```env
   DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
   ```

2. **Crear usuario con permisos limitados:**
   ```sql
   -- Solo permisos necesarios, no superusuario
   GRANT CONNECT ON DATABASE sorteohub_prod TO sorteohub_user;
   GRANT USAGE ON SCHEMA public TO sorteohub_user;
   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sorteohub_user;
   GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sorteohub_user;
   ```

3. **Configurar firewall:**
   - Solo permitir conexiones desde el servidor de la aplicación
   - Bloquear acceso directo desde internet

4. **Backups automáticos:**
   ```bash
   # Ejemplo de backup diario
   pg_dump -U sorteohub_user -d sorteohub_prod > backup_$(date +%Y%m%d).sql
   ```

## 📊 Estructura Creada

El script crea:

- ✅ **25 tablas** principales
- ✅ **Índices optimizados** para rendimiento
- ✅ **Triggers** para actualización automática
- ✅ **Funciones auxiliares** para estadísticas
- ✅ **Vistas** para consultas complejas
- ✅ **Datos iniciales** (planes, países, estados)
- ✅ **Configuración del sistema**

## 🚨 Troubleshooting

### Error: "database already exists"
```sql
-- Eliminar y recrear (¡CUIDADO! Esto borra todos los datos)
DROP DATABASE IF EXISTS sorteohub_prod;
CREATE DATABASE sorteohub_prod;
```

### Error: "permission denied"
```sql
-- Dar permisos al usuario
GRANT ALL PRIVILEGES ON DATABASE sorteohub_prod TO sorteohub_user;
\c sorteohub_prod
GRANT ALL ON SCHEMA public TO sorteohub_user;
```

### Error: "relation already exists"
El script usa `CREATE TABLE IF NOT EXISTS` y `CREATE INDEX IF NOT EXISTS`, así que es seguro ejecutarlo múltiples veces.

## 📝 Notas Importantes

1. **No ejecutar en desarrollo:** Este script es solo para producción
2. **Backup antes de ejecutar:** Si ya tienes datos, haz backup primero
3. **Revisar contraseñas:** Asegúrate de usar contraseñas seguras
4. **SSL requerido:** En producción, siempre usa SSL para conexiones a la BD

## ✅ Checklist Post-Creación

- [ ] Base de datos creada
- [ ] Usuario creado con permisos
- [ ] Script ejecutado sin errores
- [ ] Tablas verificadas
- [ ] Datos iniciales verificados
- [ ] Configuración del backend actualizada
- [ ] Conexión probada desde el backend
- [ ] Backups configurados

---

**¡Listo!** Tu base de datos de producción está lista para usar. 🎉

