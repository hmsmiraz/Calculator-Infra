const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost', port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'calculator_db',
  user: process.env.DB_USER || 'calculator_user', password: process.env.DB_PASSWORD || '',
});
pool.connect((err, client, release) => {
  if (err) { console.error('❌ [user-service] DB failed:', err.message); return; }
  release(); console.log('✅ [user-service] PostgreSQL connected');
});
module.exports = pool;
