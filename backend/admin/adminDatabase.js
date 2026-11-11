// Everything that talks to the "admins" table
const pool = require("../config/database");

// Create the admins table if it does not exist yet
async function ensureAdminsTable() {
  await pool.query(
    "CREATE TABLE IF NOT EXISTS admins (" +
      "admin_id INT AUTO_INCREMENT PRIMARY KEY, " +
      "Name VARCHAR(100) NOT NULL, " +
      "Email VARCHAR(150) NOT NULL UNIQUE, " +
      "Department VARCHAR(100) DEFAULT '', " +
      "Phone_number VARCHAR(30) DEFAULT '', " +
      "UserName VARCHAR(60) NOT NULL UNIQUE, " +
      "Password_hash VARCHAR(255) NOT NULL, " +
      "Profile_Pic VARCHAR(255) DEFAULT ''" +
    ")"
  );
}

async function findByEmail(email) {
  const [rows] = await pool.query("SELECT * FROM admins WHERE Email = ?", [email]);
  return rows[0] || null;
}

async function findById(adminId) {
  const [rows] = await pool.query("SELECT * FROM admins WHERE admin_id = ?", [adminId]);
  return rows[0] || null;
}

async function updateAdmin(adminId, values) {
  await pool.query(
    "UPDATE admins SET Name = ?, Email = ?, Department = ?, Phone_number = ?, UserName = ? WHERE admin_id = ?",
    [values.Name, values.Email, values.Department, values.Phone_number, values.UserName, adminId]
  );
}

async function updatePasswordHash(adminId, passwordHash) {
  await pool.query("UPDATE admins SET Password_hash = ? WHERE admin_id = ?", [passwordHash, adminId]);
}

async function createAdmin(admin) {
  await pool.query(
    "INSERT INTO admins (Name, Email, Department, Phone_number, UserName, Password_hash, Profile_Pic) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [admin.Name, admin.Email, admin.Department || "", admin.Phone_number || "", admin.UserName, admin.Password_hash, admin.Profile_Pic || ""]
  );
}

module.exports = { ensureAdminsTable, findByEmail, findById, updateAdmin, updatePasswordHash, createAdmin };