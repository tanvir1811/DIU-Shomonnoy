// Same pattern as bookApi.js, but with picture upload (FormData)
import { getAuthHeader, makeApiError, makeAuthApiError } from "../user/userFunctions";

const API_URL = "http://localhost:5000/api/equipment";

// Do not set Content-Type here: the browser sets it for FormData
async function request(url, options = {}, needsLogin = true) {
  const response = await fetch(url, {
    ...options,
    headers: { ...getAuthHeader() },
  });
  if (!response.ok) {
    throw needsLogin
      ? await makeAuthApiError(response, "Request failed.")
      : await makeApiError(response, "Request failed.");
  }
  return response.json().catch(function () { return {}; });
}

export function fetchAllEquipment() { return request(API_URL, {}, false); }
export function fetchMyEquipment() { return request(API_URL + "/mine"); }
export function createEquipment(formData) { return request(API_URL, { method: "POST", body: formData }); }
export function updateEquipment(id, formData) { return request(API_URL + "/" + id, { method: "PUT", body: formData }); }
export function deleteEquipment(id) { return request(API_URL + "/" + id, { method: "DELETE" }); }