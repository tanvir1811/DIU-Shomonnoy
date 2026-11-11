import { getLoggedInUser } from "../user/userFunctions";

// True only when the logged-in person is an admin
export function isAdminLoggedIn() {
  const loggedInUser = getLoggedInUser();
  return loggedInUser !== null && loggedInUser.role === "admin";
}

// Starting (empty) values for the faculty form
export function getEmptyFacultyForm() {
  return { Name: "", Designation: "", Email: "", Department: "", Image: "", Counseling_Hour: "" };
}

// Remove one item from a list by its id field
export function removeItemFromList(itemList, idFieldName, idToRemove) {
  return itemList.filter(function (item) {
    return item[idFieldName] !== idToRemove;
  });
}
