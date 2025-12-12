module.exports = {
    apps: [{
        name: 'lexa',
        script: 'node_modules/next/dist/bin/next',
        args: 'start -p 3001',
        instances: 1, // Start with 1, can scale to 'max' for cluster mode
        exec_mode: 'fork', // Use 'cluster' for multiple instances

        // Environment
        env_production: {
            NODE_ENV: 'production',
            PORT: 3001
        },

        // Memory management - OTIMIZADO
        max_memory_restart: '1500M', // Aumentado de 1G para 1.5GB

        // Logging
        error_file: './logs/pm2-error.log',
        out_file: './logs/pm2-out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true,

        // Auto-restart configuration - OTIMIZADO
        autorestart: true,
        watch: false, // Don't watch files in production
        max_restarts: 10,
        min_uptime: '30s', // Aumentado de 10s para 30s

        // Graceful shutdown - OTIMIZADO
        kill_timeout: 10000, // Aumentado de 5s para 10s
        listen_timeout: 5000, // Aumentado de 3s para 5s
        shutdown_with_message: true,

        // Health monitoring - OTIMIZADO
        exp_backoff_restart_delay: 100,

        // Health check endpoint
        health_check: {
            url: 'http://localhost:3001/api/health',
            interval: 60000, // Check every 60 seconds
            timeout: 5000,
        },

        // Environment variables file
        env_file: '.env.production',

        // Cron restart - REMOVIDO (não é necessário com monitoramento)
        // cron_restart: '0 3 * * *',

        // Node.js options - OTIMIZADO
        node_args: '--max-old-space-size=3072', // Aumentado de 2GB para 3GB heap limit
    }]
};
