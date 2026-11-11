// Connects the frontend's adminApi.js to the backend  ->  /api/admin/...
const express = require("express");
const { requireAdmin } = require("../middleware/auth");
const adminFunctions = require("./adminFunctions");

const router = express.Router();

router.post("/login", adminFunctions.login);
router.put("/:id", requireAdmin, adminFunctions.updateProfile);

// Save the admin from .env into the admins table when the backend starts
adminFunctions.seedAdminFromEnv();

module.exports = router;