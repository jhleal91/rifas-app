#!/bin/bash

# Script de Deployment para SorteoHub
# Uso: ./deploy.sh [staging|production]

set -e  # Salir si hay error

ENVIRONMENT=${1:-staging}

echo "🚀 Iniciando deployment a $ENVIRONMENT..."

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: No se encontró package.json. Ejecuta este script desde la raíz del proyecto.${NC}"
    exit 1
fi

# Verificar que las variables de entorno estén configuradas
if [ "$ENVIRONMENT" = "production" ]; then
    if [ ! -f ".env.production" ]; then
        echo -e "${YELLOW}⚠️  Advertencia: No se encontró .env.production${NC}"
        echo "Creando desde .env.example..."
        cp .env.example .env.production
        echo -e "${YELLOW}⚠️  IMPORTANTE: Edita .env.production con los valores de producción${NC}"
    fi
    
    if [ ! -f "backend/config.env" ]; then
        echo -e "${RED}❌ Error: No se encontró backend/config.env${NC}"
        exit 1
    fi
fi

# Pull latest code
echo -e "${GREEN}📥 Obteniendo último código...${NC}"
git pull origin main || echo "⚠️  No se pudo hacer pull (continuando...)"

# Instalar dependencias
echo -e "${GREEN}📦 Instalando dependencias...${NC}"
npm install

# Backend
echo -e "${GREEN}📦 Instalando dependencias del backend...${NC}"
cd backend
npm install --production
cd ..

# Build frontend
echo -e "${GREEN}🔨 Construyendo frontend...${NC}"
npm run build

# Verificar que el build fue exitoso
if [ ! -d "build" ]; then
    echo -e "${RED}❌ Error: El build falló. No se creó la carpeta build/${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completado exitosamente${NC}"

# Reiniciar PM2 (si está configurado)
if command -v pm2 &> /dev/null; then
    echo -e "${GREEN}🔄 Reiniciando aplicación con PM2...${NC}"
    cd backend
    pm2 restart ecosystem.config.js --env $ENVIRONMENT || pm2 start ecosystem.config.js --env $ENVIRONMENT
    cd ..
    echo -e "${GREEN}✅ Aplicación reiniciada${NC}"
else
    echo -e "${YELLOW}⚠️  PM2 no está instalado. Reinicia manualmente el backend.${NC}"
fi

# Verificar salud del backend
echo -e "${GREEN}🏥 Verificando salud del backend...${NC}"
sleep 3
if curl -f http://localhost:5001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend está respondiendo${NC}"
else
    echo -e "${YELLOW}⚠️  Backend no responde. Verifica los logs.${NC}"
fi

echo -e "${GREEN}🎉 Deployment completado!${NC}"
echo ""
echo "Próximos pasos:"
echo "1. Verifica que el frontend se sirve correctamente"
echo "2. Prueba los flujos críticos"
echo "3. Monitorea los logs: pm2 logs"

