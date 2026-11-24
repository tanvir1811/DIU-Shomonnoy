// Everything that talks to the "equipment" table
const pool = require("../config/database");

async function getAllEquipment() {
  const [rows] = await pool.query("SELECT * FROM equipment ORDER BY created_at DESC, Equipment_id DESC");
  return rows;
}

async function getEquipmentByUser(userId) {
  const [rows] = await pool.query(
    "SELECT * FROM equipment WHERE Uploaded_by = ? ORDER BY created_at DESC, Equipment_id DESC",
    [userId]
  );
  return rows;
}

async function getEquipmentById(equipmentId) {
  const [rows] = await pool.query("SELECT * FROM equipment WHERE Equipment_id = ?", [equipmentId]);
  return rows[0] || null;
}

async function createEquipment(item) {
  const [result] = await pool.query(
    "INSERT INTO equipment (Title, Description, Picture_Path, Asking_Type, Equipment_Condition, Price, Uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [item.Title, item.Description, item.Picture_Path, item.Asking_Type, item.Equipment_Condition, item.Price, item.Uploaded_by]
  );
  return result.insertId;
}

async function updateEquipment(equipmentId, item) {
  await pool.query(
    "UPDATE equipment SET Title = ?, Description = ?, Picture_Path = ?, Asking_Type = ?, Equipment_Condition = ?, Price = ? WHERE Equipment_id = ?",
    [item.Title, item.Description, item.Picture_Path, item.Asking_Type, item.Equipment_Condition, item.Price, equipmentId]
  );
}

async function deleteEquipment(equipmentId) {
  await pool.query("DELETE FROM equipment WHERE Equipment_id = ?", [equipmentId]);
}

module.exports = { getAllEquipment, getEquipmentByUser, getEquipmentById, createEquipment, updateEquipment, deleteEquipment };