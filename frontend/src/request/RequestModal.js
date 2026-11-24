import React, { useState } from "react";
import { sendRequest } from "./requestApi";
import { getRequestButtonText, getListingId, isRequestFormValid } from "./requestFunctions";

// Popup used by both the book page and the equipment page
// listingType is "book" or "equipment"
export function RequestModal({ listing, listingType, onClose }) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDone, setIsDone] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!isRequestFormValid(email, phone, quantity)) {
      setMessage("Please enter a valid email, phone number and quantity.");
      setIsError(true);
      return;
    }
    setIsSending(true);
    try {
      await sendRequest({
        listingType: listingType,
        listingId: getListingId(listingType, listing),
        email: email.trim(),
        phone: phone.trim(),
        quantity: Number(quantity),
      });
      setMessage("Request sent. A copy was emailed to you.");
      setIsError(false);
      setIsDone(true);
    } catch (error) {
      setMessage(error.message || "Could not send the request.");
      setIsError(true);
    }
    setIsSending(false);
  }

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <form className="form-box" onSubmit={handleSubmit} style={{ background: "#fff", maxWidth: "420px", width: "90%" }}>
        <h3>{getRequestButtonText(listing.Asking_Type)}: {listing.Title}</h3>
        <label>Your email</label>
        <input type="email" value={email} onChange={function (event) { setEmail(event.target.value); }} />
        <label>Phone number</label>
        <input value={phone} onChange={function (event) { setPhone(event.target.value); }} />
        <label>How many?</label>
        <input type="number" min="1" value={quantity} onChange={function (event) { setQuantity(event.target.value); }} />
        {message !== "" && <div className={isError ? "message-error" : "message-ok"}>{message}</div>}
        <br />
        {!isDone && <button className="btn btn-yellow" disabled={isSending}>{isSending ? "Sending..." : "Send request"}</button>}
        <button type="button" className="btn" onClick={onClose}>{isDone ? "Done" : "Close"}</button>
      </form>
    </div>
  );
}