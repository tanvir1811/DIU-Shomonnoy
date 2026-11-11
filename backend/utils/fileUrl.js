// Turn a stored path like "notes/abc.pdf" into a full link the frontend can open.
function makeFileUrl(req, storedPath) {
  if (!storedPath) return "";
  if (storedPath.startsWith("http")) return storedPath;
  return req.protocol + "://" + req.get("host") + "/uploads/" + storedPath;
}

module.exports = { makeFileUrl };
