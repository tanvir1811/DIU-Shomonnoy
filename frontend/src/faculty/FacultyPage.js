import React, { useState, useEffect } from "react";
import { filterFaculty } from "./facultyFunctions";
import { fetchAllFaculty } from "./facultyApi";

// Faculty page: searchable cards with contact and counseling hour
export function FacultyPage() {
  const [facultyList, setFacultyList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Load faculty when the page opens
  useEffect(function () {
    async function loadFaculty() {
      try {
        setFacultyList(await fetchAllFaculty());
      } catch (error) {
        setFacultyList([]);
        setErrorMessage("Could not load faculty. Please make sure the server is running.");
      }
      setIsLoading(false);
    }
    loadFaculty();
  }, []);

  const visibleFaculty = filterFaculty(facultyList, searchText);

  return (
    <div>
      <h2>Faculty</h2>
      <div className="toolbar">
        <input placeholder="Search by name, department or designation" value={searchText} onChange={function (event) { setSearchText(event.target.value); }} />
      </div>
      {errorMessage !== "" && <div className="message-error">{errorMessage}</div>}
      {isLoading && <div className="spinner"></div>}
      {!isLoading && errorMessage === "" && visibleFaculty.length === 0 && <p className="message-empty">No faculty found for that search.</p>}
      {/* Card order follows the ERD: Name, Designation, Email, Department, Image, Counseling_Hour */}
      <div className="grid">
        {visibleFaculty.map(function (faculty) {
          return (
            <div className="card" key={faculty.Faculty_listing_id}>
              <img className="faculty-photo" src={faculty.Image} alt={faculty.Name} />
              <h3>{faculty.Name}</h3>
              <span className="tag">{faculty.Designation}</span>
              <p className="muted">{faculty.Email}</p>
              <span className="tag">{faculty.Department}</span>
              <p>Counseling: {faculty.Counseling_Hour}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}