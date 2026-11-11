// ONE shared MySQL connection pool. Every feature's "Database" file imports this.
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "diu_shomonnoy",
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true, // dates come back as plain text (the frontend shows them directly)
});

module.exports = pool;
