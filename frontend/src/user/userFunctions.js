const LOCAL_STORAGE_KEY = "loggedInUser";

// Read the logged-in person from localStorage (null if nobody is logged in)
export function getLoggedInUser() {
  const savedText = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (savedText === null) {
    return null;
  }
  return JSON.parse(savedText);
}

// Save the logged-in person into localStorage
export function saveLoggedInUser(userObject) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userObject));
}

// Remove the logged-in person from localStorage
export function logoutUser() {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
}

// Check that the student ID looks like 213-15-4567
export function isStudentIdValid(studentId) {
  const studentIdPattern = /^\d{3}-\d{2}-\d{3,5}$/;
  return studentIdPattern.test(studentId);
}

// Check that the email has an @ and a dot
export function isEmailValid(email) {
  return email.includes("@") && email.includes(".");
}

// Check that the password has at least 6 characters
export function isPasswordValid(password) {
  return password.length >= 6;
}

// Return an error message for the signup form, or "" if everything is fine
export function getSignupErrorMessage(formValues, profilePictureFile) {
  if (!isStudentIdValid(formValues.student_id)) {
    return "Student ID must look like 213-15-4567.";
  }
  if (profilePictureFile === null) {
    return "Please choose a profile picture.";
  }
  if (!isEmailValid(formValues.Email)) {
    return "Please enter a valid email.";
  }
  if (!isPasswordValid(formValues.Password)) {
    return "Password must be at least 6 characters.";
  }
  return "";
}

// Turn a picked image file into a temporary preview address
export function makePicturePreviewUrl(pictureFile) {
  return URL.createObjectURL(pictureFile);
}


// Headers that carry the login token to the backend (empty when nobody is logged in)
export function getAuthHeader() {
  const loggedInUser = getLoggedInUser();
  if (loggedInUser === null || !loggedInUser.token) {
    return {};
  }
  return { Authorization: "Bearer " + loggedInUser.token };
}

// Build an Error from a failed backend answer.
// It keeps the backend's own message and the status code (error.status).
// A request that never reached the backend has NO status, so error.status === undefined means "backend is off".
export async function makeApiError(response, fallbackMessage) {
  let message = fallbackMessage;
  try {
    const data = await response.json();
    if (data && data.message) {
      message = data.message;
    }
  } catch (error) {
    // the answer had no JSON body, keep the fallback message
  }
  const apiError = new Error(message);
  apiError.status = response.status;
  return apiError;
}

// Same as makeApiError, for requests that need a login.
// A 401 means the saved token is missing, expired or no longer valid, so we clear it and ask the person to log in again.
export async function makeAuthApiError(response, fallbackMessage) {
  if (response.status === 401) {
    logoutUser();
    const loginError = new Error("Your login has expired. Please log in again.");
    loginError.status = 401;
    return loginError;
  }
  return makeApiError(response, fallbackMessage);
}

// True when the backend answered with an error (wrong password, expired login, bad form...).
// False when the backend could not be reached at all.
export function isBackendError(error) {
  return error !== null && error !== undefined && error.status !== undefined;
}