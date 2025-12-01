const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  // Proxy any /api/* requests to backend (which mounts auth routes under /api/auth)
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://192.168.1.5:5001',
      changeOrigin: true,
      secure: false,
    })
  );
  // Proxy only admin API endpoints (avoid proxying SPA routes like /admin/default)
  app.use(
    '/admin/stats',
    createProxyMiddleware({
      target: process.env.REACT_APP_API_BASE || 'http://192.168.1.5:5001',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
    })
  );
};
