module.exports = {
  apps: [
    {
      name: 'pubfreedom-server',
      script: 'index.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      time: true,
      env: {
        NODE_ENV: 'development',
        PORT: 5001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5001,
        ALLOWED_ORIGINS: 'https://www.pubfreedom.it,https://pubfreedom.it',
        PUBLIC_MENU_URL: 'https://www.pubfreedom.it/menu'
      }
    }
  ]
};