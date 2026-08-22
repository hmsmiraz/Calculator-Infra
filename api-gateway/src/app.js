const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');

const proxyRoutes            = require('./routes/proxy.routes');
const { rateLimit }          = require('./middleware/rateLimit.middleware');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'DELETE', 'PATCH', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Rate limit all requests via Redis — 100 req/min per IP
app.use(rateLimit(100, 60));

// Health
app.get('/health', (_req, res) =>
  res.json({
    success: true,
    service: 'api-gateway',
    status:  'healthy',
    uptime:  process.uptime(),
    services: {
      auth:       process.env.AUTH_SERVICE_URL,
      calculator: process.env.CALC_SERVICE_URL,
      user:       process.env.USER_SERVICE_URL,
    },
  })
);

app.get('/', (_req, res) =>
  res.json({
    success: true,
    message: 'Calculator API Gateway 🚀',
    version: '3.0.0',
    routes: {
      auth:       '/api/v1/auth/*',
      calculator: '/api/v1/calculator/*',
      users:      '/api/v1/users/*',
    },
  })
);

// All API traffic goes through the proxy router
app.use('/api/v1', proxyRoutes);

// 404
app.use((req, res) =>
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` })
);

// Error handler
app.use((err, _req, res, _next) => {
  console.error('[Gateway Error]', err.message);
  res.status(500).json({ success: false, message: 'Gateway error.' });
});

module.exports = app;
