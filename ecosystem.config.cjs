module.exports = {
  apps: [{
    name: "leasy",
    script: "dist/index.js",
    cwd: "/var/www/leadhub",
    instances: 1,
    exec_mode: "fork",
    max_memory_restart: "300M",
    env: {
      NODE_ENV: "production",
    },
    error_file: "/root/.pm2/logs/leasy-error.log",
    out_file: "/root/.pm2/logs/leasy-out.log",
    merge_logs: true,
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    watch: false,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 5000,
  }]
};
