module.exports = {
  apps: [
    {
      name: 'mawared-backend',
      script: 'dist/main.js',
      cwd: '/home/ubuntu/mawared/apps/backend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
