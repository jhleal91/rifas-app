#!/bin/bash

# Script de despliegue para producción
# Uso: ./deploy.sh [staging|production]

set -e

# Configuración
ENVIRONMENT=${1:-staging}
APP_NAME="rifas-backend"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.${ENVIRONMENT}"

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

# Verificar prerrequisitos
check_prerequisites() {
    log "Verificando prerrequisitos..."
    
    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        error "Docker no está instalado"
        exit 1
    fi
    
    # Verificar Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose no está instalado"
        exit 1
    fi
    
    # Verificar archivo de variables de entorno
    if [ ! -f "$ENV_FILE" ]; then
        error "Archivo de variables de entorno no encontrado: $ENV_FILE"
        exit 1
    fi
    
    success "Prerrequisitos verificados"
}

# Crear backup
create_backup() {
    log "Creando backup de la base de datos..."
    
    local backup_dir="./backups"
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    
    mkdir -p "$backup_dir"
    
    # Backup de la base de datos
    docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres \
        pg_dump -U rifas_user rifas_digital_prod > "$backup_dir/db_backup_$timestamp.sql"
    
    success "Backup creado: $backup_dir/db_backup_$timestamp.sql"
}

# Construir y desplegar
deploy() {
    log "Desplegando aplicación en entorno: $ENVIRONMENT"
    
    # Detener servicios existentes
    log "Deteniendo servicios existentes..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" down
    
    # Construir imágenes
    log "Construyendo imágenes Docker..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache
    
    # Iniciar servicios
    log "Iniciando servicios..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    
    # Esperar a que los servicios estén listos
    log "Esperando a que los servicios estén listos..."
    sleep 30
    
    # Verificar salud de los servicios
    check_health
}

# Verificar salud de los servicios
check_health() {
    log "Verificando salud de los servicios..."
    
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f http://localhost:5001/api/health > /dev/null 2>&1; then
            success "Backend saludable (intento $attempt/$max_attempts)"
            break
        else
            warning "Backend no responde (intento $attempt/$max_attempts)"
            sleep 10
            ((attempt++))
        fi
    done
    
    if [ $attempt -gt $max_attempts ]; then
        error "Backend no responde después de $max_attempts intentos"
        show_logs
        exit 1
    fi
    
    # Verificar base de datos
    if docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres \
        pg_isready -U rifas_user -d rifas_digital_prod > /dev/null 2>&1; then
        success "Base de datos saludable"
    else
        error "Base de datos no responde"
        exit 1
    fi
}

# Mostrar logs
show_logs() {
    log "Mostrando logs de los servicios..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" logs --tail=50
}

# Limpiar recursos no utilizados
cleanup() {
    log "Limpiando recursos no utilizados..."
    docker system prune -f
    docker volume prune -f
    success "Limpieza completada"
}

# Mostrar estado
show_status() {
    log "Estado de los servicios:"
    docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" ps
    
    echo ""
    log "Uso de recursos:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
}

# Función principal
main() {
    log "Iniciando despliegue en entorno: $ENVIRONMENT"
    
    check_prerequisites
    
    if [ "$ENVIRONMENT" = "production" ]; then
        warning "Desplegando en PRODUCCIÓN"
        read -p "¿Estás seguro? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Despliegue cancelado"
            exit 1
        fi
        
        create_backup
    fi
    
    deploy
    
    success "Despliegue completado exitosamente"
    
    echo ""
    log "Información del despliegue:"
    echo "  - Entorno: $ENVIRONMENT"
    echo "  - Backend: http://localhost:5001"
    echo "  - Health Check: http://localhost:5001/api/health"
    echo "  - Prometheus: http://localhost:9090"
    echo "  - Grafana: http://localhost:3001"
    
    echo ""
    log "Comandos útiles:"
    echo "  - Ver logs: docker-compose -f $DOCKER_COMPOSE_FILE --env-file $ENV_FILE logs -f"
    echo "  - Ver estado: docker-compose -f $DOCKER_COMPOSE_FILE --env-file $ENV_FILE ps"
    echo "  - Detener: docker-compose -f $DOCKER_COMPOSE_FILE --env-file $ENV_FILE down"
    echo "  - Reiniciar: docker-compose -f $DOCKER_COMPOSE_FILE --env-file $ENV_FILE restart"
}

# Ejecutar función principal
main
