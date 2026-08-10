import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CarFront,
  Columns3,
  Download,
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
  Trash2,
  Users,
} from "lucide-react";

import * as XLSX from "xlsx";

import {
  createCustomer,
  deactivateCustomer,
  getCustomers,
  updateCustomer,
} from "../services/api";

import {
  buildCustomerPayload,
  CustomerForm,
  EMPTY_CUSTOMER_FORM,
  validateCustomerForm,
} from "../components/CustomerForm";

import "./CustomerList.css";




// =========================================================
// INITIAL STATES
// =========================================================

const INITIAL_FILTERS = {
  full_name: "",
  dni: "",
  driving_license: "",
  phone: "",
  email: "",
  vehicles_summary: "",
  address: "",
};


const INITIAL_VISIBILITY = {
  customer: true,
  contact: true,
  vehicles: true,
  address: false,
};




const COLUMN_OPTIONS = [
  {
    key: "customer",
    label: "Customer",
  },
  {
    key: "contact",
    label: "Contact",
  },
  {
    key: "vehicles",
    label: "Vehicles",
  },
  {
    key: "address",
    label: "Address",
  },
];


// =========================================================
// HELPERS
// =========================================================

const formatVehicle = (vehicle) => {
  const plate =
    vehicle.plate || "No plate";

  const brandModel = [
    vehicle.brand,
    vehicle.model,
  ]
    .filter(Boolean)
    .join(" ");

  return brandModel
    ? `${plate} - ${brandModel}`
    : plate;
};


const normalizeCustomer = (customer) => {
  const vehicles =
    customer.vehicles || [];

  return {
    id: customer.id,

    first_name:
      customer.first_name || "",

    last_name:
      customer.last_name || "",

    full_name: `${
      customer.first_name || ""
    } ${
      customer.last_name || ""
    }`.trim(),

    dni:
      customer.dni || "",

    driving_license:
      customer.driving_license || "",

    phone:
      customer.phone || "",

    email:
      customer.email || "",

    address:
      customer.address || "",

    vehicles,

    vehicles_count:
      customer.vehicles_count ??
      vehicles.length,

    vehicles_summary:
      vehicles.length > 0
        ? vehicles
            .map(formatVehicle)
            .join(" | ")
        : "",
  };
};


const getInitials = (customer) => {
  const first =
    customer.first_name?.[0] || "";

  const last =
    customer.last_name?.[0] || "";

  return `${first}${last}`
    .toUpperCase() || "?";
};


const escapeCsvValue = (value) => {
  return `"${String(value ?? "")
    .replaceAll('"', '""')}"`;
};


// =========================================================
// SMART SEARCH
// =========================================================

const matchesWordStart = (
  value,
  searchTerm
) => {
  const normalizedValue =
    String(value || "")
      .toLowerCase()
      .trim();

  return normalizedValue
    .split(/\s+/)
    .some((word) =>
      word.startsWith(
        searchTerm
      )
    );
};


// =========================================================
// COMPONENT
// =========================================================

