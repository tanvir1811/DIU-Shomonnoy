// Same pattern as noteApi.js, but for /api/books (with photo upload via FormData)
import { getAuthHeader, makeApiError, makeAuthApiError } from "../user/userFunctions";

const API_URL = "http://localhost:5000/api/books";

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

export function fetchAllBooks() { return request(API_URL, {}, false); }
export function fetchMyBooks() { return request(API_URL + "/mine"); }
export function createBook(formData) { return request(API_URL, { method: "POST", body: formData }); }
export function updateBook(id, formData) { return request(API_URL + "/" + id, { method: "PUT", body: formData }); }
export function deleteBook(id) { return request(API_URL + "/" + id, { method: "DELETE" }); }