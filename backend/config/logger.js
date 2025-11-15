// Configuración de Logging Estructurado con Winston
const winston = require('winston');
const path = require('path');

// Definir niveles de log personalizados
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Colores para cada nivel
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

winston.addColors(colors);

// Formato de log
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Formato para consola (más legible)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

// Transports (dónde se guardan los logs)
const transports = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')
  })
];

// En producción, agregar file transports
if (process.env.NODE_ENV === 'production') {
  const logsDir = path.join(__dirname, '../logs');
  
  // Log de errores
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: format,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );

  // Log general
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: format,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
}

// Crear logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels,
  format,
  transports,
  // No salir del proceso en caso de error
  exitOnError: false
});

// Stream para integración con Express morgan (opcional)
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

module.exports = logger;

