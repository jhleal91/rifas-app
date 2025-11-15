#!/bin/bash

# Script de monitoreo y mantenimiento del servidor de rifas
# Uso: ./monitor.sh [start|stop|restart|status|logs|health]

set -e

# Configuración
APP_NAME="rifas-backend"
LOG_DIR="./logs"
HEALTH_URL="http://localhost:5001/api/health"
MAX_RESTART_ATTEMPTS=3
RESTART_DELAY=5

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Crear directorio de logs si no existe
create_log_dir() {
    if [ ! -d "$LOG_DIR" ]; then
        mkdir -p "$LOG_DIR"
        log "Directorio de logs creado: $LOG_DIR"
    fi
}

# Verificar si PM2 está instalado
check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        error "PM2 no está instalado. Instalando..."
        npm install -g pm2
        success "PM2 instalado correctamente"
    fi
}

# Función para verificar salud del servidor
check_health() {
    local max_attempts=5
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$HEALTH_URL" > /dev/null 2>&1; then
            success "Servidor saludable (intento $attempt/$max_attempts)"
            return 0
        else
            warning "Servidor no responde (intento $attempt/$max_attempts)"
            sleep 2
            ((attempt++))
        fi
    done
    
    error "Servidor no responde después de $max_attempts intentos"
    return 1
}

# Función para iniciar el servidor
start_server() {
    log "Iniciando servidor $APP_NAME..."
    create_log_dir
    check_pm2
    
    if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
        warning "Servidor ya está ejecutándose"
        pm2 restart "$APP_NAME"
    else
        pm2 start ecosystem.config.js --env development
    fi
    
    sleep 3
    
    if check_health; then
        success "Servidor iniciado correctamente"
        pm2 save
    else
        error "Error iniciando servidor"
        return 1
    fi
}

# Función para detener el servidor
stop_server() {
    log "Deteniendo servidor $APP_NAME..."
    
    if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
        pm2 stop "$APP_NAME"
        success "Servidor detenido"
    else
        warning "Servidor no está ejecutándose"
    fi
}

# Función para reiniciar el servidor
restart_server() {
    log "Reiniciando servidor $APP_NAME..."
    
    if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
        pm2 restart "$APP_NAME"
        sleep 3
        
        if check_health; then
            success "Servidor reiniciado correctamente"
        else
            error "Error reiniciando servidor"
            return 1
        fi
    else
        warning "Servidor no está ejecutándose, iniciando..."
        start_server
    fi
}

# Función para mostrar estado
show_status() {
    log "Estado del servidor:"
    pm2 status "$APP_NAME" 2>/dev/null || warning "Servidor no está ejecutándose"
    
    echo ""
    log "Verificando salud del servidor..."
    if check_health; then
        success "✅ Servidor funcionando correctamente"
    else
        error "❌ Servidor no responde"
    fi
}

# Función para mostrar logs
show_logs() {
    log "Mostrando logs del servidor:"
    pm2 logs "$APP_NAME" --lines 50
}

# Función para monitoreo continuo
monitor_continuous() {
    log "Iniciando monitoreo continuo..."
    
    while true; do
        if ! check_health; then
            error "Servidor no responde, reiniciando..."
            restart_server
        else
            log "Servidor funcionando correctamente"
        fi
        
        sleep 30
    done
}

# Función para limpiar logs antiguos
cleanup_logs() {
    log "Limpiando logs antiguos..."
    
    if [ -d "$LOG_DIR" ]; then
        find "$LOG_DIR" -name "*.log" -mtime +7 -delete
        success "Logs antiguos eliminados"
    else
        warning "Directorio de logs no existe"
    fi
}

# Función para backup de configuración
backup_config() {
    local backup_dir="./backups"
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    
    log "Creando backup de configuración..."
    
    mkdir -p "$backup_dir"
    cp config.env "$backup_dir/config_$timestamp.env"
    cp ecosystem.config.js "$backup_dir/ecosystem_$timestamp.config.js"
    
    success "Backup creado en $backup_dir"
}

# Función principal
main() {
    case "${1:-status}" in
        start)
            start_server
            ;;
        stop)
            stop_server
            ;;
        restart)
            restart_server
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs
            ;;
        health)
            check_health
            ;;
        monitor)
            monitor_continuous
            ;;
        cleanup)
            cleanup_logs
            ;;
        backup)
            backup_config
            ;;
        *)
            echo "Uso: $0 [start|stop|restart|status|logs|health|monitor|cleanup|backup]"
            echo ""
            echo "Comandos disponibles:"
            echo "  start    - Iniciar el servidor"
            echo "  stop     - Detener el servidor"
            echo "  restart  - Reiniciar el servidor"
            echo "  status   - Mostrar estado del servidor"
            echo "  logs     - Mostrar logs del servidor"
            echo "  health   - Verificar salud del servidor"
            echo "  monitor  - Monitoreo continuo"
            echo "  cleanup  - Limpiar logs antiguos"
            echo "  backup   - Crear backup de configuración"
            exit 1
            ;;
    esac
}

# Ejecutar función principal
main "$@"
