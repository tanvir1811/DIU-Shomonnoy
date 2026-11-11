import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { getLoggedInUser, logoutUser } from "../user/userFunctions";
import { groups, features } from "../features";

// Top menu bar: dropdown groups on desktop, a full-screen drawer on small screens.
// The menu is built from features.js, so nothing to change here when you add a feature.
function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState(null);
  const navRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation(); // makes the navbar refresh after every page change
  const loggedInUser = getLoggedInUser();
  const isAdmin = loggedInUser !== null && loggedInUser.role === "admin";

  // Close everything whenever the page changes
  useEffect(() => {
    setIsMenuOpen(false);
    setOpenGroup(null);
  }, [location.pathname]);

  // Close the dropdown on outside click or the Escape key
  useEffect(() => {
    function handleOutsideClick(event) {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setOpenGroup(null);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpenGroup(null);
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Stop the page behind the drawer from scrolling
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  function handleHamburgerClick() {
    setIsMenuOpen(!isMenuOpen);
    setOpenGroup(null);
  }

  function closeMenu() {
    setIsMenuOpen(false);
    setOpenGroup(null);
  }

  function handleGroupClick(group) {
    setOpenGroup(openGroup === group ? null : group);
  }

  function handleLogoutClick() {
    const wasAdmin = isAdmin;
    logoutUser();
    closeMenu();
    // an admin goes back to the admin login, a student goes to the home page
    navigate(wasAdmin ? "/admin/login" : "/");
  }

  // True when the current page belongs to this menu group
  function groupHasActivePage(group) {
    return features.some(
      (feature) => feature.group === group && location.pathname.startsWith(feature.path)
    );
  }

  // Black pill when the page is selected
  function authClass({ isActive }) {
    return isActive ? "auth-btn active" : "auth-btn";
  }

  return (
    <header className="navbar" ref={navRef}>
      <div className="navbar-inner">
        <Link to="/" className="logo" onClick={closeMenu}>
          <span className="logo-mark">D</span>
          <span className="logo-text">DIU Shomonnoy</span>
        </Link>

        <button
          className="hamburger"
          onClick={handleHamburgerClick}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
        >
          <span className={isMenuOpen ? "burger-icon open" : "burger-icon"} aria-hidden="true">
            <span></span><span></span><span></span>
          </span>
        </button>

        <nav className={isMenuOpen ? "nav-links open" : "nav-links"} aria-label="Main">
          <div className="nav-groups">
            {groups.map((group) => {
              let groupClass = "nav-group";
              if (openGroup === group) groupClass += " open";
              if (groupHasActivePage(group)) groupClass += " has-active";
              return (
                <div key={group} className={groupClass}>
                  <button
                    className="nav-group-btn"
                    onClick={() => handleGroupClick(group)}
                    aria-expanded={openGroup === group}
                  >
                    {group}
                    <span className="caret" aria-hidden="true"></span>
                  </button>
                  <div className="nav-dropdown">
                    {features
                      .filter((feature) => feature.group === group)
                      .map((feature) => (
                        <NavLink key={feature.path} to={feature.path} className="nav-item" onClick={closeMenu}>
                          <span className="nav-item-title">
                            {feature.title}
                            {!feature.component && <span className="soon-badge">Soon</span>}
                          </span>
                          <span className="nav-item-desc">{feature.description}</span>
                        </NavLink>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="nav-auth">
            {/* Not logged in: student login, sign up, and a separate admin login */}
            {loggedInUser === null && (
              <NavLink to="/login" className={authClass} onClick={closeMenu}>
                Login
              </NavLink>
            )}
            {loggedInUser === null && (
              <NavLink to="/signup" className={authClass} onClick={closeMenu}>
                Sign up
              </NavLink>
            )}
            {loggedInUser === null && (
              <NavLink to="/admin/login" className={authClass} onClick={closeMenu}>
                Admin
              </NavLink>
            )}

            {/* Logged in as a student */}
            {loggedInUser !== null && !isAdmin && (
              <NavLink to="/profile" className={authClass} onClick={closeMenu}>
                Profile
              </NavLink>
            )}

            {/* Logged in as an admin */}
            {isAdmin && (
              <NavLink to="/admin/dashboard" className={authClass} onClick={closeMenu}>
                Dashboard
              </NavLink>
            )}

            {loggedInUser !== null && (
              <button className="auth-btn" onClick={handleLogoutClick}>
                Logout
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;