import { getAuthHeader, makeApiError, makeAuthApiError } from "../user/userFunctions";

const BASE_URL = "http://localhost:5000/api/notes";

// Get every note (public)
export async function fetchAllNotes() {
  const response = await fetch(BASE_URL);
  if (!response.ok) {
    throw await makeApiError(response, "Could not load notes");
  }
  return response.json();
}

// Get only the notes uploaded by the logged-in student
export async function fetchMyNotes() {
  const response = await fetch(BASE_URL + "/mine", { headers: getAuthHeader() });
  if (!response.ok) {
    throw await makeAuthApiError(response, "Could not load your uploads");
  }
  return response.json();
}

// Upload a new note. formData holds Course_Code, Course_Name, Semester, Year, Description and "file".
export async function uploadNote(formData) {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: { ...getAuthHeader() }, // no Content-Type here: the browser sets it for file uploads
    body: formData,
  });
  if (!response.ok) {
    throw await makeAuthApiError(response, "Could not upload note");
  }
  return response.json();
}

// Edit a note (owner only). A new "file" in formData is optional.
export async function updateNoteById(noteId, formData) {
  const response = await fetch(BASE_URL + "/" + noteId, {
    method: "PUT",
    headers: { ...getAuthHeader() },
    body: formData,
  });
  if (!response.ok) {
    throw await makeAuthApiError(response, "Could not update note");
  }
  return response.json();
}

// Delete a note (owner or admin)
export async function deleteNoteById(noteId) {
  const response = await fetch(BASE_URL + "/" + noteId, { method: "DELETE", headers: getAuthHeader() });
  if (!response.ok) {
    throw await makeAuthApiError(response, "Could not delete note");
  }
}