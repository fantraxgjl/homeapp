/** @type {import('pm2').ProcessDescription} */
module.exports = {
  apps: [
    {
      name: "homeapp",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      watch: false,
      autorestart: true,
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: "10s",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      // Log config
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "logs/error.log",
      out_file: "logs/out.log",
      merge_logs: true,
    },
  ],
};
