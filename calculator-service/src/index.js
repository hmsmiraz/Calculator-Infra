require('dotenv').config();
require('./config/db');
require('./config/redis');

const cors = require('cors');
const app  = require('./app');

app.use(cors());

const PORT     = process.env.PORT     || 4002;
const NODE_ENV = process.env.NODE_ENV || 'development';

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n✅ calculator-service Started');
  console.log('================================');
  console.log(`🌍 Environment : ${NODE_ENV}`);
  console.log(`📡 Port        : ${PORT}`);
  console.log(`🔗 URL         : http://0.0.0.0:${PORT}`);
  console.log(`🧮 Calc API    : http://0.0.0.0:${PORT}/api/calculator`);
  console.log('================================\n');
});

process.on('SIGINT', () => {
  console.log('\nShutting down calculator-service...');
  server.close(() => {
    console.log('calculator-service closed.');
    process.exit(0);
  });
});