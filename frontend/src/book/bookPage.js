import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getLoggedInUser, isBackendError } from "../user/userFunctions";
import { askingTypeList, conditionList, filterBooks, isPriceNeeded, isBookFormValid, getPriceText, isBookOwner } from "./bookFunctions";
import { fetchAllBooks, fetchMyBooks, createBook, updateBook, deleteBook } from "./bookApi";
import { RequestModal } from "../request/RequestModal";
import { getRequestButtonText } from "../request/requestFunctions";

const emptyForm = { Title: "", Course: "", Edition: "", Asking_Type: "", Book_Condition: "", Price: "", Review: "" };

// Book listing page: photo on top, details below; search, filter, list, edit and delete
export function BookPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const loggedInUser = getLoggedInUser();
  // The dashboard can open this page with the form already open ("Upload a book")
  // or already showing only the user's own listings ("My books")
  const openFormFromDashboard = Boolean(location.state && location.state.openForm && loggedInUser !== null);
  const viewMineFromDashboard = Boolean(location.state && location.state.viewMine && loggedInUser !== null);

  const [bookList, setBookList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedAskingType, setSelectedAskingType] = useState("");
  const [viewMode, setViewMode] = useState(viewMineFromDashboard ? "mine" : "all");
  const [isFormOpen, setIsFormOpen] = useState(openFormFromDashboard);
  const [editingId, setEditingId] = useState(null); // null = creating a new listing
  const [bookForm, setBookForm] = useState(emptyForm);
  const [photoFile, setPhotoFile] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isStatusError, setIsStatusError] = useState(false);
  const [requestBook, setRequestBook] = useState(null); // book shown in the request popup

  // Load books when the page opens or when "All books / My listings" changes
  useEffect(function () {
    async function loadBooks() {
      setIsLoading(true);
      try {
        setBookList(viewMode === "mine" ? await fetchMyBooks() : await fetchAllBooks());
      } catch (error) {
        if (isBackendError(error)) {
          if (error.status === 401) {
            navigate("/login", { state: { message: error.message } });
            return;
          }
          setStatusMessage(error.message);
        } else {
          setStatusMessage("Could not load books. Please make sure the server is running.");
        }
        setIsStatusError(true);
        setBookList([]);
      }
      setIsLoading(false);
    }
    loadBooks();
  }, [viewMode]);

  // Open the form for a new listing, or send visitors to login first
  function handleListBookClick() {
    if (getLoggedInUser() === null) {
      navigate("/login");
      return;
    }
    if (isFormOpen && editingId === null) {
      setIsFormOpen(false);
      return;
    }
    setEditingId(null);
    setBookForm(emptyForm);
    setPhotoFile(null);
    setIsFormOpen(true);
  }

  // Open the form filled with an existing listing
  function handleEditClick(book) {
    setEditingId(book.Listing_id);
    setBookForm({
      Title: book.Title,
      Course: book.Course,
      Edition: book.Edition,
      Asking_Type: book.Asking_Type,
      Book_Condition: book.Book_Condition,
      Price: book.Price === null ? "" : String(book.Price),
      Review: book.Review,
    });
    setPhotoFile(null);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleFormFieldChange(event) {
    const { name, value } = event.target;
    const updatedForm = { ...bookForm, [name]: value };
    if (name === "Asking_Type" && !isPriceNeeded(value)) updatedForm.Price = ""; // Lend = free
    setBookForm(updatedForm);
  }

  // Create or update the listing
  async function handleBookSubmit(event) {
    event.preventDefault();
    if (!isBookFormValid(bookForm)) {
      setStatusMessage("Please fill title, course, asking type, condition and a price (not needed for Lend).");
      setIsStatusError(true);
      return;
    }
    const formData = new FormData();
    formData.append("Title", bookForm.Title);
    formData.append("Course", bookForm.Course);
    formData.append("Edition", bookForm.Edition);
    formData.append("Asking_Type", bookForm.Asking_Type);
    formData.append("Book_Condition", bookForm.Book_Condition);
    formData.append("Review", bookForm.Review);
    if (isPriceNeeded(bookForm.Asking_Type)) formData.append("Price", bookForm.Price);
    if (photoFile !== null) formData.append("photo", photoFile);

    try {
      if (editingId === null) {
        const newBook = await createBook(formData);
        setBookList([newBook, ...bookList]);
        setStatusMessage("Book listed.");
      } else {
        const savedBook = await updateBook(editingId, formData);
        setBookList(bookList.map(function (book) { return book.Listing_id === editingId ? savedBook : book; }));
        setStatusMessage("Listing updated.");
      }
      setIsStatusError(false);
      setIsFormOpen(false);
      setEditingId(null);
      setBookForm(emptyForm);
      setPhotoFile(null);
    } catch (error) {
      if (isBackendError(error)) {
        if (error.status === 401) {
          navigate("/login", { state: { message: error.message } });
          return;
        }
        setStatusMessage(error.message);
      } else {
        setStatusMessage("Could not save the listing. Please make sure the server is running.");
      }
      setIsStatusError(true);
    }
  }

  async function handleDeleteClick(book) {
    if (!window.confirm("Delete this listing?")) return;
    try {
      await deleteBook(book.Listing_id);
      setBookList(bookList.filter(function (item) { return item.Listing_id !== book.Listing_id; }));
      setStatusMessage("Listing deleted.");
      setIsStatusError(false);
    } catch (error) {
      if (isBackendError(error)) {
        if (error.status === 401) {
          navigate("/login", { state: { message: error.message } });
          return;
        }
        setStatusMessage(error.message);
      } else {
        setStatusMessage("Could not delete the listing.");
      }
      setIsStatusError(true);
    }
  }

  const visibleBooks = filterBooks(bookList, searchText, selectedAskingType);

  return (
    <div>
      <h2>Book Listing</h2>
      <div className="toolbar">
        <input placeholder="Search by title or course" value={searchText} onChange={function (event) { setSearchText(event.target.value); }} />
        {loggedInUser !== null && loggedInUser.role !== "admin" && (
          <select value={viewMode} onChange={function (event) { setViewMode(event.target.value); }}>
            <option value="all">All books</option>
            <option value="mine">My listings</option>
          </select>
        )}
        <select value={selectedAskingType} onChange={function (event) { setSelectedAskingType(event.target.value); }}>
          <option value="">Rent / Buy / Lend</option>
          {askingTypeList.map(function (askingType) {
            return <option key={askingType}>{askingType}</option>;
          })}
        </select>
        {(loggedInUser === null || loggedInUser.role !== "admin") && (
          <button className="btn btn-yellow" onClick={handleListBookClick}>List a book</button>
        )}
      </div>
      {statusMessage !== "" && <div className={isStatusError ? "message-error" : "message-ok"}>{statusMessage}</div>}
      {isFormOpen && (
        <form className="form-box fade-in" onSubmit={handleBookSubmit}>
          <label>Book title</label>
          <input name="Title" placeholder="Introduction to Algorithms" value={bookForm.Title} onChange={handleFormFieldChange} />
          <label>Course</label>
          <input name="Course" placeholder="CSE 221" value={bookForm.Course} onChange={handleFormFieldChange} />
          <label>Edition</label>
          <input name="Edition" placeholder="3rd" value={bookForm.Edition} onChange={handleFormFieldChange} />
          <label>Asking type</label>
          <select name="Asking_Type" value={bookForm.Asking_Type} onChange={handleFormFieldChange}>
            <option value="">Choose Rent, Buy or Lend</option>
            {askingTypeList.map(function (askingType) {
              return <option key={askingType}>{askingType}</option>;
            })}
          </select>
          <label>Condition</label>
          <select name="Book_Condition" value={bookForm.Book_Condition} onChange={handleFormFieldChange}>
            <option value="">Choose condition</option>
            {conditionList.map(function (condition) {
              return <option key={condition}>{condition}</option>;
            })}
          </select>
          {isPriceNeeded(bookForm.Asking_Type) && (
            <>
              <label>Price (৳)</label>
              <input name="Price" type="number" min="0" value={bookForm.Price} onChange={handleFormFieldChange} />
            </>
          )}
          <label>Review</label>
          <textarea name="Review" placeholder="Notes, highlights, anything the next student should know" value={bookForm.Review} onChange={handleFormFieldChange} />
          <label>Photo {editingId !== null && "(leave empty to keep the current one)"}</label>
          <input type="file" accept="image/*" onChange={function (event) { setPhotoFile(event.target.files[0] || null); }} />
          <br /><br />
          <button className="btn">{editingId === null ? "List book" : "Save changes"}</button>
        </form>
      )}
      {isLoading && <div className="spinner"></div>}
      {!isLoading && visibleBooks.length === 0 && <p className="message-empty">No books found. Try another search or list one.</p>}
      <div className="grid">
        {visibleBooks.map(function (book) {
          return (
            <div className="card book-card" key={book.Listing_id}>
              {book.Photo_url !== "" ? (
                <img className="book-image" src={book.Photo_url} alt={book.Title} />
              ) : (
                <div className="book-image book-no-image">No photo</div>
              )}
              <h3>{book.Title}</h3>
              <span className="tag">{book.Asking_Type}</span> <span className="tag">{book.Book_Condition}</span>
              <p>{book.Course}{book.Edition !== "" ? " · " + book.Edition + " edition" : ""}</p>
              <p><strong>{getPriceText(book)}</strong></p>
              {book.Review !== "" && <p>{book.Review}</p>}
              <p className="muted">{book.created_at}</p>
              {isBookOwner(loggedInUser, book) && (
                <button className="btn" onClick={function () { handleEditClick(book); }}>Edit</button>
              )}
              {isBookOwner(loggedInUser, book) && (
                <button className="btn" onClick={function () { handleDeleteClick(book); }}>Delete</button>
              )}
           {(loggedInUser === null || loggedInUser.role !== "admin") && !isBookOwner(loggedInUser, book) && (
  <button className="btn btn-yellow" onClick={function () { setRequestBook(book); }}>
    {getRequestButtonText(book.Asking_Type)}
  </button>
)}
            </div>
          );
        })}
      </div>
      {requestBook !== null && (
        <RequestModal listing={requestBook} listingType="book" onClose={function () { setRequestBook(null); }} />
      )}
    </div>
  );
}