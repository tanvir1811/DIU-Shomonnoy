import React, { useState, useEffect } from "react";
import "./coverpage.css";
import {
  maximumTeamMembers, coverPageWidth, coverPageHeight, getPreviewScale, levelList, criteriaList, coverTypeList,
  getEmptyCoverPageForm, getMarkValuesForCoverType, getCoverTitle,
  getSumOfRowMarks, addEmptyTeamMember, updateTeamMember, removeTeamMember,
  formatSubmissionDate, getScaleForResolution, getQualityForResolution,
  getFileNameStart, acceptedFileTypes, downloadCoverAsPdf, downloadCoverAsImage, downloadCoverWithAttachedFiles,
} from "./coverPageFunctions";

const designationList = ["Professor", "Associate Professor", "Assistant Professor", "Senior Lecturer", "Lecturer"];
const yearList = ["2025", "2026", "2027", "2028", "2029", "2030"];

// Cover page generator: form cards and a live cover page preview
function CoverPageGenerator() {
  const [coverForm, setCoverForm] = useState(getEmptyCoverPageForm());
  const [teamMemberList, setTeamMemberList] = useState([{ name: "", id: "" }]);
  const [markValues, setMarkValues] = useState(getMarkValuesForCoverType("Theory Assignment Report"));
  const [attachedFileList, setAttachedFileList] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [previewScale, setPreviewScale] = useState(1);

  // Shrink the preview to fit the screen, and update when the window size changes
  useEffect(function () {
    // Work out the preview size from the width of the blue area
    function updatePreviewScale() {
      const deskElement = document.getElementById("cp-desk");
      setPreviewScale(getPreviewScale(deskElement.clientWidth - 32));
    }
    updatePreviewScale();
    window.addEventListener("resize", updatePreviewScale);
    return function () {
      window.removeEventListener("resize", updatePreviewScale);
    };
  }, []);

  const isOtherCoverType = coverForm.coverType === "Other";
  const rowMarksSum = getSumOfRowMarks(markValues);
  const isTotalDifferent = markValues.total !== "" && rowMarksSum !== Number(markValues.total);

  // Update one form field while typing
  function handleFieldChange(event) {
    setCoverForm({ ...coverForm, [event.target.name]: event.target.value });
  }

  // Change the cover type and load its usual marks (except for "Other")
  function handleCoverTypeChange(event) {
    const newCoverType = event.target.value;
    setCoverForm({ ...coverForm, coverType: newCoverType });
    if (newCoverType !== "Other") {
      setMarkValues(getMarkValuesForCoverType(newCoverType));
    }
  }

  // Change one mark box (a row mark or the total mark)
  function handleMarkValueChange(markName, newValue) {
    setMarkValues({ ...markValues, [markName]: newValue });
  }

  // Change the name or id of one team member
  function handleTeamMemberChange(memberIndex, fieldName, newValue) {
    setTeamMemberList(updateTeamMember(teamMemberList, memberIndex, fieldName, newValue));
  }

  // Add one more empty team member row
  function handleAddTeamMemberClick() {
    setTeamMemberList(addEmptyTeamMember(teamMemberList));
  }

  // Remove one team member row
  function handleRemoveTeamMemberClick(memberIndex) {
    setTeamMemberList(removeTeamMember(teamMemberList, memberIndex));
  }

  // Keep the files the student picked
  function handleAttachedFileChange(event) {
    setAttachedFileList(Array.from(event.target.files));
  }

  // Download as pdf, image, or pdf merged with the attached files
  async function handleDownloadClick() {
    setErrorMessage("");
    setIsDownloading(true);
    const scale = getScaleForResolution(coverForm.resolution);
    const quality = getQualityForResolution(coverForm.resolution);
    const fileNameStart = getFileNameStart(coverForm, teamMemberList);
    try {
      if (coverForm.downloadFormat === "image") {
        await downloadCoverAsImage(scale, fileNameStart);
      } else if (attachedFileList.length > 0) {
        await downloadCoverWithAttachedFiles(scale, quality, attachedFileList, fileNameStart);
      } else {
        await downloadCoverAsPdf(scale, quality, fileNameStart);
      }
    } catch (error) {
      setErrorMessage(error.message || "Download failed. Check your attached files and try again.");
    }
    setIsDownloading(false);
  }

  // Show one line of the cover page (bold label and value)
  function renderCoverRow(labelText, valueText) {
    return (
      <div className="cp-row">
        <div className="cp-row-label">{labelText}</div>
        <div className="cp-row-value">{valueText}</div>
      </div>
    );
  }

  return (
    <div className="cover-generator">
      <h2 className="cp-title">Cover Page Generator</h2>
      <p className="cp-subtitle">Fill in the cards, watch the cover update below, then download it as a PDF or image.</p>

      <div className="cp-form-grid">
        <fieldset className="cp-field">
          <legend className="cp-legend">Cover Details</legend>
          <label>Cover type</label>
          <select name="coverType" value={coverForm.coverType} onChange={handleCoverTypeChange}>
            {coverTypeList.map(function (typeName) { return <option key={typeName}>{typeName}</option>; })}
            <option>Other</option>
          </select>
          {isOtherCoverType && (
            <div>
              <label>Write your cover type</label>
              <input name="customCoverType" placeholder="Example: Case Study Report" value={coverForm.customCoverType} onChange={handleFieldChange} />
            </div>
          )}
          <label>Submission date</label>
          <input type="date" name="submissionDate" value={coverForm.submissionDate} onChange={handleFieldChange} />
          <label>Semester</label>
          <div className="cp-two-columns">
            <select name="semesterName" value={coverForm.semesterName} onChange={handleFieldChange}>
              <option>Spring</option><option>Summer</option><option>Fall</option>
            </select>
            <select name="semesterYear" value={coverForm.semesterYear} onChange={handleFieldChange}>
              {yearList.map(function (year) { return <option key={year}>{year}</option>; })}
            </select>
          </div>
        </fieldset>

        <fieldset className="cp-field">
          <legend className="cp-legend">Student Information</legend>
          {!isOtherCoverType && (
            <div>
              <label>Student name</label>
              <input name="studentName" value={coverForm.studentName} onChange={handleFieldChange} />
              <label>Student ID</label>
              <input name="studentId" value={coverForm.studentId} onChange={handleFieldChange} />
            </div>
          )}
          <div className="cp-two-columns">
            <div>
              <label>Section</label>
              <input name="section" value={coverForm.section} onChange={handleFieldChange} />
            </div>
            <div>
              <label>Batch</label>
              <input name="batch" value={coverForm.batch} onChange={handleFieldChange} />
            </div>
          </div>
        </fieldset>

        {isOtherCoverType && (
          <fieldset className="cp-field">
            <legend className="cp-legend">Team Members</legend>
            {teamMemberList.map(function (member, memberIndex) {
              return (
                <div className="cp-member-row" key={memberIndex}>
                  <input placeholder="Name" value={member.name} onChange={function (event) { handleTeamMemberChange(memberIndex, "name", event.target.value); }} />
                  <input placeholder="Student ID" value={member.id} onChange={function (event) { handleTeamMemberChange(memberIndex, "id", event.target.value); }} />
                  <button type="button" className="cp-small-button" onClick={function () { handleRemoveTeamMemberClick(memberIndex); }}>X</button>
                </div>
              );
            })}
            {teamMemberList.length < maximumTeamMembers && (
              <button type="button" className="cp-small-button" onClick={handleAddTeamMemberClick}>+ Add member</button>
            )}
            <p className="cp-hint">Up to {maximumTeamMembers} members fit on the page.</p>
          </fieldset>
        )}

        <fieldset className="cp-field">
          <legend className="cp-legend">Course Details</legend>
          <label>Course name</label>
          <input name="courseName" value={coverForm.courseName} onChange={handleFieldChange} />
          <label>Course ID</label>
          <input name="courseId" value={coverForm.courseId} onChange={handleFieldChange} />
        </fieldset>

        <fieldset className="cp-field">
          <legend className="cp-legend">Teacher Info</legend>
          <label>Course teacher name</label>
          <input name="teacherName" value={coverForm.teacherName} onChange={handleFieldChange} />
          <label>Designation</label>
          <select name="designation" value={coverForm.designation} onChange={handleFieldChange}>
            {designationList.map(function (name) { return <option key={name}>{name}</option>; })}
          </select>
        </fieldset>

        <fieldset className="cp-field">
          <legend className="cp-legend">Marks</legend>
          <p className="cp-hint">Filled in for the cover type. Change any number you need.</p>
          <label>Total marks</label>
          <input type="number" min="0" step="0.5" value={markValues.total} onChange={function (event) { handleMarkValueChange("total", event.target.value); }} />
          <div className="cp-two-columns">
            {criteriaList.map(function (criteria) {
              return (
                <div key={criteria.key}>
                  <label>{criteria.label}</label>
                  <input type="number" min="0" step="0.5" value={markValues[criteria.key]} onChange={function (event) { handleMarkValueChange(criteria.key, event.target.value); }} />
                </div>
              );
            })}
          </div>
          {isTotalDifferent && <p className="cp-hint">The four rows add up to {rowMarksSum}, but total marks is {markValues.total}.</p>}
        </fieldset>

        <fieldset className="cp-field">
          <legend className="cp-legend">Download</legend>
          <div className="cp-two-columns">
            <div>
              <label>Format</label>
              <select name="downloadFormat" value={coverForm.downloadFormat} onChange={handleFieldChange}>
                <option value="pdf">Pdf</option>
                <option value="image">Image</option>
              </select>
            </div>
            <div>
              <label>Resolution</label>
              <select name="resolution" value={coverForm.resolution} onChange={handleFieldChange}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          {coverForm.downloadFormat === "pdf" && (
            <div>
              <label>Attach files (optional)</label>
              <input type="file" multiple accept={acceptedFileTypes} onChange={handleAttachedFileChange} />
              <p className="cp-hint">PDF, pictures and text/code files are put after the cover in the order you picked them. Save Word, Excel or PowerPoint as PDF first.</p>
            </div>
          )}
        </fieldset>
      </div>

      <div className="cp-preview-header">
        <h3>Live preview</h3>
        <button className="btn btn-yellow" onClick={handleDownloadClick} disabled={isDownloading}>
          {isDownloading ? "Preparing..." : "Download"}
        </button>
      </div>
      {errorMessage !== "" && <div className="message-error">{errorMessage}</div>}

      <div className="cp-desk" id="cp-desk">
        <div className="cp-paper-shadow" id="cp-paper" style={{ width: coverPageWidth * previewScale, height: coverPageHeight * previewScale }}>
          <div className="cp-scaler" id="cp-scaler" style={{ transform: "scale(" + previewScale + ")" }}>
          <div id="cover-page">
            <img src="/logo.jpeg" alt="DIU Logo" className="cp-logo" />
            <div className="cp-cover-name">{getCoverTitle(coverForm)}</div>

            <div className="cp-marks-area">
              <table className="cp-marks-table">
                <tbody>
                  <tr><th colSpan="7">Only for course Teacher</th></tr>
                  <tr>
                    <th colSpan="2"></th>
                    {levelList.map(function (level) { return <th key={level.percent}>{level.name}</th>; })}
                    <th>Total Mark</th>
                  </tr>
                  <tr>
                    <th colSpan="2">Allocate mark and Percentage</th>
                    {levelList.map(function (level) { return <th key={level.percent}>{level.percent}%</th>; })}
                    <th>{markValues.total}</th>
                  </tr>
                  {criteriaList.map(function (criteria) {
                    return (
                      <tr key={criteria.key}>
                        <th>{criteria.label}</th>
                        <th>{markValues[criteria.key]}</th>
                        <td></td><td></td><td></td><td></td><td></td>
                      </tr>
                    );
                  })}
                  <tr>
                    <th colSpan="6" className="cp-align-right">Total obtained mark</th>
                    <td></td>
                  </tr>
                  <tr><th>Comments</th><td colSpan="6"></td></tr>
                </tbody>
              </table>
            </div>

            {renderCoverRow("Semester:", coverForm.semesterName + "-" + coverForm.semesterYear)}
            {!isOtherCoverType && renderCoverRow("Student Name:", coverForm.studentName)}
            {!isOtherCoverType && renderCoverRow("Student ID:", coverForm.studentId)}
            {isOtherCoverType && (
              <div className="cp-team-area">
                <div className="cp-row-label">Team Members:</div>
                <table className="cp-team-table">
                  <tbody>
                    {teamMemberList.map(function (member, memberIndex) {
                      return (
                        <tr key={memberIndex}>
                          <td>{member.name}</td>
                          <td>{member.id}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="cp-row">
              <div className="cp-row-label">Batch:</div>
              <div className="cp-row-value cp-batch-value">{coverForm.batch}</div>
              <div className="cp-row-label">Section:</div>
              <div className="cp-row-value">{coverForm.section}</div>
            </div>
            {renderCoverRow("Course Code:", coverForm.courseId)}
            {renderCoverRow("Course Name:", coverForm.courseName)}
            {renderCoverRow("Course Teacher Name:", coverForm.teacherName)}
            {renderCoverRow("Designation:", coverForm.designation)}
            {renderCoverRow("Submission Date:", formatSubmissionDate(coverForm.submissionDate))}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CoverPageGenerator;