// Logic for admin login and admin profile update
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { makeToken } = require("../middleware/auth");
const { makeFileUrl } = require("../utils/fileUrl");
const adminDatabase = require("./adminDatabase");

function toPublicAdmin(req, admin) {
  return {
    admin_id: admin.admin_id,
    Name: admin.Name,
    Email: admin.Email,
    Department: admin.Department,
    Phone_number: admin.Phone_number,
    UserName: admin.UserName,
    Profile_Pic: makeFileUrl(req, admin.Profile_Pic),
    role: "admin",
  };
}

// Runs when the backend starts: makes sure the admin from .env is saved in the admins table
async function seedAdminFromEnv() {
  try {
    const name = process.env.ADMIN_NAME || "Main Admin";
    const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD || "";
    const userName = process.env.ADMIN_USERNAME || "admin";

    if (email === "" || password === "") {
      console.log("Admin seed skipped: ADMIN_EMAIL and ADMIN_PASSWORD are not set in .env");
      return;
    }

    await adminDatabase.ensureAdminsTable();
    const existing = await adminDatabase.findByEmail(email);

    if (!existing) {
      const passwordHash = await bcrypt.hash(password, 10);
      await adminDatabase.createAdmin({
        Name: name,
        Email: email,
        Department: "CSE",
        Phone_number: "",
        UserName: userName,
        Password_hash: passwordHash,
        Profile_Pic: "",
      });
      console.log("Admin created in admins table: " + email);
      return;
    }

    // The admin exists. If its saved password does not match .env, fix it.
    const passwordMatches = await bcrypt.compare(password, existing.Password_hash);
    if (!passwordMatches) {
      const passwordHash = await bcrypt.hash(password, 10);
      await adminDatabase.updatePasswordHash(existing.admin_id, passwordHash);
      console.log("Admin password updated from .env for: " + email);
    }
  } catch (error) {
    console.error("Admin seed failed:", error.message);
  }
}

async function login(req, res) {
  try {
    const { Email, Password } = req.body;
    if (!Email || !Password) return res.status(400).json({ message: "Email and password are required." });
    const admin = await adminDatabase.findByEmail(Email.trim().toLowerCase());
    const passwordOk = admin && (await bcrypt.compare(Password, admin.Password_hash));
    if (!passwordOk) return res.status(401).json({ message: "Wrong email or password." });
    res.json({ ...toPublicAdmin(req, admin), token: makeToken(admin.admin_id, "admin") });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Admin login failed." });
  }
}

async function updateProfile(req, res) {
  try {
    const adminId = req.params.id;
    if (req.auth.id !== String(adminId)) return res.status(403).json({ message: "You can only edit your own profile." });
    const current = await adminDatabase.findById(adminId);
    if (!current) return res.status(404).json({ message: "Admin not found." });
    if (!req.body.Email || !req.body.Email.includes("@")) return res.status(400).json({ message: "Please enter a valid email." });

    await adminDatabase.updateAdmin(adminId, {
      Name: req.body.Name || current.Name,
      Email: req.body.Email.toLowerCase(),
      Department: req.body.Department ?? current.Department,
      Phone_number: req.body.Phone_number ?? current.Phone_number,
      UserName: req.body.UserName || current.UserName,
    });
    const updated = await adminDatabase.findById(adminId);
    res.json({ ...toPublicAdmin(req, updated), token: req.headers.authorization.slice(7) });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Email or username already taken." });
    console.error(error);
    res.status(500).json({ message: "Admin profile update failed." });
  }
}

module.exports = { login, updateProfile, seedAdminFromEnv };