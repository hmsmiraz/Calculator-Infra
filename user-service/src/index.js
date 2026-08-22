require('dotenv').config();
require('./config/db');
require('./config/redis');

const cors = require('cors');
const app  = require('./app');

app.use(cors());

const PORT     = process.env.PORT     || 4003;
const NODE_ENV = process.env.NODE_ENV || 'development';

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n✅ user-service Started');
  console.log('================================');
  console.log(`🌍 Environment : ${NODE_ENV}`);
  console.log(`📡 Port        : ${PORT}`);
  console.log(`🔗 URL         : http://0.0.0.0:${PORT}`);
  console.log(`👤 User API    : http://0.0.0.0:${PORT}/api/users`);
  console.log('================================\n');
});

process.on('SIGINT', () => {
  console.log('\nShutting down user-service...');
  server.close(() => {
    console.log('user-service closed.');
    process.exit(0);
  });
});