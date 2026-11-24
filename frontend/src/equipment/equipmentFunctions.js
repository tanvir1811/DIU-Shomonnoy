export const askingTypeList = ["Rent", "Buy", "Lend"];
export const conditionList = ["New", "Like New", "Good", "Fair", "Poor"];

// Keep only the equipment that matches the name/description search and asking type (empty = any)
export function filterEquipment(equipmentList, searchText, selectedAskingType) {
  const lowerSearchText = searchText.toLowerCase();
  return equipmentList.filter(function (item) {
    const titleMatches = String(item.Title || "").toLowerCase().includes(lowerSearchText);
    const descriptionMatches = String(item.Description || "").toLowerCase().includes(lowerSearchText);
    const typeMatches = selectedAskingType === "" || item.Asking_Type === selectedAskingType;
    return (titleMatches || descriptionMatches) && typeMatches;
  });
}

// Lend is free, so only Rent and Buy need a price
export function isPriceNeeded(askingType) {
  return askingType === "Rent" || askingType === "Buy";
}

export function isEquipmentFormValid(form) {
  if (form.Title.trim() === "") return false;
  if (form.Asking_Type === "" || form.Equipment_Condition === "") return false;
  if (isPriceNeeded(form.Asking_Type)) {
    const price = Number(form.Price);
    if (form.Price === "" || isNaN(price) || price < 0) return false;
  }
  return true;
}

export function getPriceText(item) {
  if (item.Asking_Type === "Lend" || item.Price === null) return "Free";
  return "৳ " + item.Price;
}

export function isEquipmentOwner(loggedInUser, item) {
  if (loggedInUser === null || loggedInUser.role === "admin") return false;
  const userId = loggedInUser.student_id || loggedInUser.id || loggedInUser.User_id;
  return String(userId) === String(item.Uploaded_by);
}

export function canDeleteEquipment(loggedInUser, item) {
  if (loggedInUser === null) return false;
  return loggedInUser.role === "admin" || isEquipmentOwner(loggedInUser, item);
}