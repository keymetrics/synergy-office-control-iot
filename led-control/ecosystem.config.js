module.exports = {
  apps: [{
    name: 'led-control',
    script: 'index.js',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }],
  deploy: {
    production: {
      user: 'root',
      host: '192.168.1.11',
      ref: 'origin/master',
      repo: 'git@github.com:keymetrics/led-control.git',
      path: '/home/pi/led-control/',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
}
