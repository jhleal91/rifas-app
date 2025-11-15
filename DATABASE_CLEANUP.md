# 🧹 Limpieza de Base de Datos - SorteoHub

## 📋 Descripción

Este proceso elimina todas las rifas y datos relacionados de la base de datos, manteniendo únicamente:
- ✅ **Usuarios** (administradores y cuentas)
- ✅ **Configuraciones del sistema**
- ✅ **Logs de usuarios** (sin logs de rifas)

## 🗑️ Datos que se eliminan

- ❌ **Rifas** (todas las rifas creadas)
- ❌ **Participantes** (todos los participantes)
- ❌ **Premios** (todos los premios)
- ❌ **Fotos de premios** (todas las imágenes)
- ❌ **Formas de pago** (configuraciones de pago)
- ❌ **Elementos vendidos** (números/elementos vendidos)
- ❌ **Elementos reservados** (reservas temporales)
- ❌ **Logs de rifas** (mantiene solo logs de usuarios)

## 🚀 Cómo ejecutar la limpieza

### Opción 1: Script de Node.js (Recomendado)

```bash
# Ejecutar el script interactivo
npm run cleanup-db

# O ejecutar directamente
node cleanup-database.js
```

### Opción 2: SQL directo

```bash
# Conectar a PostgreSQL y ejecutar
psql -U postgres -d rifas_db -f cleanup-database.sql
```

## ⚠️ Advertencias Importantes

1. **Esta acción es IRREVERSIBLE**
2. **Haz backup de la base de datos antes de ejecutar**
3. **Solo ejecuta en entornos de desarrollo o cuando estés seguro**
4. **Los usuarios y configuraciones se mantienen intactos**

## 🔧 Configuración de Base de Datos

El script usa las siguientes variables de entorno:

```bash
DB_USER=postgres
DB_HOST=localhost
DB_NAME=rifas_db
DB_PASSWORD=tu_password
DB_PORT=5432
```

## 📊 Verificación Post-Limpieza

Después de la limpieza, el script mostrará estadísticas:

```
📊 ESTADÍSTICAS FINALES:
  usuarios: X registros
  rifas: 0 registros
  participantes: 0 registros
  premios: 0 registros
  elementos_vendidos: 0 registros
  elementos_reservados: 0 registros
  configuracion_sistema: X registros
  logs_sistema: X registros
```

## 🎯 Casos de Uso

- **Desarrollo**: Limpiar datos de prueba
- **Testing**: Resetear base de datos para pruebas
- **Producción**: Preparar para lanzamiento limpio
- **Migración**: Limpiar antes de migrar a nueva versión

## 🔄 Restaurar Datos

Si necesitas restaurar datos:

1. **Desde backup**: Restaurar desde backup completo
2. **Recrear**: Usar los scripts de migración para recrear estructura
3. **Datos de prueba**: Ejecutar scripts de datos de prueba

## 📝 Logs

El script genera logs detallados de:
- Conexión a base de datos
- Progreso de eliminación
- Estadísticas finales
- Errores (si los hay)

## 🛡️ Seguridad

- Requiere confirmación manual
- No se ejecuta automáticamente
- Valida conexión antes de proceder
- Manejo de errores robusto
