// Everything that talks to the "notes" table
const pool = require("../config/database");

async function getAllNotes() {
  const [rows] = await pool.query("SELECT * FROM notes ORDER BY created_at DESC, Note_id DESC");
  return rows;
}

// Notes uploaded by one user
async function getNotesByUser(userId) {
  const [rows] = await pool.query(
    "SELECT * FROM notes WHERE Uploaded_by = ? ORDER BY created_at DESC, Note_id DESC",
    [userId]
  );
  return rows;
}

async function getNoteById(noteId) {
  const [rows] = await pool.query("SELECT * FROM notes WHERE Note_id = ?", [noteId]);
  return rows[0] || null;
}

// The old Course column is still filled (with the course code) so the table keeps working
async function createNote(note) {
  const [result] = await pool.query(
    "INSERT INTO notes (Title, Course_Code, Course_Name, Course, Semester, Year, Description, File_Path, Uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [note.Title, note.Course_Code, note.Course_Name, note.Course_Code, note.Semester, note.Year, note.Description, note.File_Path, note.Uploaded_by]
  );
  return result.insertId;
}

// Update the editable fields of one note (the old Course column follows the course code)
async function updateNote(noteId, note) {
  await pool.query(
    "UPDATE notes SET Title = ?, Course_Code = ?, Course_Name = ?, Course = ?, Semester = ?, Year = ?, Description = ?, File_Path = ? WHERE Note_id = ?",
    [note.Title, note.Course_Code, note.Course_Name, note.Course_Code, note.Semester, note.Year, note.Description, note.File_Path, noteId]
  );
}

async function deleteNote(noteId) {
  await pool.query("DELETE FROM notes WHERE Note_id = ?", [noteId]);
}

module.exports = { getAllNotes, getNotesByUser, getNoteById, createNote, updateNote, deleteNote };