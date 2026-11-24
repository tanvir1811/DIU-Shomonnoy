// Connects the frontend's bookApi.js to the backend  ->  /api/books/...
const express = require("express");
const { requireLogin } = require("../middleware/auth");
const { uploadBookPhoto } = require("../middleware/upload");
const bookFunctions = require("./bookFunctions");

const router = express.Router();

// Run multer, and turn its errors (wrong type, too big) into a JSON message
function readPhoto(req, res, next) {
  uploadBookPhoto.single("photo")(req, res, function (error) {
    if (error) return res.status(400).json({ message: error.message });
    next();
  });
}

router.get("/", bookFunctions.getAllBooks);
router.get("/mine", requireLogin, bookFunctions.getMyBooks); // must stay above the /:id routes
router.post("/", requireLogin, readPhoto, bookFunctions.createBook);
router.get("/:id/image", bookFunctions.getBookImage);

// Edit: owner only (checked inside updateBook)
router.put("/:id", requireLogin, readPhoto, bookFunctions.updateBook);

// Delete: owner or admin (checked inside deleteBook)
router.delete("/:id", requireLogin, bookFunctions.deleteBook);

module.exports = router;