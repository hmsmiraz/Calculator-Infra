require('dotenv').config();

const cors  = require('cors');
const app   = require('./app');
const redis = require('./utils/redis');

app.use(cors());

const PORT     = process.env.PORT     || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';

redis.connect().catch(() => console.warn('⚠️  Redis not available — rate limiting disabled'));

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n🚀 API Gateway Started');
  console.log('================================');
  console.log(`🌍 Environment : ${NODE_ENV}`);
  console.log(`📡 Port        : ${PORT}`);
  console.log(`🔗 URL         : http://0.0.0.0:${PORT}`);
  console.log(`🔐 Auth        : → ${process.env.AUTH_SERVICE_URL}`);
  console.log(`🧮 Calculator  : → ${process.env.CALC_SERVICE_URL}`);
  console.log(`👤 User        : → ${process.env.USER_SERVICE_URL}`);
  console.log('================================\n');
});

process.on('SIGINT', () => {
  console.log('\nShutting down API Gateway...');
  server.close(() => {
    console.log('API Gateway closed.');
    process.exit(0);
  });
});