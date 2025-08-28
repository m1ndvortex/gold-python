const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // 🐳 DOCKER NETWORKING FIX: Use backend service name for internal Docker communication
  const backendUrl = 'http://backend:8000';

  console.log('🐳 Docker Proxy Configuration:', {
    environment: process.env.NODE_ENV,
    backendUrl: backendUrl,
    apiUrl: process.env.REACT_APP_API_URL
  });

  // Proxy for /api routes with enhanced authentication support
  app.use(
    '/api',
    createProxyMiddleware({
      target: backendUrl,
      changeOrigin: true,
      secure: false,
      logLevel: 'info',
      timeout: 30000, // 30 second timeout
      onError: (err, req, res) => {
        console.error('🚨 Proxy Error:', err.message);
        console.error('🔍 Request URL:', req.url);
        console.error('🎯 Target:', backendUrl);
        res.status(500).json({ 
          error: 'Proxy error', 
          details: err.message,
          timestamp: new Date().toISOString()
        });
      },
      onProxyReq: (proxyReq, req) => {
        console.log('📤 Proxying request:', req.method, req.url, '→', backendUrl + req.url);
        
        // Forward all authentication-related headers with enhanced support
        const authHeaders = [
          'authorization',
          'x-api-key',
          'x-auth-token',
          'x-request-id',
          'cookie',
          'cache-control',
          'pragma'
        ];
        
        authHeaders.forEach(header => {
          if (req.headers[header]) {
            proxyReq.setHeader(header, req.headers[header]);
            if (header === 'authorization') {
              console.log('🔐 Forwarding Authorization header');
            }
          }
        });
        
        // Forward user agent and other important headers
        if (req.headers['user-agent']) {
          proxyReq.setHeader('User-Agent', req.headers['user-agent']);
        }
        
        if (req.headers['accept']) {
          proxyReq.setHeader('Accept', req.headers['accept']);
        }
        
        if (req.headers['x-requested-with']) {
          proxyReq.setHeader('X-Requested-With', req.headers['x-requested-with']);
        }
        
        // Handle client IP forwarding
        const clientIp = req.headers['x-forwarded-for'] || 
                        req.connection?.remoteAddress || 
                        req.socket?.remoteAddress ||
                        (req.connection?.socket ? req.connection.socket.remoteAddress : null);
        
        if (clientIp) {
          proxyReq.setHeader('X-Forwarded-For', clientIp);
          proxyReq.setHeader('X-Real-IP', clientIp);
        }
        
        // Set additional proxy headers
        proxyReq.setHeader('X-Forwarded-Proto', req.protocol || 'http');
        proxyReq.setHeader('X-Forwarded-Host', req.headers.host || 'localhost');
        
        // Handle request body for POST/PUT/PATCH requests
        if (req.body && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
          let bodyData;
          const contentType = req.headers['content-type'] || '';
          
          // Handle different content types
          if (contentType.includes('application/json')) {
            bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
          } else if (contentType.includes('multipart/form-data')) {
            // For file uploads, preserve the original content-type with boundary
            bodyData = req.body;
            if (req.headers['content-type']) {
              proxyReq.setHeader('Content-Type', req.headers['content-type']);
            }
          } else if (contentType.includes('application/x-www-form-urlencoded')) {
            // Handle form data
            bodyData = req.body;
            proxyReq.setHeader('Content-Type', 'application/x-www-form-urlencoded');
          } else {
            // Default to JSON
            bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
          }
          
          if (typeof bodyData === 'string') {
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
          }
        }
      },
      onProxyRes: (proxyRes, req) => {
        const statusCode = proxyRes.statusCode;
        const isError = statusCode >= 400;
        
        if (isError) {
          console.error(`🚨 Proxy Error Response: ${statusCode} for ${req.method} ${req.url}`);
        } else {
          console.log(`📥 Proxy Success: ${statusCode} for ${req.method} ${req.url}`);
        }
        
        // Enhanced CORS headers for OAuth2 and authentication
        proxyRes.headers['Access-Control-Allow-Origin'] = req.headers.origin || '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD';
        proxyRes.headers['Access-Control-Allow-Headers'] = [
          'Origin',
          'X-Requested-With', 
          'Content-Type', 
          'Accept', 
          'Authorization',
          'X-API-Key',
          'X-Auth-Token',
          'X-Request-ID',
          'Cache-Control',
          'Pragma',
          'X-Forwarded-For',
          'X-Real-IP'
        ].join(', ');
        proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
        proxyRes.headers['Access-Control-Max-Age'] = '86400'; // 24 hours
        proxyRes.headers['Access-Control-Expose-Headers'] = 'Content-Disposition, X-Request-ID';
        
        // Security headers
        proxyRes.headers['X-Content-Type-Options'] = 'nosniff';
        proxyRes.headers['X-Frame-Options'] = 'DENY';
        proxyRes.headers['X-XSS-Protection'] = '1; mode=block';
        
        // Handle authentication-related responses
        if (req.url.includes('/oauth2/') || req.url.includes('/auth/')) {
          // Allow credentials for auth endpoints
          proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
          
          // Log authentication responses for debugging
          if (statusCode === 401) {
            console.warn(`🔐 Unauthorized access attempt to ${req.url}`);
          } else if (statusCode === 403) {
            console.warn(`🚫 Forbidden access attempt to ${req.url}`);
          } else if (statusCode === 200 && req.method === 'POST') {
            console.log(`✅ Successful authentication for ${req.url}`);
          }
        }
      }
    })
  );

  // Proxy for direct backend API routes (for backward compatibility) with auth support
  app.use(
    ['/reports', '/invoices', '/inventory', '/customers', '/auth', '/categories', '/settings', '/sms', '/advanced-analytics', '/kpi', '/business-config', '/accounting', '/disaster-recovery', '/oauth2'],
    createProxyMiddleware({
      target: backendUrl,
      changeOrigin: true,
      secure: false,
      logLevel: 'info',
      timeout: 30000,
      onError: (err, req, res) => {
        console.error('🚨 Direct API Proxy Error:', err.message);
        console.error('🔍 Request URL:', req.url);
        console.error('🎯 Target:', backendUrl);
        res.status(500).json({ 
          error: 'Direct API proxy error', 
          details: err.message,
          timestamp: new Date().toISOString()
        });
      },
      onProxyReq: (proxyReq, req) => {
        console.log('📤 Direct API Proxying request:', req.method, req.url, '→', backendUrl + req.url);
        
        // Forward all authentication headers for direct API routes
        const authHeaders = [
          'authorization',
          'x-api-key',
          'x-auth-token',
          'x-request-id',
          'cookie',
          'cache-control',
          'pragma'
        ];
        
        authHeaders.forEach(header => {
          if (req.headers[header]) {
            proxyReq.setHeader(header, req.headers[header]);
            if (header === 'authorization') {
              console.log('🔐 Forwarding Authorization header for direct API');
            }
          }
        });
        
        // Forward other important headers
        if (req.headers['content-type']) {
          proxyReq.setHeader('Content-Type', req.headers['content-type']);
        }
        if (req.headers['accept']) {
          proxyReq.setHeader('Accept', req.headers['accept']);
        }
        if (req.headers['user-agent']) {
          proxyReq.setHeader('User-Agent', req.headers['user-agent']);
        }
      },
      onProxyRes: (proxyRes, req) => {
        console.log('📥 Direct API Proxy response:', proxyRes.statusCode, req.url);
        
        // Add enhanced CORS headers for direct API routes
        proxyRes.headers['Access-Control-Allow-Origin'] = req.headers.origin || '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD';
        proxyRes.headers['Access-Control-Allow-Headers'] = [
          'Origin',
          'X-Requested-With',
          'Content-Type',
          'Accept',
          'Authorization',
          'X-API-Key',
          'X-Auth-Token',
          'X-Request-ID',
          'Cache-Control',
          'Pragma'
        ].join(', ');
        proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
        proxyRes.headers['Access-Control-Expose-Headers'] = 'Content-Disposition, X-Request-ID';
      }
    })
  );

  // Handle preflight OPTIONS requests for CORS with enhanced headers
  app.options([
    '/api/*', 
    '/reports/*', 
    '/invoices/*', 
    '/inventory/*', 
    '/customers/*', 
    '/auth/*', 
    '/oauth2/*',
    '/categories/*',
    '/settings/*',
    '/sms/*',
    '/advanced-analytics/*',
    '/kpi/*',
    '/business-config/*',
    '/accounting/*',
    '/disaster-recovery/*'
  ], (req, res) => {
    console.log('🔄 Handling CORS preflight for:', req.url);
    
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
    res.header('Access-Control-Allow-Headers', [
      'Origin',
      'X-Requested-With', 
      'Content-Type', 
      'Accept', 
      'Authorization',
      'X-API-Key',
      'X-Auth-Token',
      'X-Request-ID',
      'Cache-Control',
      'Pragma',
      'X-Forwarded-For',
      'X-Real-IP'
    ].join(', '));
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    res.header('Access-Control-Expose-Headers', 'Content-Disposition, X-Request-ID');
    res.sendStatus(200);
  });
};