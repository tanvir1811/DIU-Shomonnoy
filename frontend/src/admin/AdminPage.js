import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { departmentList, teacherDesignationList } from "../sampleData";
import { saveLoggedInUser, getLoggedInUser, isEmailValid, isBackendError } from "../user/userFunctions";
import { isAdminLoggedIn, getEmptyFacultyForm, removeItemFromList } from "./adminFunctions";
import { loginAdmin, updateAdminProfile } from "./adminApi";
import { fetchAllNotes, deleteNoteById } from "../note/noteApi";
import { fetchAllQuestions, deleteQuestionById } from "../questionBank/questionApi";
import { fetchAllFaculty, addFaculty, updateFaculty, deleteFacultyById } from "../faculty/facultyApi";
import { isFacultyFormValid } from "../faculty/facultyFunctions";

// Options for a dropdown: the list from sampleData.js, plus the saved value if it is not in that list
// (so an older record is not shown blank)
function getOptionList(optionList, currentValue) {
  if (currentValue && !optionList.includes(currentValue)) {
    return [currentValue, ...optionList];
  }
  return optionList;
}

// Admin login page
export function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // starts with a message when we were sent here because the old login expired
  const [errorMessage, setErrorMessage] = useState((location.state && location.state.message) || "");

  // Log in with the backend, or use a demo admin if it is offline
  async function handleAdminLoginSubmit(event) {
    event.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!isEmailValid(cleanEmail) || password === "") {
      setErrorMessage("Please enter your email and password.");
      return;
    }
    let adminUser = { admin_id: "A-1", Name: "Demo Admin", Email: cleanEmail, Department: "CSE", Phone_number: "", UserName: "admin", Profile_Pic: "https://i.pravatar.cc/150?img=15", role: "admin" };
    try {
      adminUser = await loginAdmin(cleanEmail, password);
      adminUser.role = "admin";
    } catch (error) {
      if (isBackendError(error)) {
        // wrong email or password, etc. Stay on this page (a demo admin has no token and cannot change anything)
        setErrorMessage(error.message);
        return;
      }
      console.log("Backend not connected, using demo admin.");
    }
    saveLoggedInUser(adminUser);
    navigate("/admin/dashboard");
  }

  return (
    <form className="form-box" onSubmit={handleAdminLoginSubmit}>
      <h2>Admin login</h2>
      <label>Email</label>
      <input value={email} onChange={function (event) { setEmail(event.target.value); }} />
      <label>Password</label>
      <input type="password" value={password} onChange={function (event) { setPassword(event.target.value); }} />
      {errorMessage !== "" && <div className="message-error">{errorMessage}</div>}
      <button className="btn btn-yellow">Log in</button>
    </form>
  );
}

// Admin profile page (same fields as a student profile)
export function AdminProfilePage() {
  const navigate = useNavigate();
  const [profileValues, setProfileValues] = useState(getLoggedInUser());
  const [statusMessage, setStatusMessage] = useState("");

  // Update one profile field while typing
  function handleFieldChange(event) {
    setProfileValues({ ...profileValues, [event.target.name]: event.target.value });
  }

  // Save the profile to the backend and localStorage
  async function handleSaveClick() {
    try {
      await updateAdminProfile(profileValues.admin_id, profileValues);
    } catch (error) {
      if (isBackendError(error)) {
        setStatusMessage(error.message);
        if (error.status === 401) {
          navigate("/admin/login", { state: { message: error.message } });
        }
        return;
      }
      console.log("Backend not connected, saved on this device only.");
    }
    saveLoggedInUser(profileValues);
    setStatusMessage("Profile saved.");
  }

  if (!isAdminLoggedIn()) {
    return (
      <div className="message-empty">
        <p>Admins only. Please log in.</p>
        <button className="btn" onClick={function () { navigate("/admin/login"); }}>Admin login</button>
      </div>
    );
  }

  return (
    <div className="form-box">
      <h2>Admin profile</h2>
      <img className="faculty-photo" src={profileValues.Profile_Pic} alt="Admin" />
      <p className="muted">Admin ID: {profileValues.admin_id}</p>
      <label>Name</label>
      <input name="Name" value={profileValues.Name} onChange={handleFieldChange} />
      <label>Email</label>
      <input name="Email" value={profileValues.Email} onChange={handleFieldChange} />
      <label>Department</label>
      <select name="Department" value={profileValues.Department} onChange={handleFieldChange}>
        <option value="">Choose department</option>
        {getOptionList(departmentList, profileValues.Department).map(function (name) {
          return <option key={name}>{name}</option>;
        })}
      </select>
      <label>Phone number</label>
      <input name="Phone_number" value={profileValues.Phone_number} onChange={handleFieldChange} />
      <label>Username</label>
      <input name="UserName" value={profileValues.UserName} onChange={handleFieldChange} />
      {statusMessage !== "" && <div className="message-ok">{statusMessage}</div>}
      <button className="btn btn-yellow" onClick={handleSaveClick}>Save changes</button>
    </div>
  );
}

