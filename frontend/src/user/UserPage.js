import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { departmentList, semesterNameList, yearList, examTypeList } from "../sampleData";
import { signupStudent, loginStudent, updateStudentProfile } from "./userApi";
import { getLoggedInUser, saveLoggedInUser, getSignupErrorMessage, isEmailValid, makePicturePreviewUrl, isBackendError } from "./userFunctions";
import { getNoteHeading } from "../note/noteFunctions";
import { fetchMyNotes, updateNoteById, deleteNoteById } from "../note/noteApi";
import { fetchMyQuestions, updateQuestionById, deleteQuestionById } from "../questionBank/questionApi";

// Signup page for new students
export function SignupPage() {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({ student_id: "", Name: "", Email: "", Department: "CSE", Phone_number: "", UserName: "", Password: "" });
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [picturePreviewUrl, setPicturePreviewUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Update one field of the form while the student types
  function handleFieldChange(event) {
    setFormValues({ ...formValues, [event.target.name]: event.target.value });
  }

  // Save the chosen picture and show a preview
  function handlePictureChange(event) {
    const pickedFile = event.target.files[0];
    if (pickedFile) {
      setProfilePictureFile(pickedFile);
      setPicturePreviewUrl(makePicturePreviewUrl(pickedFile));
    }
  }

  // Check the form, send it to the backend, then go to profile
  async function handleSignupSubmit(event) {
    event.preventDefault();
    const problemText = getSignupErrorMessage(formValues, profilePictureFile);
    setErrorMessage(problemText);
    if (problemText !== "") {
      return;
    }
    setIsLoading(true);
    const formData = new FormData();
    Object.keys(formValues).forEach(function (fieldName) {
      formData.append(fieldName, formValues[fieldName]);
    });
    formData.append("Profile_Pic", profilePictureFile);
    let newUser = { ...formValues, Profile_Pic: picturePreviewUrl, role: "student" };
    try {
      newUser = await signupStudent(formData);
      newUser.role = "student";
    } catch (error) {
      if (isBackendError(error)) {
        // the backend answered with a problem (duplicate ID/email, bad value...), so show it instead of a fake account
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }
      console.log("Backend not connected, using demo account.");
    }
    saveLoggedInUser(newUser);
    setIsLoading(false);
    navigate("/profile");
  }

  return (
    <form className="form-box" onSubmit={handleSignupSubmit}>
      <h2>Create your account</h2>
      <label>Student ID</label>
      <input name="student_id" placeholder="213-15-4567" value={formValues.student_id} onChange={handleFieldChange} />
      <label>Profile picture</label>
      <input type="file" accept="image/*" onChange={handlePictureChange} />
      {picturePreviewUrl !== "" && <img className="faculty-photo" src={picturePreviewUrl} alt="Preview" />}
      <label>Name</label>
      <input name="Name" value={formValues.Name} onChange={handleFieldChange} />
      <label>Email</label>
      <input name="Email" value={formValues.Email} onChange={handleFieldChange} />
      <label>Department</label>
      <select name="Department" value={formValues.Department} onChange={handleFieldChange}>
        {departmentList.map(function (departmentName) {
          return <option key={departmentName}>{departmentName}</option>;
        })}
      </select>
      <label>Phone number</label>
      <input name="Phone_number" value={formValues.Phone_number} onChange={handleFieldChange} />
      <label>Username</label>
      <input name="UserName" value={formValues.UserName} onChange={handleFieldChange} />
      <label>Password</label>
      <input type="password" name="Password" value={formValues.Password} onChange={handleFieldChange} />
      {errorMessage !== "" && <div className="message-error">{errorMessage}</div>}
      <button className="btn btn-yellow" disabled={isLoading}>{isLoading ? "Creating..." : "Sign up"}</button>
      <p className="muted">Already have an account? <Link to="/login">Log in</Link></p>
    </form>
  );
}

// Login page for students
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // starts with a message when we were sent here because the old login expired
  const [errorMessage, setErrorMessage] = useState((location.state && location.state.message) || "");

  // Try to log in with the backend, or use a demo user if it is offline
  async function handleLoginSubmit(event) {
    event.preventDefault();
    if (!isEmailValid(email) || password === "") {
      setErrorMessage("Please enter your email and password.");
      return;
    }
    let loggedInUser = { student_id: "000-00-0000", Name: "Demo Student", Email: email, Department: "CSE", Phone_number: "", UserName: "demo", Profile_Pic: "https://i.pravatar.cc/150?img=5", role: "student" };
    try {
      loggedInUser = await loginStudent(email, password);
      loggedInUser.role = "student";
    } catch (error) {
      if (isBackendError(error)) {
        // wrong email or password, etc. Stay on this page (a demo user has no token and cannot upload)
        setErrorMessage(error.message);
        return;
      }
      console.log("Backend not connected, using demo user.");
    }
    saveLoggedInUser(loggedInUser);
    navigate("/profile");
  }

  return (
    <form className="form-box" onSubmit={handleLoginSubmit}>
      <h2>Welcome back</h2>
      <label>Email</label>
      <input value={email} onChange={function (event) { setEmail(event.target.value); }} />
      <label>Password</label>
      <input type="password" value={password} onChange={function (event) { setPassword(event.target.value); }} />
      {errorMessage !== "" && <div className="message-error">{errorMessage}</div>}
      <button className="btn btn-yellow">Log in</button>
      <p className="muted">New here? <Link to="/signup">Create an account</Link></p>
    </form>
  );
}

