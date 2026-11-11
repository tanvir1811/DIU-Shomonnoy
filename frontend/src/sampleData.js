
export const departmentList = [
  "Business Administration",
  "Management",
  "Real Estate",
  "Tourism & Hospitality Management",
  "Innovation & Entrepreneurship",
  "Accounting",
  "Finance & Banking",
  "Marketing",

  "Computer Science and Engineering",
  "Software Engineering",
  "Multimedia & Creative Technology (MCT)",
  "Computing and Information System",
  "Information Technology & Management (ITM)",
  "Robotics and Mechatronics Engineering",

  "Agricultural Science",
  "Fisheries",

  "Information and Communication Engineering",
  "Textile Engineering",
  "Electrical and Electronic Engineering",
  "Architecture",
  "Civil Engineering",

  "Environmental Science and Disaster Management",
  "Pharmacy",
  "Nutrition and Food Engineering",
  "Public Health",
  "Physical Education & Sports Science",
  "Genetic Engineering and Biotechnology",

  "English",
  "Law",
  "Journalism, Media and Communication",
  "Development Studies",
];

export const semesterNameList = [
  "Spring",
  "Summer",
  "Fall"
];

// Exam types
export const examTypeList = [
  "Quiz",
  "Class Test",
  "Mid Term",
  "Final",
  "Lab Test",
  "Lab Mid Term",
  "Lab Final",
  "Assignment",
  "Presentation",
  "Project",
  "Viva",
  "Practical Exam",
  "Other"
];

// Teacher designations
export const teacherDesignationList = [
  "Professor",
  "Associate Professor",
  "Assistant Professor",
  "Senior Lecturer",
  "Lecturer",
  "Adjunct Faculty",
  "Visiting Faculty",
  "Instructor",
  "Research Professor",
  "Emeritus Professor"
];

// Make a list of years as text
function makeYearList(firstYear, lastYear) {
  const years = [];

  for (let year = firstYear; year <= lastYear; year++) {
    years.push(String(year));
  }

  return years;
}

export const yearList = makeYearList(2018, 2030);
