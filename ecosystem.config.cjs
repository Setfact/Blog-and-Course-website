module.exports = {
  apps: [
    {
      name: 'blog-course',
      script: './dist/server/entry.mjs',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0',
      },
    },
  ],
};
