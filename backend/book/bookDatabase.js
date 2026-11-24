// Everything that talks to the "books" table
const pool = require("../config/database");

async function getAllBooks() {
  const [rows] = await pool.query("SELECT * FROM books ORDER BY created_at DESC, Listing_id DESC");
  return rows;
}

async function getBooksByUser(userId) {
  const [rows] = await pool.query(
    "SELECT * FROM books WHERE Uploaded_by = ? ORDER BY created_at DESC, Listing_id DESC",
    [userId]
  );
  return rows;
}

async function getBookById(listingId) {
  const [rows] = await pool.query("SELECT * FROM books WHERE Listing_id = ?", [listingId]);
  return rows[0] || null;
}

async function createBook(book) {
  const [result] = await pool.query(
    "INSERT INTO books (Title, Course, Edition, Asking_Type, Book_Condition, Price, Review, Photo_Path, Uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [book.Title, book.Course, book.Edition, book.Asking_Type, book.Book_Condition, book.Price, book.Review, book.Photo_Path, book.Uploaded_by]
  );
  return result.insertId;
}

async function updateBook(listingId, book) {
  await pool.query(
    "UPDATE books SET Title = ?, Course = ?, Edition = ?, Asking_Type = ?, Book_Condition = ?, Price = ?, Review = ?, Photo_Path = ? WHERE Listing_id = ?",
    [book.Title, book.Course, book.Edition, book.Asking_Type, book.Book_Condition, book.Price, book.Review, book.Photo_Path, listingId]
  );
}

async function deleteBook(listingId) {
  await pool.query("DELETE FROM books WHERE Listing_id = ?", [listingId]);
}

module.exports = { getAllBooks, getBooksByUser, getBookById, createBook, updateBook, deleteBook };