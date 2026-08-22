const express    = require('express');
const morgan     = require('morgan');
const userRoutes = require('./routes/user.routes');

const app = express();
app.use(express.json());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

app.get('/health', (_req, res) =>
  res.json({ success: true, service: 'user-service', status: 'healthy' })
);

app.use('/api/users', userRoutes);

app.use((err, _req, res, _next) => {
  console.error('[user-service]', err.message);
  res.status(500).json({ success: false, message: 'User service error.' });
});

module.exports = app;
