// Connects the frontend's userApi.js to the backend  ->  /api/users/...
const express = require("express");
const { requireLogin } = require("../middleware/auth");
const { uploadProfilePic } = require("../middleware/upload");
const userFunctions = require("./userFunctions");

const router = express.Router();

router.post("/signup", uploadProfilePic.single("Profile_Pic"), userFunctions.signup);
router.post("/login", userFunctions.login);
router.put("/:id", requireLogin, userFunctions.updateProfile);

module.exports = router;
