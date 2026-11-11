// Creates the first admin account:  npm run seed:admin
require("dotenv").config();
const bcrypt = require("bcryptjs");
const adminDatabase = require("../admin/adminDatabase");
const pool = require("../config/database");

async function run() {
  const email = (process.env.ADMIN_EMAIL || "admin@diu.edu.bd").toLowerCase();
  if (await adminDatabase.findByEmail(email)) {
    console.log("Admin already exists:", email);
    return;
  }
  await adminDatabase.createAdmin({
    Name: process.env.ADMIN_NAME || "Main Admin",
    Email: email,
    UserName: process.env.ADMIN_USERNAME || "admin",
    Password_hash: await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123", 10),
  });
  console.log("Admin created:", email);
}

run().catch(console.error).finally(function () { pool.end(); });
