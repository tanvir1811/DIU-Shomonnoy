import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { PDFDocument, StandardFonts } from "pdf-lib";

export const maximumTeamMembers = 5;
export const coverPageWidth = 794;
export const coverPageHeight = 1123;

// How much to shrink the preview so it fits the available width (never bigger than 1)
export function getPreviewScale(availableWidth) {
  const scale = availableWidth / coverPageWidth;
  if (scale > 1) {
    return 1;
  }
  if (scale < 0.2) {
    return 0.2;
  }
  return scale;
}

// In the copy used for the download, undo the shrinking so the file is full size
function resetPreviewSizeInClone(clonedDocument) {
  clonedDocument.getElementById("cp-desk").style.overflow = "visible";
  const paperElement = clonedDocument.getElementById("cp-paper");
  paperElement.style.width = "auto";
  paperElement.style.height = "auto";
  paperElement.style.overflow = "visible";
  paperElement.style.boxShadow = "none";
  clonedDocument.getElementById("cp-scaler").style.transform = "none";
}

// The four mark columns of the table
export const levelList = [
  { name: "Needs Improvement", percent: 25 },
  { name: "Developing", percent: 50 },
  { name: "Sufficient", percent: 75 },
  { name: "Above Average", percent: 100 },
];

// The four rows of the table
export const criteriaList = [
  { key: "clarity", label: "Clarity" },
  { key: "content", label: "Content Quality" },
  { key: "spelling", label: "Spelling & Grammar" },
  { key: "organization", label: "Organization and Formating" },
];

export const coverTypeList = [
  "Theory Assignment Report", "Lab Assignment Report", "Lab Evaluation Report",
  "Lab Report", "Lab Final",
];

// Starting (empty) values for the whole cover page form
export function getEmptyCoverPageForm() {
  return {
    coverType: "Theory Assignment Report", customCoverType: "",
    studentName: "", studentId: "", section: "", batch: "",
    semesterName: "Spring", semesterYear: "2026",
    courseName: "", courseId: "",
    teacherName: "", designation: "Lecturer",
    submissionDate: "",
    downloadFormat: "pdf", resolution: "normal",
  };
}

// Marks for a cover type as text, ready to put into the input boxes
export function getMarkValuesForCoverType(coverType) {
  const distribution = getMarkDistribution(coverType);
  return {
    clarity: String(distribution.clarity),
    content: String(distribution.content),
    spelling: String(distribution.spelling),
    organization: String(distribution.organization),
    total: String(distribution.total),
  };
}

// The title written on the cover (the typed one when "Other" is chosen)
export function getCoverTitle(coverForm) {
  if (coverForm.coverType === "Other") {
    return coverForm.customCoverType;
  }
  return coverForm.coverType;
}

// Add the four row marks together
export function getSumOfRowMarks(markValues) {
  let sum = 0;
  criteriaList.forEach(function (criteria) {
    sum = sum + Number(markValues[criteria.key]);
  });
  return Number(sum.toFixed(2));
}

// Maximum marks of each row for a cover type (change the numbers here if needed)
export function getMarkDistribution(coverType) {
  if (coverType === "Theory Assignment Report") {
    return { clarity: 1, content: 2, spelling: 1, organization: 1, total: 5 };
  }
  if (coverType === "Lab Assignment Report") {
    return { clarity: 2, content: 4, spelling: 2, organization: 2, total: 10 };
  }
  if (coverType === "Lab Final") {
    return { clarity: 10, content: 15, spelling: 10, organization: 5, total: 40 };
  }
  return { clarity: 3, content: 4, spelling: 8, organization: 10, total: 25 };
}

// Return a new team list with one more empty member
export function addEmptyTeamMember(teamMemberList) {
  return [...teamMemberList, { name: "", id: "" }];
}

// Return a new team list where one member's name or id is changed
export function updateTeamMember(teamMemberList, memberIndex, fieldName, newValue) {
  return teamMemberList.map(function (member, index) {
    if (index === memberIndex) {
      return { ...member, [fieldName]: newValue };
    }
    return member;
  });
}

// Return a new team list without one member
export function removeTeamMember(teamMemberList, memberIndex) {
  return teamMemberList.filter(function (member, index) {
    return index !== memberIndex;
  });
}

