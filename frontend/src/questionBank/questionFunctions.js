// Keep only questions that match department, semester, year and exam type (empty = any)
export function filterQuestions(questionList, selectedDepartment, selectedSemester, selectedYear, selectedExamType) {
  return questionList.filter(function (question) {
    const departmentMatches = selectedDepartment === "" || question.Department === selectedDepartment;
    const semesterMatches = selectedSemester === "" || question.Semester === selectedSemester;
    // the database can send the year as a number, the dropdown gives a string
    const yearMatches = selectedYear === "" || String(question.Year) === String(selectedYear);
    const examTypeMatches = selectedExamType === "" || question.ExamType === selectedExamType;
    return departmentMatches && semesterMatches && yearMatches && examTypeMatches;
  });
}

// Check that the question upload form has all required values
export function isQuestionFormValid(questionForm, questionFile) {
  return (
    questionForm.Course_Code.trim() !== "" &&
    questionForm.Course_Name.trim() !== "" &&
    questionForm.Department !== "" &&
    questionForm.Semester !== "" &&
    questionForm.Year !== "" &&
    questionFile !== null
  );
}