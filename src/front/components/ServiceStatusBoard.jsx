import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

import { apiFetch } from "../services/api";
import { ServiceDetailsModal } from "./ServiceDetailsModal";

import pendingIcon from "../assets/img/pending.png";
import diagnosisIcon from "../assets/img/diagnosis.png";
import waitingPartsIcon from "../assets/img/waitingParts.png";
import inRepairIcon from "../assets/img/inRepair.png";
import readyToDeliverIcon from "../assets/img/readyToDeliver.png";
import deliveredIcon from "../assets/img/delivered.png";

import "./ServiceStatusBoard.css";


const BOARD_COLUMNS = [
  {
    id: "pending",
    title: "Pending",
    statuses: ["pending"],
    icon: pendingIcon,
  },
  {
    id: "diagnosis",
    title: "Diagnosis",
    statuses: ["diagnosis", "budget_pending"],
    icon: diagnosisIcon,
  },
  {
    id: "waiting_parts",
    title: "Waiting parts",
    statuses: ["waiting_parts"],
    icon: waitingPartsIcon,
  },
  {
    id: "in_repair",
    title: "In repair",
    statuses: ["in_repair"],
    icon: inRepairIcon,
  },
  {
    id: "ready_to_deliver",
    title: "Ready to deliver",
    statuses: ["ready_to_deliver"],
    icon: readyToDeliverIcon,
  },
  {
    id: "delivered",
    title: "Delivered",
    statuses: ["delivered"],
    icon: deliveredIcon,
  },
];


const STATUS_LABELS = {
  pending: "Pending",
  diagnosis: "Diagnosis",
  budget_pending: "Budget pending",
  waiting_parts: "Waiting parts",
  in_repair: "In repair",
  ready_to_deliver: "Ready to deliver",
  delivered: "Delivered",
};


const PRIORITY_LABELS = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};


const STATUS_FLOW_COLUMNS = BOARD_COLUMNS;


/* =========================
   DATE
   ========================= */

function formatDate(dateValue) {
  if (!dateValue) return "No date";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}


/* =========================
   TIME IN CURRENT STATUS
   ========================= */

function getTimeInStatus(dateValue) {
  if (!dateValue) return "";

  const start = new Date(dateValue);
  const now = new Date();

  if (Number.isNaN(start.getTime())) {
    return "";
  }

  const differenceMs =
    now.getTime() - start.getTime();

  if (differenceMs < 0) {
    return "";
  }

  const minutes = Math.floor(
    differenceMs / (1000 * 60)
  );

  const hours = Math.floor(
    differenceMs / (1000 * 60 * 60)
  );

  const days = Math.floor(
    differenceMs / (1000 * 60 * 60 * 24)
  );

  if (days >= 1) {
    return `${days} ${
      days === 1 ? "day" : "days"
    }`;
  }

  if (hours >= 1) {
    return `${hours} ${
      hours === 1 ? "hour" : "hours"
    }`;
  }

  return `${Math.max(minutes, 1)} min`;
}


/* =========================
   NORMALIZE ADMIN SERVICES
   ========================= */

function normalizeAdminServices(
  servicesByStatus
) {
  if (!servicesByStatus) return [];

  return Object.entries(
    servicesByStatus
  ).flatMap(([status, services]) => {
    const serviceList =
      Array.isArray(services)
        ? services
        : [];

    return serviceList.map(
      (service) => ({
        ...service,
        status:
          service.status || status,
      })
    );
  });
}


/* =========================
   STATUS FLOW
   ========================= */

function getColumnIndexByStatus(status) {
  return STATUS_FLOW_COLUMNS.findIndex(
    (column) =>
      column.statuses.includes(status)
  );
}


function getMainStatusFromColumn(column) {
  return column?.statuses?.[0] || null;
}


function getPreviousStatus(status) {
  const currentColumnIndex =
    getColumnIndexByStatus(status);

  if (currentColumnIndex <= 0) {
    return null;
  }

  return getMainStatusFromColumn(
    STATUS_FLOW_COLUMNS[
      currentColumnIndex - 1
    ]
  );
}


function getNextStatus(status) {
  const currentColumnIndex =
    getColumnIndexByStatus(status);

  if (
    currentColumnIndex === -1 ||
    currentColumnIndex >=
      STATUS_FLOW_COLUMNS.length - 1
  ) {
    return null;
  }

  return getMainStatusFromColumn(
    STATUS_FLOW_COLUMNS[
      currentColumnIndex + 1
    ]
  );
}


