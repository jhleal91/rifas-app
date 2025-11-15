module.exports = {
  apps: [{
    name: 'rifas-backend',
    script: 'server.js',
    cwd: './backend',
    instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
    exec_mode: 'cluster',
    
    // Configuración de entorno
    env: {
      NODE_ENV: 'development',
      PORT: 5001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    
    // Configuración de reinicio automático
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    
    // Configuración de logs
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Configuración de monitoreo
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    
    // Configuración de health check
    health_check_grace_period: 3000,
    
    // Configuración de cluster
    kill_timeout: 5000,
    listen_timeout: 3000,
    
    // Variables de entorno adicionales
    env_file: './config.env',
    
    // Configuración de errores
    merge_logs: true,
    time: true,
    
    // Configuración de notificaciones (opcional)
    // notify: true,
    // notify_mode: 'startup',
    
    // Configuración de source map (para debugging)
    source_map_support: true,
    
    // Configuración de timeouts
    kill_retry_time: 100,
    
    // Configuración de graceful shutdown
    shutdown_with_message: true,
    
    // Configuración de cluster mode
    increment_var: 'PORT',
    
    // Configuración de monitoreo avanzado
    pmx: true,
    
    // Configuración de memoria
    max_memory_restart: '500M',
    
    // Configuración de CPU
    max_cpu_restart: 80,
    
    // Configuración de archivos a monitorear (solo en desarrollo)
    watch_options: {
      followSymlinks: false,
      usePolling: true,
      interval: 1000
    },
    
    // Configuración de ignore files
    ignore_watch: [
      'node_modules',
      'logs',
      '*.log',
      '*.pid',
      '*.seed',
      '*.pid.lock',
      '.git',
      '.nyc_output',
      'coverage',
      '.cache'
    ]
  }],
  
  // Configuración de deployment (opcional)
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo/rifas-app.git',
      path: '/var/www/rifas-app',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