// Admin dashboard: manage faculty, remove notes and questions
export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("faculty");
  const [facultyList, setFacultyList] = useState([]);
  const [noteList, setNoteList] = useState([]);
  const [questionList, setQuestionList] = useState([]);
  const [facultyForm, setFacultyForm] = useState(getEmptyFacultyForm());
  const [editingFacultyId, setEditingFacultyId] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  // faculty photo upload
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0); // changing this clears the file input
  // the "Created faculties" bar opens and closes the list
  const [isFacultyListOpen, setIsFacultyListOpen] = useState(false);

  // Load all three lists when the dashboard opens
  useEffect(function () {
    async function loadEverything() {
      try { setFacultyList(await fetchAllFaculty()); } catch (error) { setFacultyList(sampleFaculty); }
      try { setNoteList(await fetchAllNotes()); } catch (error) { setNoteList(sampleNotes); }
      try { setQuestionList(await fetchAllQuestions()); } catch (error) { setQuestionList(sampleQuestions); }
    }
    loadEverything();
  }, []);

  // True (and shows the problem) when the backend refused the request, so we never pretend it worked.
  // False when the backend is simply off, so the local-only demo behaviour still works.
  function stopOnBackendError(error) {
    if (!isBackendError(error)) {
      return false;
    }
    if (error.status === 401) {
      navigate("/admin/login", { state: { message: error.message } });
    } else {
      setStatusMessage(error.message);
    }
    return true;
  }

  // Update one faculty form field
  function handleFacultyFieldChange(event) {
    setFacultyForm({ ...facultyForm, [event.target.name]: event.target.value });
  }

  // The admin picked a photo file from the computer
  function handlePhotoChange(event) {
    const chosenFile = event.target.files[0];
    if (!chosenFile) {
      setPhotoFile(null);
      setPhotoPreview("");
      return;
    }
    if (!chosenFile.type.startsWith("image/")) {
      setStatusMessage("Please choose an image file (jpg, png, webp...).");
      event.target.value = "";
      return;
    }
    setPhotoFile(chosenFile);
    setPhotoPreview(URL.createObjectURL(chosenFile));
  }

  // Empty the faculty form, the chosen photo and the edit mode
  function resetFacultyForm() {
    setFacultyForm(getEmptyFacultyForm());
    setEditingFacultyId(null);
    setPhotoFile(null);
    setPhotoPreview("");
    setFileInputKey(fileInputKey + 1);
  }

  // Add a new faculty or save changes to the one being edited
  async function handleFacultySubmit(event) {
    event.preventDefault();
    if (!isFacultyFormValid(facultyForm)) {
      setStatusMessage("Please fill name, designation, a valid email and department.");
      return;
    }

    let savedOnBackend = false;
    try {
      if (editingFacultyId === null) {
        await addFaculty(facultyForm, photoFile);
      } else {
        await updateFaculty(editingFacultyId, facultyForm, photoFile);
      }
      savedOnBackend = true;
    } catch (error) {
      if (stopOnBackendError(error)) { return; }
      console.log("Backend off, local only.");
    }

    if (savedOnBackend) {
      // reload so the list has the real ids and the uploaded photo links
      try { setFacultyList(await fetchAllFaculty()); } catch (error) { console.log("Could not reload faculty."); }
    } else if (editingFacultyId === null) {
      const newFaculty = { ...facultyForm, Image: photoPreview || facultyForm.Image, Faculty_listing_id: Date.now() };
      setFacultyList([...facultyList, newFaculty]);
    } else {
      setFacultyList(facultyList.map(function (faculty) {
        if (faculty.Faculty_listing_id === editingFacultyId) {
          return { ...facultyForm, Image: photoPreview || facultyForm.Image, Faculty_listing_id: editingFacultyId };
        }
        return faculty;
      }));
    }

    resetFacultyForm();
    setIsFacultyListOpen(true);
    setStatusMessage("Faculty saved.");
  }

  // Put a faculty's details into the form so it can be edited
  function handleEditFacultyClick(faculty) {
    setFacultyForm(faculty);
    setEditingFacultyId(faculty.Faculty_listing_id);
    setPhotoFile(null);
    setPhotoPreview("");
    setFileInputKey(fileInputKey + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Delete a faculty after the admin confirms
  async function handleDeleteFacultyClick(facultyId) {
    if (!window.confirm("Delete this faculty member?")) { return; }
    try { await deleteFacultyById(facultyId); } catch (error) { if (stopOnBackendError(error)) { return; } console.log("Backend off, local only."); }
    setFacultyList(removeItemFromList(facultyList, "Faculty_listing_id", facultyId));
  }

  // Delete an inappropriate note after the admin confirms
  async function handleDeleteNoteClick(noteId) {
    if (!window.confirm("Remove this note?")) { return; }
    try { await deleteNoteById(noteId); } catch (error) { if (stopOnBackendError(error)) { return; } console.log("Backend off, local only."); }
    setNoteList(removeItemFromList(noteList, "Note_id", noteId));
  }

  // Delete an inappropriate question after the admin confirms
  async function handleDeleteQuestionClick(questionId) {
    if (!window.confirm("Remove this question?")) { return; }
    try { await deleteQuestionById(questionId); } catch (error) { if (stopOnBackendError(error)) { return; } console.log("Backend off, local only."); }
    setQuestionList(removeItemFromList(questionList, "QuestionBankId", questionId));
  }

  if (!isAdminLoggedIn()) {
    return (
      <div className="message-empty">
        <p>Admins only. Please log in.</p>
        <button className="btn" onClick={function () { navigate("/admin/login"); }}>Admin login</button>
      </div>
    );
  }

  // the photo shown in the form: the newly chosen one, or the saved one while editing
  const shownPhoto = photoPreview || facultyForm.Image;

  return (
    <div>
      <h2>Admin dashboard</h2>
      <div className="tab-row">
        <button className="btn" onClick={function () { setActiveTab("faculty"); }}>Faculty</button>
        <button className="btn" onClick={function () { setActiveTab("notes"); }}>Notes</button>
        <button className="btn" onClick={function () { setActiveTab("questions"); }}>Questions</button>
      </div>
      {statusMessage !== "" && <div className="message-ok">{statusMessage}</div>}

      {activeTab === "faculty" && (
        <div>
          {/* Faculty form fields follow the ERD order: Name, Designation, Email, Department, Image, Counseling_Hour */}
          <form className="form-box" onSubmit={handleFacultySubmit}>
            <h3>{editingFacultyId === null ? "Add faculty" : "Edit faculty"}</h3>
            <input name="Name" placeholder="Name" value={facultyForm.Name} onChange={handleFacultyFieldChange} />
            <select name="Designation" value={facultyForm.Designation} onChange={handleFacultyFieldChange}>
              <option value="">Choose designation</option>
              {getOptionList(teacherDesignationList, facultyForm.Designation).map(function (name) {
                return <option key={name}>{name}</option>;
              })}
            </select>
            <input name="Email" placeholder="Email" value={facultyForm.Email} onChange={handleFacultyFieldChange} />
            <select name="Department" value={facultyForm.Department} onChange={handleFacultyFieldChange}>
              <option value="">Choose department</option>
              {getOptionList(departmentList, facultyForm.Department).map(function (name) {
                return <option key={name}>{name}</option>;
              })}
            </select>

            <label>Profile picture</label>
            {shownPhoto && <img className="faculty-photo" src={shownPhoto} alt="Faculty preview" />}
            <input key={fileInputKey} type="file" accept="image/*" onChange={handlePhotoChange} />
            {editingFacultyId !== null && <p className="muted">Leave the file empty to keep the current picture.</p>}

            <input name="Counseling_Hour" placeholder="Counseling hour" value={facultyForm.Counseling_Hour} onChange={handleFacultyFieldChange} />

            <br /><br />
            <button className="btn">{editingFacultyId === null ? "Add faculty" : "Save changes"}</button>
            {editingFacultyId !== null && (
              <button type="button" className="btn" onClick={resetFacultyForm}>Cancel edit</button>
            )}
          </form>

          {/* Click this bar to show or hide every created faculty */}
          <button
            type="button"
            className="btn"
            style={{ width: "100%", display: "flex", justifyContent: "space-between", marginTop: "16px" }}
            onClick={function () { setIsFacultyListOpen(!isFacultyListOpen); }}
            aria-expanded={isFacultyListOpen}
          >
            <span>Created faculties ({facultyList.length})</span>
            <span aria-hidden="true">{isFacultyListOpen ? "▲" : "▼"}</span>
          </button>

          {isFacultyListOpen && (
            <div className="grid">
              {facultyList.length === 0 && <p className="message-empty">No faculty added yet.</p>}
              {facultyList.map(function (faculty) {
                return (
                  <div className="card" key={faculty.Faculty_listing_id}>
                    {faculty.Image && <img className="faculty-photo" src={faculty.Image} alt={faculty.Name} />}
                    <h3>{faculty.Name}</h3>
                    <p className="muted">{faculty.Designation}</p>
                    <p className="muted">{faculty.Email}</p>
                    <p className="muted">{faculty.Department}</p>
                    {faculty.Counseling_Hour && <p className="muted">Counseling: {faculty.Counseling_Hour}</p>}
                    <div className="row-actions">
                      <button className="btn" onClick={function () { handleEditFacultyClick(faculty); }}>Edit</button>
                      <button className="btn btn-danger" onClick={function () { handleDeleteFacultyClick(faculty.Faculty_listing_id); }}>Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "notes" && (
        <div className="grid">
          {noteList.length === 0 && <p className="message-empty">No notes to review.</p>}
          {noteList.map(function (note) {
            return (
              <div className="card" key={note.Note_id}>
                <h3>{note.Title}</h3>
                <p className="muted">{note.Course} · {note.Semester} {note.Year}</p>
                <button className="btn btn-danger" onClick={function () { handleDeleteNoteClick(note.Note_id); }}>Remove note</button>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "questions" && (
        <div className="grid">
          {questionList.length === 0 && <p className="message-empty">No questions to review.</p>}
          {questionList.map(function (question) {
            return (
              <div className="card" key={question.QuestionBankId}>
                <h3>{question.Title}</h3>
                <p className="muted">{question.ExamType} · {question.Department}</p>
                <button className="btn btn-danger" onClick={function () { handleDeleteQuestionClick(question.QuestionBankId); }}>Remove question</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}