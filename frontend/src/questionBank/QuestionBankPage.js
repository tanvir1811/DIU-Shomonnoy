import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { semesterNameList, yearList, departmentList, examTypeList } from "../sampleData";
import { getLoggedInUser, isBackendError } from "../user/userFunctions";
import { filterQuestions, isQuestionFormValid } from "./questionFunctions";
import { fetchAllQuestions, fetchMyQuestions, downloadQuestionFile, downloadAnswerNote, uploadQuestion } from "./questionApi";

// Question bank page: filter, download and upload past questions
export function QuestionBankPage() {
  const navigate = useNavigate();
  const [questionList, setQuestionList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOwner, setSelectedOwner] = useState("all"); // "all" or "mine"
  const [selectedExamType, setSelectedExamType] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [isUploadFormOpen, setIsUploadFormOpen] = useState(false);
  // "Mid Term" is one of the exam types in examTypeList (sampleData.js)
  const [questionForm, setQuestionForm] = useState({ Course_Code: "", Course_Name: "", ExamType: "Mid Term", Department: "", Semester: "", Year: "", Details: "" });
  const [questionFile, setQuestionFile] = useState(null);
  const [answerFile, setAnswerFile] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isStatusError, setIsStatusError] = useState(false);

  // Load questions when the page opens or when "All questions / My uploads" changes
  useEffect(function () {
    async function loadQuestions() {
      setIsLoading(true);
      try {
        if (selectedOwner === "mine") {
          setQuestionList(await fetchMyQuestions());
        } else {
          setQuestionList(await fetchAllQuestions());
        }
      } catch (error) {
        if (isBackendError(error) && error.status === 401) {
          navigate("/login", { state: { message: error.message } });
          return;
        }
        setQuestionList([]);
        if (isBackendError(error)) {
          setStatusMessage(error.message);
        } else {
          setStatusMessage("Could not load questions. Please make sure the server is running.");
        }
        setIsStatusError(true);
      }
      setIsLoading(false);
    }
    loadQuestions();
  }, [selectedOwner]);

  // Open the upload form, or send visitors to login first
  function handleUploadQuestionClick() {
    if (getLoggedInUser() === null) {
      navigate("/login");
      return;
    }
    setIsUploadFormOpen(!isUploadFormOpen);
  }

  // Update one upload form field
  function handleFormFieldChange(event) {
    setQuestionForm({ ...questionForm, [event.target.name]: event.target.value });
  }

  // Send the new question to the backend and show it in the list
  async function handleQuestionSubmit(event) {
    event.preventDefault();
    if (!isQuestionFormValid(questionForm, questionFile)) {
      setStatusMessage("Please fill course code, course name, department, semester, year and choose a file.");
      setIsStatusError(true);
      return;
    }
    const formData = new FormData();
    Object.keys(questionForm).forEach(function (fieldName) {
      formData.append(fieldName, questionForm[fieldName]);
    });
    formData.append("file", questionFile);
    if (answerFile !== null) {
      formData.append("answerFile", answerFile);
    }
    let newQuestion = {
      ...questionForm,
      Title: questionForm.Course_Code + " - " + questionForm.Course_Name,
      QuestionBankId: Date.now(),
      Answer_note_Url: answerFile ? "#" : "",
      posted_at: new Date().toISOString().slice(0, 10),
    };
    try {
      // use the saved question from the backend (it has the real id and the file links)
      newQuestion = await uploadQuestion(formData);
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
      console.log("Backend not connected, showing question locally only.");
    }
    setQuestionList([newQuestion, ...questionList]);
    setStatusMessage("Question uploaded.");
    setIsStatusError(false);
    setIsUploadFormOpen(false);
  }

  // Download the question file
  async function handleDownloadClick(question) {
    try {
      await downloadQuestionFile(question);
      setStatusMessage("Download started successfully.");
      setIsStatusError(false);
    } catch (error) {
      setStatusMessage(error.message);
      setIsStatusError(true);
    }
  }

  // Download the optional answer note
  async function handleAnswerClick(question) {
    try {
      await downloadAnswerNote(question);
      setStatusMessage("Answer note download started successfully.");
      setIsStatusError(false);
    } catch (error) {
      setStatusMessage(error.message);
      setIsStatusError(true);
    }
  }

  const visibleQuestions = filterQuestions(questionList, selectedDepartment, selectedSemester, selectedYear, selectedExamType);

  return (
    <div>
      <h2>Question Bank</h2>
      {/* Filters follow the ERD order: ExamType, Department, Semester (then Year) */}
      <div className="toolbar">
        {getLoggedInUser() !== null && (
          <select value={selectedOwner} onChange={function (event) { setSelectedOwner(event.target.value); }}>
            <option value="all">All questions</option>
            <option value="mine">My uploads</option>
          </select>
        )}
        <select value={selectedExamType} onChange={function (event) { setSelectedExamType(event.target.value); }}>
          <option value="">All exam types</option>
          {examTypeList.map(function (name) { return <option key={name}>{name}</option>; })}
        </select>
        <select value={selectedDepartment} onChange={function (event) { setSelectedDepartment(event.target.value); }}>
          <option value="">All departments</option>
          {departmentList.map(function (name) { return <option key={name}>{name}</option>; })}
        </select>
        <select value={selectedSemester} onChange={function (event) { setSelectedSemester(event.target.value); }}>
          <option value="">All semesters</option>
          {semesterNameList.map(function (name) { return <option key={name}>{name}</option>; })}
        </select>
        <select value={selectedYear} onChange={function (event) { setSelectedYear(event.target.value); }}>
          <option value="">All years</option>
          {yearList.map(function (year) { return <option key={year}>{year}</option>; })}
        </select>
        <button className="btn btn-yellow" onClick={handleUploadQuestionClick}>Upload question</button>
      </div>
      {statusMessage !== "" && <div className={isStatusError ? "message-error" : "message-ok"}>{statusMessage}</div>}
      {isUploadFormOpen && (
        <form className="form-box fade-in" onSubmit={handleQuestionSubmit}>
          <label>Course code</label>
          <input name="Course_Code" placeholder="e.g. CSE101" value={questionForm.Course_Code} onChange={handleFormFieldChange} />
          <label>Course name</label>
          <input name="Course_Name" placeholder="e.g. Data Structures" value={questionForm.Course_Name} onChange={handleFormFieldChange} />
          <label>Exam type</label>
          <select name="ExamType" value={questionForm.ExamType} onChange={handleFormFieldChange}>
            {examTypeList.map(function (name) { return <option key={name}>{name}</option>; })}
          </select>
          <label>Department</label>
          <select name="Department" value={questionForm.Department} onChange={handleFormFieldChange}>
            <option value="">Choose department</option>
            {departmentList.map(function (name) { return <option key={name}>{name}</option>; })}
          </select>
          <label>Semester</label>
          <select name="Semester" value={questionForm.Semester} onChange={handleFormFieldChange}>
            <option value="">Choose semester</option>
            {semesterNameList.map(function (name) { return <option key={name}>{name}</option>; })}
          </select>
          <label>Year</label>
          <select name="Year" value={questionForm.Year} onChange={handleFormFieldChange}>
            <option value="">Choose year</option>
            {yearList.map(function (year) { return <option key={year}>{year}</option>; })}
          </select>
          <label>Details</label>
          <textarea name="Details" value={questionForm.Details} onChange={handleFormFieldChange} />
          <label>Question file</label>
          <input type="file" onChange={function (event) { setQuestionFile(event.target.files[0]); }} />
          <label>Answer note (optional)</label>
          <input type="file" onChange={function (event) { setAnswerFile(event.target.files[0]); }} />
          <br /><br />
          <button className="btn">Share question</button>
        </form>
      )}
      {isLoading && <div className="spinner"></div>}
      {!isLoading && visibleQuestions.length === 0 && <p className="message-empty">No questions match these filters.</p>}
      <div className="grid">
        {visibleQuestions.map(function (question) {
          return (
            <div className="card" key={question.QuestionBankId}>
              <h3>{question.Course_Code ? question.Course_Code + " - " + question.Course_Name : question.Title}</h3>
              <span className="tag">{question.ExamType}</span>
              <span className="tag">{question.Department}</span>
              <span className="tag">{question.Semester} {question.Year}</span>
              <p>{question.Details}</p>
              <p className="muted">{question.posted_at}</p>
              <div className="row-actions">
                <button className="btn" onClick={function () { handleDownloadClick(question); }}>Download</button>
                {question.Answer_note_Url && <button className="btn btn-yellow" onClick={function () { handleAnswerClick(question); }}>Download answer note</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}