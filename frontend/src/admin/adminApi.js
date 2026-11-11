import { getAuthHeader, makeApiError, makeAuthApiError } from "../user/userFunctions";

const BASE_URL = "http://localhost:5000/api/admin";

// Send email and password to the backend to log in as admin
export async function loginAdmin(email, password) {
  const response = await fetch(BASE_URL + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Email: email.trim().toLowerCase(), Password: password }),
  });
  if (!response.ok) {
    throw await makeApiError(response, "Admin login failed");
  }
  return response.json();
}

// Send the edited admin profile to the backend
export async function updateAdminProfile(adminId, profileValues) {
  const response = await fetch(BASE_URL + "/" + adminId, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(profileValues),
  });
  if (!response.ok) {
    throw await makeAuthApiError(response, "Admin profile update failed");
  }
  return response.json();
}