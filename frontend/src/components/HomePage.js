import React from "react";
import { Link } from "react-router-dom";
import { groups, features } from "../features";
import { getLoggedInUser } from "../user/userFunctions";

// Short line under each section heading (optional: a group without one just has no line)
const groupBlurbs = {
  Academic: "Everything you need for classes, assignments and exams.",
  Marketplace: "Buy, sell and swap with other DIU students.",
  Community: "Talk, ask questions and find out what is happening on campus.",
};

// Home page: hero, then one section per menu group with a tile for every feature in features.js
function HomePage() {
  const loggedInUser = getLoggedInUser();

  return (
    <div className="home">
      <section className="home-hero">
        <div className="home-hero-text">
          <span className="eyebrow">Student resource hub for DIU</span>
          <h1>
            Everything for your DIU semester, <mark>in one place</mark>.
          </h1>
          <p>
            Make assignment cover pages, download notes and past questions, trade books and
            equipment, join discussions and find out when your teachers are free to talk.
          </p>
          <div className="home-hero-buttons">
            <Link to="/cover-page" className="btn">Make a cover page</Link>
            <Link to="/notes" className="btn btn-light">Browse notes</Link>
          </div>
          <ul className="hero-points">
            <li>Cover pages in minutes</li>
            <li>Notes and past questions</li>
            <li>Teacher counseling hours</li>
          </ul>
        </div>
        <div className="paper-mock" aria-hidden="true">
          <div className="paper-logo"></div>
          <div className="paper-title"></div>
          <div className="paper-table">
            <span></span><span></span><span></span><span></span>
            <span></span><span></span><span></span><span></span>
            <span></span><span></span><span></span><span></span>
          </div>
          <div className="paper-line wide"></div>
          <div className="paper-line"></div>
          <div className="paper-line short"></div>
        </div>
      </section>

      {groups.map((group) => (
        <section className="home-section" key={group}>
          <div className="section-head">
            <h2>{group}</h2>
            {groupBlurbs[group] && <p>{groupBlurbs[group]}</p>}
          </div>
          <div className="bento">
            {features
              .filter((feature) => feature.group === group)
              .map((feature) => {
                let tileClass = "bento-tile";
                if (feature.featured) tileClass += " tile-featured";
                if (!feature.component) tileClass += " tile-soon";
                return (
                  <Link key={feature.path} to={feature.path} className={tileClass}>
                    <span className={"tile-icon icon-" + group.toLowerCase()} aria-hidden="true">
                      {feature.title.charAt(0)}
                    </span>
                    {!feature.component && <span className="soon-badge tile-badge">Soon</span>}
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                    <span className="tile-action">{feature.action}</span>
                  </Link>
                );
              })}
          </div>
        </section>
      ))}

      {loggedInUser === null && (
        <section className="home-cta">
          <div>
            <h2>Join DIU Shomonnoy</h2>
            <p>Create a free account to upload notes, list books and save what you need.</p>
          </div>
          <div className="home-cta-buttons">
            <Link to="/signup" className="btn btn-yellow">Sign up</Link>
            <Link to="/login" className="btn btn-outline-light">Login</Link>
          </div>
        </section>
      )}
    </div>
  );
}

export default HomePage;