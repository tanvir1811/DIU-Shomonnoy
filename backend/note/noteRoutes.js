// Connects the frontend's noteApi.js to the backend  ->  /api/notes/...
const express = require("express");
const { requireLogin } = require("../middleware/auth");
const { uploadNoteFile } = require("../middleware/upload");
const noteFunctions = require("./noteFunctions");

const router = express.Router();

router.get("/", noteFunctions.getAllNotes);
router.get("/mine", requireLogin, noteFunctions.getMyNotes); // must stay above the /:id routes
router.post("/", requireLogin, uploadNoteFile.single("file"), noteFunctions.uploadNote);
router.get("/:id/download", noteFunctions.downloadNote);

// Edit: owner only (checked inside updateNote)
router.put("/:id", requireLogin, uploadNoteFile.single("file"), noteFunctions.updateNote);

// Delete: owner or admin (checked inside deleteNote)
router.delete("/:id", requireLogin, noteFunctions.deleteNote);

module.exports = router;