// Turn a date like 2026-03-10 into "10 March 2026"
export function formatSubmissionDate(dateText) {
  if (dateText === "") {
    return "";
  }
  return new Date(dateText).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

// Pick the picture sharpness for the chosen resolution
export function getScaleForResolution(resolution) {
  if (resolution === "high") { return 4; }
  if (resolution === "normal") { return 3; }
  return 2;
}

// Pick the JPEG quality for the chosen resolution
export function getQualityForResolution(resolution) {
  if (resolution === "high") { return 0.95; }
  if (resolution === "normal") { return 0.85; }
  return 0.6;
}

// Make the start of the download file name (student id, or first team member id when "Other" is chosen)
export function getFileNameStart(coverForm, teamMemberList) {
  if (coverForm.coverType === "Other" && teamMemberList.length > 0 && teamMemberList[0].id !== "") {
    return teamMemberList[0].id;
  }
  if (coverForm.studentId !== "") {
    return coverForm.studentId;
  }
  return "Student";
}

// Take a picture of the cover page element
async function captureCoverAsCanvas(scale) {
  const coverElement = document.getElementById("cover-page");
  return html2canvas(coverElement, { scale: scale, useCORS: true, logging: false, backgroundColor: "#ffffff", onclone: resetPreviewSizeInClone });
}

// Put the cover picture on a single A4 pdf page
function makeCoverPdf(canvas, quality) {
  const imageData = canvas.toDataURL("image/jpeg", quality);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const imageProperties = pdf.getImageProperties(imageData);
  const pdfHeight = (imageProperties.height * pdfWidth) / imageProperties.width;
  pdf.addImage(imageData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
  return pdf;
}

// Save a blob as a file on the computer
function saveBlobAsFile(blob, fileName) {
  const linkElement = document.createElement("a");
  linkElement.href = URL.createObjectURL(blob);
  linkElement.download = fileName;
  linkElement.click();
}

// Download the cover page as a pdf
export async function downloadCoverAsPdf(scale, quality, fileNameStart) {
  const canvas = await captureCoverAsCanvas(scale);
  const pdf = makeCoverPdf(canvas, quality);
  pdf.save(fileNameStart + "_Cover_Page.pdf");
}

// Download the cover page as a png image
export async function downloadCoverAsImage(scale, fileNameStart) {
  const canvas = await captureCoverAsCanvas(scale);
  const linkElement = document.createElement("a");
  linkElement.download = fileNameStart + "_Cover_Page.png";
  linkElement.href = canvas.toDataURL("image/png");
  linkElement.click();
}

const pageWidth = 595.28;
const pageHeight = 841.89;
const pageMargin = 40;
const textFileExtensionList = ["txt", "md", "csv", "json", "js", "jsx", "py", "java", "c", "cpp", "html", "css", "xml", "log", "sql"];

// The file types the file picker should offer
export const acceptedFileTypes = "application/pdf,image/*," + textFileExtensionList.map(function (extension) { return "." + extension; }).join(",");

// Get the ending of a file name, like "pdf" or "png"
function getFileExtension(fileName) {
  const nameParts = fileName.toLowerCase().split(".");
  return nameParts[nameParts.length - 1];
}

// True when the file is a pdf
function isPdfFile(file) {
  return file.type === "application/pdf" || getFileExtension(file.name) === "pdf";
}

// True when the file is a picture
function isImageFile(file) {
  return file.type.startsWith("image/");
}

// True when the file is plain text or code
function isTextFile(file) {
  return file.type.startsWith("text/") || textFileExtensionList.includes(getFileExtension(file.name));
}

// Add every page of a pdf file to the merged pdf
async function addPdfFileToPdf(mergedPdf, file) {
  const attachedPdf = await PDFDocument.load(await file.arrayBuffer());
  const copiedPages = await mergedPdf.copyPages(attachedPdf, attachedPdf.getPageIndices());
  copiedPages.forEach(function (page) { mergedPdf.addPage(page); });
}

// Turn any picture type (webp, gif, bmp...) into png bytes
async function convertImageToPngBytes(file) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext("2d").drawImage(bitmap, 0, 0);
  const pngBlob = await new Promise(function (resolve) { canvas.toBlob(resolve, "image/png"); });
  return pngBlob.arrayBuffer();
}

// Put one picture on its own page, centered and fitted
async function addImageFileToPdf(mergedPdf, file) {
  let embeddedImage;
  if (file.type === "image/jpeg") {
    embeddedImage = await mergedPdf.embedJpg(await file.arrayBuffer());
  } else if (file.type === "image/png") {
    embeddedImage = await mergedPdf.embedPng(await file.arrayBuffer());
  } else {
    embeddedImage = await mergedPdf.embedPng(await convertImageToPngBytes(file));
  }
  const page = mergedPdf.addPage([pageWidth, pageHeight]);
  const fitScale = Math.min((pageWidth - 2 * pageMargin) / embeddedImage.width, (pageHeight - 2 * pageMargin) / embeddedImage.height, 1);
  const imageWidth = embeddedImage.width * fitScale;
  const imageHeight = embeddedImage.height * fitScale;
  page.drawImage(embeddedImage, { x: (pageWidth - imageWidth) / 2, y: (pageHeight - imageHeight) / 2, width: imageWidth, height: imageHeight });
}

// Keep only letters the pdf font can draw
function cleanTextForPdf(text) {
  return text.replace(/\r/g, "").replace(/\t/g, "    ").replace(/[^\x20-\x7E\n]/g, "?");
}

// Cut one long line into several lines that fit the page width
function wrapOneLine(line, font, fontSize, maximumWidth) {
  const wrappedLines = [];
  let currentLine = "";
  for (const character of line) {
    if (font.widthOfTextAtSize(currentLine + character, fontSize) > maximumWidth) {
      wrappedLines.push(currentLine);
      currentLine = character;
    } else {
      currentLine = currentLine + character;
    }
  }
  wrappedLines.push(currentLine);
  return wrappedLines;
}

// Write a text or code file onto as many pages as it needs
async function addTextFileToPdf(mergedPdf, file) {
  const fontSize = 10;
  const lineHeight = 13;
  const font = await mergedPdf.embedFont(StandardFonts.Courier);
  const originalLines = cleanTextForPdf(await file.text()).split("\n");
  let page = mergedPdf.addPage([pageWidth, pageHeight]);
  let currentY = pageHeight - pageMargin - fontSize;
  for (const originalLine of originalLines) {
    const wrappedLines = wrapOneLine(originalLine, font, fontSize, pageWidth - 2 * pageMargin);
    for (const oneLine of wrappedLines) {
      if (currentY < pageMargin) {
        page = mergedPdf.addPage([pageWidth, pageHeight]);
        currentY = pageHeight - pageMargin - fontSize;
      }
      page.drawText(oneLine, { x: pageMargin, y: currentY, size: fontSize, font: font });
      currentY = currentY - lineHeight;
    }
  }
}

// Add one attached file (pdf, picture or text) to the merged pdf
async function addAttachedFileToPdf(mergedPdf, file) {
  if (isPdfFile(file)) {
    await addPdfFileToPdf(mergedPdf, file);
  } else if (isImageFile(file)) {
    await addImageFileToPdf(mergedPdf, file);
  } else if (isTextFile(file)) {
    await addTextFileToPdf(mergedPdf, file);
  } else {
    throw new Error('"' + file.name + '" cannot be turned into a pdf here. Save Word, Excel or PowerPoint files as PDF first.');
  }
}

// Download one pdf: the cover page first, then every attached file in order
export async function downloadCoverWithAttachedFiles(scale, quality, attachedFileList, fileNameStart) {
  const canvas = await captureCoverAsCanvas(scale);
  const coverBytes = makeCoverPdf(canvas, quality).output("arraybuffer");
  const mergedPdf = await PDFDocument.create();
  const coverPdf = await PDFDocument.load(coverBytes);
  const coverPages = await mergedPdf.copyPages(coverPdf, coverPdf.getPageIndices());
  coverPages.forEach(function (page) { mergedPdf.addPage(page); });
  for (const attachedFile of attachedFileList) {
    await addAttachedFileToPdf(mergedPdf, attachedFile);
  }
  const mergedBytes = await mergedPdf.save({ useObjectStreams: true });
  saveBlobAsFile(new Blob([mergedBytes], { type: "application/pdf" }), fileNameStart + ".pdf");
}