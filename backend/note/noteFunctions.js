// Logic for notes
const fs = require("fs");
const path = require("path");
const { makeFileUrl } = require("../utils/fileUrl");
const noteDatabase = require("./noteDatabase");

// The shape the frontend expects
function toPublicNote(req, note) {
  return {
    Note_id: note.Note_id,
    Title: note.Title,
    Course_Code: note.Course_Code || "",
    Course_Name: note.Course_Name || "",
    Semester: note.Semester,
    Year: note.Year,
    Description: note.Description || "",
    created_at: String(note.created_at).slice(0, 10),
    file_url: makeFileUrl(req, note.File_Path),
  };
}

function removeFile(storedPath) {
  if (storedPath) fs.unlink(path.join(__dirname, "..", "uploads", storedPath), function () {});
}

// True only when the logged-in student uploaded this note
function isOwner(req, note) {
  return req.auth.role === "student" && note.Uploaded_by !== null && String(note.Uploaded_by) === String(req.auth.id);
}

async function getAllNotes(req, res) {
  try {
    const notes = await noteDatabase.getAllNotes();
    res.json(notes.map(function (note) { return toPublicNote(req, note); }));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not load notes." });
  }
}

// Only the notes uploaded by the logged-in student
async function getMyNotes(req, res) {
  try {
    if (req.auth.role !== "student") return res.json([]);
    const notes = await noteDatabase.getNotesByUser(req.auth.id);
    res.json(notes.map(function (note) { return toPublicNote(req, note); }));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not load your uploads." });
  }
}

async function uploadNote(req, res) {
  try {
    const { Semester, Year, Description } = req.body;
    const courseCode = String(req.body.Course_Code || "").trim();
    const courseName = String(req.body.Course_Name || "").trim();
    if (!courseCode || !courseName || !Semester || !Year || !req.file) {
      if (req.file) fs.unlink(req.file.path, function () {});
      return res.status(400).json({ message: "Course code, course name, semester, year and a file are required." });
    }
    const noteId = await noteDatabase.createNote({
      Title: courseCode + " - " + courseName, // old column, kept so nothing else breaks
      Course_Code: courseCode,
      Course_Name: courseName,
      Semester, Year,
      Description: Description || "",
      File_Path: "notes/" + req.file.filename,
      Uploaded_by: req.auth.role === "student" ? req.auth.id : null,
    });
    res.status(201).json(toPublicNote(req, await noteDatabase.getNoteById(noteId)));
  } catch (error) {
    console.error(error);
    if (req.file) fs.unlink(req.file.path, function () {});
    res.status(500).json({ message: "Could not upload note." });
  }
}

// Edit a note: owner only. A new file is optional.
async function updateNote(req, res) {
  try {
    const note = await noteDatabase.getNoteById(req.params.id);
    if (!note) {
      if (req.file) fs.unlink(req.file.path, function () {});
      return res.status(404).json({ message: "Note not found." });
    }
    if (!isOwner(req, note)) {
      if (req.file) fs.unlink(req.file.path, function () {});
      return res.status(403).json({ message: "Only the owner can edit this note." });
    }
    const { Semester, Year, Description } = req.body;
    const courseCode = String(req.body.Course_Code || "").trim();
    const courseName = String(req.body.Course_Name || "").trim();
    if (!courseCode || !courseName || !Semester || !Year) {
      if (req.file) fs.unlink(req.file.path, function () {});
      return res.status(400).json({ message: "Course code, course name, semester and year are required." });
    }
    await noteDatabase.updateNote(req.params.id, {
      Title: courseCode + " - " + courseName,
      Course_Code: courseCode,
      Course_Name: courseName,
      Semester, Year,
      Description: Description || "",
      File_Path: req.file ? "notes/" + req.file.filename : note.File_Path,
    });
    if (req.file) removeFile(note.File_Path); // the old file is replaced
    res.json(toPublicNote(req, await noteDatabase.getNoteById(req.params.id)));
  } catch (error) {
    console.error(error);
    if (req.file) fs.unlink(req.file.path, function () {});
    res.status(500).json({ message: "Could not update note." });
  }
}

// Make a download handler for one stored path column (stored as "folder/<hexname>.ext")
function makeDownloadHandler(pathColumn, label) {
  return async function (req, res) {
    try {
      const note = await noteDatabase.getNoteById(req.params.id);
      if (!note) return res.status(404).json({ message: "Note not found." });
      const storedPath = note[pathColumn];
      if (!storedPath) return res.status(404).json({ message: "This note has no " + label + "." });
      const folder = path.basename(path.dirname(storedPath));
      const fileName = path.basename(storedPath);
      const filePath = path.join(__dirname, "..", "uploads", folder, fileName);
      if (!fs.existsSync(filePath)) return res.status(404).json({ message: "The " + label + " file is missing." });
      res.download(filePath);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Could not download the " + label + "." });
    }
  };
}

const downloadNote = makeDownloadHandler("File_Path", "note");

// Delete a note: owner or admin
async function deleteNote(req, res) {
  try {
    const note = await noteDatabase.getNoteById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found." });
    if (req.auth.role !== "admin" && !isOwner(req, note)) {
      return res.status(403).json({ message: "Only the owner or an admin can delete this note." });
    }
    await noteDatabase.deleteNote(req.params.id);
    removeFile(note.File_Path);
    // files uploaded earlier with an answer note are cleaned up too
    removeFile(note.Answer_File_Path);
    res.json({ message: "Note deleted." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not delete note." });
  }
}

module.exports = { getAllNotes, getMyNotes, uploadNote, updateNote, downloadNote, deleteNote };