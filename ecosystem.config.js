module.exports = {
  apps: [
    {
      name: "doi-dia-chi",
      cwd: "/var/www/doi-dia-chi",
      script: ".next/standalone/server.js",
      args: "start -p 3005",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3005,
        HOSTNAME: "127.0.0.1",
      },
    },
  ],
};