export default function CustomerList() {

  // -------------------------------------------------------
  // Customer data
  // -------------------------------------------------------

  const [data, setData] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  // -------------------------------------------------------
  // Search and filters
  // -------------------------------------------------------

  const [
    globalSearch,
    setGlobalSearch,
  ] = useState("");

  const [
    columnFilters,
    setColumnFilters,
  ] = useState(
    INITIAL_FILTERS
  );

  const [
    showFilters,
    setShowFilters,
  ] = useState(false);


  // -------------------------------------------------------
  // Table options
  // -------------------------------------------------------

  const [
    visibleColumns,
    setVisibleColumns,
  ] = useState(
    INITIAL_VISIBILITY
  );

  const [
    showColumnsMenu,
    setShowColumnsMenu,
  ] = useState(false);

  const [
    showExportMenu,
    setShowExportMenu,
  ] = useState(false);


  // -------------------------------------------------------
  // Pagination
  // -------------------------------------------------------

  const [
    recordsPerPage,
    setRecordsPerPage,
  ] = useState(10);

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);


  // -------------------------------------------------------
  // Customer modal
  // -------------------------------------------------------

  const [
    showCustomerModal,
    setShowCustomerModal,
  ] = useState(false);

  const [
    editingCustomer,
    setEditingCustomer,
  ] = useState(null);

  const [
    customerForm,
    setCustomerForm,
  ] = useState(
    EMPTY_CUSTOMER_FORM
  );

  const [
    formErrors,
    setFormErrors,
  ] = useState({});

  const [
    modalError,
    setModalError,
  ] = useState("");

  const [
    savingCustomer,
    setSavingCustomer,
  ] = useState(false);

  const [
    deactivatingId,
    setDeactivatingId,
  ] = useState(null);


  // =======================================================
  // LOAD CUSTOMERS
  // =======================================================

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const result =
        await getCustomers();

      const customers =
        result.customers || [];

      setData(
        customers.map(
          normalizeCustomer
        )
      );

    } catch (error) {

      setError(
        error.message ||
          "Could not load customers."
      );

    } finally {

      setLoading(false);
    }
  };


  useEffect(() => {
    fetchCustomers();
  }, []);


  // Prevent background scroll while modal is open.

  useEffect(() => {

    if (!showCustomerModal) {
      return;
    }

    const originalOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        originalOverflow;
    };

  }, [showCustomerModal]);


  // =======================================================
  // FILTERING
  // =======================================================

  const activeFilterCount =
    useMemo(() => {

      return Object.values(
        columnFilters
      ).filter(
        (value) =>
          value.trim() !== ""
      ).length;

    }, [columnFilters]);


  const filteredData =
    useMemo(() => {

      const searchTerm =
        globalSearch
          .trim()
          .toLowerCase();


      return data.filter(
        (customer) => {

          // -------------------------------------------------
          // Natural text fields
          //
          // Search must match the START of a word.
          //
          // adr -> Adriano ✅
          // adr -> Madrid ❌
          // mad -> Madrid ✅
          // maz -> Mazda ✅
          // -------------------------------------------------

          const matchesTextFields = [
            customer.full_name,
            customer.address,
            customer.vehicles_summary,
          ].some((value) =>
            matchesWordStart(
              value,
              searchTerm
            )
          );


          // -------------------------------------------------
          // Identifier fields
          //
          // Partial matches are useful here.
          //
          // 6004 -> phone ✅
          // X542 -> NIE ✅
          // gmail -> email ✅
          // -------------------------------------------------

          const matchesFlexibleFields = [
            customer.dni,
            customer.phone,
            customer.email,
            customer.driving_license,
          ].some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(
                searchTerm
              )
          );


          const matchesGlobal =
            !searchTerm ||
            matchesTextFields ||
            matchesFlexibleFields;


          // -------------------------------------------------
          // Advanced filters
          // -------------------------------------------------

          const matchesFilters =
            Object.entries(
              columnFilters
            ).every(
              ([key, value]) => {

                const filterValue =
                  value
                    .trim()
                    .toLowerCase();

                if (!filterValue) {
                  return true;
                }

                return String(
                  customer[key] || ""
                )
                  .toLowerCase()
                  .includes(
                    filterValue
                  );
              }
            );


          return (
            matchesGlobal &&
            matchesFilters
          );
        }
      );

    }, [
      data,
      globalSearch,
      columnFilters,
    ]);


  const handleFilterChange = (
    field,
    value
  ) => {

    setColumnFilters(
      (currentFilters) => ({
        ...currentFilters,
        [field]: value,
      })
    );

    setCurrentPage(1);
  };


  const handleClearFilters = () => {

    setGlobalSearch("");

    setColumnFilters(
      INITIAL_FILTERS
    );

    setCurrentPage(1);
  };


  // =======================================================
  // PAGINATION
  // =======================================================

  const totalPages =
    recordsPerPage === -1
      ? 1
      : Math.max(
          1,
          Math.ceil(
            filteredData.length /
              recordsPerPage
          )
        );


  useEffect(() => {

    if (
      currentPage > totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }

  }, [
    currentPage,
    totalPages,
  ]);


  const paginatedData =
    useMemo(() => {

      if (
        recordsPerPage === -1
      ) {
        return filteredData;
      }

      const startIndex =
        (currentPage - 1) *
        recordsPerPage;

      return filteredData.slice(
        startIndex,
        startIndex +
          recordsPerPage
      );

    }, [
      filteredData,
      currentPage,
      recordsPerPage,
    ]);


  const firstVisibleRecord =
    filteredData.length === 0
      ? 0
      : recordsPerPage === -1
        ? 1
        : (currentPage - 1) *
            recordsPerPage +
          1;


  const lastVisibleRecord =
    recordsPerPage === -1
      ? filteredData.length
      : Math.min(
          currentPage *
            recordsPerPage,
          filteredData.length
        );


  const visiblePageNumbers =
    useMemo(() => {

      const amount =
        Math.min(
          5,
          totalPages
        );

      let start =
        Math.max(
          1,
          currentPage - 2
        );

      if (
        start + amount - 1 >
        totalPages
      ) {
        start =
          Math.max(
            1,
            totalPages -
              amount +
              1
          );
      }

      return Array.from(
        {
          length: amount,
        },
        (_, index) =>
          start + index
      );

    }, [
      currentPage,
      totalPages,
    ]);


  // =======================================================
  // COLUMN VISIBILITY
  // =======================================================

  const handleToggleColumn = (
    column
  ) => {

    setVisibleColumns(
      (currentColumns) => ({
        ...currentColumns,
        [column]:
          !currentColumns[
            column
          ],
      })
    );
  };


  const tableColumnCount =
    Object.values(
      visibleColumns
    ).filter(Boolean).length + 1;


  // =======================================================
  // EXPORT
  // =======================================================

  const getExportRows = () => {

    return filteredData.map(
      (customer) => ({
        Name:
          customer.full_name,

        "DNI / NIE":
          customer.dni,

        "Driving License":
          customer.driving_license,

        Phone:
          customer.phone,

        Email:
          customer.email,

        Address:
          customer.address,

        Vehicles:
          customer.vehicles_summary ||
          "No vehicles",
      })
    );
  };


  const handleExportExcel = () => {

    const exportRows =
      getExportRows();

    const worksheet =
      XLSX.utils.json_to_sheet(
        exportRows
      );

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Customers"
    );

    XLSX.writeFile(
      workbook,
      "customer_list.xlsx"
    );

    setShowExportMenu(false);
  };


  const handleExportCSV = () => {

    const exportRows =
      getExportRows();

    if (
      exportRows.length === 0
    ) {
      return;
    }

    const headers =
      Object.keys(
        exportRows[0]
      );

    const rows =
      exportRows.map(
        (row) =>
          headers
            .map((header) =>
              escapeCsvValue(
                row[header]
              )
            )
            .join(",")
      );


    const csvContent = [
      headers
        .map(
          escapeCsvValue
        )
        .join(","),

      ...rows,
    ].join("\n");


    const blob =
      new Blob(
        [csvContent],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      );


    const fileUrl =
      URL.createObjectURL(
        blob
      );


    const link =
      document.createElement(
        "a"
      );

    link.href =
      fileUrl;

    link.download =
      "customer_list.csv";

    document.body.appendChild(
      link
    );

    link.click();

    link.remove();

    URL.revokeObjectURL(
      fileUrl
    );

    setShowExportMenu(false);
  };


  // =======================================================
  // FORM
  // =======================================================

  const handleCustomerFormChange = (
    event
  ) => {

    const {
      name,
      value,
    } = event.target;


    setCustomerForm(
      (currentCustomer) => ({
        ...currentCustomer,
        [name]: value,
      })
    );


    if (formErrors[name]) {

      setFormErrors(
        (currentErrors) => ({
          ...currentErrors,
          [name]: undefined,
        })
      );
    }


    setModalError("");
  };


  // =======================================================
  // MODAL
  // =======================================================

  const handleOpenCreateModal =
    () => {

      setEditingCustomer(null);

      setCustomerForm(
        EMPTY_CUSTOMER_FORM
      );

      setFormErrors({});

      setModalError("");

      setShowCustomerModal(
        true
      );
    };


  const handleOpenEditModal = (
    customer
  ) => {

    setEditingCustomer(
      customer
    );

    setCustomerForm({
      first_name:
        customer.first_name || "",

      last_name:
        customer.last_name || "",

      dni:
        customer.dni || "",

      driving_license:
        customer.driving_license ||
        "",

      phone:
        customer.phone || "",

      email:
        customer.email || "",

      address:
        customer.address || "",
    });

    setFormErrors({});

    setModalError("");

    setShowCustomerModal(
      true
    );
  };


  const handleCloseModal = () => {

    if (savingCustomer) {
      return;
    }

    setShowCustomerModal(
      false
    );

    setEditingCustomer(null);

    setCustomerForm(
      EMPTY_CUSTOMER_FORM
    );

    setFormErrors({});

    setModalError("");
  };


  const handleBackdropClick = (
    event
  ) => {

    if (
      event.target ===
      event.currentTarget
    ) {
      handleCloseModal();
    }
  };


  // =======================================================
  // CREATE / UPDATE CUSTOMER
  // =======================================================

  const handleSaveCustomer =
    async (event) => {

      event.preventDefault();


      const validationErrors =
        validateCustomerForm(customerForm);


      if (
        Object.keys(
          validationErrors
        ).length > 0
      ) {

        setFormErrors(
          validationErrors
        );

        return;
      }


      try {

        setSavingCustomer(
          true
        );

        setModalError("");


        const payload =
          buildCustomerPayload(
            customerForm
          );


        if (editingCustomer) {

          const result =
            await updateCustomer(
              editingCustomer.id,
              payload
            );


          const updatedCustomer =
            normalizeCustomer({
              ...editingCustomer,
              ...(result.customer ||
                payload),
            });


          setData(
            (currentData) =>
              currentData.map(
                (customer) =>
                  customer.id ===
                  editingCustomer.id
                    ? updatedCustomer
                    : customer
              )
          );

        } else {

          const result =
            await createCustomer(
              payload
            );


          if (result.customer) {

            setData(
              (currentData) => [
                normalizeCustomer(
                  result.customer
                ),
                ...currentData,
              ]
            );

          } else {

            await fetchCustomers();
          }
        }


        setShowCustomerModal(
          false
        );

        setEditingCustomer(null);

        setCustomerForm(
          EMPTY_CUSTOMER_FORM
        );

        setFormErrors({});

      } catch (error) {

        setModalError(
          error.message ||
            "Could not save customer."
        );

      } finally {

        setSavingCustomer(
          false
        );
      }
    };


  // =======================================================
  // DEACTIVATE CUSTOMER
  // =======================================================

  const handleDeactivateCustomer =
    async (customer) => {

      const confirmed =
        window.confirm(
          `Deactivate ${customer.full_name}?`
        );


      if (!confirmed) {
        return;
      }


      try {

        setDeactivatingId(
          customer.id
        );

        setError("");


        await deactivateCustomer(
          customer.id
        );


        setData(
          (currentData) =>
            currentData.filter(
              (item) =>
                String(item.id) !==
                String(customer.id)
            )
        );

      } catch (error) {

        setError(
          error.message ||
            "Could not deactivate customer."
        );

      } finally {

        setDeactivatingId(
          null
        );
      }
    };


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <section className="customer-page">

      {/* ===================================================
          PAGE HEADER
          =================================================== */}

      <div className="mb-4">

        <div className="d-flex align-items-center gap-3">

          <div className="customer-page-icon bg-dark text-warning rounded-3 d-flex align-items-center justify-content-center flex-shrink-0">

            <Users size={24} />

          </div>


          <div>

            <h1 className="h3 fw-bold mb-1">
              Customers
            </h1>

            <p className="text-secondary mb-0">
              Manage customer and vehicle information
              registered in your workshop.
            </p>

          </div>

        </div>

      </div>


      {/* ERROR */}

      {error && (

        <div
          className="alert alert-danger"
          role="alert"
        >
          {error}
        </div>

      )}


      {/* ===================================================
          TOOLBAR
          =================================================== */}

      <div className="card border-0 shadow-sm rounded-4 mb-3">

        <div className="card-body p-3">

          <div className="row g-2 align-items-center">


            {/* SEARCH */}

            <div className="col-12 col-xl">

              <div className="input-group">

                <span className="input-group-text bg-white border-end-0">

                  <Search
                    size={18}
                    className="text-secondary"
                  />

                </span>


                <input
                  type="search"
                  className="form-control border-start-0 ps-0"
                  placeholder="Search by name, DNI, phone, email, address or vehicle..."
                  value={
                    globalSearch
                  }
                  onChange={(
                    event
                  ) => {

                    setGlobalSearch(
                      event.target.value
                    );

                    setCurrentPage(1);
                  }}
                />

              </div>

            </div>


            {/* FILTERS */}

            <div className="col-12 col-sm-auto">

              <button
                type="button"
                className={`btn w-100 d-flex align-items-center justify-content-center gap-2 ${
                  showFilters ||
                  activeFilterCount > 0
                    ? "btn-dark"
                    : "btn-outline-secondary"
                }`}
                onClick={() =>
                  setShowFilters(
                    (current) =>
                      !current
                  )
                }
              >

                <SlidersHorizontal
                  size={17}
                />

                Filters


                {activeFilterCount >
                  0 && (

                  <span className="badge bg-warning text-dark">
                    {
                      activeFilterCount
                    }
                  </span>

                )}

              </button>

            </div>


            {/* EXPORT */}

            <div className="col-6 col-sm-auto position-relative">

              <button
                type="button"
                className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
                onClick={() => {

                  setShowExportMenu(
                    (current) =>
                      !current
                  );

                  setShowColumnsMenu(
                    false
                  );
                }}
              >

                <Download
                  size={17}
                />

                Export

              </button>


              {showExportMenu && (

                <div className="dropdown-menu dropdown-menu-end show customer-dropdown-menu shadow">

                  <button
                    type="button"
                    className="dropdown-item d-flex align-items-center gap-2 py-2"
                    onClick={
                      handleExportExcel
                    }
                  >

                    <FileSpreadsheet
                      size={17}
                    />

                    Excel

                  </button>


                  <button
                    type="button"
                    className="dropdown-item d-flex align-items-center gap-2 py-2"
                    onClick={
                      handleExportCSV
                    }
                  >

                    <FileText
                      size={17}
                    />

                    CSV

                  </button>

                </div>

              )}

            </div>


            {/* COLUMNS */}

            <div className="col-6 col-sm-auto position-relative">

              <button
                type="button"
                className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
                onClick={() => {

                  setShowColumnsMenu(
                    (current) =>
                      !current
                  );

                  setShowExportMenu(
                    false
                  );
                }}
              >

                <Columns3
                  size={17}
                />

                Columns

              </button>


              {showColumnsMenu && (

                <div className="dropdown-menu dropdown-menu-end show customer-dropdown-menu shadow p-2">

                  <p className="dropdown-header fw-bold text-dark px-2">
                    Visible columns
                  </p>


                  {COLUMN_OPTIONS.map(
                    (column) => (

                      <label
                        key={
                          column.key
                        }
                        className="dropdown-item d-flex align-items-center gap-2 py-2 customer-column-option"
                      >

                        <input
                          type="checkbox"
                          className="form-check-input m-0"
                          checked={
                            visibleColumns[
                              column.key
                            ]
                          }
                          onChange={() =>
                            handleToggleColumn(
                              column.key
                            )
                          }
                        />

                        {
                          column.label
                        }

                      </label>

                    )
                  )}

                </div>

              )}

            </div>


            {/* ADD CUSTOMER */}

            <div className="col-12 col-sm-auto">

              <button
                type="button"
                className="btn btn-warning w-100 fw-bold d-flex align-items-center justify-content-center gap-2 px-3"
                onClick={
                  handleOpenCreateModal
                }
              >

                <Plus size={17} />

                Add customer

              </button>

            </div>

          </div>

        </div>

      </div>


      {/* ===================================================
          ADVANCED FILTERS
          =================================================== */}

      {showFilters && (

        <div className="card border-0 shadow-sm rounded-4 mb-3 customer-filter-panel">

          <div className="card-body p-4">

            <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4">

              <div>

                <h2 className="h6 fw-bold mb-1">
                  Advanced filters
                </h2>

                <p className="small text-secondary mb-0">
                  Results update as you type.
                </p>

              </div>


              <button
                type="button"
                className="btn btn-sm btn-outline-danger d-inline-flex align-items-center justify-content-center gap-2 align-self-md-start"
                onClick={
                  handleClearFilters
                }
              >

                <FilterX
                  size={16}
                />

                Clear filters

              </button>

            </div>


            <div className="row g-3">


              <div className="col-12 col-md-6 col-xl-4">

                <label className="form-label small fw-semibold">
                  Name
                </label>

                <input
                  type="text"
                  className="form-control"
                  placeholder="Customer name"
                  value={
                    columnFilters.full_name
                  }
                  onChange={(
                    event
                  ) =>
                    handleFilterChange(
                      "full_name",
                      event.target.value
                    )
                  }
                />

              </div>


              <div className="col-12 col-md-6 col-xl-4">

                <label className="form-label small fw-semibold">
                  DNI / NIE
                </label>

                <input
                  type="text"
                  className="form-control text-uppercase"
                  placeholder="12345678Z"
                  value={
                    columnFilters.dni
                  }
                  onChange={(
                    event
                  ) =>
                    handleFilterChange(
                      "dni",
                      event.target.value
                    )
                  }
                />

              </div>


              <div className="col-12 col-md-6 col-xl-4">

                <label className="form-label small fw-semibold">
                  Driving licence
                </label>

                <input
                  type="text"
                  className="form-control"
                  placeholder="Licence"
                  value={
                    columnFilters.driving_license
                  }
                  onChange={(
                    event
                  ) =>
                    handleFilterChange(
                      "driving_license",
                      event.target.value
                    )
                  }
                />

              </div>


              <div className="col-12 col-md-6 col-xl-4">

                <label className="form-label small fw-semibold">
                  Phone
                </label>

                <input
                  type="text"
                  className="form-control"
                  placeholder="Phone number"
                  value={
                    columnFilters.phone
                  }
                  onChange={(
                    event
                  ) =>
                    handleFilterChange(
                      "phone",
                      event.target.value
                    )
                  }
                />

              </div>


              <div className="col-12 col-md-6 col-xl-4">

                <label className="form-label small fw-semibold">
                  Email
                </label>

                <input
                  type="text"
                  className="form-control"
                  placeholder="Email address"
                  value={
                    columnFilters.email
                  }
                  onChange={(
                    event
                  ) =>
                    handleFilterChange(
                      "email",
                      event.target.value
                    )
                  }
                />

              </div>


              <div className="col-12 col-md-6 col-xl-4">

                <label className="form-label small fw-semibold">
                  Vehicle
                </label>

                <input
                  type="text"
                  className="form-control"
                  placeholder="Plate, brand or model"
                  value={
                    columnFilters.vehicles_summary
                  }
                  onChange={(
                    event
                  ) =>
                    handleFilterChange(
                      "vehicles_summary",
                      event.target.value
                    )
                  }
                />

              </div>


              <div className="col-12">

                <label className="form-label small fw-semibold">
                  Address
                </label>

                <input
                  type="text"
                  className="form-control"
                  placeholder="Customer address"
                  value={
                    columnFilters.address
                  }
                  onChange={(
                    event
                  ) =>
                    handleFilterChange(
                      "address",
                      event.target.value
                    )
                  }
                />

              </div>

            </div>

          </div>

        </div>

      )}


      {/* ===================================================
          RESULT SUMMARY
          =================================================== */}

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">

        <p className="small text-secondary mb-0">

          {filteredData.length ===
          data.length
            ? `${data.length} ${
                data.length === 1
                  ? "customer"
                  : "customers"
              }`
            : `${filteredData.length} of ${data.length} customers`}

        </p>


        {(globalSearch ||
          activeFilterCount >
            0) && (

          <button
            type="button"
            className="btn btn-link btn-sm text-danger text-decoration-none p-0"
            onClick={
              handleClearFilters
            }
          >

            Clear search and filters

          </button>

        )}

      </div>


      {/* ===================================================
          TABLE
          =================================================== */}

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">

        <div className="table-responsive">

          <table className="table align-middle mb-0 customer-table">

            <thead>

              <tr>

                {visibleColumns.customer && (
                  <th>
                    Customer
                  </th>
                )}

                {visibleColumns.contact && (
                  <th>
                    Contact
                  </th>
                )}

                {visibleColumns.vehicles && (
                  <th>
                    Vehicles
                  </th>
                )}

                {visibleColumns.address && (
                  <th>
                    Address
                  </th>
                )}

                <th className="text-end">
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>

              {loading ? (

                <tr>

                  <td
                    colSpan={
                      tableColumnCount
                    }
                    className="text-center py-5"
                  >

                    <div
                      className="spinner-border spinner-border-sm text-warning me-2"
                      role="status"
                    />

                    Loading customers...

                  </td>

                </tr>

              ) : paginatedData.length ===
                0 ? (

                <tr>

                  <td
                    colSpan={
                      tableColumnCount
                    }
                    className="text-center py-5"
                  >

                    <Users
                      size={34}
                      className="text-secondary mb-3"
                    />

                    <h3 className="h6 fw-bold">
                      No customers found
                    </h3>

                    <p className="small text-secondary mb-0">
                      Try changing the search or filters.
                    </p>

                  </td>

                </tr>

              ) : (

                paginatedData.map(
                  (customer) => (

                    <tr
                      key={
                        customer.id
                      }
                    >


                      {/* CUSTOMER */}

                      {visibleColumns.customer && (

                        <td>

                          <div className="d-flex align-items-center gap-3">

                            <div className="customer-avatar rounded-circle bg-dark text-warning d-flex align-items-center justify-content-center fw-bold flex-shrink-0">

                              {getInitials(
                                customer
                              )}

                            </div>


                            <div>

                              <p className="fw-bold mb-1">
                                {
                                  customer.full_name
                                }
                              </p>


                              <div className="small text-secondary">

                                {customer.dni
                                  ? `DNI/NIE: ${customer.dni}`
                                  : "No DNI/NIE"}


                                {customer.driving_license && (

                                  <span className="d-block">

                                    Licence:{" "}
                                    {
                                      customer.driving_license
                                    }

                                  </span>

                                )}

                              </div>

                            </div>

                          </div>

                        </td>

                      )}


                      {/* CONTACT */}

                      {visibleColumns.contact && (

                        <td>

                          <div className="d-flex flex-column gap-1 small">

                            <span className="d-flex align-items-center gap-2">

                              <Phone
                                size={14}
                                className="text-secondary"
                              />

                              {customer.phone ||
                                "-"}

                            </span>


                            <span className="d-flex align-items-center gap-2 text-secondary">

                              <Mail
                                size={14}
                              />

                              {customer.email ||
                                "No email"}

                            </span>

                          </div>

                        </td>

                      )}


                      {/* VEHICLES */}

                      {visibleColumns.vehicles && (

                        <td>

                          {customer.vehicles.length >
                          0 ? (

                            <div className="d-flex flex-column gap-2">

                              {customer.vehicles
                                .slice(
                                  0,
                                  2
                                )
                                .map(
                                  (
                                    vehicle
                                  ) => (

                                    <div
                                      key={
                                        vehicle.id
                                      }
                                      className="d-flex align-items-center gap-2 small"
                                    >

                                      <CarFront
                                        size={15}
                                        className="text-warning flex-shrink-0"
                                      />

                                      <span>

                                        <strong>
                                          {vehicle.plate ||
                                            "No plate"}
                                        </strong>


                                        {(vehicle.brand ||
                                          vehicle.model) && (

                                          <span className="text-secondary">

                                            {" "}
                                            ·{" "}

                                            {[
                                              vehicle.brand,
                                              vehicle.model,
                                            ]
                                              .filter(
                                                Boolean
                                              )
                                              .join(
                                                " "
                                              )}

                                          </span>

                                        )}

                                      </span>

                                    </div>

                                  )
                                )}


                              {customer.vehicles.length >
                                2 && (

                                <span className="small text-secondary">

                                  +
                                  {customer
                                    .vehicles
                                    .length -
                                    2}{" "}
                                  more

                                </span>

                              )}

                            </div>

                          ) : customer.vehicles_count >
                            0 ? (

                            <span className="small text-secondary">

                              {
                                customer.vehicles_count
                              }{" "}
                              vehicles

                            </span>

                          ) : (

                            <span className="small text-secondary">
                              No vehicles
                            </span>

                          )}

                        </td>

                      )}


                      {/* ADDRESS */}

                      {visibleColumns.address && (

                        <td>

                          <div className="d-flex align-items-start gap-2 small customer-address">

                            <MapPin
                              size={15}
                              className="text-secondary flex-shrink-0 mt-1"
                            />

                            <span>

                              {customer.address ||
                                "No address"}

                            </span>

                          </div>

                        </td>

                      )}


                      {/* ACTIONS */}

                      <td className="text-end">

                        <div className="d-inline-flex align-items-center gap-2">

                          <button
                            type="button"
                            className="btn btn-sm customer-action-button customer-action-edit"
                            title="Edit customer"
                            aria-label={`Edit ${customer.full_name}`}
                            onClick={() =>
                              handleOpenEditModal(
                                customer
                              )
                            }
                          >

                            <Pencil
                              size={16}
                            />

                          </button>


                          <button
                            type="button"
                            className="btn btn-sm customer-action-button customer-action-delete"
                            title="Deactivate customer"
                            aria-label={`Deactivate ${customer.full_name}`}
                            disabled={
                              deactivatingId ===
                              customer.id
                            }
                            onClick={() =>
                              handleDeactivateCustomer(
                                customer
                              )
                            }
                          >

                            {deactivatingId ===
                            customer.id ? (

                              <span className="spinner-border spinner-border-sm" />

                            ) : (

                              <Trash2
                                size={16}
                              />

                            )}

                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* ===================================================
          PAGINATION
          =================================================== */}

      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mt-3">

        <div className="d-flex flex-wrap align-items-center gap-3">

          <label className="d-flex align-items-center gap-2 small text-secondary">

            Show

            <select
              className="form-select form-select-sm customer-record-select"
              value={
                recordsPerPage
              }
              onChange={(
                event
              ) => {

                setRecordsPerPage(
                  Number(
                    event.target.value
                  )
                );

                setCurrentPage(1);
              }}
            >

              <option value={10}>
                10
              </option>

              <option value={25}>
                25
              </option>

              <option value={50}>
                50
              </option>

              <option value={-1}>
                All
              </option>

            </select>

            records

          </label>


          <span className="small text-secondary">

            Showing{" "}
            {firstVisibleRecord}
            –
            {lastVisibleRecord}{" "}
            of{" "}
            {
              filteredData.length
            }

          </span>

        </div>


        {recordsPerPage !==
          -1 &&
          totalPages > 1 && (

          <nav aria-label="Customer pagination">

            <ul className="pagination pagination-sm mb-0">

              <li
                className={`page-item ${
                  currentPage === 1
                    ? "disabled"
                    : ""
                }`}
              >

                <button
                  type="button"
                  className="page-link"
                  disabled={
                    currentPage === 1
                  }
                  onClick={() =>
                    setCurrentPage(
                      (current) =>
                        Math.max(
                          1,
                          current - 1
                        )
                    )
                  }
                >

                  Previous

                </button>

              </li>


              {visiblePageNumbers.map(
                (pageNumber) => (

                  <li
                    key={
                      pageNumber
                    }
                    className={`page-item ${
                      currentPage ===
                      pageNumber
                        ? "active"
                        : ""
                    }`}
                  >

                    <button
                      type="button"
                      className="page-link"
                      onClick={() =>
                        setCurrentPage(
                          pageNumber
                        )
                      }
                    >

                      {
                        pageNumber
                      }

                    </button>

                  </li>

                )
              )}


              <li
                className={`page-item ${
                  currentPage ===
                  totalPages
                    ? "disabled"
                    : ""
                }`}
              >

                <button
                  type="button"
                  className="page-link"
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  onClick={() =>
                    setCurrentPage(
                      (current) =>
                        Math.min(
                          totalPages,
                          current + 1
                        )
                    )
                  }
                >

                  Next

                </button>

              </li>

            </ul>

          </nav>

        )}

      </div>


      {/* ===================================================
          CUSTOMER MODAL
          =================================================== */}

      {showCustomerModal && (

        <div
          className="modal show d-block customer-modal-layer"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          onMouseDown={
            handleBackdropClick
          }
        >

          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">

            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">


              {/* HEADER */}

              <div className="modal-header bg-dark text-white border-bottom border-warning border-3 p-4">

                <div>

                  <p className="small text-warning fw-bold text-uppercase mb-1">
                    Customer details
                  </p>

                  <h2 className="modal-title h4 fw-bold mb-0">

                    {editingCustomer
                      ? "Edit customer"
                      : "Add customer"}

                  </h2>

                </div>


                <button
                  type="button"
                  className="btn-close btn-close-white"
                  aria-label="Close"
                  disabled={
                    savingCustomer
                  }
                  onClick={
                    handleCloseModal
                  }
                />

              </div>


              <form
                onSubmit={
                  handleSaveCustomer
                }
                noValidate
              >

                <div className="modal-body p-4">


                  {modalError && (

                    <div
                      className="alert alert-danger"
                      role="alert"
                    >

                      {
                        modalError
                      }

                    </div>

                  )}


                  <CustomerForm
                    formData={customerForm}
                    errors={formErrors}
                    disabled={savingCustomer}
                    onChange={handleCustomerFormChange}
                    idPrefix="customer-modal"
                  />

                </div>


                {/* FOOTER */}

                <div className="modal-footer bg-light border-0 px-4 py-3">

                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    disabled={
                      savingCustomer
                    }
                    onClick={
                      handleCloseModal
                    }
                  >

                    Cancel

                  </button>


                  <button
                    type="submit"
                    className="btn btn-warning fw-bold px-4"
                    disabled={
                      savingCustomer
                    }
                  >

                    {savingCustomer ? (

                      <>
                        <span className="spinner-border spinner-border-sm me-2" />

                        Saving...
                      </>

                    ) : editingCustomer ? (

                      "Save changes"

                    ) : (

                      "Save customer"

                    )}

                  </button>

                </div>

              </form>

            </div>

          </div>

        </div>

      )}

    </section>
  );
}