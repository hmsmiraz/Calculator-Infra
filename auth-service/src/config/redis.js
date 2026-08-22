const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.on('connect',    () => console.log('✅ [auth-service] Redis connected'));
redis.on('error', (e) => console.error('❌ [auth-service] Redis error:', e.message));

module.exports = redis;
