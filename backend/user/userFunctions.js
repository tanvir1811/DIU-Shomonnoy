// Logic for signup, login and profile update
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const { makeToken } = require("../middleware/auth");
const { makeFileUrl } = require("../utils/fileUrl");
const userDatabase = require("./userDatabase");

function isStudentIdValid(id) { return /^\d{3}-\d{2}-\d{3,5}$/.test(id || ""); }
function isEmailValid(email) { return typeof email === "string" && email.includes("@") && email.includes("."); }

// The shape the frontend expects (never send the password hash)
function toPublicUser(req, user) {
  return {
    student_id: user.student_id,
    Name: user.Name,
    Email: user.Email,
    Department: user.Department,
    Phone_number: user.Phone_number,
    UserName: user.UserName,
    Profile_Pic: makeFileUrl(req, user.Profile_Pic),
    role: "student",
  };
}

function deleteUploadedFile(file) {
  if (file) fs.unlink(file.path, function () {});
}

async function signup(req, res) {
  const body = req.body;
  try {
    if (!isStudentIdValid(body.student_id)) { deleteUploadedFile(req.file); return res.status(400).json({ message: "Student ID must look like 213-15-4567." }); }
    if (!req.file) return res.status(400).json({ message: "Please choose a profile picture." });
    if (!body.Name || !body.Department || !body.UserName) { deleteUploadedFile(req.file); return res.status(400).json({ message: "Name, department and username are required." }); }
    if (!isEmailValid(body.Email)) { deleteUploadedFile(req.file); return res.status(400).json({ message: "Please enter a valid email." }); }
    if (!body.Password || body.Password.length < 6) { deleteUploadedFile(req.file); return res.status(400).json({ message: "Password must be at least 6 characters." }); }

    const passwordHash = await bcrypt.hash(body.Password, 10);
    await userDatabase.createUser({
      student_id: body.student_id,
      Name: body.Name,
      Email: body.Email.toLowerCase(),
      Department: body.Department,
      Phone_number: body.Phone_number || "",
      UserName: body.UserName,
      Password_hash: passwordHash,
      Profile_Pic: "profile/" + req.file.filename,
    });

    const user = await userDatabase.findById(body.student_id);
    res.status(201).json({ ...toPublicUser(req, user), token: makeToken(user.student_id, "student") });
  } catch (error) {
    deleteUploadedFile(req.file);
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Student ID, email or username already exists." });
    console.error(error);
    res.status(500).json({ message: "Signup failed." });
  }
}

async function login(req, res) {
  try {
    const { Email, Password } = req.body;
    if (!Email || !Password) return res.status(400).json({ message: "Email and password are required." });
    const user = await userDatabase.findByEmail(Email.toLowerCase());
    const passwordOk = user && (await bcrypt.compare(Password, user.Password_hash));
    if (!passwordOk) return res.status(401).json({ message: "Wrong email or password." });
    res.json({ ...toPublicUser(req, user), token: makeToken(user.student_id, "student") });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Login failed." });
  }
}

async function updateProfile(req, res) {
  try {
    const studentId = req.params.id;
    // a student may only edit their own profile
    if (req.auth.role !== "student" || req.auth.id !== studentId) return res.status(403).json({ message: "You can only edit your own profile." });
    const current = await userDatabase.findById(studentId);
    if (!current) return res.status(404).json({ message: "User not found." });
    if (!isEmailValid(req.body.Email)) return res.status(400).json({ message: "Please enter a valid email." });

    await userDatabase.updateUser(studentId, {
      Name: req.body.Name || current.Name,
      Email: req.body.Email.toLowerCase(),
      Department: req.body.Department || current.Department,
      Phone_number: req.body.Phone_number ?? current.Phone_number,
      UserName: req.body.UserName || current.UserName,
    });
    const updated = await userDatabase.findById(studentId);
    res.json({ ...toPublicUser(req, updated), token: req.headers.authorization.slice(7) });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Email or username already taken." });
    console.error(error);
    res.status(500).json({ message: "Profile update failed." });
  }
}

module.exports = { signup, login, updateProfile };
