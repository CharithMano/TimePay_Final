module.exports = {
  apps: [{
    name: 'prasanna-payroll-backend',
    script: './server.js',
    cwd: '/var/www/prasanna_payroll_and_HRMS/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5002
    },
    error_file: '/var/log/pm2/prasanna-payroll-error.log',
    out_file: '/var/log/pm2/prasanna-payroll-out.log',
    log_file: '/var/log/pm2/prasanna-payroll-combined.log',
    time: true
  }]
};