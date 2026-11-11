// Logic for faculty info
const fs = require("fs");
const path = require("path");
const facultyDatabase = require("./facultyDatabase");

// Turn the saved photo path ("faculty/abc.jpg") into a full link the browser can open.
// Old rows that still hold a normal web link are returned as they are.
function makePhotoUrl(req, savedPath) {
  if (!savedPath) return "";
  if (savedPath.startsWith("http://") || savedPath.startsWith("https://")) return savedPath;
  return req.protocol + "://" + req.get("host") + "/uploads/" + savedPath;
}

function toPublicFaculty(req, faculty) {
  return { ...faculty, Image: makePhotoUrl(req, faculty.Image) };
}

// Delete an uploaded faculty photo from the disk (old web links are left alone)
function removePhotoFile(savedPath) {
  if (!savedPath || !savedPath.startsWith("faculty/")) return;
  fs.unlink(path.join(__dirname, "..", "uploads", savedPath), function (error) {
    if (error && error.code !== "ENOENT") console.error("Could not delete photo:", error.message);
  });
}

function readFacultyValues(body) {
  return {
    Name: (body.Name || "").trim(),
    Designation: (body.Designation || "").trim(),
    Email: (body.Email || "").trim(),
    Department: (body.Department || "").trim(),
    Counseling_Hour: body.Counseling_Hour || "",
  };
}

function isFacultyValid(f) {
  return f.Name !== "" && f.Designation !== "" && f.Email.includes("@") && f.Department !== "";
}

async function getAllFaculty(req, res) {
  try {
    const facultyRows = await facultyDatabase.getAllFaculty();
    res.json(facultyRows.map(function (faculty) { return toPublicFaculty(req, faculty); }));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not load faculty." });
  }
}

async function addFaculty(req, res) {
  // path of the photo that was just uploaded (empty when no photo was chosen)
  const uploadedPath = req.file ? "faculty/" + req.file.filename : "";
  try {
    const values = readFacultyValues(req.body);
    if (!isFacultyValid(values)) {
      removePhotoFile(uploadedPath);
      return res.status(400).json({ message: "Name, designation, valid email and department are required." });
    }
    values.Image = uploadedPath;
    const newId = await facultyDatabase.createFaculty(values);
    res.status(201).json(toPublicFaculty(req, await facultyDatabase.getFacultyById(newId)));
  } catch (error) {
    removePhotoFile(uploadedPath);
    console.error(error);
    res.status(500).json({ message: "Could not add faculty." });
  }
}

async function updateFaculty(req, res) {
  const uploadedPath = req.file ? "faculty/" + req.file.filename : "";
  try {
    const values = readFacultyValues(req.body);
    if (!isFacultyValid(values)) {
      removePhotoFile(uploadedPath);
      return res.status(400).json({ message: "Name, designation, valid email and department are required." });
    }
    const current = await facultyDatabase.getFacultyById(req.params.id);
    if (!current) {
      removePhotoFile(uploadedPath);
      return res.status(404).json({ message: "Faculty not found." });
    }
    // keep the old photo unless a new one was uploaded
    values.Image = uploadedPath || current.Image;
    await facultyDatabase.updateFaculty(req.params.id, values);
    if (uploadedPath) {
      removePhotoFile(current.Image);
    }
    res.json(toPublicFaculty(req, await facultyDatabase.getFacultyById(req.params.id)));
  } catch (error) {
    removePhotoFile(uploadedPath);
    console.error(error);
    res.status(500).json({ message: "Could not update faculty." });
  }
}

async function deleteFaculty(req, res) {
  try {
    const current = await facultyDatabase.getFacultyById(req.params.id);
    if (!current) return res.status(404).json({ message: "Faculty not found." });
    await facultyDatabase.deleteFaculty(req.params.id);
    removePhotoFile(current.Image);
    res.json({ message: "Faculty deleted." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not delete faculty." });
  }
}

module.exports = { getAllFaculty, addFaculty, updateFaculty, deleteFaculty };