const express = require('express');
const morgan  = require('morgan');
const authRoutes = require('./routes/auth.routes');

const app = express();
app.use(express.json());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

app.get('/health', (_req, res) =>
  res.json({ success: true, service: 'auth-service', status: 'healthy' })
);

app.use('/api/auth', authRoutes);

app.use((err, _req, res, _next) => {
  console.error('[auth-service]', err.message);
  if (err.code === '23505') return res.status(409).json({ success: false, message: 'Email already registered.' });
  res.status(500).json({ success: false, message: 'Auth service error.' });
});

module.exports = app;
