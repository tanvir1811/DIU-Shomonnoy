// Connects the frontend's facultyApi.js to the backend  ->  /api/faculty/...
const express = require("express");
const { requireAdmin } = require("../middleware/auth");
const { uploadFacultyPic } = require("../middleware/upload");
const facultyFunctions = require("./facultyFunctions");

const router = express.Router();

// Reads the "Image" file from the form. A wrong file type gives a normal JSON error message.
function receiveFacultyPhoto(req, res, next) {
  uploadFacultyPic.single("Image")(req, res, function (error) {
    if (error) {
      return res.status(400).json({ message: error.message });
    }
    next();
  });
}

router.get("/", facultyFunctions.getAllFaculty);
// requireAdmin runs first, so only a logged-in admin can upload anything
router.post("/", requireAdmin, receiveFacultyPhoto, facultyFunctions.addFaculty);
router.put("/:id", requireAdmin, receiveFacultyPhoto, facultyFunctions.updateFaculty);
router.delete("/:id", requireAdmin, facultyFunctions.deleteFaculty);

module.exports = router;