// Profile page where the student can view and edit their details
export function ProfilePage() {
  const navigate = useNavigate();
  const savedUser = getLoggedInUser();
  const [profileValues, setProfileValues] = useState(savedUser);
  const [statusMessage, setStatusMessage] = useState("");

  // Update one profile field while typing
  function handleFieldChange(event) {
    setProfileValues({ ...profileValues, [event.target.name]: event.target.value });
  }

  // Save the edited profile to the backend and localStorage
  async function handleSaveClick() {
    try {
      await updateStudentProfile(profileValues.student_id, profileValues);
    } catch (error) {
      if (isBackendError(error)) {
        setStatusMessage(error.message);
        if (error.status === 401) {
          navigate("/login", { state: { message: error.message } });
        }
        return;
      }
      console.log("Backend not connected, saved on this device only.");
    }
    saveLoggedInUser(profileValues);
    setStatusMessage("Profile saved.");
  }

  if (savedUser === null) {
    return (
      <div className="message-empty">
        <p>Please log in to see your profile.</p>
        <button className="btn" onClick={function () { navigate("/login"); }}>Go to login</button>
      </div>
    );
  }

  return (
    <div className="form-box">
      <h2>My profile</h2>
      <img className="faculty-photo" src={profileValues.Profile_Pic} alt="Profile" />
      <p className="muted">Student ID: {profileValues.student_id} (cannot be changed)</p>
      <label>Name</label>
      <input name="Name" value={profileValues.Name} onChange={handleFieldChange} />
      <label>Email</label>
      <input name="Email" value={profileValues.Email} onChange={handleFieldChange} />
      <label>Department</label>
      <select name="Department" value={profileValues.Department} onChange={handleFieldChange}>
        {departmentList.map(function (departmentName) {
          return <option key={departmentName}>{departmentName}</option>;
        })}
      </select>
      <label>Phone number</label>
      <input name="Phone_number" value={profileValues.Phone_number} onChange={handleFieldChange} />
      <label>Username</label>
      <input name="UserName" value={profileValues.UserName} onChange={handleFieldChange} />
      {statusMessage !== "" && <div className="message-ok">{statusMessage}</div>}
      <button className="btn btn-yellow" onClick={handleSaveClick}>Save changes</button>
      <button className="btn" onClick={function () { navigate("/dashboard"); }}>My dashboard</button>
    </div>
  );
}

// Everything that differs between notes and question banks lives here
const noteKind = {
  idField: "Note_id",
  fields: ["Course_Code", "Course_Name", "Semester", "Year", "Description"],
  fetchList: fetchMyNotes,
  updateItem: updateNoteById,
  deleteItem: deleteNoteById,
};
const questionKind = {
  idField: "QuestionBankId",
  fields: ["Course_Code", "Course_Name", "ExamType", "Department", "Semester", "Year", "Details"],
  fetchList: fetchMyQuestions,
  updateItem: updateQuestionById,
  deleteItem: deleteQuestionById,
};

