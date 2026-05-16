const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : 5432,
  database: process.env.DATABASE_NAME || 'appdb',
  user: process.env.DATABASE_USER || 'appuser',
  password: process.env.DATABASE_PASSWORD || 'secret',
});

module.exports = pool;
