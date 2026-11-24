// Connects the frontend's equipmentApi.js to the backend  ->  /api/equipment/...
const express = require("express");
const { requireLogin } = require("../middleware/auth");
const { uploadEquipmentFile } = require("../middleware/upload");
const equipmentFunctions = require("./equipmentFunctions");

const router = express.Router();

router.get("/", equipmentFunctions.getAllEquipment);
router.get("/mine", requireLogin, equipmentFunctions.getMyEquipment); // must stay above the /:id routes
router.post("/", requireLogin, uploadEquipmentFile.single("picture"), equipmentFunctions.createEquipment);
router.get("/:id/image", equipmentFunctions.getEquipmentImage);

// Edit: owner only (checked inside updateEquipment)
router.put("/:id", requireLogin, uploadEquipmentFile.single("picture"), equipmentFunctions.updateEquipment);

// Delete: owner or admin (checked inside deleteEquipment)
router.delete("/:id", requireLogin, equipmentFunctions.deleteEquipment);

module.exports = router;