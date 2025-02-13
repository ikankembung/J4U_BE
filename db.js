const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres', 
  host: 'localhost',
  database: 'JAJAN4U', 
  password: 'J4U_SMKN4BDG',
  port: 5432,
});

module.exports = pool;