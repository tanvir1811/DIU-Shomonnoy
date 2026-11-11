// Keep only faculty whose name, department or designation matches the search text
export function filterFaculty(facultyList, searchText) {
  const lowerSearchText = searchText.toLowerCase();
  return facultyList.filter(function (faculty) {
    const nameMatches = faculty.Name.toLowerCase().includes(lowerSearchText);
    const departmentMatches = faculty.Department.toLowerCase().includes(lowerSearchText);
    const designationMatches = faculty.Designation.toLowerCase().includes(lowerSearchText);
    return nameMatches || departmentMatches || designationMatches;
  });
}

// Check that the faculty form has the required values
export function isFacultyFormValid(facultyForm) {
  return facultyForm.Name !== "" && facultyForm.Designation !== "" && facultyForm.Email.includes("@") && facultyForm.Department !== "";
}
