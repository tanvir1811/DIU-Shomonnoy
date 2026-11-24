export const askingTypeList = ["Rent", "Buy", "Lend"];
export const conditionList = ["New", "Like New", "Good", "Fair", "Poor"];

// Keep only the books that match the search text and asking type (empty = any)
export function filterBooks(bookList, searchText, selectedAskingType) {
  const lowerSearchText = searchText.toLowerCase();
  return bookList.filter(function (book) {
    const titleMatches = String(book.Title || "").toLowerCase().includes(lowerSearchText);
    const courseMatches = String(book.Course || "").toLowerCase().includes(lowerSearchText);
    const typeMatches = selectedAskingType === "" || book.Asking_Type === selectedAskingType;
    return (titleMatches || courseMatches) && typeMatches;
  });
}

// Lend is free, so only Rent and Buy need a price
export function isPriceNeeded(askingType) {
  return askingType === "Rent" || askingType === "Buy";
}

// Check that the book form has all required values
export function isBookFormValid(bookForm) {
  if (bookForm.Title.trim() === "" || bookForm.Course.trim() === "") return false;
  if (bookForm.Asking_Type === "" || bookForm.Book_Condition === "") return false;
  if (isPriceNeeded(bookForm.Asking_Type)) {
    const price = Number(bookForm.Price);
    if (bookForm.Price === "" || isNaN(price) || price < 0) return false;
  }
  return true;
}

// "Free" for Lend, otherwise "৳ 250"
export function getPriceText(book) {
  if (book.Asking_Type === "Lend" || book.Price === null) return "Free";
  return "৳ " + book.Price;
}

// True only when the logged-in student created this listing.
// The users table uses student_id, so look for that first.
export function isBookOwner(loggedInUser, book) {
  if (loggedInUser === null || loggedInUser.role === "admin") return false;
  const userId = loggedInUser.student_id || loggedInUser.id || loggedInUser.User_id;
  return String(userId) === String(book.Uploaded_by);
}

// Owner can delete their own listing, admin can delete any listing
export function canDeleteBook(loggedInUser, book) {
  if (loggedInUser === null) return false;
  return loggedInUser.role === "admin" || isBookOwner(loggedInUser, book);
}