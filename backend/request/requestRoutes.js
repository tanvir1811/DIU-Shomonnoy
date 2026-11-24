const express = require("express");
const pool = require("../config/database");
const bookDatabase = require("../book/bookDatabase");
const equipmentDatabase = require("../equipment/equipmentDatabase");
const sendEmail = require("./sendEmail");

const router = express.Router();
const emailPattern = /^\S+@\S+\.\S+$/;

// Uploaded_by holds the poster's student_id, so this returns the poster's email
const OWNER_EMAIL_QUERY = "SELECT Email FROM users WHERE student_id = ?";

async function findListing(listingType, listingId) {
  if (listingType === "book") return await bookDatabase.getBookById(listingId);
  return await equipmentDatabase.getEquipmentById(listingId);
}

router.post("/", async function (req, res) {
  const { listingType, listingId, email, phone, quantity } = req.body;

  if (listingType !== "book" && listingType !== "equipment") {
    return res.status(400).json({ message: "Invalid listing type." });
  }
  if (!listingId || !phone || !quantity) {
    return res.status(400).json({ message: "Missing details." });
  }
  if (!emailPattern.test(String(email || ""))) {
    return res.status(400).json({ message: "Invalid email address." });
  }

  try {
    const listing = await findListing(listingType, listingId);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found." });
    }

    const [rows] = await pool.query(OWNER_EMAIL_QUERY, [listing.Uploaded_by]);
    const ownerEmail = rows.length > 0 ? rows[0].Email : "";
    if (!emailPattern.test(String(ownerEmail))) {
      return res.status(500).json({ message: "The owner has no valid email." });
    }

    const text =
      "New " + listing.Asking_Type + " request for your " + listingType + ": " + listing.Title + "\n\n" +
      "Requester email: " + email + "\n" +
      "Requester phone: " + phone + "\n" +
      "Quantity: " + quantity + "\n\n" +
      "Reply to this email to contact the requester.";

    // the owner gets the request, the requester is copied
    await sendEmail(ownerEmail, "New " + listing.Asking_Type + " request: " + listing.Title, text, email);
    res.json({ message: "Request sent." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not send the email." });
  }
});

module.exports = router;