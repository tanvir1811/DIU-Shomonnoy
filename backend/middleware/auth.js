const jwt = require("jsonwebtoken");

function makeToken(id, role) {
  return jwt.sign({ id: String(id), role }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// Reads "Authorization: Bearer <token>" and puts { id, role } in req.auth
function requireLogin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  try {
    req.auth = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ message: "Please log in first." });
  }
}

function requireAdmin(req, res, next) {
  requireLogin(req, res, function () {
    if (req.auth.role !== "admin") {
      return res.status(403).json({ message: "Admins only." });
    }
    next();
  });
}

module.exports = { makeToken, requireLogin, requireAdmin };
