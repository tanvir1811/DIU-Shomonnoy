import { getAuthHeader, makeAuthApiError } from "../user/userFunctions";

const BASE_URL = "http://localhost:5000/api/faculty";

// Put the faculty text fields and the optional photo file into one FormData
function makeFacultyFormData(facultyValues, photoFile) {
  const formData = new FormData();
  formData.append("Name", facultyValues.Name || "");
  formData.append("Designation", facultyValues.Designation || "");
  formData.append("Email", facultyValues.Email || "");
  formData.append("Department", facultyValues.Department || "");
  formData.append("Counseling_Hour", facultyValues.Counseling_Hour || "");
  if (photoFile) {
    formData.append("Image", photoFile);
  }
  return formData;
}

// Get all faculty members from the backend
export async function fetchAllFaculty() {
  const response = await fetch(BASE_URL);
  if (!response.ok) {
    throw new Error("Could not load faculty");
  }
  return response.json();
}

// Add a new faculty member with an uploaded photo (admin only)
export async function addFaculty(facultyValues, photoFile) {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: { ...getAuthHeader() }, // no Content-Type here: the browser sets it for file uploads
    body: makeFacultyFormData(facultyValues, photoFile),
  });
  if (!response.ok) {
    throw await makeAuthApiError(response, "Could not add faculty");
  }
  return response.json();
}

// Update a faculty member (admin only). The old photo stays if no new file is chosen.
export async function updateFaculty(facultyId, facultyValues, photoFile) {
  const response = await fetch(BASE_URL + "/" + facultyId, {
    method: "PUT",
    headers: { ...getAuthHeader() },
    body: makeFacultyFormData(facultyValues, photoFile),
  });
  if (!response.ok) {
    throw await makeAuthApiError(response, "Could not update faculty");
  }
  return response.json();
}

// Delete a faculty member (admin only)
export async function deleteFacultyById(facultyId) {
  const response = await fetch(BASE_URL + "/" + facultyId, { method: "DELETE", headers: getAuthHeader() });
  if (!response.ok) {
    throw await makeAuthApiError(response, "Could not delete faculty");
  }
}