// Everything that talks to the "faculty" table
const pool = require("../config/database");

async function getAllFaculty() {
  const [rows] = await pool.query("SELECT * FROM faculty ORDER BY Name");
  return rows;
}

async function getFacultyById(facultyId) {
  const [rows] = await pool.query("SELECT * FROM faculty WHERE Faculty_listing_id = ?", [facultyId]);
  return rows[0] || null;
}

async function createFaculty(f) {
  const [result] = await pool.query(
    "INSERT INTO faculty (Name, Designation, Email, Department, Image, Counseling_Hour) VALUES (?, ?, ?, ?, ?, ?)",
    [f.Name, f.Designation, f.Email, f.Department, f.Image, f.Counseling_Hour]
  );
  return result.insertId;
}

async function updateFaculty(facultyId, f) {
  const [result] = await pool.query(
    "UPDATE faculty SET Name = ?, Designation = ?, Email = ?, Department = ?, Image = ?, Counseling_Hour = ? WHERE Faculty_listing_id = ?",
    [f.Name, f.Designation, f.Email, f.Department, f.Image, f.Counseling_Hour, facultyId]
  );
  return result.affectedRows > 0;
}

async function deleteFaculty(facultyId) {
  const [result] = await pool.query("DELETE FROM faculty WHERE Faculty_listing_id = ?", [facultyId]);
  return result.affectedRows > 0;
}

module.exports = { getAllFaculty, getFacultyById, createFaculty, updateFaculty, deleteFaculty };
