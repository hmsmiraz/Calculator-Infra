const express = require('express');
const morgan  = require('morgan');
const calcRoutes = require('./routes/calculator.routes');

const app = express();
app.use(express.json());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

app.get('/health', (_req, res) =>
  res.json({ success: true, service: 'calculator-service', status: 'healthy' })
);

app.use('/api/calculator', calcRoutes);

app.use((err, _req, res, _next) => {
  console.error('[calculator-service]', err.message);
  if (err.message === 'Division by zero is not allowed')
    return res.status(400).json({ success: false, message: err.message });
  res.status(500).json({ success: false, message: 'Calculator service error.' });
});

module.exports = app;
