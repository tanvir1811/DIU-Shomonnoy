import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { semesterNameList, yearList } from "../sampleData";
import { getLoggedInUser, isBackendError } from "../user/userFunctions";
import { filterNotes, isNoteFormValid, getNoteHeading } from "./noteFunctions";
import { fetchAllNotes, fetchMyNotes, uploadNote } from "./noteApi";

// Notes page: search, filter, download and upload notes
export function NotesPage() {
  const navigate = useNavigate();
  const loggedInUser = getLoggedInUser();
  const [noteList, setNoteList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [viewMode, setViewMode] = useState("all");
  const [isUploadFormOpen, setIsUploadFormOpen] = useState(false);
  const [noteForm, setNoteForm] = useState({ Course_Code: "", Course_Name: "", Semester: "", Year: "", Description: "" });
  const [noteFile, setNoteFile] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isStatusError, setIsStatusError] = useState(false);

  // Load notes when the page opens or when "All notes / My uploads" changes
  useEffect(function () {
    async function loadNotes() {
      setIsLoading(true);
      try {
        if (viewMode === "mine") {
          setNoteList(await fetchMyNotes());
        } else {
          setNoteList(await fetchAllNotes());
        }
      } catch (error) {
        if (isBackendError(error)) {
          // the backend refused it (for example the login expired)
          if (error.status === 401) {
            navigate("/login", { state: { message: error.message } });
            return;
          }
          setStatusMessage(error.message);
        } else {
          setStatusMessage("Could not load notes. Please make sure the server is running.");
        }
        setIsStatusError(true);
        setNoteList([]);
      }
      setIsLoading(false);
    }
    loadNotes();
  }, [viewMode]);

  // Open the upload form, or send visitors to login first
  function handleUploadNoteClick() {
    if (getLoggedInUser() === null) {
      navigate("/login");
      return;
    }
    setIsUploadFormOpen(!isUploadFormOpen);
  }

  // Update one upload form field
  function handleFormFieldChange(event) {
    setNoteForm({ ...noteForm, [event.target.name]: event.target.value });
  }

  // Send the new note to the backend and show it in the list
  async function handleNoteSubmit(event) {
    event.preventDefault();
    if (!isNoteFormValid(noteForm, noteFile)) {
      setStatusMessage("Please fill course code, course name, semester, year and choose a file.");
      setIsStatusError(true);
      return;
    }
    const formData = new FormData();
    Object.keys(noteForm).forEach(function (fieldName) {
      formData.append(fieldName, noteForm[fieldName]);
    });
    formData.append("file", noteFile);
    const courseCode = noteForm.Course_Code.trim();
    const courseName = noteForm.Course_Name.trim();
    let newNote = {
      ...noteForm,
      Course_Code: courseCode,
      Course_Name: courseName,
      Title: courseCode + " - " + courseName,
      Note_id: Date.now(),
      created_at: new Date().toISOString().slice(0, 10),
      file_url: "#",
    };
    try {
      // use the saved note from the backend (it has the real id and the file link)
      newNote = await uploadNote(formData);
    } catch (error) {
      if (isBackendError(error)) {
        // the backend refused it (for example the login expired), so do not say it was uploaded
        if (error.status === 401) {
          navigate("/login", { state: { message: error.message } });
          return;
        }
        setStatusMessage(error.message);
        setIsStatusError(true);
        return;
      }
      console.log("Backend not connected, showing note locally only.");
    }
    setNoteList([newNote, ...noteList]);
    setStatusMessage("Note uploaded.");
    setIsStatusError(false);
    setIsUploadFormOpen(false);
  }

  // Open the file
  function handleDownloadClick(note) {
    window.open(note.file_url, "_blank");
  }

  const visibleNotes = filterNotes(noteList, searchText, selectedSemester, selectedYear);

  return (
    <div>
      <h2>Notes</h2>
      <div className="toolbar">
        <input placeholder="Search by course code or name" value={searchText} onChange={function (event) { setSearchText(event.target.value); }} />
        {loggedInUser !== null && (
          <select value={viewMode} onChange={function (event) { setViewMode(event.target.value); }}>
            <option value="all">All notes</option>
            <option value="mine">My uploads</option>
          </select>
        )}
        <select value={selectedSemester} onChange={function (event) { setSelectedSemester(event.target.value); }}>
          <option value="">All semesters</option>
          {semesterNameList.map(function (semesterName) {
            return <option key={semesterName}>{semesterName}</option>;
          })}
        </select>
        <select value={selectedYear} onChange={function (event) { setSelectedYear(event.target.value); }}>
          <option value="">All years</option>
          {yearList.map(function (year) {
            return <option key={year}>{year}</option>;
          })}
        </select>
        <button className="btn btn-yellow" onClick={handleUploadNoteClick}>Upload note</button>
      </div>
      {statusMessage !== "" && <div className={isStatusError ? "message-error" : "message-ok"}>{statusMessage}</div>}
      {isUploadFormOpen && (
        <form className="form-box fade-in" onSubmit={handleNoteSubmit}>
          <label>Course code</label>
          <input name="Course_Code" placeholder="CSE 221" value={noteForm.Course_Code} onChange={handleFormFieldChange} />
          <label>Course name</label>
          <input name="Course_Name" placeholder="Algorithms" value={noteForm.Course_Name} onChange={handleFormFieldChange} />
          <label>Semester</label>
          <select name="Semester" value={noteForm.Semester} onChange={handleFormFieldChange}>
            <option value="">Choose semester</option>
            {semesterNameList.map(function (semesterName) {
              return <option key={semesterName}>{semesterName}</option>;
            })}
          </select>
          <label>Year</label>
          <select name="Year" value={noteForm.Year} onChange={handleFormFieldChange}>
            <option value="">Choose year</option>
            {yearList.map(function (year) {
              return <option key={year}>{year}</option>;
            })}
          </select>
          <label>Description</label>
          <textarea name="Description" value={noteForm.Description} onChange={handleFormFieldChange} />
          <label>File</label>
          <input type="file" onChange={function (event) { setNoteFile(event.target.files[0]); }} />
          <br /><br />
          <button className="btn">Share note</button>
        </form>
      )}
      {isLoading && <div className="spinner"></div>}
      {!isLoading && visibleNotes.length === 0 && <p className="message-empty">No notes found. Try another search or upload one.</p>}
      <div className="grid">
        {visibleNotes.map(function (note) {
          return (
            <div className="card" key={note.Note_id}>
              <h3>{getNoteHeading(note)}</h3>
              <span className="tag">{note.Semester} {note.Year}</span>
              <p>{note.Description}</p>
              <p className="muted">{note.created_at}</p>
              <button className="btn" onClick={function () { handleDownloadClick(note); }}>Download</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}