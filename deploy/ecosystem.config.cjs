module.exports = {
  apps: [
    {
      name: "surf-crm-api",
      script: "server/sheetsProxy.mjs",
      cwd: "/var/www/surf-crm",
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "256M",
      time: true,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
