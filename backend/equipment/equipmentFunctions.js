// Logic for equipment listings
const fs = require("fs");
const path = require("path");
const equipmentDatabase = require("./equipmentDatabase");

const ASKING_TYPES = ["Rent", "Buy", "Lend"];
const CONDITIONS = ["New", "Like New", "Good", "Fair", "Poor"];

// The shape the frontend expects. Picture_url points to the image route below.
function toPublicEquipment(req, item) {
  return {
    Equipment_id: item.Equipment_id,
    Title: item.Title,
    Description: item.Description || "",
    Picture_url: item.Picture_Path
      ? req.protocol + "://" + req.get("host") + "/api/equipment/" + item.Equipment_id + "/image"
      : "",
    Asking_Type: item.Asking_Type,
    Equipment_Condition: item.Equipment_Condition,
    Price: item.Price === null ? null : Number(item.Price),
    Uploaded_by: item.Uploaded_by,
    created_at: String(item.created_at).slice(0, 10),
  };
}

function removeFile(storedPath) {
  if (storedPath) fs.unlink(path.join(__dirname, "..", "uploads", storedPath), function () {});
}

function removeUploaded(req) {
  if (req.file) fs.unlink(req.file.path, function () {});
}

function isOwner(req, item) {
  return req.auth.role === "student" && String(item.Uploaded_by) === String(req.auth.id);
}

// Validate and clean the request body. Returns { error } or { data }
function readEquipmentBody(body) {
  const Title = String(body.Title || "").trim();
  const Description = String(body.Description || "").trim();
  const { Asking_Type, Equipment_Condition } = body;

  if (!Title || !Asking_Type || !Equipment_Condition) {
    return { error: "Title, asking type and condition are required." };
  }
  if (!ASKING_TYPES.includes(Asking_Type)) return { error: "Asking type must be Rent, Buy or Lend." };
  if (!CONDITIONS.includes(Equipment_Condition)) return { error: "Invalid condition." };

  let Price = null; // Lend = free
  if (Asking_Type !== "Lend") {
    Price = Number(body.Price);
    if (body.Price === "" || body.Price === null || body.Price === undefined || isNaN(Price) || Price < 0) {
      return { error: "Please enter a valid price for Rent or Buy." };
    }
  }
  return { data: { Title, Description, Asking_Type, Equipment_Condition, Price } };
}

async function getAllEquipment(req, res) {
  try {
    const items = await equipmentDatabase.getAllEquipment();
    res.json(items.map(function (item) { return toPublicEquipment(req, item); }));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not load equipment." });
  }
}

async function getMyEquipment(req, res) {
  try {
    if (req.auth.role !== "student") return res.json([]);
    const items = await equipmentDatabase.getEquipmentByUser(req.auth.id);
    res.json(items.map(function (item) { return toPublicEquipment(req, item); }));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not load your listings." });
  }
}

// Any logged-in student can list equipment (picture is optional)
async function createEquipment(req, res) {
  try {
    if (req.auth.role !== "student") {
      removeUploaded(req);
      return res.status(403).json({ message: "Only students can list equipment." });
    }
    const { error, data } = readEquipmentBody(req.body);
    if (error) {
      removeUploaded(req);
      return res.status(400).json({ message: error });
    }
    const equipmentId = await equipmentDatabase.createEquipment({
      ...data,
      Picture_Path: req.file ? "equipment/" + req.file.filename : "",
      Uploaded_by: req.auth.id,
    });
    res.status(201).json(toPublicEquipment(req, await equipmentDatabase.getEquipmentById(equipmentId)));
  } catch (error) {
    console.error(error);
    removeUploaded(req);
    res.status(500).json({ message: "Could not create listing." });
  }
}

// Edit: owner only. A new picture is optional.
async function updateEquipment(req, res) {
  try {
    const item = await equipmentDatabase.getEquipmentById(req.params.id);
    if (!item) {
      removeUploaded(req);
      return res.status(404).json({ message: "Listing not found." });
    }
    if (!isOwner(req, item)) {
      removeUploaded(req);
      return res.status(403).json({ message: "Only the owner can edit this listing." });
    }
    const { error, data } = readEquipmentBody(req.body);
    if (error) {
      removeUploaded(req);
      return res.status(400).json({ message: error });
    }
    await equipmentDatabase.updateEquipment(req.params.id, {
      ...data,
      Picture_Path: req.file ? "equipment/" + req.file.filename : item.Picture_Path,
    });
    if (req.file) removeFile(item.Picture_Path); // the old picture is replaced
    res.json(toPublicEquipment(req, await equipmentDatabase.getEquipmentById(req.params.id)));
  } catch (error) {
    console.error(error);
    removeUploaded(req);
    res.status(500).json({ message: "Could not update listing." });
  }
}

// Send the picture file (used by <img src=...>, so no login needed)
async function getEquipmentImage(req, res) {
  try {
    const item = await equipmentDatabase.getEquipmentById(req.params.id);
    if (!item || !item.Picture_Path) return res.status(404).json({ message: "No picture." });
    const filePath = path.join(__dirname, "..", "uploads", "equipment", path.basename(item.Picture_Path));
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: "The picture file is missing." });
    res.sendFile(filePath);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not load the picture." });
  }
}

// Delete: owner or admin
async function deleteEquipment(req, res) {
  try {
    const item = await equipmentDatabase.getEquipmentById(req.params.id);
    if (!item) return res.status(404).json({ message: "Listing not found." });
    if (req.auth.role !== "admin" && !isOwner(req, item)) {
      return res.status(403).json({ message: "Only the owner or an admin can delete this listing." });
    }
    await equipmentDatabase.deleteEquipment(req.params.id);
    removeFile(item.Picture_Path);
    res.json({ message: "Listing deleted." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not delete listing." });
  }
}

module.exports = { getAllEquipment, getMyEquipment, createEquipment, updateEquipment, getEquipmentImage, deleteEquipment };