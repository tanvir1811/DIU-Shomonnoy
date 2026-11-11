// ONE place that lists every feature of the site.
// The navbar, the home page tiles and the routes in App.js are all built from this file.
//
// FINISH A FEATURE:  import its page below and change  component: null  to  component: YourPage
// ADD A NEW FEATURE: copy one entry in "features", change the fields (and import its page)
// ADD A NEW MENU GROUP: add its name to "groups" and use it as the "group" of a feature

import CoverPageGenerator from "./coverPage/CoverPageGenerator";
import { NotesPage } from "./note/NotePage";
import { QuestionBankPage } from "./questionBank/QuestionBankPage";
import { FacultyPage } from "./faculty/FacultyPage";
import { DashboardPage, SignupPage, LoginPage, ProfilePage } from "./user/UserPage";
import { AdminLoginPage, AdminProfilePage, AdminDashboardPage } from "./admin/AdminPage";

// Menu groups, in the order they appear in the navbar
export const groups = ["Academic", "Marketplace", "Community"];

// component: null means the page is not built yet (shows "Coming soon")
// featured: true makes the home tile black
export const features = [
  {
    path: "/cover-page",
    group: "Academic",
    title: "Cover Page",
    description: "Fill in your course, teacher and marks, check the live preview, and download a ready PDF or image. Attach your report to get one merged file.",
    action: "Open cover page generator",
    featured: true,
    component: CoverPageGenerator,
  },
  {
    path: "/notes",
    group: "Academic",
    title: "Notes",
    description: "Search by course, filter by semester and year, and share your own.",
    action: "View notes",
    component: NotesPage,
  },
  {
    path: "/question-bank",
    group: "Academic",
    title: "Question Bank",
    description: "Midterm and final questions by department, with optional answer notes.",
    action: "Practice questions",
    component: QuestionBankPage,
  },
  {
    path: "/faculty",
    group: "Academic",
    title: "Faculty Info",
    description: "Find a teacher's designation, email and counseling hour before you walk to their room.",
    action: "Find a teacher",
    component: FacultyPage, // set to null to show "Coming soon" until you finish it
  },
  {
    path: "/books",
    group: "Marketplace",
    title: "Book Listing",
    description: "Buy, sell or swap textbooks by course, edition and condition.",
    action: "Browse books",
    component: null,
  },
  {
    path: "/equipment",
    group: "Marketplace",
    title: "Equipment",
    description: "Calculators, lab kits and drawing tools from other students at a fair price.",
    action: "Browse equipment",
    component: null,
  },
  {
    path: "/discussion",
    group: "Community",
    title: "Discussion",
    description: "Ask questions, start threads and help each other out.",
    action: "Join the discussion",
    component: null,
  },
  {
    path: "/events",
    group: "Community",
    title: "Events",
    description: "Seminars, contests and club events with organizer, place and details.",
    action: "See events",
    component: null,
  },
];

// Pages that are not in the menu groups (login, sign up, profile, dashboard, admin)
export const extraRoutes = [
  { path: "/signup", component: SignupPage },
  { path: "/login", component: LoginPage },
  { path: "/profile", component: ProfilePage },
  { path: "/dashboard", component: DashboardPage },
  { path: "/admin/login", component: AdminLoginPage },
  { path: "/admin/profile", component: AdminProfilePage },
  { path: "/admin/dashboard", component: AdminDashboardPage },
];