function getColumnTitleByStatus(status) {
  const column = BOARD_COLUMNS.find(
    (item) =>
      item.statuses.includes(status)
  );

  return (
    column?.title ||
    STATUS_LABELS[status] ||
    status
  );
}


/* =========================
   VEHICLE
   ========================= */

function getVehicleInfo(service) {
  const brand =
    service.vehicle_brand || "";

  const model =
    service.vehicle_model || "";

  const plate =
    service.vehicle_plate ||
    "No plate";

  const vehicleName =
    `${brand} ${model}`.trim();

  return {
    name:
      vehicleName ||
      "Unknown vehicle",
    plate,
  };
}


/* =========================
   SORT
   ========================= */

function getServiceSortValue(service) {
  const candidateDates = [
    service.created_at,
    service.start_date,
  ];

  for (const candidate of candidateDates) {
    if (!candidate) continue;

    const timestamp =
      new Date(candidate).getTime();

    if (!Number.isNaN(timestamp)) {
      return timestamp;
    }
  }

  return Number(service.id) || 0;
}


/* =========================
   CURRENT STATUS LOG
   ========================= */

function getCurrentStatusLog(
  logData,
  currentStatus
) {
  const logs =
    logData?.status_logs ||
    logData?.logs ||
    logData;

  if (
    !Array.isArray(logs) ||
    logs.length === 0
  ) {
    return null;
  }

  const matchingLogs =
    logs.filter((log) => {
      const logStatus =
        log.status ||
        log.new_status ||
        log.to_status;

      return (
        logStatus === currentStatus
      );
    });

  const candidates =
    matchingLogs.length > 0
      ? matchingLogs
      : logs;

  return [...candidates].sort(
    (first, second) => {
      const firstDate =
        first.created_at ||
        first.changed_at ||
        first.entered_at ||
        first.timestamp;

      const secondDate =
        second.created_at ||
        second.changed_at ||
        second.entered_at ||
        second.timestamp;

      return (
        new Date(
          secondDate
        ).getTime() -
        new Date(
          firstDate
        ).getTime()
      );
    }
  )[0];
}


/* =========================
   COMPONENT
   ========================= */

