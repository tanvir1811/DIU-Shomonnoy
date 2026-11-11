import { getAuthHeader, makeApiError, makeAuthApiError } from "./userFunctions";

const BASE_URL = "http://localhost:5000/api/users";

// Send the signup form (with the picture) to the backend
export async function signupStudent(formData) {
  const response = await fetch(BASE_URL + "/signup", { method: "POST", body: formData });
  if (!response.ok) {
    throw await makeApiError(response, "Signup failed");
  }
  return response.json();
}

// Send email and password to the backend to log in
export async function loginStudent(email, password) {
  const response = await fetch(BASE_URL + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Email: email, Password: password }),
  });
  if (!response.ok) {
    throw await makeApiError(response, "Login failed");
  }
  return response.json();
}

// Send the edited profile to the backend
export async function updateStudentProfile(studentId, profileValues) {
  const response = await fetch(BASE_URL + "/" + studentId, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(profileValues),
  });
  if (!response.ok) {
    throw await makeAuthApiError(response, "Profile update failed");
  }
  return response.json();
}