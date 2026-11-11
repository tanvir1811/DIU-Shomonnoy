const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

// Make an uploader that saves into uploads/<folder>
function makeUploader(folder, onlyImages) {
  const storage = multer.diskStorage({
    destination: path.join(__dirname, "..", "uploads", folder),
    filename: function (req, file, cb) {
      const uniqueName = crypto.randomBytes(12).toString("hex") + path.extname(file.originalname).toLowerCase();
      cb(null, uniqueName);
    },
  });
  return multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
    fileFilter: function (req, file, cb) {
      if (onlyImages && !file.mimetype.startsWith("image/")) {
        return cb(new Error("Only image files are allowed."));
      }
      cb(null, true);
    },
  });
}

module.exports = {
  uploadProfilePic: makeUploader("profile", true),
  uploadFacultyPic: makeUploader("faculty", true),
  uploadNoteFile: makeUploader("notes", false),
  uploadQuestionFiles: makeUploader("questions", false),
};