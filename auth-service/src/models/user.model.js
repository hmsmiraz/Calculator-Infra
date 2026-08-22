const pool    = require('../config/db');
const bcrypt  = require('bcryptjs');

const UserModel = {
  async create({ name, email, password }) {
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, hash]
    );
    return rows[0];
  },

  async findByEmail(email) {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1', [id]
    );
    return rows[0] || null;
  },

  async comparePassword(plain, hash) {
    return bcrypt.compare(plain, hash);
  },
};

module.exports = UserModel;
