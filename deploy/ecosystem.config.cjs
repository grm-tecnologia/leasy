module.exports = {
  apps: [
    {
      name: "leasy",
      script: "dist/index.js",
      cwd: "/var/www/leasy",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_file: "/var/www/leasy/.env",
      error_file: "/var/log/leasy/error.log",
      out_file: "/var/log/leasy/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
    },
  ],
};
