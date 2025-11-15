# Dockerfile para el backend de rifas
FROM node:18-alpine

# Instalar dependencias del sistema
RUN apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production && npm cache clean --force

# Copiar código fuente
COPY . .

# Crear directorio de logs
RUN mkdir -p logs && chown -R nodejs:nodejs logs

# Cambiar a usuario no-root
USER nodejs

# Exponer puerto
EXPOSE 5001

# Configurar health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5001/api/health || exit 1

# Usar dumb-init para manejo de señales
ENTRYPOINT ["dumb-init", "--"]

# Comando por defecto
CMD ["node", "server.js"]