// Keep only the editable fields of an item (empty text instead of null)
function pickFields(item, fieldNames) {
  const picked = {};
  fieldNames.forEach(function (fieldName) {
    picked[fieldName] = item[fieldName] || "";
  });
  return picked;
}

// One card in the dashboard (view mode and edit mode)
function DashboardItem({ kind, isQuestion, item, onSaved, onDeleted, onProblem }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [editValues, setEditValues] = useState(pickFields(item, kind.fields));
  const [newFile, setNewFile] = useState(null);
  const [newAnswerFile, setNewAnswerFile] = useState(null);

  // Update one field while typing
  function handleFieldChange(event) {
    setEditValues({ ...editValues, [event.target.name]: event.target.value });
  }

  // Send the changes to the backend and update the card
  async function handleSaveClick() {
    if (editValues.Course_Code.trim() === "" || editValues.Course_Name.trim() === "") {
      onProblem("Course code and course name cannot be empty.");
      return;
    }
    const formData = new FormData();
    Object.keys(editValues).forEach(function (fieldName) {
      formData.append(fieldName, editValues[fieldName]);
    });
    if (newFile !== null) {
      formData.append("file", newFile);
    }
    if (isQuestion && newAnswerFile !== null) {
      formData.append("answerFile", newAnswerFile);
    }
    setIsBusy(true);
    try {
      const savedItem = await kind.updateItem(item[kind.idField], formData);
      onSaved({ ...item, ...editValues, ...(savedItem || {}) });
      setIsEditing(false);
      setNewFile(null);
      setNewAnswerFile(null);
    } catch (error) {
      onProblem(error);
    }
    setIsBusy(false);
  }

  // Ask first, then delete from the backend and remove the card
  async function handleDeleteClick() {
    if (!window.confirm("Delete this upload? This cannot be undone.")) {
      return;
    }
    setIsBusy(true);
    try {
      await kind.deleteItem(item[kind.idField]);
      onDeleted(item[kind.idField]);
    } catch (error) {
      onProblem(error);
      setIsBusy(false);
    }
  }

  if (isEditing) {
    return (
      <div className="card">
        <label>Course code</label>
        <input name="Course_Code" value={editValues.Course_Code} onChange={handleFieldChange} />
        <label>Course name</label>
        <input name="Course_Name" value={editValues.Course_Name} onChange={handleFieldChange} />
        {isQuestion && (
          <>
            <label>Exam type</label>
            <select name="ExamType" value={editValues.ExamType} onChange={handleFieldChange}>
              {examTypeList.map(function (name) { return <option key={name}>{name}</option>; })}
            </select>
            <label>Department</label>
            <select name="Department" value={editValues.Department} onChange={handleFieldChange}>
              {departmentList.map(function (name) { return <option key={name}>{name}</option>; })}
            </select>
          </>
        )}
        <label>Semester</label>
        <select name="Semester" value={editValues.Semester} onChange={handleFieldChange}>
          {semesterNameList.map(function (name) { return <option key={name}>{name}</option>; })}
        </select>
        <label>Year</label>
        <select name="Year" value={editValues.Year} onChange={handleFieldChange}>
          {yearList.map(function (year) { return <option key={year}>{year}</option>; })}
        </select>
        <label>{isQuestion ? "Details" : "Description"}</label>
        <textarea
          name={isQuestion ? "Details" : "Description"}
          value={isQuestion ? editValues.Details : editValues.Description}
          onChange={handleFieldChange}
        />
        <label>Replace file (optional)</label>
        <input type="file" onChange={function (event) { setNewFile(event.target.files[0] || null); }} />
        {isQuestion && (
          <>
            <label>Replace answer note (optional)</label>
            <input type="file" onChange={function (event) { setNewAnswerFile(event.target.files[0] || null); }} />
          </>
        )}
        <div className="row-actions">
          <button className="btn btn-yellow" disabled={isBusy} onClick={handleSaveClick}>{isBusy ? "Saving..." : "Save"}</button>
          <button className="btn" disabled={isBusy} onClick={function () { setIsEditing(false); }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>{isQuestion ? item.Course_Code + " - " + item.Course_Name : getNoteHeading(item)}</h3>
      {isQuestion && <span className="tag">{item.ExamType}</span>}
      {isQuestion && <span className="tag">{item.Department}</span>}
      <span className="tag">{item.Semester} {item.Year}</span>
      <p>{isQuestion ? item.Details : item.Description}</p>
      <p className="muted">{isQuestion ? item.posted_at : item.created_at}</p>
      <div className="row-actions">
        <button className="btn" disabled={isBusy} onClick={function () { setIsEditing(true); }}>Edit</button>
        <button className="btn" disabled={isBusy} onClick={handleDeleteClick}>Delete</button>
      </div>
    </div>
  );
}

// Dashboard where the student sees, edits and deletes their own notes and question banks
export function DashboardPage() {
  const navigate = useNavigate();
  const loggedInUser = getLoggedInUser();
  const isStudent = loggedInUser !== null && loggedInUser.role === "student";
  const [activeTab, setActiveTab] = useState("notes");
  const [noteList, setNoteList] = useState([]);
  const [questionList, setQuestionList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [isStatusError, setIsStatusError] = useState(false);

  // Show a backend problem, or go to login if the session expired
  function handleProblem(error) {
    if (typeof error === "string") {
      setStatusMessage(error);
    } else if (isBackendError(error)) {
      if (error.status === 401) {
        navigate("/login", { state: { message: error.message } });
        return;
      }
      setStatusMessage(error.message);
    } else {
      setStatusMessage("Could not reach the server. Please make sure it is running.");
    }
    setIsStatusError(true);
  }

  // Load the student's notes and question banks when the page opens
  useEffect(function () {
    if (!isStudent) {
      return;
    }
    async function loadUploads() {
      try {
        setNoteList(await noteKind.fetchList());
        setQuestionList(await questionKind.fetchList());
      } catch (error) {
        handleProblem(error);
      }
      setIsLoading(false);
    }
    loadUploads();
  }, []);

  // Replace one saved item in its list
  function handleItemSaved(kind, savedItem) {
    function swap(list) {
      return list.map(function (item) { return item[kind.idField] === savedItem[kind.idField] ? savedItem : item; });
    }
    if (kind === noteKind) {
      setNoteList(swap(noteList));
    } else {
      setQuestionList(swap(questionList));
    }
    setStatusMessage("Changes saved.");
    setIsStatusError(false);
  }

  // Remove one deleted item from its list
  function handleItemDeleted(kind, itemId) {
    function without(list) {
      return list.filter(function (item) { return item[kind.idField] !== itemId; });
    }
    if (kind === noteKind) {
      setNoteList(without(noteList));
    } else {
      setQuestionList(without(questionList));
    }
    setStatusMessage("Deleted.");
    setIsStatusError(false);
  }

  // Only logged-in students can see the dashboard
  if (!isStudent) {
    return (
      <div className="message-empty">
        <p>Please log in as a student to see your dashboard.</p>
        <button className="btn" onClick={function () { navigate("/login"); }}>Go to login</button>
      </div>
    );
  }

  const isQuestionTab = activeTab === "questions";
  const activeKind = isQuestionTab ? questionKind : noteKind;
  const activeList = isQuestionTab ? questionList : noteList;

  return (
    <div>
      <h2>My dashboard</h2>
      <div className="toolbar">
        <button className={activeTab === "notes" ? "btn btn-yellow" : "btn"} onClick={function () { setActiveTab("notes"); }}>
          My notes ({noteList.length})
        </button>
        <button className={isQuestionTab ? "btn btn-yellow" : "btn"} onClick={function () { setActiveTab("questions"); }}>
          My question banks ({questionList.length})
        </button>
      </div>
      {statusMessage !== "" && <div className={isStatusError ? "message-error" : "message-ok"}>{statusMessage}</div>}
      {isLoading && <div className="spinner"></div>}
      {!isLoading && activeList.length === 0 && <p className="message-empty">You have not uploaded anything here yet.</p>}
      <div className="grid">
        {activeList.map(function (item) {
          return (
            <DashboardItem
              key={item[activeKind.idField]}
              kind={activeKind}
              isQuestion={isQuestionTab}
              item={item}
              onSaved={function (savedItem) { handleItemSaved(activeKind, savedItem); }}
              onDeleted={function (itemId) { handleItemDeleted(activeKind, itemId); }}
              onProblem={handleProblem}
            />
          );
        })}
      </div>
    </div>
  );
}