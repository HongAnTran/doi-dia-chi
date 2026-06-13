module.exports = {
  apps: [
    {
      name: "doi-dia-chi",
      cwd: "/var/www/doi-dia-chi",
      script: ".next/standalone/server.js",
      args: "start -p 3002",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3002,
        HOSTNAME: "127.0.0.1",
      },
    },
  ],
};
