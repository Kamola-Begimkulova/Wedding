const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' }); 

const pool = new Pool({
    connectionString: "postgresql://image_web:uUttgnhNQFa3lZ0IOVYrRx7EFrf2rpUP@dpg-d0tcrqc9c44c739blhfg-a.oregon-postgres.render.com/Wedding",
    ssl: {
      rejectUnauthorized: false, 
    },
  });
  
  module.exports = pool;
