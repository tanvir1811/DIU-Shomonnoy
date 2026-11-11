// Keep only the notes that match the search text, semester and year (empty = any)
export function filterNotes(noteList, searchText, selectedSemester, selectedYear) {
  const lowerSearchText = searchText.toLowerCase();
  return noteList.filter(function (note) {
    const titleMatches = String(note.Title || "").toLowerCase().includes(lowerSearchText);
    const codeMatches = String(note.Course_Code || "").toLowerCase().includes(lowerSearchText);
    const nameMatches = String(note.Course_Name || "").toLowerCase().includes(lowerSearchText);
    const semesterMatches = selectedSemester === "" || note.Semester === selectedSemester;
    // the database returns a number, the dropdown gives a string
    const yearMatches = selectedYear === "" || String(note.Year) === String(selectedYear);
    return (titleMatches || codeMatches || nameMatches) && semesterMatches && yearMatches;
  });
}

// Card heading: "CODE - Name", or the old Title for old rows
export function getNoteHeading(note) {
  if (note.Course_Code && note.Course_Name) {
    return note.Course_Code + " - " + note.Course_Name;
  }
  return note.Title;
}

// Check that the upload form has all required values
export function isNoteFormValid(noteForm, noteFile) {
  return (
    noteForm.Course_Code.trim() !== "" &&
    noteForm.Course_Name.trim() !== "" &&
    noteForm.Semester !== "" &&
    noteForm.Year !== "" &&
    noteFile !== null
  );
}