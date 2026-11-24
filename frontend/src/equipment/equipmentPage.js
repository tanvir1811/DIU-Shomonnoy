import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getLoggedInUser, isBackendError } from "../user/userFunctions";
import { askingTypeList, conditionList, filterEquipment, isPriceNeeded, isEquipmentFormValid, getPriceText, isEquipmentOwner } from "./equipmentFunctions";
import { fetchAllEquipment, fetchMyEquipment, createEquipment, updateEquipment, deleteEquipment } from "./equipmentApi";
import { RequestModal } from "../request/RequestModal";
import { getRequestButtonText } from "../request/requestFunctions";

const emptyForm = { Title: "", Description: "", Asking_Type: "", Equipment_Condition: "", Price: "" };

// Equipment page: picture on top, details below, search by name, filter by Rent / Buy / Lend
export function EquipmentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const loggedInUser = getLoggedInUser();
  // The dashboard can open this page with the form already open ("Upload equipment")
  // or already showing only the user's own listings ("My equipment")
  const openFormFromDashboard = Boolean(location.state && location.state.openForm && loggedInUser !== null);
  const viewMineFromDashboard = Boolean(location.state && location.state.viewMine && loggedInUser !== null);

  const [equipmentList, setEquipmentList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedAskingType, setSelectedAskingType] = useState("");
  const [viewMode, setViewMode] = useState(viewMineFromDashboard ? "mine" : "all");
  const [isFormOpen, setIsFormOpen] = useState(openFormFromDashboard);
  const [editingId, setEditingId] = useState(null); // null = creating a new listing
  const [equipmentForm, setEquipmentForm] = useState(emptyForm);
  const [pictureFile, setPictureFile] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isStatusError, setIsStatusError] = useState(false);
  const [requestItem, setRequestItem] = useState(null); // equipment shown in the request popup

  // Load equipment when the page opens or when "All equipment / My listings" changes
  useEffect(function () {
    async function loadEquipment() {
      setIsLoading(true);
      try {
        setEquipmentList(viewMode === "mine" ? await fetchMyEquipment() : await fetchAllEquipment());
      } catch (error) {
        if (isBackendError(error)) {
          if (error.status === 401) {
            navigate("/login", { state: { message: error.message } });
            return;
          }
          setStatusMessage(error.message);
        } else {
          setStatusMessage("Could not load equipment. Please make sure the server is running.");
        }
        setIsStatusError(true);
        setEquipmentList([]);
      }
      setIsLoading(false);
    }
    loadEquipment();
  }, [viewMode]);

  function handleListClick() {
    if (getLoggedInUser() === null) {
      navigate("/login");
      return;
    }
    if (isFormOpen && editingId === null) {
      setIsFormOpen(false);
      return;
    }
    setEditingId(null);
    setEquipmentForm(emptyForm);
    setPictureFile(null);
    setIsFormOpen(true);
  }

  function handleEditClick(item) {
    setEditingId(item.Equipment_id);
    setEquipmentForm({
      Title: item.Title,
      Description: item.Description,
      Asking_Type: item.Asking_Type,
      Equipment_Condition: item.Equipment_Condition,
      Price: item.Price === null ? "" : String(item.Price),
    });
    setPictureFile(null);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleFormFieldChange(event) {
    const { name, value } = event.target;
    const updatedForm = { ...equipmentForm, [name]: value };
    if (name === "Asking_Type" && !isPriceNeeded(value)) updatedForm.Price = ""; // Lend = free
    setEquipmentForm(updatedForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!isEquipmentFormValid(equipmentForm)) {
      setStatusMessage("Please fill title, asking type, condition and a price (not needed for Lend).");
      setIsStatusError(true);
      return;
    }
    const formData = new FormData();
    formData.append("Title", equipmentForm.Title);
    formData.append("Description", equipmentForm.Description);
    formData.append("Asking_Type", equipmentForm.Asking_Type);
    formData.append("Equipment_Condition", equipmentForm.Equipment_Condition);
    if (isPriceNeeded(equipmentForm.Asking_Type)) formData.append("Price", equipmentForm.Price);
    if (pictureFile !== null) formData.append("picture", pictureFile);

    try {
      if (editingId === null) {
        const newItem = await createEquipment(formData);
        setEquipmentList([newItem, ...equipmentList]);
        setStatusMessage("Equipment listed.");
      } else {
        const savedItem = await updateEquipment(editingId, formData);
        setEquipmentList(equipmentList.map(function (item) { return item.Equipment_id === editingId ? savedItem : item; }));
        setStatusMessage("Listing updated.");
      }
      setIsStatusError(false);
      setIsFormOpen(false);
      setEditingId(null);
      setEquipmentForm(emptyForm);
      setPictureFile(null);
    } catch (error) {
      if (isBackendError(error)) {
        if (error.status === 401) {
          navigate("/login", { state: { message: error.message } });
          return;
        }
        setStatusMessage(error.message);
      } else {
        setStatusMessage("Could not save the listing. Please make sure the server is running.");
      }
      setIsStatusError(true);
    }
  }

  async function handleDeleteClick(item) {
    if (!window.confirm("Delete this listing?")) return;
    try {
      await deleteEquipment(item.Equipment_id);
      setEquipmentList(equipmentList.filter(function (other) { return other.Equipment_id !== item.Equipment_id; }));
      setStatusMessage("Listing deleted.");
      setIsStatusError(false);
    } catch (error) {
      if (isBackendError(error)) {
        if (error.status === 401) {
          navigate("/login", { state: { message: error.message } });
          return;
        }
        setStatusMessage(error.message);
      } else {
        setStatusMessage("Could not delete the listing.");
      }
      setIsStatusError(true);
    }
  }

  const visibleEquipment = filterEquipment(equipmentList, searchText, selectedAskingType);

  return (
    <div>
      <h2>Equipment</h2>
      <div className="toolbar">
        <input placeholder="Search equipment (e.g. Arduino, calculator)" value={searchText} onChange={function (event) { setSearchText(event.target.value); }} />
        {loggedInUser !== null && loggedInUser.role !== "admin" && (
          <select value={viewMode} onChange={function (event) { setViewMode(event.target.value); }}>
            <option value="all">All equipment</option>
            <option value="mine">My listings</option>
          </select>
        )}
        <select value={selectedAskingType} onChange={function (event) { setSelectedAskingType(event.target.value); }}>
          <option value="">Rent / Buy / Lend</option>
          {askingTypeList.map(function (askingType) {
            return <option key={askingType}>{askingType}</option>;
          })}
        </select>
        {(loggedInUser === null || loggedInUser.role !== "admin") && (
          <button className="btn btn-yellow" onClick={handleListClick}>List equipment</button>
        )}
      </div>
      {statusMessage !== "" && <div className={isStatusError ? "message-error" : "message-ok"}>{statusMessage}</div>}
      {isFormOpen && (
        <form className="form-box fade-in" onSubmit={handleSubmit}>
          <label>Equipment name</label>
          <input name="Title" placeholder="Arduino Uno R3" value={equipmentForm.Title} onChange={handleFormFieldChange} />
          <label>Asking type</label>
          <select name="Asking_Type" value={equipmentForm.Asking_Type} onChange={handleFormFieldChange}>
            <option value="">Choose Rent, Buy or Lend</option>
            {askingTypeList.map(function (askingType) {
              return <option key={askingType}>{askingType}</option>;
            })}
          </select>
          <label>Condition</label>
          <select name="Equipment_Condition" value={equipmentForm.Equipment_Condition} onChange={handleFormFieldChange}>
            <option value="">Choose condition</option>
            {conditionList.map(function (condition) {
              return <option key={condition}>{condition}</option>;
            })}
          </select>
          {isPriceNeeded(equipmentForm.Asking_Type) && (
            <>
              <label>Price (৳)</label>
              <input name="Price" type="number" min="0" value={equipmentForm.Price} onChange={handleFormFieldChange} />
            </>
          )}
          <label>Description</label>
          <textarea name="Description" placeholder="Model, what's included, how it was used" value={equipmentForm.Description} onChange={handleFormFieldChange} />
          <label>Picture {editingId !== null && "(leave empty to keep the current one)"}</label>
          <input type="file" accept="image/*" onChange={function (event) { setPictureFile(event.target.files[0] || null); }} />
          <br /><br />
          <button className="btn">{editingId === null ? "List equipment" : "Save changes"}</button>
        </form>
      )}
      {isLoading && <div className="spinner"></div>}
      {!isLoading && visibleEquipment.length === 0 && <p className="message-empty">No equipment found. Try another search or list one.</p>}
      <div className="grid">
        {visibleEquipment.map(function (item) {
          return (
            <div className="card equipment-card" key={item.Equipment_id}>
              {item.Picture_url !== "" ? (
                <img className="equipment-image" src={item.Picture_url} alt={item.Title} />
              ) : (
                <div className="equipment-image equipment-no-image">No picture</div>
              )}
              <h3>{item.Title}</h3>
              <span className="tag">{item.Asking_Type}</span> <span className="tag">{item.Equipment_Condition}</span>
              <p><strong>{getPriceText(item)}</strong></p>
              {item.Description !== "" && <p>{item.Description}</p>}
              <p className="muted">{item.created_at}</p>
              {isEquipmentOwner(loggedInUser, item) && (
                <button className="btn" onClick={function () { handleEditClick(item); }}>Edit</button>
              )}
              {isEquipmentOwner(loggedInUser, item) && (
                <button className="btn" onClick={function () { handleDeleteClick(item); }}>Delete</button>
              )}
              {(loggedInUser === null || loggedInUser.role !== "admin") && !isEquipmentOwner(loggedInUser, item) && (
                <button className="btn btn-yellow" onClick={function () { setRequestItem(item); }}>
                  {getRequestButtonText(item.Asking_Type)}
                </button>
              )}
            </div>
          );
        })}
      </div>
      {requestItem !== null && (
        <RequestModal listing={requestItem} listingType="equipment" onClose={function () { setRequestItem(null); }} />
      )}
    </div>
  );
}