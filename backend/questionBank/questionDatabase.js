// Everything that talks to the "question_bank" table
const pool = require("../config/database");

async function getAllQuestions() {
  const [rows] = await pool.query("SELECT * FROM question_bank ORDER BY posted_at DESC, QuestionBankId DESC");
  return rows;
}

// Only the questions uploaded by one student
async function getQuestionsByUser(userId) {
  const [rows] = await pool.query(
    "SELECT * FROM question_bank WHERE Uploaded_by = ? ORDER BY posted_at DESC, QuestionBankId DESC",
    [userId]
  );
  return rows;
}

async function getQuestionById(questionId) {
  const [rows] = await pool.query("SELECT * FROM question_bank WHERE QuestionBankId = ?", [questionId]);
  return rows[0] || null;
}

async function createQuestion(q) {
  const [result] = await pool.query(
    `INSERT INTO question_bank (Title, Course_Code, Course_Name, ExamType, Department, Semester, Year, Details, File_Path, Answer_note_Path, Uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [q.Title, q.Course_Code, q.Course_Name, q.ExamType, q.Department, q.Semester, q.Year, q.Details, q.File_Path, q.Answer_note_Path, q.Uploaded_by]
  );
  return result.insertId;
}

// Update the editable fields of one question (Uploaded_by and posted_at stay as they are)
async function updateQuestion(questionId, q) {
  await pool.query(
    `UPDATE question_bank
     SET Title = ?, Course_Code = ?, Course_Name = ?, ExamType = ?, Department = ?, Semester = ?, Year = ?, Details = ?, File_Path = ?, Answer_note_Path = ?
     WHERE QuestionBankId = ?`,
    [q.Title, q.Course_Code, q.Course_Name, q.ExamType, q.Department, q.Semester, q.Year, q.Details, q.File_Path, q.Answer_note_Path, questionId]
  );
}

async function deleteQuestion(questionId) {
  await pool.query("DELETE FROM question_bank WHERE QuestionBankId = ?", [questionId]);
}

module.exports = { getAllQuestions, getQuestionsByUser, getQuestionById, createQuestion, updateQuestion, deleteQuestion };