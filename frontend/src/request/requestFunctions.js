// Button text for a listing: Buy -> "Buy now", Rent -> "Take rent", Lend -> "Borrow"
export function getRequestButtonText(askingType) {
  if (askingType === "Buy") return "Buy now";
  if (askingType === "Rent") return "Take rent";
  return "Borrow";
}

// Same popup for books and equipment: only the id field differs
export function getListingId(listingType, listing) {
  return listingType === "book" ? listing.Listing_id : listing.Equipment_id;
}

export function isRequestFormValid(email, phone, quantity) {
  return /^\S+@\S+\.\S+$/.test(email.trim()) && phone.trim().length >= 7 && Number(quantity) >= 1;
}