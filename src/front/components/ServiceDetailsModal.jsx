import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Gauge,
  Pencil,
  Phone,
  UserRound,
  Wrench,
} from "lucide-react";

import { apiFetch } from "../services/api";
import { BACKEND_URL } from "../config";
const STATUS_LABELS = {
  pending: "Pending",
  diagnosis: "Diagnosis",
  budget_pending: "Budget pending",
  waiting_parts: "Waiting parts",
  in_repair: "In repair",
  ready_to_deliver: "Ready to deliver",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const PRIORITY_LABELS = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

const COMMENT_TYPE_OPTIONS = [
  { value: "note", label: "Note" },
  { value: "status_update", label: "Status update" },
  { value: "admin_alert", label: "Admin alert" },
];

const COMMENT_TYPE_LABELS = {
  note: "Note",
  status_update: "Status update",
  admin_alert: "Admin alert",
};

function formatDate(dateValue) {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(dateValue) {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getMechanicName(mechanic) {
  const fullName = `${mechanic.first_name || ""} ${
    mechanic.last_name || ""
  }`.trim();

  return (
    mechanic.name ||
    fullName ||
    mechanic.email ||
    `Mechanic #${mechanic.id}`
  );
}

function getVehicleName(service) {
  const vehicleName = `${service?.vehicle_brand || ""} ${
    service?.vehicle_model || ""
  }`.trim();

  return vehicleName || "Unknown vehicle";
}

function formatServiceType(value) {
  if (!value) return "—";

  return value
    .replaceAll("_", " ")
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

export function ServiceDetailsModal({
  serviceId,
  role = "admin",
  onClose,
  onServiceUpdated,
}) {
  const fileInputRef = useRef(null);

  const [service, setService] = useState(null);
  const [comments, setComments] = useState([]);

  const [commentText, setCommentText] = useState("");
  const [commentType, setCommentType] = useState("note");
  const [commentImage, setCommentImage] = useState(null);
  const [commentImagePreview, setCommentImagePreview] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingComment, setSavingComment] = useState(false);

  const [showMechanicMenu, setShowMechanicMenu] = useState(false);
  const [availableMechanics, setAvailableMechanics] = useState([]);
  const [loadingMechanics, setLoadingMechanics] = useState(false);
  const [reassigningMechanic, setReassigningMechanic] = useState(false);

  const isAdmin = role === "admin";

  async function loadDetails() {
    try {
      setLoading(true);
      setError("");

      const [serviceData, commentsData] = await Promise.all([
        apiFetch(`/services/${serviceId}`),
        apiFetch(`/services/${serviceId}/comments`),
      ]);

      setService(serviceData.service || serviceData);
      setComments(commentsData.comments || []);
    } catch (error) {
      setError(error.message || "Could not load service details.");
    } finally {
      setLoading(false);
    }
  }

  async function loadMechanics() {
    try {
      setLoadingMechanics(true);
      setError("");

      const data = await apiFetch("/mechanics");

      setAvailableMechanics(data.mechanics || []);
    } catch (error) {
      setError(error.message || "Could not load mechanics.");
    } finally {
      setLoadingMechanics(false);
    }
  }

  async function handleToggleMechanicMenu() {
    const shouldOpenMenu = !showMechanicMenu;

    setShowMechanicMenu(shouldOpenMenu);

    if (shouldOpenMenu && availableMechanics.length === 0) {
      await loadMechanics();
    }
  }

  async function handleReassignMechanic(mechanicId) {
    try {
      setReassigningMechanic(true);
      setError("");

      const data = await apiFetch(`/services/${serviceId}`, {
        method: "PUT",
        body: {
          employee_id: mechanicId,
        },
      });

      setService(data.service || data);
      setShowMechanicMenu(false);

      await loadDetails();

      if (onServiceUpdated) {
        await onServiceUpdated();
      }
    } catch (error) {
      setError(error.message || "Could not reassign mechanic.");
    } finally {
      setReassigningMechanic(false);
    }
  }

  useEffect(() => {
    loadDetails();
  }, [serviceId]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (commentImagePreview) {
        URL.revokeObjectURL(commentImagePreview);
      }
    };
  }, [commentImagePreview]);

  function handleCommentImageChange(event) {
    const selectedImage = event.target.files[0];

    if (commentImagePreview) {
      URL.revokeObjectURL(commentImagePreview);
    }

    if (!selectedImage) {
      setCommentImage(null);
      setCommentImagePreview("");
      return;
    }

    setCommentImage(selectedImage);
    setCommentImagePreview(URL.createObjectURL(selectedImage));
  }

  async function handleSubmitComment(event) {
    event.preventDefault();

    if (!commentText.trim()) {
      setError("Please write a comment before saving.");
      return;
    }

    try {
      setSavingComment(true);
      setError("");

      const token = localStorage.getItem("token");

      const formData = new FormData();

      formData.append("comment", commentText.trim());
      formData.append("comment_type", commentType);

      if (commentImage) {
        formData.append("image", commentImage);
      }

      const response = await fetch(
        `${BACKEND_URL}/api/services/${serviceId}/comments`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Could not save comment."
        );
      }

      setCommentText("");
      setCommentType("note");
      setCommentImage(null);

      if (commentImagePreview) {
        URL.revokeObjectURL(commentImagePreview);
      }

      setCommentImagePreview("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await loadDetails();

      if (onServiceUpdated) {
        await onServiceUpdated();
      }
    } catch (error) {
      setError(error.message || "Could not save comment.");
    } finally {
      setSavingComment(false);
    }
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  const customerPhone =
    service?.customer_phone ||
    service?.customer?.phone ||
    service?.customer?.phone_number ||
    "";

  return (
    <>
      <div
        className="modal show d-block"
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        onMouseDown={handleBackdropClick}
      >
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
            <div className="modal-header bg-dark border-0 px-4 py-3">
              <h2 className="h6 text-warning fw-bold text-uppercase mb-0">
                Service details
              </h2>

              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
                aria-label="Close"
              />
            </div>

            <div className="modal-body p-0">
              {error && (
                <div className="px-4 pt-4">
                  <div className="alert alert-warning rounded-3 mb-0">
                    {error}
                  </div>
                </div>
              )}

              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-warning mb-3" />

                  <p className="text-muted mb-0">
                    Loading service details...
                  </p>
                </div>
              ) : !service ? (
                <div className="p-4">
                  <div className="alert alert-info mb-0">
                    Service not found.
                  </div>
                </div>
              ) : (
                <div className="px-4 py-4">
                  <section className="mb-4">
                    <h3 className="h4 fw-bold mb-1">
                      {service.title || "Service"}
                    </h3>

                    <p className="text-secondary mb-0">
                      {getVehicleName(service)}
                      {service.vehicle_plate
                        ? ` · ${service.vehicle_plate}`
                        : ""}
                    </p>
                  </section>

                  <section className="mb-4">
                    <p className="text-secondary text-uppercase small fw-bold mb-2">
                      Work notes
                    </p>

                    <div className="border-start border-3 border-warning ps-3">
                      <p className="fw-semibold mb-2">
                        {service.description ||
                          "No description provided for this service."}
                      </p>

                      {service.observations && (
                        <p className="text-secondary small mb-0">
                          {service.observations}
                        </p>
                      )}
                    </div>
                  </section>

                  <section className="row g-0 border-top border-bottom py-3 mb-4">
                    <div className="col-sm-4 pe-sm-4">
                      <p className="text-secondary text-uppercase small fw-bold mb-1">
                        Status
                      </p>

                      <p className="fw-bold mb-0">
                        {STATUS_LABELS[service.status] || service.status}
                      </p>
                    </div>

                    <div className="col-sm-4 px-sm-4 border-start border-warning">
                      <p className="text-secondary text-uppercase small fw-bold mb-1">
                        Priority
                      </p>

                      <p className="fw-bold mb-0">
                        {PRIORITY_LABELS[service.priority] ||
                          service.priority ||
                          "Normal"}
                      </p>
                    </div>

                    <div className="col-sm-4 ps-sm-4 border-start border-warning">
                      <p className="text-secondary text-uppercase small fw-bold mb-1">
                        Service type
                      </p>

                      <p className="fw-bold mb-0">
                        {formatServiceType(service.service_type)}
                      </p>
                    </div>
                  </section>

                  <section className="mb-4">
                    <div className="row g-4">
                      <div className="col-md-6">
                        <div className="d-flex gap-3">
                          <div
                            className="bg-warning-subtle rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{
                              width: "42px",
                              height: "42px",
                            }}
                          >
                            <UserRound size={18} className="text-warning" />
                          </div>

                          <div>
                            <p className="text-secondary small fw-bold mb-1">
                              Customer
                            </p>

                            <p className="fw-semibold mb-1">
                              {service.customer_name || "Unknown customer"}
                            </p>

                            {customerPhone ? (
                              <a
                                href={`tel:${customerPhone}`}
                                className="d-inline-flex align-items-center gap-2 text-dark text-decoration-none small fw-semibold"
                              >
                                <Phone size={14} className="text-warning" />

                                {customerPhone}
                              </a>
                            ) : (
                              <span className="small text-secondary">
                                No phone available
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="d-flex gap-3">
                          <div
                            className="bg-warning-subtle rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{
                              width: "42px",
                              height: "42px",
                            }}
                          >
                            <Wrench size={18} className="text-warning" />
                          </div>

                          <div className="flex-grow-1">
                            <p className="text-secondary small fw-bold mb-1">
                              Mechanic
                            </p>

                            <div className="d-flex align-items-center justify-content-between gap-3">
                              <p
                                className={`fw-semibold mb-0 ${
                                  service.employee_name
                                    ? "text-success"
                                    : "text-danger"
                                }`}
                              >
                                {service.employee_name || "Unassigned"}
                              </p>

                              {isAdmin && (
                                <div className="dropdown">
                                  <button
                                    type="button"
                                    className="btn btn-warning btn-sm d-inline-flex align-items-center gap-2 fw-semibold px-3"
                                    title="Change mechanic"
                                    aria-label="Change mechanic"
                                    onClick={handleToggleMechanicMenu}
                                    disabled={
                                      loadingMechanics ||
                                      reassigningMechanic
                                    }
                                  >
                                    <Pencil size={13} />
                                    Edit
                                  </button>

                                  {showMechanicMenu && (
                                    <ul className="dropdown-menu dropdown-menu-end show shadow-sm">
                                      {loadingMechanics ? (
                                        <li>
                                          <span className="dropdown-item text-muted">
                                            Loading mechanics...
                                          </span>
                                        </li>
                                      ) : availableMechanics.length === 0 ? (
                                        <li>
                                          <span className="dropdown-item text-muted">
                                            No mechanics available
                                          </span>
                                        </li>
                                      ) : (
                                        availableMechanics.map((mechanic) => {
                                          const isCurrentMechanic =
                                            Number(service.employee_id) ===
                                            Number(mechanic.id);

                                          return (
                                            <li key={mechanic.id}>
                                              <button
                                                type="button"
                                                className="dropdown-item"
                                                disabled={
                                                  reassigningMechanic ||
                                                  isCurrentMechanic
                                                }
                                                onClick={() =>
                                                  handleReassignMechanic(
                                                    mechanic.id
                                                  )
                                                }
                                              >
                                                {getMechanicName(mechanic)}

                                                {isCurrentMechanic
                                                  ? " (current)"
                                                  : ""}
                                              </button>
                                            </li>
                                          );
                                        })
                                      )}
                                    </ul>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="border-top pt-4 mb-4">
                    <div className="row g-4">
                      <div className="col-md-6">
                        <div className="d-flex gap-3">
                          <CalendarDays
                            size={18}
                            className="text-warning mt-1"
                          />

                          <div>
                            <p className="text-secondary small fw-bold mb-1">
                              Entry date
                            </p>

                            <p className="fw-semibold mb-0">
                              {formatDate(service.start_date)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="d-flex gap-3">
                          <Gauge
                            size={18}
                            className="text-warning mt-1"
                          />

                          <div>
                            <p className="text-secondary small fw-bold mb-1">
                              Entry mileage
                            </p>

                            <p className="fw-semibold mb-0">
                              {service.entry_mileage
                                ? `${service.entry_mileage} km`
                                : "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="border-top pt-4 mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="fw-bold mb-0">
                        Comments
                      </h5>

                      <span className="badge rounded-pill bg-warning-subtle text-dark border border-warning-subtle">
                        {comments.length}
                      </span>
                    </div>

                    {comments.length === 0 ? (
                      <div className="bg-light rounded-3 px-3 py-4 text-center">
                        <p className="text-secondary small mb-0">
                          No comments have been added yet.
                        </p>
                      </div>
                    ) : (
                      <div className="d-flex flex-column gap-3">
                        {comments.map((comment) => (
                          <article
                            key={comment.id}
                            className="border rounded-3 p-3 bg-white"
                          >
                            <div className="d-flex justify-content-between align-items-start gap-3">
                              <div>
                                <p className="fw-bold mb-1">
                                  {comment.author_name || "Unknown author"}
                                </p>

                                <span className="badge bg-light text-secondary border fw-semibold">
                                  {COMMENT_TYPE_LABELS[
                                    comment.comment_type
                                  ] ||
                                    comment.comment_type ||
                                    "Note"}
                                </span>
                              </div>

                              <span className="text-secondary small text-nowrap">
                                {formatDateTime(comment.created_at)}
                              </span>
                            </div>

                            <p className="mb-0 mt-3">
                              {comment.comment}
                            </p>

                            {comment.image_url && (
                              <img
                                src={comment.image_url}
                                alt="Service comment"
                                className="img-fluid rounded-3 border mt-3"
                                style={{
                                  maxHeight: "260px",
                                  objectFit: "cover",
                                }}
                              />
                            )}
                          </article>
                        ))}
                      </div>
                    )}
                  </section>

                  <form onSubmit={handleSubmitComment}>
                    <div className="bg-light border rounded-4 p-4">
                      <h5 className="fw-bold mb-3">
                        Add comment
                      </h5>

                      <div className="mb-3">
                        <label className="form-label small fw-bold">
                          Comment type
                        </label>

                        <select
                          className="form-select"
                          value={commentType}
                          onChange={(event) =>
                            setCommentType(event.target.value)
                          }
                          disabled={savingComment}
                        >
                          {COMMENT_TYPE_OPTIONS.map((type) => (
                            <option
                              key={type.value}
                              value={type.value}
                            >
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mb-3">
                        <label className="form-label small fw-bold">
                          Comment
                        </label>

                        <textarea
                          className="form-control"
                          rows="3"
                          placeholder="Write an update about this service..."
                          value={commentText}
                          onChange={(event) =>
                            setCommentText(event.target.value)
                          }
                          disabled={savingComment}
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label small fw-bold">
                          Add image
                        </label>

                        <input
                          ref={fileInputRef}
                          type="file"
                          className="form-control"
                          accept="image/*"
                          onChange={handleCommentImageChange}
                          disabled={savingComment}
                        />
                      </div>

                      {commentImagePreview && (
                        <div className="mb-3">
                          <img
                            src={commentImagePreview}
                            alt="Selected service comment"
                            className="img-fluid rounded-3 border"
                            style={{
                              maxHeight: "220px",
                              objectFit: "cover",
                            }}
                          />
                        </div>
                      )}

                      <div className="d-flex justify-content-end">
                        <button
                          type="submit"
                          className="btn btn-warning fw-bold px-4"
                          disabled={savingComment}
                        >
                          {savingComment
                            ? "Saving..."
                            : "Save comment"}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </div>

            <div className="modal-footer border-0 px-4 pb-4 pt-0">
              <button
                type="button"
                className="btn btn-dark px-4 fw-semibold"
                onClick={onClose}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal-backdrop show" />
    </>
  );
}