module.exports = {
  apps : [{
    name      : 'DMX-control',
    script    : 'index.js',
    env: {
      COMMON_VARIABLE: 'true'
    },
    env_production : {
      NODE_ENV: 'production'
    }
  }]
};
