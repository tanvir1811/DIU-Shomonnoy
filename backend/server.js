require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const pool = require("./config/database");

const userRoutes = require("./user/userRoutes");
const adminRoutes = require("./admin/adminRoutes");
const noteRoutes = require("./note/noteRoutes");
const questionRoutes = require("./questionBank/questionRoutes");
const facultyRoutes = require("./faculty/facultyRoutes");

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:3000" }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/question-bank", questionRoutes);
app.use("/api/faculty", facultyRoutes);

// Upload errors (wrong type, too big) and anything unexpected
app.use(function (error, req, res, next) {
  if (error.name === "MulterError" || error.message === "Only image files are allowed.") {
    return res.status(400).json({ message: error.message });
  }
  console.error(error);
  res.status(500).json({ message: "Something went wrong." });
});

const PORT = process.env.PORT || 5000;
pool.query("SELECT 1")
  .then(function () {
    console.log("MySQL connected.");
    app.listen(PORT, function () { console.log("Server running on http://localhost:" + PORT); });
  })
  .catch(function (error) {
    console.error("Could not connect to MySQL:", error.message);
    process.exit(1);
  });
