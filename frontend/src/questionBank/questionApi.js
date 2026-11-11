import { getAuthHeader, makeApiError, makeAuthApiError } from "../user/userFunctions";

const BASE_URL = "http://localhost:5000/api/question-bank";

// Download a file from the backend and save it through the browser.
// Going through fetch lets us show the backend's own message when the file is missing.
async function downloadFile(url, fallbackName, errorMessage) {
  const response = await fetch(url);
  if (!response.ok) {
    throw await makeApiError(response, errorMessage);
  }
  // use the file name the backend sent, if there is one
  const disposition = response.headers.get("Content-Disposition") || "";
  const nameMatch = disposition.match(/filename="?([^";]+)"?/i);
  const fileName = nameMatch ? nameMatch[1] : fallbackName;

  const blobUrl = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
}

// Get every question (public)
export async function fetchAllQuestions() {
  const response = await fetch(BASE_URL);
  if (!response.ok) {
    throw await makeApiError(response, "Could not load questions");
  }
  return response.json();
}

// Get only the questions uploaded by the logged-in student
export async function fetchMyQuestions() {
  const response = await fetch(BASE_URL + "/mine", { headers: getAuthHeader() });
  if (!response.ok) {
    throw await makeAuthApiError(response, "Could not load your questions");
  }
  return response.json();
}

// Upload a new question. formData holds the text fields, "file" and the optional "answerFile".
export async function uploadQuestion(formData) {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: { ...getAuthHeader() }, // no Content-Type here: the browser sets it for file uploads
    body: formData,
  });
  if (!response.ok) {
    throw await makeAuthApiError(response, "Could not upload question");
  }
  return response.json();
}

// Edit a question (owner only). New "file" and "answerFile" are both optional.
export async function updateQuestionById(questionId, formData) {
  const response = await fetch(BASE_URL + "/" + questionId, {
    method: "PUT",
    headers: { ...getAuthHeader() },
    body: formData,
  });
  if (!response.ok) {
    throw await makeAuthApiError(response, "Could not update question");
  }
  return response.json();
}

// Delete a question (owner or admin)
export async function deleteQuestionById(questionId) {
  const response = await fetch(BASE_URL + "/" + questionId, { method: "DELETE", headers: getAuthHeader() });
  if (!response.ok) {
    throw await makeAuthApiError(response, "Could not delete question");
  }
}

// Download the question file
export async function downloadQuestionFile(question) {
  await downloadFile(BASE_URL + "/" + question.QuestionBankId + "/download", "question", "Could not download the question file");
}

// Download the answer note
export async function downloadAnswerNote(question) {
  await downloadFile(BASE_URL + "/" + question.QuestionBankId + "/answer-download", "answer-note", "Could not download the answer note");
}