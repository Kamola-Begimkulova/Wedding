const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' }); 

const pool = new Pool({
    connectionString: "postgresql://kamola:OcfXypODkOLqNnYnCBwPhaH1jVVoPoU0@dpg-d0rek4ndiees73bv74dg-a.oregon-postgres.render.com/photoapp_7h6h",
    ssl: {
      rejectUnauthorized: false, 
    },
  });
  
  module.exports = pool;
