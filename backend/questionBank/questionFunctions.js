// Logic for the question bank
const fs = require("fs");
const path = require("path");
const { makeFileUrl } = require("../utils/fileUrl");
const questionDatabase = require("./questionDatabase");

function toPublicQuestion(req, q) {
  return {
    QuestionBankId: q.QuestionBankId,
    Title: q.Title,
    Course_Code: q.Course_Code || "",
    Course_Name: q.Course_Name || "",
    ExamType: q.ExamType,
    Department: q.Department,
    Semester: q.Semester,
    Year: q.Year,
    Details: q.Details || "",
    posted_at: String(q.posted_at).slice(0, 10),
    File_Url: makeFileUrl(req, q.File_Path),
    Answer_note_Url: makeFileUrl(req, q.Answer_note_Path), // "" when there is no answer note
  };
}

function removeFile(storedPath) {
  if (storedPath) fs.unlink(path.join(__dirname, "..", "uploads", storedPath), function () {});
}

// True only when the logged-in student uploaded this question
function isOwner(req, q) {
  return req.auth.role === "student" && q.Uploaded_by !== null && String(q.Uploaded_by) === String(req.auth.id);
}

async function getAllQuestions(req, res) {
  try {
    const questions = await questionDatabase.getAllQuestions();
    res.json(questions.map(function (q) { return toPublicQuestion(req, q); }));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not load questions." });
  }
}

// Questions uploaded by the logged-in student (route must use requireLogin)
async function getMyQuestions(req, res) {
  try {
    if (req.auth.role !== "student") {
      return res.json([]);
    }
    const questions = await questionDatabase.getQuestionsByUser(req.auth.id);
    res.json(questions.map(function (q) { return toPublicQuestion(req, q); }));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not load your questions." });
  }
}

async function uploadQuestion(req, res) {
  const questionFile = req.files && req.files.file ? req.files.file[0] : null;
  const answerFile = req.files && req.files.answerFile ? req.files.answerFile[0] : null;
  try {
    const { Course_Code, Course_Name, ExamType, Department, Semester, Year, Details } = req.body;
    if (!Course_Code || !Course_Name || !Department || !Semester || !Year || !questionFile) {
      if (questionFile) removeFile("questions/" + questionFile.filename);
      if (answerFile) removeFile("questions/" + answerFile.filename);
      return res.status(400).json({ message: "Course code, course name, department, semester, year and a file are required." });
    }
    const code = Course_Code.trim();
    const name = Course_Name.trim();
    const questionId = await questionDatabase.createQuestion({
      Title: code + " - " + name, // keeps the old Title column filled
      Course_Code: code,
      Course_Name: name,
      Department, Semester, Year,
      ExamType: ExamType || "Midterm",
      Details: Details || "",
      File_Path: "questions/" + questionFile.filename,
      Answer_note_Path: answerFile ? "questions/" + answerFile.filename : "",
      Uploaded_by: req.auth.role === "student" ? req.auth.id : null,
    });
    res.status(201).json(toPublicQuestion(req, await questionDatabase.getQuestionById(questionId)));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not upload question." });
  }
}

// Edit a question: owner only. New question file and new answer note are both optional.
async function updateQuestion(req, res) {
  const questionFile = req.files && req.files.file ? req.files.file[0] : null;
  const answerFile = req.files && req.files.answerFile ? req.files.answerFile[0] : null;
  // removes the files that were just uploaded when the edit is refused or fails
  function discardNewFiles() {
    if (questionFile) removeFile("questions/" + questionFile.filename);
    if (answerFile) removeFile("questions/" + answerFile.filename);
  }
  try {
    const q = await questionDatabase.getQuestionById(req.params.id);
    if (!q) {
      discardNewFiles();
      return res.status(404).json({ message: "Question not found." });
    }
    if (!isOwner(req, q)) {
      discardNewFiles();
      return res.status(403).json({ message: "Only the owner can edit this question." });
    }
    const { ExamType, Department, Semester, Year, Details } = req.body;
    const code = String(req.body.Course_Code || "").trim();
    const name = String(req.body.Course_Name || "").trim();
    if (!code || !name || !Department || !Semester || !Year) {
      discardNewFiles();
      return res.status(400).json({ message: "Course code, course name, department, semester and year are required." });
    }
    await questionDatabase.updateQuestion(req.params.id, {
      Title: code + " - " + name,
      Course_Code: code,
      Course_Name: name,
      Department, Semester, Year,
      ExamType: ExamType || q.ExamType,
      Details: Details || "",
      File_Path: questionFile ? "questions/" + questionFile.filename : q.File_Path,
      Answer_note_Path: answerFile ? "questions/" + answerFile.filename : q.Answer_note_Path,
    });
    // the old files are replaced
    if (questionFile) removeFile(q.File_Path);
    if (answerFile) removeFile(q.Answer_note_Path);
    res.json(toPublicQuestion(req, await questionDatabase.getQuestionById(req.params.id)));
  } catch (error) {
    console.error(error);
    discardNewFiles();
    res.status(500).json({ message: "Could not update question." });
  }
}

// Delete a question: owner or admin
async function deleteQuestion(req, res) {
  try {
    const q = await questionDatabase.getQuestionById(req.params.id);
    if (!q) return res.status(404).json({ message: "Question not found." });
    if (req.auth.role !== "admin" && !isOwner(req, q)) {
      return res.status(403).json({ message: "Only the owner or an admin can delete this question." });
    }
    await questionDatabase.deleteQuestion(req.params.id);
    removeFile(q.File_Path);
    removeFile(q.Answer_note_Path);
    res.json({ message: "Question deleted." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not delete question." });
  }
}

module.exports = { getAllQuestions, getMyQuestions, uploadQuestion, updateQuestion, deleteQuestion };