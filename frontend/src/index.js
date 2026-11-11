import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import "./navbar-home.css"; // must stay AFTER index.css so it wins

// Start the React app and turn on page routing
const rootElement = ReactDOM.createRoot(document.getElementById("root"));
rootElement.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);