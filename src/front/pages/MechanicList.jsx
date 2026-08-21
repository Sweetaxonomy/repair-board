import { useEffect, useMemo, useState } from "react";
import {
  Ban,
  Briefcase,
  ClipboardList,
  Columns3,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  FilterX,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  SlidersHorizontal,
  Wrench,
} from "lucide-react";
import * as XLSX from "xlsx";
import { apiFetch } from "../services/api";
import "./Mechanic-List.css";

const DNI_NIE_REGEX = /^(?:\d{8}[A-Z]|[XYZ]\d{7}[A-Z])$/;
const PHONE_REGEX = /^(?:\+34)?[6789]\d{8}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_REGEX = /^[\p{L}]+(?:[\s'-][\p{L}]+)*$/u;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const INITIAL_FILTERS = {
  mechanic: "",
  contact: "",
  specialty: "",
  address: "",
};

const INITIAL_VISIBILITY = {
  mechanic: true,
  contact: true,
  professional: true,
  active_tasks: true,
};

const INITIAL_FORM_STATE = {
  id: null,
  first_name: "",
  last_name: "",
  dni: "",
  phone: "",
  email: "",
  address: "",
  specialty: "",
  temporary_password: "",
  confirm_password: "",
};

const COLUMN_OPTIONS = [
  { key: "mechanic", label: "Mechanic" },
  { key: "contact", label: "Contact" },
  { key: "professional", label: "Professional" },
  { key: "active_tasks", label: "Active tasks" },
];

const normalizeDni = (value = "") =>
  value.replace(/[\s-]/g, "").toUpperCase();

const normalizePhone = (value = "") =>
  value.replace(/[\s()-]/g, "").replace(/^0034/, "+34");

const normalizeSearchValue = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const matchesWordStart = (value, searchTerm) =>
  normalizeSearchValue(value)
    .split(/[\s,./|()@_-]+/)
    .some((word) => word.startsWith(searchTerm));

const normalizeMechanic = (mechanic, activeTasks = 0) => ({
  id: mechanic.id,
  first_name: mechanic.first_name || "",
  last_name: mechanic.last_name || "",
  full_name: `${mechanic.first_name || ""} ${mechanic.last_name || ""}`.trim(),
  dni: mechanic.dni || "",
  phone: mechanic.phone || "",
  email: mechanic.email || "",
  address: mechanic.address || "",
  specialty: mechanic.specialty || "",
  active_tasks: activeTasks,
});

const getInitials = (mechanic) => {
  const firstInitial = (mechanic.first_name || "").trim().charAt(0);
  const lastInitial = (mechanic.last_name || "").trim().charAt(0);

  return `${firstInitial}${lastInitial}`.toUpperCase() || "M";
};

const getActiveTaskCountByMechanic = (services = []) => {
  const finishedStatuses = new Set(["delivered", "cancelled"]);

  return services.reduce((counts, service) => {
    if (!service.employee_id || finishedStatuses.has(service.status)) {
      return counts;
    }

    const mechanicId = String(service.employee_id);
    counts[mechanicId] = (counts[mechanicId] || 0) + 1;

    return counts;
  }, {});
};

const escapeCsvValue = (value) =>
  `"${String(value ?? "").replaceAll('"', '""')}"`;

export default function MechanicList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [globalSearch, setGlobalSearch] = useState("");
  const [columnFilters, setColumnFilters] = useState(INITIAL_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState(INITIAL_VISIBILITY);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [mechanicForm, setMechanicForm] = useState(INITIAL_FORM_STATE);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [modalError, setModalError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState(null);

  const loadMechanics = async () => {
    setLoading(true);
    setError("");

    try {
      const [mechanicsPayload, servicesPayload] = await Promise.all([
        apiFetch("/mechanics"),
        apiFetch("/services"),
      ]);

      const mechanics = mechanicsPayload.mechanics || [];
      const services = servicesPayload.services || [];
      const activeTaskCounts = getActiveTaskCountByMechanic(services);

      setData(
        mechanics.map((mechanic) =>
          normalizeMechanic(
            mechanic,
            activeTaskCounts[String(mechanic.id)] || 0
          )
        )
      );
    } catch (requestError) {
      setError(
        requestError.message ||
          "Could not load mechanics and assigned services."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMechanics();
  }, []);

  useEffect(() => {
    if (!showModal) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showModal]);

  const activeFilterCount = useMemo(
    () => Object.values(columnFilters).filter((value) => value.trim() !== "").length,
    [columnFilters]
  );

  const filteredData = useMemo(() => {
    const searchTerm = normalizeSearchValue(globalSearch);

    return data.filter((mechanic) => {
      const matchesTextFields = [
        mechanic.first_name,
        mechanic.last_name,
        mechanic.full_name,
        mechanic.specialty,
        mechanic.address,
      ].some((value) => matchesWordStart(value, searchTerm));

      const matchesIdentifierFields = [
        mechanic.dni,
        mechanic.phone,
        mechanic.email,
      ].some((value) => normalizeSearchValue(value).startsWith(searchTerm));

      const matchesGlobal =
        !searchTerm || matchesTextFields || matchesIdentifierFields;

      const filterValues = {
        mechanic: [mechanic.full_name, mechanic.dni].join(" "),
        contact: [mechanic.email, mechanic.phone].join(" "),
        specialty: mechanic.specialty,
        address: mechanic.address,
      };

      const matchesFilters = Object.entries(columnFilters).every(
        ([key, value]) => {
          const filterValue = normalizeSearchValue(value);
          if (!filterValue) return true;
          return normalizeSearchValue(filterValues[key]).includes(filterValue);
        }
      );

      return matchesGlobal && matchesFilters;
    });
  }, [data, globalSearch, columnFilters]);

  const handleFilterChange = (field, value) => {
    setColumnFilters((currentFilters) => ({
      ...currentFilters,
      [field]: value,
    }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setGlobalSearch("");
    setColumnFilters(INITIAL_FILTERS);
    setCurrentPage(1);
  };

  const totalPages =
    recordsPerPage === -1
      ? 1
      : Math.max(1, Math.ceil(filteredData.length / recordsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedData = useMemo(() => {
    if (recordsPerPage === -1) return filteredData;

    const startIndex = (currentPage - 1) * recordsPerPage;
    return filteredData.slice(startIndex, startIndex + recordsPerPage);
  }, [filteredData, currentPage, recordsPerPage]);

  const firstVisibleRecord =
    filteredData.length === 0
      ? 0
      : recordsPerPage === -1
        ? 1
        : (currentPage - 1) * recordsPerPage + 1;

  const lastVisibleRecord =
    recordsPerPage === -1
      ? filteredData.length
      : Math.min(currentPage * recordsPerPage, filteredData.length);

  const visiblePageNumbers = useMemo(() => {
    const amount = Math.min(5, totalPages);
    let start = Math.max(1, currentPage - 2);

    if (start + amount - 1 > totalPages) {
      start = Math.max(1, totalPages - amount + 1);
    }

    return Array.from({ length: amount }, (_, index) => start + index);
  }, [currentPage, totalPages]);

  const handleToggleColumn = (column) => {
    setVisibleColumns((currentColumns) => ({
      ...currentColumns,
      [column]: !currentColumns[column],
    }));
  };

  const tableColumnCount =
    Object.values(visibleColumns).filter(Boolean).length + 1;

  const getExportRows = () =>
    filteredData.map((mechanic) => ({
      Name: mechanic.full_name,
      "DNI / NIE": mechanic.dni,
      Email: mechanic.email,
      Phone: mechanic.phone,
      Address: mechanic.address,
      Specialty: mechanic.specialty,
      "Active tasks": mechanic.active_tasks,
    }));

  const handleExportExcel = () => {
    const exportRows = getExportRows();
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Mechanics");
    XLSX.writeFile(workbook, "mechanic_list.xlsx");
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const exportRows = getExportRows();
    if (exportRows.length === 0) return;

    const headers = Object.keys(exportRows[0]);
    const rows = exportRows.map((row) =>
      headers.map((header) => escapeCsvValue(row[header])).join(",")
    );

    const csvContent = [
      headers.map(escapeCsvValue).join(","),
      ...rows,
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const fileUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = fileUrl;
    link.download = "mechanic_list.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(fileUrl);
    setShowExportMenu(false);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    let nextValue = value;

    if (name === "dni") nextValue = normalizeDni(value);
    if (name === "phone") nextValue = normalizePhone(value);
    if (name === "email") nextValue = value.trimStart().toLowerCase();

    setMechanicForm((currentForm) => ({
      ...currentForm,
      [name]: nextValue,
    }));

    if (formErrors[name]) {
      setFormErrors((currentErrors) => ({
        ...currentErrors,
        [name]: undefined,
      }));
    }

    setModalError("");
  };

  const validateMechanic = () => {
    const nextErrors = {};
    const firstName = mechanicForm.first_name.trim();
    const lastName = mechanicForm.last_name.trim();
    const dni = normalizeDni(mechanicForm.dni);
    const phone = normalizePhone(mechanicForm.phone);
    const email = mechanicForm.email.trim().toLowerCase();

    if (!firstName) {
      nextErrors.first_name = "First name is required.";
    } else if (!NAME_REGEX.test(firstName)) {
      nextErrors.first_name = "Use only letters, spaces, apostrophes or hyphens.";
    }

    if (!lastName) {
      nextErrors.last_name = "Last name is required.";
    } else if (!NAME_REGEX.test(lastName)) {
      nextErrors.last_name = "Use only letters, spaces, apostrophes or hyphens.";
    }

    if (!dni) {
      nextErrors.dni = "DNI or NIE is required.";
    } else if (!DNI_NIE_REGEX.test(dni)) {
      nextErrors.dni = "Invalid format. Examples: 12345678A or X1234567A.";
    }

    if (!phone) {
      nextErrors.phone = "Phone is required.";
    } else if (!PHONE_REGEX.test(phone)) {
      nextErrors.phone = "Enter a valid Spanish phone number.";
    }

    if (!email) {
      nextErrors.email = "Email is required.";
    } else if (!EMAIL_REGEX.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!isEditing) {
      if (!mechanicForm.temporary_password) {
        nextErrors.temporary_password = "Password is required.";
      } else if (!PASSWORD_REGEX.test(mechanicForm.temporary_password)) {
        nextErrors.temporary_password =
          "Minimum 8 characters, including uppercase, lowercase and number.";
      }

      if (!mechanicForm.confirm_password) {
        nextErrors.confirm_password = "Confirm the password.";
      } else if (
        mechanicForm.temporary_password !== mechanicForm.confirm_password
      ) {
        nextErrors.confirm_password = "Passwords do not match.";
      }
    }

    return nextErrors;
  };

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setMechanicForm(INITIAL_FORM_STATE);
    setFormErrors({});
    setModalError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowModal(true);
  };

  const handleOpenEditModal = (mechanic) => {
    setIsEditing(true);
    setMechanicForm({
      id: mechanic.id,
      first_name: mechanic.first_name,
      last_name: mechanic.last_name,
      dni: mechanic.dni,
      phone: mechanic.phone,
      email: mechanic.email,
      address: mechanic.address || "",
      specialty: mechanic.specialty || "",
      temporary_password: "",
      confirm_password: "",
    });
    setFormErrors({});
    setModalError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (saving) return;

    setShowModal(false);
    setIsEditing(false);
    setMechanicForm(INITIAL_FORM_STATE);
    setFormErrors({});
    setModalError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleFormBackdropClick = (event) => {
    if (event.target === event.currentTarget) handleCloseModal();
  };

  const handleSaveMechanic = async (event) => {
    event.preventDefault();

    const validationErrors = validateMechanic();
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      setModalError("Please review the highlighted fields before saving.");
      return;
    }

    try {
      setSaving(true);
      setModalError("");
      setError("");

      if (isEditing) {
        await apiFetch(`/mechanics/${mechanicForm.id}`, {
          method: "PUT",
          body: {
            first_name: mechanicForm.first_name.trim(),
            last_name: mechanicForm.last_name.trim(),
            dni: normalizeDni(mechanicForm.dni),
            phone: normalizePhone(mechanicForm.phone),
            address: mechanicForm.address.trim() || null,
            specialty: mechanicForm.specialty.trim() || null,
          },
        });
      } else {
        await apiFetch("/mechanics", {
          method: "POST",
          body: {
            first_name: mechanicForm.first_name.trim(),
            last_name: mechanicForm.last_name.trim(),
            dni: normalizeDni(mechanicForm.dni),
            phone: normalizePhone(mechanicForm.phone),
            email: mechanicForm.email.trim().toLowerCase(),
            address: mechanicForm.address.trim() || null,
            specialty: mechanicForm.specialty.trim() || null,
            password: mechanicForm.temporary_password,
            password_confirm: mechanicForm.confirm_password,
          },
        });
      }

      await loadMechanics();

      setShowModal(false);
      setIsEditing(false);
      setMechanicForm(INITIAL_FORM_STATE);
      setFormErrors({});
      setModalError("");
      setShowPassword(false);
      setShowConfirmPassword(false);
    } catch (requestError) {
      setModalError(requestError.message || "Could not save mechanic.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (mechanic) => {
    const confirmed = window.confirm(
      `Deactivate ${mechanic.full_name}? This mechanic will no longer be available for new service assignments.`
    );

    if (!confirmed) return;

    try {
      setDeactivatingId(mechanic.id);
      setError("");

      await apiFetch(`/mechanics/${mechanic.id}`, {
        method: "DELETE",
      });

      setData((currentData) =>
        currentData.filter((item) => item.id !== mechanic.id)
      );
    } catch (requestError) {
      setError(requestError.message || "Could not deactivate mechanic.");
    } finally {
      setDeactivatingId(null);
    }
  };

  return (
    <section className="mechanic-page">
      <div className="mb-4">
        <div className="d-flex align-items-center gap-3">
          <div className="mechanic-page-icon bg-dark text-warning rounded-3 d-flex align-items-center justify-content-center flex-shrink-0">
            <Wrench size={24} />
          </div>

          <div>
            <h1 className="h3 fw-bold mb-1">Mechanics</h1>
            <p className="text-secondary mb-0">
              Manage your workshop team and mechanic accounts.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="card border-0 shadow-sm rounded-4 mb-3">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-xl">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <Search size={18} className="text-secondary" />
                </span>
                <input
                  type="search"
                  className="form-control border-start-0 ps-0"
                  placeholder="Search by name, DNI/NIE, email, phone or specialty..."
                  value={globalSearch}
                  onChange={(event) => {
                    setGlobalSearch(event.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            <div className="col-12 col-sm-auto">
              <button
                type="button"
                className={`btn w-100 d-flex align-items-center justify-content-center gap-2 ${
                  showFilters || activeFilterCount > 0
                    ? "btn-dark"
                    : "btn-outline-secondary"
                }`}
                onClick={() => setShowFilters((current) => !current)}
              >
                <SlidersHorizontal size={17} />
                Filters
                {activeFilterCount > 0 && (
                  <span className="badge bg-warning text-dark">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            <div className="col-6 col-sm-auto position-relative">
              <button
                type="button"
                className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
                onClick={() => {
                  setShowExportMenu((current) => !current);
                  setShowColumnsMenu(false);
                }}
              >
                <Download size={17} />
                Export
              </button>

              {showExportMenu && (
                <div className="dropdown-menu dropdown-menu-end show mechanic-dropdown-menu shadow">
                  <button
                    type="button"
                    className="dropdown-item d-flex align-items-center gap-2 py-2"
                    onClick={handleExportExcel}
                  >
                    <FileSpreadsheet size={17} />
                    Excel
                  </button>

                  <button
                    type="button"
                    className="dropdown-item d-flex align-items-center gap-2 py-2"
                    onClick={handleExportCSV}
                  >
                    <FileText size={17} />
                    CSV
                  </button>
                </div>
              )}
            </div>

            <div className="col-6 col-sm-auto position-relative">
              <button
                type="button"
                className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
                onClick={() => {
                  setShowColumnsMenu((current) => !current);
                  setShowExportMenu(false);
                }}
              >
                <Columns3 size={17} />
                Columns
              </button>

              {showColumnsMenu && (
                <div className="dropdown-menu dropdown-menu-end show mechanic-dropdown-menu shadow p-2">
                  <p className="dropdown-header fw-bold text-dark px-2">
                    Visible columns
                  </p>

                  {COLUMN_OPTIONS.map((column) => (
                    <label
                      key={column.key}
                      className="dropdown-item d-flex align-items-center gap-2 py-2 mechanic-column-option"
                    >
                      <input
                        type="checkbox"
                        className="form-check-input m-0"
                        checked={visibleColumns[column.key]}
                        onChange={() => handleToggleColumn(column.key)}
                      />
                      {column.label}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="col-12 col-sm-auto">
              <button
                type="button"
                className="btn btn-warning w-100 fw-bold d-flex align-items-center justify-content-center gap-2 px-3"
                onClick={handleOpenAddModal}
              >
                <Plus size={17} />
                Add mechanic
              </button>
            </div>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="card border-0 shadow-sm rounded-4 mb-3 mechanic-filter-panel">
          <div className="card-body p-4">
            <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4">
              <div>
                <h2 className="h6 fw-bold mb-1">Advanced filters</h2>
                <p className="small text-secondary mb-0">
                  Results update as you type.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-sm btn-outline-danger d-inline-flex align-items-center justify-content-center gap-2 align-self-md-start"
                onClick={handleClearFilters}
              >
                <FilterX size={16} />
                Clear filters
              </button>
            </div>

            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold">Mechanic</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Name or DNI/NIE"
                  value={columnFilters.mechanic}
                  onChange={(event) =>
                    handleFilterChange("mechanic", event.target.value)
                  }
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold">Contact</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Email or phone"
                  value={columnFilters.contact}
                  onChange={(event) =>
                    handleFilterChange("contact", event.target.value)
                  }
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold">Specialty</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Example: Engine repair"
                  value={columnFilters.specialty}
                  onChange={(event) =>
                    handleFilterChange("specialty", event.target.value)
                  }
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold">Address</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search address"
                  value={columnFilters.address}
                  onChange={(event) =>
                    handleFilterChange("address", event.target.value)
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
        <p className="small text-secondary mb-0">
          {filteredData.length === data.length
            ? `${data.length} ${data.length === 1 ? "mechanic" : "mechanics"}`
            : `${filteredData.length} of ${data.length} mechanics`}
        </p>

        {(globalSearch || activeFilterCount > 0) && (
          <button
            type="button"
            className="btn btn-link btn-sm text-danger text-decoration-none p-0"
            onClick={handleClearFilters}
          >
            Clear search and filters
          </button>
        )}
      </div>

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table align-middle mb-0 mechanic-table">
            <thead>
              <tr>
                {visibleColumns.mechanic && <th>Mechanic</th>}
                {visibleColumns.contact && <th>Contact</th>}
                {visibleColumns.professional && <th>Professional</th>}
                {visibleColumns.active_tasks && (
                  <th className="text-center">Active tasks</th>
                )}
                <th className="text-end">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={tableColumnCount} className="text-center py-5">
                    <span className="spinner-border spinner-border-sm text-warning me-2" />
                    Loading mechanics...
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={tableColumnCount} className="text-center py-5">
                    <Wrench size={34} className="text-secondary mb-3" />
                    <h3 className="h6 fw-bold">No mechanics found</h3>
                    <p className="small text-secondary mb-0">
                      Try changing the search or filters.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((mechanic) => (
                  <tr key={mechanic.id}>
                    {visibleColumns.mechanic && (
                      <td>
                        <div className="d-flex align-items-start gap-3">
                          <div className="mechanic-avatar bg-light border rounded-circle d-flex align-items-center justify-content-center flex-shrink-0">
                            {getInitials(mechanic)}
                          </div>

                          <div>
                            <p className="fw-bold mb-1">
                              {mechanic.full_name || "Mechanic"}
                            </p>
                            <p className="small text-secondary mb-0">
                              DNI/NIE: {mechanic.dni || "Not specified"}
                            </p>
                          </div>
                        </div>
                      </td>
                    )}

                    {visibleColumns.contact && (
                      <td>
                        <div className="d-flex flex-column gap-2 small">
                          <span className="d-flex align-items-center gap-2">
                            <Mail size={15} className="text-secondary flex-shrink-0" />
                            {mechanic.email || "No email"}
                          </span>
                          <span className="d-flex align-items-center gap-2">
                            <Phone size={15} className="text-secondary flex-shrink-0" />
                            {mechanic.phone || "No phone"}
                          </span>
                        </div>
                      </td>
                    )}

                    {visibleColumns.professional && (
                      <td>
                        <div className="d-flex flex-column gap-2 small">
                          <span className="d-flex align-items-center gap-2">
                            <Briefcase
                              size={15}
                              className="text-secondary flex-shrink-0"
                            />
                            {mechanic.specialty || "Specialty not specified"}
                          </span>

                          {mechanic.address && (
                            <span className="d-flex align-items-start gap-2 text-secondary">
                              <MapPin size={15} className="flex-shrink-0 mt-1" />
                              {mechanic.address}
                            </span>
                          )}
                        </div>
                      </td>
                    )}

                    {visibleColumns.active_tasks && (
                      <td className="text-center">
                        <div className="d-inline-flex align-items-center gap-2">
                          <ClipboardList
                            size={17}
                            className="text-secondary"
                          />
                          <span className="fw-bold">
                            {mechanic.active_tasks}
                          </span>
                        </div>
                        <div className="small text-secondary mt-1">
                          {mechanic.active_tasks === 1
                            ? "active task"
                            : "active tasks"}
                        </div>
                      </td>
                    )}

                    <td className="text-end">
                      <div className="d-inline-flex align-items-center gap-2">
                        <button
                          type="button"
                          className="btn btn-sm mechanic-action-button mechanic-action-edit"
                          title="Edit mechanic"
                          aria-label={`Edit ${mechanic.full_name}`}
                          onClick={() => handleOpenEditModal(mechanic)}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm mechanic-action-button mechanic-action-deactivate"
                          title="Deactivate mechanic"
                          aria-label={`Deactivate ${mechanic.full_name}`}
                          disabled={deactivatingId === mechanic.id}
                          onClick={() => handleDeactivate(mechanic)}
                        >
                          {deactivatingId === mechanic.id ? (
                            <span className="spinner-border spinner-border-sm" />
                          ) : (
                            <Ban size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mt-3">
        <div className="d-flex flex-wrap align-items-center gap-3">
          <label className="d-flex align-items-center gap-2 small text-secondary">
            Show
            <select
              className="form-select form-select-sm mechanic-record-select"
              value={recordsPerPage}
              onChange={(event) => {
                setRecordsPerPage(Number(event.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={-1}>All</option>
            </select>
            records
          </label>

          <span className="small text-secondary">
            Showing {firstVisibleRecord}–{lastVisibleRecord} of {filteredData.length}
          </span>
        </div>

        {recordsPerPage !== -1 && totalPages > 1 && (
          <nav aria-label="Mechanic pagination">
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                <button
                  type="button"
                  className="page-link"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((current) => Math.max(1, current - 1))
                  }
                >
                  Previous
                </button>
              </li>

              {visiblePageNumbers.map((pageNumber) => (
                <li
                  key={pageNumber}
                  className={`page-item ${
                    currentPage === pageNumber ? "active" : ""
                  }`}
                >
                  <button
                    type="button"
                    className="page-link"
                    onClick={() => setCurrentPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                </li>
              ))}

              <li
                className={`page-item ${
                  currentPage === totalPages ? "disabled" : ""
                }`}
              >
                <button
                  type="button"
                  className="page-link"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((current) => Math.min(totalPages, current + 1))
                  }
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        )}
      </div>

      {showModal && (
        <div
          className="modal show d-block mechanic-modal-layer"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          onMouseDown={handleFormBackdropClick}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable mechanic-modal-dialog">
            <form
              className="modal-content border-0 shadow-lg rounded-4 overflow-hidden"
              onSubmit={handleSaveMechanic}
              noValidate
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="modal-header bg-dark text-white border-bottom border-warning border-3 p-4">
                <div>
                  <p className="small text-warning fw-bold text-uppercase mb-1">
                    Mechanic account
                  </p>
                  <h2 className="modal-title h4 fw-bold mb-0">
                    {isEditing ? "Edit mechanic" : "Add mechanic"}
                  </h2>
                </div>

                <button
                  type="button"
                  className="btn-close btn-close-white"
                  aria-label="Close"
                  disabled={saving}
                  onClick={handleCloseModal}
                />
              </div>

              <div className="modal-body p-4 mechanic-modal-body">
                {modalError && (
                  <div className="alert alert-danger" role="alert">
                    {modalError}
                  </div>
                )}

                {!isEditing && (
                  <div className="alert alert-light border rounded-3 small">
                    This account lets the mechanic sign in and see services assigned to them.
                  </div>
                )}

                <div className="mechanic-form-section">
                  <p className="mechanic-form-section-title">
                    Personal information
                  </p>

                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">First name *</label>
                      <input
                        type="text"
                        name="first_name"
                        className={`form-control ${
                          formErrors.first_name ? "is-invalid" : ""
                        }`}
                        value={mechanicForm.first_name}
                        onChange={handleInputChange}
                        disabled={saving}
                      />
                      {formErrors.first_name && (
                        <div className="invalid-feedback">
                          {formErrors.first_name}
                        </div>
                      )}
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Last name *</label>
                      <input
                        type="text"
                        name="last_name"
                        className={`form-control ${
                          formErrors.last_name ? "is-invalid" : ""
                        }`}
                        value={mechanicForm.last_name}
                        onChange={handleInputChange}
                        disabled={saving}
                      />
                      {formErrors.last_name && (
                        <div className="invalid-feedback">
                          {formErrors.last_name}
                        </div>
                      )}
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">DNI / NIE *</label>
                      <input
                        type="text"
                        name="dni"
                        className={`form-control text-uppercase ${
                          formErrors.dni ? "is-invalid" : ""
                        }`}
                        placeholder="12345678A or X1234567A"
                        maxLength={9}
                        value={mechanicForm.dni}
                        onChange={handleInputChange}
                        disabled={saving}
                      />
                      {formErrors.dni && (
                        <div className="invalid-feedback">{formErrors.dni}</div>
                      )}
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Phone *</label>
                      <input
                        type="tel"
                        name="phone"
                        className={`form-control ${
                          formErrors.phone ? "is-invalid" : ""
                        }`}
                        placeholder="+34612345678"
                        value={mechanicForm.phone}
                        onChange={handleInputChange}
                        disabled={saving}
                      />
                      {formErrors.phone && (
                        <div className="invalid-feedback">{formErrors.phone}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mechanic-form-section">
                  <p className="mechanic-form-section-title">Account</p>
                  <label className="form-label fw-semibold">Email *</label>
                  <input
                    type="email"
                    name="email"
                    className={`form-control ${
                      formErrors.email ? "is-invalid" : ""
                    }`}
                    value={mechanicForm.email}
                    onChange={handleInputChange}
                    disabled={isEditing || saving}
                  />
                  {formErrors.email && (
                    <div className="invalid-feedback">{formErrors.email}</div>
                  )}
                  <div className="form-text">
                    {isEditing
                      ? "The login email cannot be changed from this screen."
                      : "This is the email the mechanic will use to log in."}
                  </div>
                </div>

                <div className="mechanic-form-section">
                  <p className="mechanic-form-section-title">
                    Professional information
                  </p>

                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Specialty</label>
                      <input
                        type="text"
                        name="specialty"
                        className="form-control"
                        placeholder="Example: Engine repair"
                        value={mechanicForm.specialty}
                        onChange={handleInputChange}
                        disabled={saving}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Address</label>
                      <input
                        type="text"
                        name="address"
                        className="form-control"
                        placeholder="Optional"
                        value={mechanicForm.address}
                        onChange={handleInputChange}
                        disabled={saving}
                      />
                    </div>
                  </div>
                </div>

                {!isEditing && (
                  <div className="mechanic-form-section">
                    <p className="mechanic-form-section-title">
                      Temporary password
                    </p>

                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold">Password *</label>
                        <div className="input-group has-validation">
                          <input
                            type={showPassword ? "text" : "password"}
                            name="temporary_password"
                            autoComplete="new-password"
                            className={`form-control ${
                              formErrors.temporary_password ? "is-invalid" : ""
                            }`}
                            value={mechanicForm.temporary_password}
                            onChange={handleInputChange}
                            disabled={saving}
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            onClick={() => setShowPassword((current) => !current)}
                            disabled={saving}
                          >
                            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                          </button>
                          {formErrors.temporary_password && (
                            <div className="invalid-feedback">
                              {formErrors.temporary_password}
                            </div>
                          )}
                        </div>
                        <div className="form-text">
                          Minimum 8 characters with uppercase, lowercase and a number.
                        </div>
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold">
                          Confirm password *
                        </label>
                        <div className="input-group has-validation">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirm_password"
                            autoComplete="new-password"
                            className={`form-control ${
                              formErrors.confirm_password ? "is-invalid" : ""
                            }`}
                            value={mechanicForm.confirm_password}
                            onChange={handleInputChange}
                            disabled={saving}
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            aria-label={
                              showConfirmPassword ? "Hide password" : "Show password"
                            }
                            onClick={() =>
                              setShowConfirmPassword((current) => !current)
                            }
                            disabled={saving}
                          >
                            {showConfirmPassword ? (
                              <EyeOff size={17} />
                            ) : (
                              <Eye size={17} />
                            )}
                          </button>
                          {formErrors.confirm_password && (
                            <div className="invalid-feedback">
                              {formErrors.confirm_password}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer bg-light border-0 px-4 py-3">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleCloseModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-warning fw-bold px-4"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Saving...
                    </>
                  ) : isEditing ? (
                    "Save changes"
                  ) : (
                    "Create mechanic"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}