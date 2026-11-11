// Connects questionApi.js to the backend -> /api/question-bank/...
const express = require("express");
const path = require("path");
const fs = require("fs");

const { requireLogin } = require("../middleware/auth");
const { uploadQuestionFiles } = require("../middleware/upload");

const questionFunctions = require("./questionFunctions");
const { getQuestionById } = require("./questionDatabase");

const router = express.Router();

const questionUploadFields = uploadQuestionFiles.fields([
  { name: "file", maxCount: 1 },
  { name: "answerFile", maxCount: 1 },
]);

// Folder where multer saves question files: backend/uploads/questions
const uploadDirectory = path.resolve(__dirname, "..", "uploads", "questions");

// Makes a download handler for one column: "File_Path" or "Answer_note_Path"
function makeDownloadHandler(pathColumn, label) {
  return async function (req, res) {
    try {
      const questionId = Number(req.params.id);
      if (!Number.isInteger(questionId) || questionId <= 0) {
        return res.status(400).json({ message: "Invalid question ID." });
      }

      const question = await getQuestionById(questionId);
      if (!question || !question[pathColumn]) {
        return res.status(404).json({ message: label + " not found." });
      }

      // The database stores "questions/<name>", so keep only the file name
      const filename = path.basename(String(question[pathColumn]).replace(/\\/g, "/"));
      const filePath = path.join(uploadDirectory, filename);

      if (!fs.existsSync(filePath)) {
        console.log("Missing file:", filePath);
        return res.status(404).json({ message: label + " does not exist on the server." });
      }

      return res.download(filePath, filename);
    } catch (error) {
      console.error("Download error:", error);
      if (!res.headersSent) {
        return res.status(500).json({ message: "Download failed." });
      }
    }
  };
}

router.get("/", questionFunctions.getAllQuestions);

// Must stay above any "/:id" route
router.get("/mine", requireLogin, questionFunctions.getMyQuestions);

router.post("/", requireLogin, questionUploadFields, questionFunctions.uploadQuestion);

router.get("/:id/download", makeDownloadHandler("File_Path", "Question file"));
router.get("/:id/answer-download", makeDownloadHandler("Answer_note_Path", "Answer note"));

// Edit: owner only (checked inside updateQuestion)
router.put("/:id", requireLogin, questionUploadFields, questionFunctions.updateQuestion);

// Delete: owner or admin (checked inside deleteQuestion)
router.delete("/:id", requireLogin, questionFunctions.deleteQuestion);

module.exports = router;