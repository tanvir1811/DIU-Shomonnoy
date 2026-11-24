// Logic for book listings
const fs = require("fs");
const path = require("path");
const bookDatabase = require("./bookDatabase");

const ASKING_TYPES = ["Rent", "Buy", "Lend"];
const CONDITIONS = ["New", "Like New", "Good", "Fair", "Poor"];

// The shape the frontend expects. Photo_url points to the image route below.
function toPublicBook(req, book) {
  return {
    Listing_id: book.Listing_id,
    Title: book.Title,
    Course: book.Course,
    Edition: book.Edition || "",
    Asking_Type: book.Asking_Type,
    Book_Condition: book.Book_Condition,
    Price: book.Price === null ? null : Number(book.Price),
    Review: book.Review || "",
    Photo_url: book.Photo_Path
      ? req.protocol + "://" + req.get("host") + "/api/books/" + book.Listing_id + "/image"
      : "",
    Uploaded_by: book.Uploaded_by,
    created_at: String(book.created_at).slice(0, 10),
  };
}

function removeFile(storedPath) {
  if (storedPath) fs.unlink(path.join(__dirname, "..", "uploads", storedPath), function () {});
}

function removeUploaded(req) {
  if (req.file) fs.unlink(req.file.path, function () {});
}

// True only when the logged-in student created this listing
function isOwner(req, book) {
  return req.auth.role === "student" && String(book.Uploaded_by) === String(req.auth.id);
}

// Validate and clean the request body. Returns { error } or { data }
function readBookBody(body) {
  const Title = String(body.Title || "").trim();
  const Course = String(body.Course || "").trim();
  const Edition = String(body.Edition || "").trim();
  const Review = String(body.Review || "").trim();
  const { Asking_Type, Book_Condition } = body;

  if (!Title || !Course || !Asking_Type || !Book_Condition) {
    return { error: "Title, course, asking type and condition are required." };
  }
  if (!ASKING_TYPES.includes(Asking_Type)) return { error: "Asking type must be Rent, Buy or Lend." };
  if (!CONDITIONS.includes(Book_Condition)) return { error: "Invalid condition." };

  let Price = null; // Lend = free
  if (Asking_Type !== "Lend") {
    Price = Number(body.Price);
    if (body.Price === "" || body.Price === null || body.Price === undefined || isNaN(Price) || Price < 0) {
      return { error: "Please enter a valid price for Rent or Buy." };
    }
  }
  return { data: { Title, Course, Edition, Asking_Type, Book_Condition, Price, Review } };
}

async function getAllBooks(req, res) {
  try {
    const books = await bookDatabase.getAllBooks();
    res.json(books.map(function (book) { return toPublicBook(req, book); }));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not load books." });
  }
}

async function getMyBooks(req, res) {
  try {
    if (req.auth.role !== "student") return res.json([]);
    const books = await bookDatabase.getBooksByUser(req.auth.id);
    res.json(books.map(function (book) { return toPublicBook(req, book); }));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not load your listings." });
  }
}

// Any logged-in student can list a book (photo is optional)
async function createBook(req, res) {
  try {
    if (req.auth.role !== "student") {
      removeUploaded(req);
      return res.status(403).json({ message: "Only students can list books." });
    }
    const { error, data } = readBookBody(req.body);
    if (error) {
      removeUploaded(req);
      return res.status(400).json({ message: error });
    }
    const listingId = await bookDatabase.createBook({
      ...data,
      Photo_Path: req.file ? "books/" + req.file.filename : "",
      Uploaded_by: req.auth.id,
    });
    res.status(201).json(toPublicBook(req, await bookDatabase.getBookById(listingId)));
  } catch (error) {
    console.error(error);
    removeUploaded(req);
    res.status(500).json({ message: "Could not create listing." });
  }
}

// Edit: owner only. A new photo is optional.
async function updateBook(req, res) {
  try {
    const book = await bookDatabase.getBookById(req.params.id);
    if (!book) {
      removeUploaded(req);
      return res.status(404).json({ message: "Listing not found." });
    }
    if (!isOwner(req, book)) {
      removeUploaded(req);
      return res.status(403).json({ message: "Only the owner can edit this listing." });
    }
    const { error, data } = readBookBody(req.body);
    if (error) {
      removeUploaded(req);
      return res.status(400).json({ message: error });
    }
    await bookDatabase.updateBook(req.params.id, {
      ...data,
      Photo_Path: req.file ? "books/" + req.file.filename : book.Photo_Path,
    });
    if (req.file) removeFile(book.Photo_Path); // the old photo is replaced
    res.json(toPublicBook(req, await bookDatabase.getBookById(req.params.id)));
  } catch (error) {
    console.error(error);
    removeUploaded(req);
    res.status(500).json({ message: "Could not update listing." });
  }
}

// Send the photo file (used by <img src=...>, so no login needed)
async function getBookImage(req, res) {
  try {
    const book = await bookDatabase.getBookById(req.params.id);
    if (!book || !book.Photo_Path) return res.status(404).json({ message: "No photo." });
    const filePath = path.join(__dirname, "..", "uploads", "books", path.basename(book.Photo_Path));
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: "The photo file is missing." });
    res.sendFile(filePath);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not load the photo." });
  }
}

// Delete: owner or admin
async function deleteBook(req, res) {
  try {
    const book = await bookDatabase.getBookById(req.params.id);
    if (!book) return res.status(404).json({ message: "Listing not found." });
    if (req.auth.role !== "admin" && !isOwner(req, book)) {
      return res.status(403).json({ message: "Only the owner or an admin can delete this listing." });
    }
    await bookDatabase.deleteBook(req.params.id);
    removeFile(book.Photo_Path);
    res.json({ message: "Listing deleted." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not delete listing." });
  }
}

module.exports = { getAllBooks, getMyBooks, createBook, updateBook, getBookImage, deleteBook };