export function ServiceStatusBoard({
  role = "admin",
}) {
  const [
    services,
    setServices,
  ] = useState([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    actionLoadingId,
    setActionLoadingId,
  ] = useState(null);

  const [
    selectedServiceId,
    setSelectedServiceId,
  ] = useState(null);

  const [
    editingService,
    setEditingService,
  ] = useState(null);

  const [
    serviceToDelete,
    setServiceToDelete,
  ] = useState(null);

  const [
    isSavingEdit,
    setIsSavingEdit,
  ] = useState(false);

  const [
    editForm,
    setEditForm,
  ] = useState({
    title: "",
    priority: "normal",
    entry_mileage: "",
    description: "",
    observations: "",
  });

  const [
    error,
    setError,
  ] = useState("");

  const isMechanic =
    role === "mechanic";


  /* =========================
     FETCH SERVICES
     ========================= */

  const fetchServices =
    useCallback(async () => {
      try {
        setIsLoading(true);
        setError("");

        const endpoint =
          isMechanic
            ? "/mechanic/services"
            : "/admin/dashboard";

        const data =
          await apiFetch(endpoint);

        const serviceList =
          isMechanic
            ? data.services || []
            : normalizeAdminServices(
                data.services_by_status
              );


        const servicesWithStatusTime =
          await Promise.all(
            serviceList.map(
              async (service) => {
                try {
                  const logData =
                    await apiFetch(
                      `/services/${service.id}/status-logs`
                    );

                  const currentLog =
                    getCurrentStatusLog(
                      logData,
                      service.status
                    );

                  const enteredAt =
                    currentLog?.created_at ||
                    currentLog?.changed_at ||
                    currentLog?.entered_at ||
                    currentLog?.timestamp ||
                    service.updated_at ||
                    service.created_at ||
                    service.start_date;

                  return {
                    ...service,
                    status_entered_at:
                      enteredAt,
                  };

                } catch {
                  return {
                    ...service,
                    status_entered_at:
                      service.updated_at ||
                      service.created_at ||
                      service.start_date,
                  };
                }
              }
            )
          );

        setServices(
          servicesWithStatusTime
        );

      } catch (error) {
        setError(error.message);

      } finally {
        setIsLoading(false);
      }
    }, [isMechanic]);


  useEffect(() => {
    fetchServices();
  }, [fetchServices]);


  /* =========================
     GROUP SERVICES
     ========================= */

  const servicesByColumn =
    useMemo(() => {
      return BOARD_COLUMNS.reduce(
        (acc, column) => {

          acc[column.id] =
            services
              .filter((service) =>
                column.statuses.includes(
                  service.status
                )
              )
              .sort(
                (
                  firstService,
                  secondService
                ) =>
                  getServiceSortValue(
                    secondService
                  ) -
                  getServiceSortValue(
                    firstService
                  )
              );

          return acc;
        },
        {}
      );
    }, [services]);


  /* =========================
     UPDATE STATUS
     ========================= */

  async function updateServiceStatus(
    serviceId,
    newStatus
  ) {
    try {
      setActionLoadingId(
        serviceId
      );

      setError("");

      await apiFetch(
        `/services/${serviceId}/status`,
        {
          method: "PATCH",
          body: {
            status: newStatus,
            note:
              "Status updated from dashboard",
          },
        }
      );

      await fetchServices();

    } catch (error) {
      setError(error.message);

    } finally {
      setActionLoadingId(null);
    }
  }


  /* =========================
     ASSIGN TO ME
     ========================= */

  async function handleAssignToMe(
    serviceId
  ) {
    try {
      setActionLoadingId(
        serviceId
      );

      setError("");

      await apiFetch(
        `/services/${serviceId}/assign-to-me`,
        {
          method: "PATCH",
        }
      );

      await fetchServices();

    } catch (error) {
      setError(
        error.message ||
          "Could not assign service."
      );

    } finally {
      setActionLoadingId(null);
    }
  }


  /* =========================
     DETAILS
     ========================= */

  function openServiceDetails(
    serviceId
  ) {
    setSelectedServiceId(
      serviceId
    );
  }


  function closeServiceDetails() {
    setSelectedServiceId(null);
  }


  /* =========================
     EDIT
     ========================= */

  function handleEditService(service) {
    setEditingService(service);

    setEditForm({
      title:
        service.title || "",

      priority:
        service.priority ||
        "normal",

      entry_mileage:
        service.entry_mileage ??
        "",

      description:
        service.description ||
        "",

      observations:
        service.observations ||
        "",
    });
  }


  function closeEditModal() {
    if (isSavingEdit) {
      return;
    }

    setEditingService(null);
  }


  function handleEditFormChange(
    event
  ) {
    const {
      name,
      value,
    } = event.target;

    setEditForm((current) => ({
      ...current,
      [name]: value,
    }));
  }


  async function handleEditSubmit(
    event
  ) {
    event.preventDefault();

    if (!editingService) {
      return;
    }

    try {
      setIsSavingEdit(true);
      setError("");

      const mileage =
        editForm.entry_mileage === ""
          ? null
          : Number(
              editForm.entry_mileage
            );

      await apiFetch(
        `/services/${editingService.id}`,
        {
          method: "PUT",
          body: {
            title:
              editForm.title.trim(),

            priority:
              editForm.priority,

            entry_mileage:
              mileage,

            description:
              editForm.description.trim(),

            observations:
              editForm.observations.trim(),
          },
        }
      );

      setEditingService(null);

      await fetchServices();

    } catch (error) {
      setError(
        error.message ||
          "Could not update service."
      );

    } finally {
      setIsSavingEdit(false);
    }
  }


  /* =========================
     DELETE
     ========================= */

  function openDeleteModal(
    service
  ) {
    setServiceToDelete(service);
  }


  function closeDeleteModal() {
    if (
      actionLoadingId ===
      serviceToDelete?.id
    ) {
      return;
    }

    setServiceToDelete(null);
  }


  async function handleDeleteService() {
    if (!serviceToDelete) {
      return;
    }

    const serviceId =
      serviceToDelete.id;

    try {
      setActionLoadingId(
        serviceId
      );

      setError("");

      await apiFetch(
        `/services/${serviceId}`,
        {
          method: "DELETE",
          body: {
            confirm: true,
          },
        }
      );

      setServiceToDelete(null);

      await fetchServices();

    } catch (error) {
      setError(
        error.message ||
          "Could not delete service."
      );

    } finally {
      setActionLoadingId(null);
    }
  }


  /* =========================
     LOADING
     ========================= */

  if (isLoading) {
    return (
      <p className="status-board-message">
        Loading services...
      </p>
    );
  }


  /* =========================
     BOARD
     ========================= */

  return (
    <>
      <section className="status-board">

        {error && (
          <p className="status-board-error">
            {error}
          </p>
        )}


        <div className="status-board-rows">

          {BOARD_COLUMNS.map(
            (column) => {

              const columnServices =
                servicesByColumn[
                  column.id
                ] || [];

              return (
                <div
                  className="status-row"
                  key={column.id}
                >

                  {/* STATUS */}

                  <div className="status-identity">

                    <img
                      src={column.icon}
                      alt=""
                      aria-hidden="true"
                      className="status-identity-icon"
                    />

                    <h3>
                      {column.title}
                    </h3>

                  </div>


                  {/* CARDS */}

                  <div className="status-row-content">

                    <div className="status-card-track">

                      {columnServices.length === 0 ? (

                        <div className="empty-row">
                          No services in this status.
                        </div>

                      ) : (

                        columnServices.map(
                          (service) => {

                            const previousStatus =
                              getPreviousStatus(
                                service.status
                              );

                            const nextStatus =
                              getNextStatus(
                                service.status
                              );

                            const isUpdating =
                              actionLoadingId ===
                              service.id;

                            const vehicleInfo =
                              getVehicleInfo(
                                service
                              );

                            const priority =
                              service.priority ||
                              "normal";

                            const isAvailable =
                              isMechanic &&
                              !service.employee_id;

                            const canChangeStatus =
                              !isMechanic ||
                              !!service.employee_id;

                            const statusTime =
                              getTimeInStatus(
                                service.status_entered_at
                              );

                            const statusLabel =
                              getColumnTitleByStatus(
                                service.status
                              ).toLowerCase();


                            return (
                              <article
                                className="service-card"
                                key={service.id}
                              >

                                {/* VEHICLE */}

                                <div className="service-card-header">

                                  <div className="service-vehicle-block">

                                    <h4 className="service-vehicle-title">
                                      {vehicleInfo.name}
                                    </h4>

                                    <p className="service-plate">
                                      {vehicleInfo.plate}
                                    </p>

                                  </div>


                                  <span
                                    className={`service-priority-dot priority-${priority}`}
                                    title={`Priority: ${
                                      PRIORITY_LABELS[
                                        priority
                                      ] ||
                                      priority
                                    }`}
                                  />

                                </div>


                                {/* SERVICE INFO */}

                                <div className="service-main-info">

                                  <h5 className="service-title">
                                    {service.title ||
                                      "No service title"}
                                  </h5>


                                  <p className="service-card-context">

                                    <span className="service-customer-name">
                                      {service.customer_name ||
                                        "Unknown customer"}
                                    </span>


                                    <span className="service-context-divider">
                                      ·
                                    </span>


                                    <span
                                      className={
                                        service.employee_name
                                          ? "service-mechanic-name"
                                          : "service-unassigned"
                                      }
                                    >
                                      {service.employee_name ||
                                        "Unassigned"}
                                    </span>

                                  </p>

                                </div>


                                {/* DATE */}

                                <div className="service-card-info">

                                  <div>

                                    <span className="service-card-label">
                                      Entry
                                    </span>


                                    <strong>
                                      {formatDate(
                                        service.start_date
                                      )}
                                    </strong>


                                    {statusTime && (
                                      <span className="service-status-time">
                                        {statusTime} in{" "}
                                        {statusLabel}
                                      </span>
                                    )}

                                  </div>


                                  <button
                                    type="button"
                                    className="details-link-button"
                                    disabled={
                                      isUpdating
                                    }
                                    onClick={() =>
                                      openServiceDetails(
                                        service.id
                                      )
                                    }
                                  >
                                    Details
                                  </button>

                                </div>


                                {/* FOOTER */}

                                <div className="service-card-footer">


                                  {/* LEFT */}

                                  <div className="service-card-management">

                                    {!isMechanic && (
                                      <>
                                        <button
                                          type="button"
                                          className="card-management-action edit-action"
                                          title="Edit service"
                                          disabled={
                                            isUpdating
                                          }
                                          onClick={() =>
                                            handleEditService(
                                              service
                                            )
                                          }
                                        >
                                          <Pencil
                                            size={
                                              13
                                            }
                                          />
                                        </button>


                                        <button
                                          type="button"
                                          className="card-management-action delete-action"
                                          title="Delete service"
                                          disabled={
                                            isUpdating
                                          }
                                          onClick={() =>
                                            openDeleteModal(
                                              service
                                            )
                                          }
                                        >
                                          <Trash2
                                            size={
                                              13
                                            }
                                          />
                                        </button>
                                      </>
                                    )}


                                    {isAvailable && (
                                      <button
                                        type="button"
                                        className="btn btn-warning btn-sm fw-bold service-assign-button"
                                        disabled={
                                          isUpdating
                                        }
                                        onClick={() =>
                                          handleAssignToMe(
                                            service.id
                                          )
                                        }
                                      >
                                        {isUpdating
                                          ? "Assigning..."
                                          : "Assign"}
                                      </button>
                                    )}

                                  </div>


                                  {/* ARROWS */}

                                  <div className="service-status-actions">

                                    <button
                                      type="button"
                                      className="status-icon-action previous-action"
                                      title={
                                        previousStatus
                                          ? `Back to ${getColumnTitleByStatus(
                                              previousStatus
                                            )}`
                                          : "No previous status"
                                      }
                                      disabled={
                                        !previousStatus ||
                                        isUpdating ||
                                        !canChangeStatus
                                      }
                                      onClick={() =>
                                        updateServiceStatus(
                                          service.id,
                                          previousStatus
                                        )
                                      }
                                    >
                                      <ArrowUp
                                        size={
                                          15
                                        }
                                      />
                                    </button>


                                    <button
                                      type="button"
                                      className="status-icon-action next-action"
                                      title={
                                        nextStatus
                                          ? `Move to ${getColumnTitleByStatus(
                                              nextStatus
                                            )}`
                                          : "Final status"
                                      }
                                      disabled={
                                        !nextStatus ||
                                        isUpdating ||
                                        !canChangeStatus
                                      }
                                      onClick={() =>
                                        updateServiceStatus(
                                          service.id,
                                          nextStatus
                                        )
                                      }
                                    >
                                      <ArrowDown
                                        size={
                                          15
                                        }
                                      />
                                    </button>

                                  </div>

                                </div>

                              </article>
                            );
                          }
                        )
                      )}

                    </div>
                  </div>

                </div>
              );
            }
          )}

        </div>


        {/* DETAILS MODAL */}

        {selectedServiceId && (
          <ServiceDetailsModal
            serviceId={
              selectedServiceId
            }
            role={role}
            onClose={
              closeServiceDetails
            }
            onServiceUpdated={
              fetchServices
            }
          />
        )}

      </section>


      {/* =========================
          EDIT MODAL
          ========================= */}

      {editingService && (
        <>
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow rounded-4">

                <div className="modal-header border-0 pb-1">

                  <div>
                    <h5 className="modal-title fw-bold">
                      Edit service
                    </h5>

                    <small className="text-secondary">
                      {getVehicleInfo(
                        editingService
                      ).name}{" "}
                      ·{" "}
                      {getVehicleInfo(
                        editingService
                      ).plate}
                    </small>
                  </div>


                  <button
                    type="button"
                    className="btn btn-light rounded-circle d-flex align-items-center justify-content-center"
                    onClick={
                      closeEditModal
                    }
                    disabled={
                      isSavingEdit
                    }
                    aria-label="Close"
                  >
                    <X size={17} />
                  </button>

                </div>


                <form
                  onSubmit={
                    handleEditSubmit
                  }
                >
                  <div className="modal-body pt-3">

                    <div className="mb-3">

                      <label
                        htmlFor="edit-title"
                        className="form-label small fw-bold"
                      >
                        Service title
                      </label>

                      <input
                        id="edit-title"
                        type="text"
                        name="title"
                        className="form-control"
                        value={
                          editForm.title
                        }
                        onChange={
                          handleEditFormChange
                        }
                        required
                      />

                    </div>


                    <div className="row g-3 mb-3">

                      <div className="col-sm-6">

                        <label
                          htmlFor="edit-priority"
                          className="form-label small fw-bold"
                        >
                          Priority
                        </label>

                        <select
                          id="edit-priority"
                          name="priority"
                          className="form-select"
                          value={
                            editForm.priority
                          }
                          onChange={
                            handleEditFormChange
                          }
                        >
                          <option value="low">
                            Low
                          </option>

                          <option value="normal">
                            Normal
                          </option>

                          <option value="high">
                            High
                          </option>

                          <option value="urgent">
                            Urgent
                          </option>
                        </select>

                      </div>


                      <div className="col-sm-6">

                        <label
                          htmlFor="edit-mileage"
                          className="form-label small fw-bold"
                        >
                          Entry mileage
                        </label>

                        <input
                          id="edit-mileage"
                          type="number"
                          min="0"
                          name="entry_mileage"
                          className="form-control"
                          value={
                            editForm.entry_mileage
                          }
                          onChange={
                            handleEditFormChange
                          }
                        />

                      </div>

                    </div>


                    <div className="mb-3">

                      <label
                        htmlFor="edit-description"
                        className="form-label small fw-bold"
                      >
                        Description
                      </label>

                      <textarea
                        id="edit-description"
                        name="description"
                        className="form-control"
                        rows="3"
                        value={
                          editForm.description
                        }
                        onChange={
                          handleEditFormChange
                        }
                      />

                    </div>


                    <div>

                      <label
                        htmlFor="edit-observations"
                        className="form-label small fw-bold"
                      >
                        Observations
                      </label>

                      <textarea
                        id="edit-observations"
                        name="observations"
                        className="form-control"
                        rows="2"
                        value={
                          editForm.observations
                        }
                        onChange={
                          handleEditFormChange
                        }
                      />

                    </div>

                  </div>


                  <div className="modal-footer border-0 pt-1">

                    <button
                      type="button"
                      className="btn btn-light fw-semibold"
                      onClick={
                        closeEditModal
                      }
                      disabled={
                        isSavingEdit
                      }
                    >
                      Cancel
                    </button>


                    <button
                      type="submit"
                      className="btn btn-warning fw-bold"
                      disabled={
                        isSavingEdit
                      }
                    >
                      {isSavingEdit
                        ? "Saving..."
                        : "Save changes"}
                    </button>

                  </div>
                </form>

              </div>
            </div>
          </div>


          <div className="modal-backdrop fade show" />
        </>
      )}


      {/* =========================
          DELETE MODAL
          ========================= */}

      {serviceToDelete && (
        <>
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-dialog modal-dialog-centered modal-sm">
              <div className="modal-content border-0 shadow rounded-4">

                <div className="modal-body text-center p-4">

                  <div
                    className="rounded-circle bg-danger-subtle text-danger d-inline-flex align-items-center justify-content-center mb-3"
                    style={{
                      width: "48px",
                      height: "48px",
                    }}
                  >
                    <Trash2 size={21} />
                  </div>


                  <h5 className="fw-bold mb-2">
                    Delete service?
                  </h5>


                  <p className="text-secondary small mb-2">
                    You are about to permanently
                    delete:
                  </p>


                  <p className="fw-bold mb-1">
                    {serviceToDelete.title ||
                      "Untitled service"}
                  </p>


                  <p className="text-secondary small mb-3">
                    {getVehicleInfo(
                      serviceToDelete
                    ).name}{" "}
                    ·{" "}
                    {getVehicleInfo(
                      serviceToDelete
                    ).plate}
                  </p>


                  <p className="text-danger small fw-semibold mb-4">
                    This action cannot be undone.
                  </p>


                  <div className="d-flex gap-2">

                    <button
                      type="button"
                      className="btn btn-light flex-fill fw-semibold"
                      onClick={
                        closeDeleteModal
                      }
                      disabled={
                        actionLoadingId ===
                        serviceToDelete.id
                      }
                    >
                      Cancel
                    </button>


                    <button
                      type="button"
                      className="btn btn-danger flex-fill fw-bold"
                      onClick={
                        handleDeleteService
                      }
                      disabled={
                        actionLoadingId ===
                        serviceToDelete.id
                      }
                    >
                      {actionLoadingId ===
                      serviceToDelete.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>

                  </div>

                </div>

              </div>
            </div>
          </div>


          <div className="modal-backdrop fade show" />
        </>
      )}

    </>
  );
}