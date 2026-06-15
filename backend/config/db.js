const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

module.exports = pool;
console.log("DB FILE LOADED");
console.log(process.env.DB_NAME);
console.log(typeof pool.query);
console.log("DB.JS IS EXECUTING");