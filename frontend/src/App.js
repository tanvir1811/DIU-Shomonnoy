import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./components/HomePage";
import { features, extraRoutes } from "./features";

// Shown for a feature whose page is not built yet
function ComingSoon({ feature }) {
  return (
    <div className="coming-soon">
      <span className="soon-badge">Coming soon</span>
      <h2>{feature.title}</h2>
      <p>{feature.description}</p>
      <Link to="/" className="btn">Back to home</Link>
    </div>
  );
}

// Decide which page to show for each web address.
// Routes come from features.js, so nothing to change here when you add a feature.
function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="page-container fade-in">
        <Routes>
          <Route path="/" element={<HomePage />} />
          {features.map((feature) => {
            const Page = feature.component;
            return (
              <Route
                key={feature.path}
                path={feature.path}
                element={Page ? <Page /> : <ComingSoon feature={feature} />}
              />
            );
          })}
          {extraRoutes.map((route) => {
            const Page = route.component;
            return <Route key={route.path} path={route.path} element={<Page />} />;
          })}
        </Routes>
      </main>
    </div>
  );
}

export default App;