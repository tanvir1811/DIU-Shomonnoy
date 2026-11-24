const API_URL = "http://localhost:5000/api"; // use the same base URL as bookApi.js

export async function sendRequest(data) {
  const response = await fetch(API_URL + "/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.message || "Request failed");
    error.status = response.status;
    throw error;
  }
  return result;
}