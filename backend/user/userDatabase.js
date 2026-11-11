// Everything that talks to the "users" table
const pool = require("../config/database");

async function findByEmail(email) {
  const [rows] = await pool.query("SELECT * FROM users WHERE Email = ?", [email]);
  return rows[0] || null;
}

async function findById(studentId) {
  const [rows] = await pool.query("SELECT * FROM users WHERE student_id = ?", [studentId]);
  return rows[0] || null;
}

async function createUser(user) {
  await pool.query(
    `INSERT INTO users (student_id, Name, Email, Department, Phone_number, UserName, Password_hash, Profile_Pic)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [user.student_id, user.Name, user.Email, user.Department, user.Phone_number, user.UserName, user.Password_hash, user.Profile_Pic]
  );
}

async function updateUser(studentId, values) {
  await pool.query(
    "UPDATE users SET Name = ?, Email = ?, Department = ?, Phone_number = ?, UserName = ? WHERE student_id = ?",
    [values.Name, values.Email, values.Department, values.Phone_number, values.UserName, studentId]
  );
}

module.exports = { findByEmail, findById, createUser, updateUser };
