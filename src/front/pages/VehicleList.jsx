import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  CarFront,
  Columns3,
  Download,
  FileSpreadsheet,
  FileText,
  FilterX,
  Fuel,
  Gauge,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  UserRound,
} from "lucide-react";

import * as XLSX from "xlsx";

import { apiFetch } from "../services/api";

import "./Vehicle-List.css";


// =========================================================
// VALIDATION
// =========================================================

const MAX_PLATE_LENGTH = 20;

const VIN_REGEX =
  /^[A-HJ-NPR-Z0-9]{17}$/;


// =========================================================
// FUEL TYPES
// =========================================================

const FUEL_OPTIONS = [
  {
    value: "gasoline",
    label: "Gasoline",
  },
  {
    value: "diesel",
    label: "Diesel",
  },
  {
    value: "hybrid",
    label: "Hybrid",
  },
  {
    value: "plug_in_hybrid",
    label: "Plug-in hybrid",
  },
  {
    value: "electric",
    label: "Electric",
  },
  {
    value: "lpg",
    label: "LPG",
  },
];

const VALID_FUEL_TYPES =
  FUEL_OPTIONS.map(
    (fuel) => fuel.value
  );


// =========================================================
// INITIAL STATES
// =========================================================

const INITIAL_FILTERS = {
  vehicle: "",
  owner: "",
  vin: "",
  fuel: "",
  year: "",
  power: "",
  displacement: "",
  color: "",
  mileage: "",
  registration_date: "",
};

const INITIAL_VISIBILITY = {
  vehicle: true,
  owner: true,
  details: true,
  registration: false,
};

const INITIAL_VEHICLE_FORM = {
  customer_id: "",
  plate: "",
  vin: "",
  brand: "",
  model: "",
  version: "",
  year: "",
  fuel_type: "gasoline",
  power_hp: "",
  engine_cc: "",
  color: "",
  mileage: "",
  first_registration_date: "",
};

const COLUMN_OPTIONS = [
  {
    key: "vehicle",
    label: "Vehicle",
  },
  {
    key: "owner",
    label: "Owner",
  },
  {
    key: "details",
    label: "Technical details",
  },
  {
    key: "registration",
    label: "Registration",
  },
];


// =========================================================
// HELPERS
// =========================================================

const normalizePlate = (
  value = ""
) => {
  return value
    .trim()
    .toUpperCase();
};


const getFuelLabel = (
  fuelValue
) => {
  return (
    FUEL_OPTIONS.find(
      (fuel) =>
        fuel.value === fuelValue
    )?.label ||
    fuelValue ||
    "Not specified"
  );
};


const getCustomerName = (
  customer
) => {
  if (!customer) {
    return "";
  }

  return [
    customer.first_name,
    customer.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
};


const findCustomer = (
  customers,
  customerId
) => {
  return customers.find(
    (customer) =>
      String(customer.id) ===
      String(customerId)
  );
};


const normalizeVehicle = (
  vehicle,
  customers = []
) => {

  const owner =
    findCustomer(
      customers,
      vehicle.customer_id
    );


  return {
    id:
      vehicle.id,

    license_plate:
      vehicle.plate || "",

    vin:
      vehicle.vin || "",

    brand:
      vehicle.brand || "",

    model:
      vehicle.model || "",

    version:
      vehicle.version || "",

    year:
      vehicle.year ?? "",

    fuel:
      vehicle.fuel_type || "",

    fuel_label:
      getFuelLabel(
        vehicle.fuel_type
      ),

    power:
      vehicle.power_hp ?? "",

    displacement:
      vehicle.engine_cc ?? "",

    color:
      vehicle.color || "",

    mileage:
      vehicle.mileage ?? 0,

    registration_date:
      vehicle.first_registration_date
        ? vehicle.first_registration_date
            .split("T")[0]
        : "",

    customer_id:
      vehicle.customer_id || "",

    customer_name:
      vehicle.customer_name ||
      getCustomerName(owner),

    customer_dni:
      vehicle.customer_dni ||
      owner?.dni ||
      "",

    active:
      vehicle.is_active !== false,
  };
};


const normalizeSearchValue = (
  value
) => {
  return String(value ?? "")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim();
};


const matchesWordStart = (
  value,
  searchTerm
) => {

  const normalizedValue =
    normalizeSearchValue(value);


  return normalizedValue
    .split(/[\s,./|()-]+/)
    .some(
      (word) =>
        word.startsWith(
          searchTerm
        )
    );
};


const escapeCsvValue = (
  value
) => {
  return `"${String(
    value ?? ""
  ).replaceAll('"', '""')}"`;
};


const formatMileage = (
  mileage
) => {

  const numericMileage =
    Number(mileage);


  if (
    Number.isNaN(
      numericMileage
    )
  ) {
    return "—";
  }


  return `${numericMileage.toLocaleString()} km`;
};


// =========================================================
// COMPONENT
// =========================================================

export default function VehicleList() {

  // =======================================================
  // DATA
  // =======================================================

  const [
    data,
    setData,
  ] = useState([]);

  const [
    customers,
    setCustomers,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  // =======================================================
  // SEARCH / FILTERS
  // =======================================================

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


  // =======================================================
  // TABLE OPTIONS
  // =======================================================

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


  // =======================================================
  // PAGINATION
  // =======================================================

  const [
    recordsPerPage,
    setRecordsPerPage,
  ] = useState(10);

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);


  // =======================================================
  // VEHICLE MODAL
  // =======================================================

  const [
    showModal,
    setShowModal,
  ] = useState(false);

  const [
    editingVehicle,
    setEditingVehicle,
  ] = useState(null);

  const [
    formState,
    setFormState,
  ] = useState(
    INITIAL_VEHICLE_FORM
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
    saving,
    setSaving,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState(null);


  // =======================================================
  // LOAD VEHICLES
  // =======================================================

  const loadVehicles =
    async () => {

      setLoading(true);
      setError("");


      try {

        const [
          vehiclesPayload,
          customersPayload,
        ] =
          await Promise.all([
            apiFetch(
              "/vehicles"
            ),

            apiFetch(
              "/customers"
            ),
          ]);


        const customerList =
          customersPayload.customers ||
          [];

        const vehicleList =
          vehiclesPayload.vehicles ||
          [];


        setCustomers(
          customerList
        );


        setData(
          vehicleList.map(
            (vehicle) =>
              normalizeVehicle(
                vehicle,
                customerList
              )
          )
        );


      } catch (requestError) {

        setError(
          requestError.message ||
            "Could not load vehicles."
        );


      } finally {

        setLoading(false);
      }
    };


  useEffect(() => {

    loadVehicles();

  }, []);


  // =======================================================
  // LOCK PAGE WHILE MODAL IS OPEN
  // =======================================================

  useEffect(() => {

    if (!showModal) {
      return;
    }


    const previousOverflow =
      document.body.style.overflow;


    document.body.style.overflow =
      "hidden";


    return () => {

      document.body.style.overflow =
        previousOverflow;
    };

  }, [showModal]);


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
        normalizeSearchValue(
          globalSearch
        );


      return data.filter(
        (vehicle) => {

          /*
           * Normal text fields:
           *
           * We search from the beginning
           * of each word.
           *
           * "Maz" -> Mazda
           * "azd" -> does not match Mazda
           *
           * "Man" -> Adriano Mancini
           */

          const matchesTextFields = [
            vehicle.brand,
            vehicle.model,
            vehicle.version,
            vehicle.customer_name,
            vehicle.color,
            vehicle.fuel_label,
          ].some(
            (value) =>
              matchesWordStart(
                value,
                searchTerm
              )
          );


          /*
           * Identifiers / numeric fields:
           *
           * They must START with the search.
           *
           * Search "22"
           * 2203MMY -> yes
           * 54111222544848888 -> no
           */

          const matchesFlexibleFields = [
            vehicle.license_plate,
            vehicle.vin,
            vehicle.customer_dni,
            vehicle.year,
            vehicle.power,
            vehicle.displacement,
            vehicle.mileage,
            vehicle.registration_date,
          ].some(
            (value) =>
              normalizeSearchValue(
                value
              ).startsWith(
                searchTerm
              )
          );


          const matchesGlobal =
            !searchTerm ||
            matchesTextFields ||
            matchesFlexibleFields;


          const filterValues = {

            vehicle: [
              vehicle.license_plate,
              vehicle.brand,
              vehicle.model,
              vehicle.version,
            ].join(" "),

            owner: [
              vehicle.customer_name,
              vehicle.customer_dni,
            ].join(" "),

            vin:
              vehicle.vin,

            fuel: [
              vehicle.fuel,
              vehicle.fuel_label,
            ].join(" "),

            year:
              vehicle.year,

            power:
              vehicle.power,

            displacement:
              vehicle.displacement,

            color:
              vehicle.color,

            mileage:
              vehicle.mileage,

            registration_date:
              vehicle.registration_date,
          };


          const matchesFilters =
            Object.entries(
              columnFilters
            ).every(
              ([key, value]) => {

                const filterValue =
                  normalizeSearchValue(
                    value
                  );


                if (!filterValue) {
                  return true;
                }


                return normalizeSearchValue(
                  filterValues[key]
                ).includes(
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

        [field]:
          value,
      })
    );


    setCurrentPage(1);
  };


  const handleClearFilters =
    () => {

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
      currentPage >
      totalPages
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
        start +
          amount -
          1 >
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
  // COLUMNS
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
    ).filter(Boolean).length +
    1;


  // =======================================================
  // EXPORT
  // =======================================================

  const getExportRows =
    () => {

      return filteredData.map(
        (vehicle) => ({

          Plate:
            vehicle.license_plate,

          VIN:
            vehicle.vin,

          Brand:
            vehicle.brand,

          Model:
            vehicle.model,

          Version:
            vehicle.version,

          Owner:
            vehicle.customer_name,

          "Owner DNI / NIE":
            vehicle.customer_dni,

          Year:
            vehicle.year,

          Fuel:
            vehicle.fuel_label,

          "Power HP":
            vehicle.power,

          "Engine CC":
            vehicle.displacement,

          Color:
            vehicle.color,

          Mileage:
            vehicle.mileage,

          "First Registration Date":
            vehicle.registration_date,
        })
      );
    };


  const handleExportExcel =
    () => {

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
        "Vehicles"
      );


      XLSX.writeFile(
        workbook,
        "vehicle_list.xlsx"
      );


      setShowExportMenu(
        false
      );
    };


  const handleExportCSV =
    () => {

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
              .map(
                (header) =>
                  escapeCsvValue(
                    row[
                      header
                    ]
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
        "vehicle_list.csv";


      document.body.appendChild(
        link
      );


      link.click();

      link.remove();


      URL.revokeObjectURL(
        fileUrl
      );


      setShowExportMenu(
        false
      );
    };


  // =======================================================
  // FORM CHANGE
  // =======================================================

  const handleInputChange = (
    event
  ) => {

    const {
      name,
      value,
    } = event.target;


    let nextValue =
      value;


    if (
      name === "plate"
    ) {

      nextValue =
        value.toUpperCase();
    }


    if (
      name === "vin"
    ) {

      nextValue =
        value
          .replace(
            /\s/g,
            ""
          )
          .toUpperCase();
    }


    setFormState(
      (currentForm) => ({
        ...currentForm,

        [name]:
          nextValue,
      })
    );


    if (
      formErrors[name]
    ) {

      setFormErrors(
        (currentErrors) => ({
          ...currentErrors,

          [name]:
            undefined,
        })
      );
    }


    setModalError("");
  };


  // =======================================================
  // VALIDATE VEHICLE
  // =======================================================

  const validateVehicle =
    () => {

      const nextErrors =
        {};


      if (
        !formState.customer_id
      ) {

        nextErrors.customer_id =
          "Select a customer.";
      }


      const plate =
        normalizePlate(
          formState.plate
        );


      if (!plate) {

        nextErrors.plate =
          "Plate is required.";

      } else if (
        plate.length >
        MAX_PLATE_LENGTH
      ) {

        nextErrors.plate =
          `Plate cannot exceed ${MAX_PLATE_LENGTH} characters.`;
      }


      const vin =
        (
          formState.vin ||
          ""
        )
          .trim()
          .toUpperCase();


      if (
        vin &&
        !VIN_REGEX.test(vin)
      ) {

        nextErrors.vin =
          "Invalid VIN. It must have 17 characters and no I/O/Q.";
      }


      if (
        !(
          formState.brand ||
          ""
        ).trim()
      ) {

        nextErrors.brand =
          "Brand is required.";
      }


      if (
        !(
          formState.model ||
          ""
        ).trim()
      ) {

        nextErrors.model =
          "Model is required.";
      }


      if (
        !formState.fuel_type ||
        !VALID_FUEL_TYPES.includes(
          formState.fuel_type
        )
      ) {

        nextErrors.fuel_type =
          "Select a valid fuel type.";
      }


      const year =
        Number(
          formState.year
        );


      const currentYear =
        new Date()
          .getFullYear();


      if (
        formState.year !== "" &&
        (
          Number.isNaN(year) ||
          year < 1900 ||
          year >
            currentYear + 1
        )
      ) {

        nextErrors.year =
          `Enter a year between 1900 and ${currentYear + 1}.`;
      }


      const mileage =
        Number(
          formState.mileage
        );


      if (
        formState.mileage !== "" &&
        (
          Number.isNaN(
            mileage
          ) ||
          mileage < 0
        )
      ) {

        nextErrors.mileage =
          "Mileage must be zero or a positive number.";
      }


      const powerHp =
        Number(
          formState.power_hp
        );


      if (
        formState.power_hp !== "" &&
        (
          Number.isNaN(
            powerHp
          ) ||
          powerHp < 0
        )
      ) {

        nextErrors.power_hp =
          "Power must be zero or a positive number.";
      }


      const engineCc =
        Number(
          formState.engine_cc
        );


      if (
        formState.engine_cc !== "" &&
        (
          Number.isNaN(
            engineCc
          ) ||
          engineCc < 0
        )
      ) {

        nextErrors.engine_cc =
          "Engine CC must be zero or a positive number.";
      }


      if (
        formState
          .first_registration_date
      ) {

        const registrationDate =
          new Date(
            `${formState.first_registration_date}T00:00:00`
          );


        const today =
          new Date();


        today.setHours(
          0,
          0,
          0,
          0
        );


        const vehicleYear =
          Number(
            formState.year
          );


        const registrationYear =
          registrationDate
            .getFullYear();


        if (
          Number.isNaN(
            registrationDate
              .getTime()
          ) ||
          registrationDate >
            today
        ) {

          nextErrors
            .first_registration_date =
            "Registration date cannot be in the future.";

        } else if (
          formState.year !== "" &&
          !Number.isNaN(
            vehicleYear
          ) &&
          registrationYear <
            vehicleYear
        ) {

          nextErrors
            .first_registration_date =
            `Registration date cannot be earlier than the manufacturing year (${vehicleYear}).`;
        }
      }


      return nextErrors;
    };


  // =======================================================
  // OPEN / CLOSE MODAL
  // =======================================================

  const handleOpenAddModal =
    () => {

      setEditingVehicle(
        null
      );

      setFormState(
        INITIAL_VEHICLE_FORM
      );

      setFormErrors({});

      setModalError("");

      setShowModal(true);
    };


  const handleOpenEditModal = (
    vehicle
  ) => {

    setEditingVehicle(
      vehicle
    );


    setFormState({

      customer_id:
        vehicle.customer_id ||
        "",

      plate:
        normalizePlate(
          vehicle.license_plate
        ),

      vin:
        (
          vehicle.vin ||
          ""
        )
          .trim()
          .toUpperCase(),

      brand:
        vehicle.brand || "",

      model:
        vehicle.model || "",

      version:
        vehicle.version || "",

      year:
        vehicle.year ?? "",

      fuel_type:
        vehicle.fuel ||
        "gasoline",

      power_hp:
        vehicle.power ?? "",

      engine_cc:
        vehicle.displacement ??
        "",

      color:
        vehicle.color || "",

      mileage:
        vehicle.mileage ?? "",

      first_registration_date:
        vehicle.registration_date ||
        "",
    });


    setFormErrors({});

    setModalError("");

    setShowModal(true);
  };


  const handleCloseModal =
    () => {

      if (saving) {
        return;
      }


      setShowModal(false);

      setEditingVehicle(
        null
      );

      setFormState(
        INITIAL_VEHICLE_FORM
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
  // SAVE VEHICLE
  // =======================================================

  const handleSave =
    async (event) => {

      event.preventDefault();


      const validationErrors =
        validateVehicle();


      if (
        Object.keys(
          validationErrors
        ).length > 0
      ) {

        setFormErrors(
          validationErrors
        );

        setModalError(
          "Please review the highlighted fields before saving."
        );

        return;
      }


      try {

        setSaving(true);

        setModalError("");

        setError("");


        const body = {

          customer_id:
            Number(
              formState.customer_id
            ),

          plate:
            normalizePlate(
              formState.plate
            ),

          vin:
            formState.vin.trim()
              ? formState.vin
                  .trim()
                  .toUpperCase()
              : null,

          brand:
            formState.brand
              .trim(),

          model:
            formState.model
              .trim(),

          version:
            formState.version.trim()
              || null,

          year:
            formState.year !== ""
              ? Number(
                  formState.year
                )
              : null,

          fuel_type:
            formState.fuel_type,

          power_hp:
            formState.power_hp !== ""
              ? Number(
                  formState.power_hp
                )
              : null,

          engine_cc:
            formState.engine_cc !== ""
              ? Number(
                  formState.engine_cc
                )
              : null,

          color:
            formState.color.trim()
              || null,

          mileage:
            formState.mileage !== ""
              ? Number(
                  formState.mileage
                )
              : 0,

          first_registration_date:
            formState
              .first_registration_date
              || null,
        };


        const path =
          editingVehicle
            ? `/vehicles/${editingVehicle.id}`
            : "/vehicles";


        await apiFetch(
          path,
          {
            method:
              editingVehicle
                ? "PUT"
                : "POST",

            body,
          }
        );


        await loadVehicles();


        setShowModal(false);

        setEditingVehicle(null);

        setFormState(
          INITIAL_VEHICLE_FORM
        );

        setFormErrors({});

        setModalError("");


      } catch (requestError) {

        setModalError(
          requestError.message ||
            "Could not save vehicle."
        );


      } finally {

        setSaving(false);
      }
    };


  // =======================================================
  // DELETE VEHICLE
  // =======================================================

  const handleDelete =
    async (vehicle) => {

      const confirmed =
        window.confirm(
          `Delete ${vehicle.license_plate} · ${vehicle.brand} ${vehicle.model}?`
        );


      if (!confirmed) {
        return;
      }


      try {

        setDeletingId(
          vehicle.id
        );

        setError("");


        await apiFetch(
          `/vehicles/${vehicle.id}`,
          {
            method:
              "DELETE",
          }
        );


        await loadVehicles();


      } catch (requestError) {

        setError(
          requestError.message ||
            "Could not delete vehicle."
        );


      } finally {

        setDeletingId(
          null
        );
      }
    };


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <section className="vehicle-page">

      {/* HEADER */}

      <div className="mb-4">
        <div className="d-flex align-items-center gap-3">

          <div className="vehicle-page-icon bg-dark text-warning rounded-3 d-flex align-items-center justify-content-center flex-shrink-0">
            <CarFront size={24} />
          </div>

          <div>
            <h1 className="h3 fw-bold mb-1">
              Vehicles
            </h1>

            <p className="text-secondary mb-0">
              Manage the vehicles registered in your workshop.
            </p>
          </div>

        </div>
      </div>


      {error && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          {error}
        </div>
      )}


      {/* TOOLBAR */}

      <div className="card border-0 shadow-sm rounded-4 mb-3">

        <div className="card-body p-3">

          <div className="row g-2 align-items-center">

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
                  placeholder="Search by plate, owner, brand, model, VIN..."
                  value={globalSearch}
                  onChange={(event) => {
                    setGlobalSearch(
                      event.target.value
                    );

                    setCurrentPage(1);
                  }}
                />

              </div>

            </div>


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
                  setShowExportMenu(
                    (current) =>
                      !current
                  );

                  setShowColumnsMenu(
                    false
                  );
                }}
              >
                <Download size={17} />
                Export
              </button>


              {showExportMenu && (
                <div className="dropdown-menu dropdown-menu-end show vehicle-dropdown-menu shadow">

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
                  setShowColumnsMenu(
                    (current) =>
                      !current
                  );

                  setShowExportMenu(
                    false
                  );
                }}
              >
                <Columns3 size={17} />
                Columns
              </button>


              {showColumnsMenu && (
                <div className="dropdown-menu dropdown-menu-end show vehicle-dropdown-menu shadow p-2">

                  <p className="dropdown-header fw-bold text-dark px-2">
                    Visible columns
                  </p>

                  {COLUMN_OPTIONS.map(
                    (column) => (
                      <label
                        key={column.key}
                        className="dropdown-item d-flex align-items-center gap-2 py-2 vehicle-column-option"
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

                        {column.label}

                      </label>
                    )
                  )}

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
                Add vehicle
              </button>

            </div>

          </div>

        </div>

      </div>


      {/* ADVANCED FILTERS */}

      {showFilters && (

        <div className="card border-0 shadow-sm rounded-4 mb-3 vehicle-filter-panel">

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
                onClick={handleClearFilters}
              >
                <FilterX size={16} />
                Clear filters
              </button>

            </div>


            <div className="row g-3">

              <div className="col-12 col-md-6 col-xl-4">

                <label className="form-label small fw-semibold">
                  Vehicle
                </label>

                <input
                  type="text"
                  className="form-control"
                  placeholder="Plate, brand, model or version"
                  value={columnFilters.vehicle}
                  onChange={(event) =>
                    handleFilterChange(
                      "vehicle",
                      event.target.value
                    )
                  }
                />

              </div>


              <div className="col-12 col-md-6 col-xl-4">

                <label className="form-label small fw-semibold">
                  Owner
                </label>

                <input
                  type="text"
                  className="form-control"
                  placeholder="Customer name or DNI/NIE"
                  value={columnFilters.owner}
                  onChange={(event) =>
                    handleFilterChange(
                      "owner",
                      event.target.value
                    )
                  }
                />

              </div>


              <div className="col-12 col-md-6 col-xl-4">

                <label className="form-label small fw-semibold">
                  VIN
                </label>

                <input
                  type="text"
                  className="form-control text-uppercase"
                  placeholder="VIN / chassis number"
                  value={columnFilters.vin}
                  onChange={(event) =>
                    handleFilterChange(
                      "vin",
                      event.target.value
                    )
                  }
                />

              </div>


              <div className="col-12 col-md-6 col-xl-4">

                <label className="form-label small fw-semibold">
                  Fuel
                </label>

                <select
                  className="form-select"
                  value={columnFilters.fuel}
                  onChange={(event) =>
                    handleFilterChange(
                      "fuel",
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    All fuel types
                  </option>

                  {FUEL_OPTIONS.map(
                    (fuel) => (
                      <option
                        key={fuel.value}
                        value={fuel.value}
                      >
                        {fuel.label}
                      </option>
                    )
                  )}

                </select>

              </div>


              <div className="col-12 col-md-6 col-xl-4">

                <label className="form-label small fw-semibold">
                  Year
                </label>

                <input
                  type="number"
                  className="form-control"
                  placeholder="Example: 2018"
                  value={columnFilters.year}
                  onChange={(event) =>
                    handleFilterChange(
                      "year",
                      event.target.value
                    )
                  }
                />

              </div>


              <div className="col-12 col-md-6 col-xl-4">

                <label className="form-label small fw-semibold">
                  Color
                </label>

                <input
                  type="text"
                  className="form-control"
                  placeholder="Vehicle color"
                  value={columnFilters.color}
                  onChange={(event) =>
                    handleFilterChange(
                      "color",
                      event.target.value
                    )
                  }
                />

              </div>


              <div className="col-12 col-md-6 col-xl-4">

                <label className="form-label small fw-semibold">
                  Power HP
                </label>

                <input
                  type="number"
                  className="form-control"
                  value={columnFilters.power}
                  onChange={(event) =>
                    handleFilterChange(
                      "power",
                      event.target.value
                    )
                  }
                />

              </div>


              <div className="col-12 col-md-6 col-xl-4">

                <label className="form-label small fw-semibold">
                  Engine CC
                </label>

                <input
                  type="number"
                  className="form-control"
                  value={
                    columnFilters.displacement
                  }
                  onChange={(event) =>
                    handleFilterChange(
                      "displacement",
                      event.target.value
                    )
                  }
                />

              </div>


              <div className="col-12 col-md-6 col-xl-4">

                <label className="form-label small fw-semibold">
                  Mileage
                </label>

                <input
                  type="number"
                  className="form-control"
                  value={columnFilters.mileage}
                  onChange={(event) =>
                    handleFilterChange(
                      "mileage",
                      event.target.value
                    )
                  }
                />

              </div>


              <div className="col-12 col-md-6">

                <label className="form-label small fw-semibold">
                  First registration date
                </label>

                <input
                  type="date"
                  className="form-control"
                  value={
                    columnFilters.registration_date
                  }
                  onChange={(event) =>
                    handleFilterChange(
                      "registration_date",
                      event.target.value
                    )
                  }
                />

              </div>

            </div>

          </div>

        </div>
      )}


      {/* RESULT SUMMARY */}

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">

        <p className="small text-secondary mb-0">

          {filteredData.length ===
          data.length
            ? `${data.length} ${
                data.length === 1
                  ? "vehicle"
                  : "vehicles"
              }`
            : `${filteredData.length} of ${data.length} vehicles`}

        </p>


        {(globalSearch ||
          activeFilterCount > 0) && (

          <button
            type="button"
            className="btn btn-link btn-sm text-danger text-decoration-none p-0"
            onClick={handleClearFilters}
          >
            Clear search and filters
          </button>
        )}

      </div>


      {/* TABLE */}

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">

        <div className="table-responsive">

          <table className="table align-middle mb-0 vehicle-table">

            <thead>
              <tr>

                {visibleColumns.vehicle && (
                  <th>Vehicle</th>
                )}

                {visibleColumns.owner && (
                  <th>Owner</th>
                )}

                {visibleColumns.details && (
                  <th>
                    Technical details
                  </th>
                )}

                {visibleColumns.registration && (
                  <th>
                    Registration
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
                    colSpan={tableColumnCount}
                    className="text-center py-5"
                  >
                    <span className="spinner-border spinner-border-sm text-warning me-2" />
                    Loading vehicles...
                  </td>
                </tr>

              ) : paginatedData.length ===
                0 ? (

                <tr>
                  <td
                    colSpan={tableColumnCount}
                    className="text-center py-5"
                  >
                    <CarFront
                      size={34}
                      className="text-secondary mb-3"
                    />

                    <h3 className="h6 fw-bold">
                      No vehicles found
                    </h3>

                    <p className="small text-secondary mb-0">
                      Try changing the search or filters.
                    </p>
                  </td>
                </tr>

              ) : (

                paginatedData.map(
                  (vehicle) => (

                    <tr key={vehicle.id}>

                      {visibleColumns.vehicle && (

                        <td>

                          <div className="d-flex align-items-start gap-3">

                            <CarFront
                              size={20}
                              className="text-warning flex-shrink-0 mt-1"
                            />

                            <div>

                              <p className="vehicle-plate fw-bold mb-1">
                                {vehicle.license_plate ||
                                  "No plate"}
                              </p>

                              <p className="mb-1">
                                {[
                                  vehicle.brand,
                                  vehicle.model,
                                ]
                                  .filter(Boolean)
                                  .join(" ") ||
                                  "Vehicle"}
                              </p>

                              {vehicle.version && (
                                <p className="small text-secondary mb-1">
                                  {vehicle.version}
                                </p>
                              )}

                              <p className="small text-secondary mb-0">
                                {vehicle.vin
                                  ? `VIN: ${vehicle.vin}`
                                  : "No VIN"}
                              </p>

                            </div>

                          </div>

                        </td>
                      )}


                      {visibleColumns.owner && (

                        <td>

                          <div className="d-flex align-items-start gap-2">

                            <UserRound
                              size={16}
                              className="text-secondary flex-shrink-0 mt-1"
                            />

                            <div>

                              <p className="fw-semibold mb-1">
                                {vehicle.customer_name ||
                                  "No owner"}
                              </p>

                              {vehicle.customer_dni && (
                                <p className="small text-secondary mb-0">
                                  DNI/NIE:{" "}
                                  {
                                    vehicle.customer_dni
                                  }
                                </p>
                              )}

                            </div>

                          </div>

                        </td>
                      )}


                      {visibleColumns.details && (

                        <td>

                          <div className="d-flex flex-column gap-1 small">

                            <span className="d-flex align-items-center gap-2">

                              <Fuel
                                size={15}
                                className="text-secondary"
                              />

                              {vehicle.year ||
                                "No year"}

                              <span className="text-secondary">
                                ·
                              </span>

                              {vehicle.fuel_label}

                            </span>


                            <span className="d-flex align-items-center gap-2">

                              <Gauge
                                size={15}
                                className="text-secondary"
                              />

                              {formatMileage(
                                vehicle.mileage
                              )}

                            </span>


                            {(vehicle.power ||
                              vehicle.displacement) && (

                              <span className="text-secondary">

                                {vehicle.power
                                  ? `${vehicle.power} HP`
                                  : ""}

                                {vehicle.power &&
                                vehicle.displacement
                                  ? " · "
                                  : ""}

                                {vehicle.displacement
                                  ? `${vehicle.displacement} cc`
                                  : ""}

                              </span>
                            )}


                            {vehicle.color && (

                              <span className="text-secondary">
                                Color:{" "}
                                {vehicle.color}
                              </span>
                            )}

                          </div>

                        </td>
                      )}


                      {visibleColumns.registration && (

                        <td>

                          <div className="d-flex align-items-center gap-2 small">

                            <CalendarDays
                              size={15}
                              className="text-secondary flex-shrink-0"
                            />

                            {vehicle.registration_date ||
                              "No registration date"}

                          </div>

                        </td>
                      )}


                      <td className="text-end">

                        <div className="d-inline-flex align-items-center gap-2">

                          <button
                            type="button"
                            className="btn btn-sm vehicle-action-button vehicle-action-edit"
                            title="Edit vehicle"
                            aria-label={`Edit ${vehicle.license_plate}`}
                            onClick={() =>
                              handleOpenEditModal(
                                vehicle
                              )
                            }
                          >
                            <Pencil size={16} />
                          </button>


                          <button
                            type="button"
                            className="btn btn-sm vehicle-action-button vehicle-action-delete"
                            title="Delete vehicle"
                            aria-label={`Delete ${vehicle.license_plate}`}
                            disabled={
                              deletingId ===
                              vehicle.id
                            }
                            onClick={() =>
                              handleDelete(
                                vehicle
                              )
                            }
                          >

                            {deletingId ===
                            vehicle.id ? (
                              <span className="spinner-border spinner-border-sm" />
                            ) : (
                              <Trash2 size={16} />
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


      {/* PAGINATION */}

      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mt-3">

        <div className="d-flex flex-wrap align-items-center gap-3">

          <label className="d-flex align-items-center gap-2 small text-secondary">

            Show

            <select
              className="form-select form-select-sm vehicle-record-select"
              value={recordsPerPage}
              onChange={(event) => {

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
            {filteredData.length}
          </span>

        </div>


        {recordsPerPage !== -1 &&
          totalPages > 1 && (

          <nav aria-label="Vehicle pagination">

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
                  disabled={currentPage === 1}
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
                    key={pageNumber}
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
                      {pageNumber}
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
          VEHICLE MODAL
          =================================================== */}

      {showModal && (

        <div
          className="modal show d-block vehicle-modal-layer"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          onMouseDown={handleBackdropClick}
        >

          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable vehicle-modal-dialog">

            <form
              className="modal-content border-0 shadow-lg rounded-4 overflow-hidden"
              onSubmit={handleSave}
              noValidate
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >


              {/* HEADER */}

              <div className="modal-header bg-dark text-white border-bottom border-warning border-3 p-4">

                <div>

                  <p className="small text-warning fw-bold text-uppercase mb-1">
                    Vehicle details
                  </p>

                  <h2 className="modal-title h4 fw-bold mb-0">
                    {editingVehicle
                      ? "Edit vehicle"
                      : "Add vehicle"}
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


              {/* SCROLLABLE BODY */}

              <div className="modal-body p-4 vehicle-modal-body">

                {modalError && (
                  <div
                    className="alert alert-danger"
                    role="alert"
                  >
                    {modalError}
                  </div>
                )}


                {/* OWNER */}

                <div className="mb-4">

                  <p className="vehicle-form-section-title">
                    Owner
                  </p>


                  <label
                    className="form-label fw-semibold"
                    htmlFor="vehicle-customer"
                  >
                    Customer *
                  </label>


                  <select
                    id="vehicle-customer"
                    name="customer_id"
                    className={`form-select ${
                      formErrors.customer_id
                        ? "is-invalid"
                        : ""
                    }`}
                    value={formState.customer_id}
                    onChange={handleInputChange}
                    disabled={saving}
                  >

                    <option value="">
                      Select customer
                    </option>


                    {customers.map(
                      (customer) => (

                        <option
                          key={customer.id}
                          value={customer.id}
                        >
                          {getCustomerName(
                            customer
                          )}

                          {customer.dni
                            ? ` · ${customer.dni}`
                            : ""}
                        </option>

                      )
                    )}

                  </select>


                  {formErrors.customer_id && (
                    <div className="invalid-feedback">
                      {formErrors.customer_id}
                    </div>
                  )}

                </div>


                {/* VEHICLE IDENTIFICATION */}

                <div className="vehicle-form-section">

                  <p className="vehicle-form-section-title">
                    Vehicle identification
                  </p>


                  <div className="row g-3">

                    <div className="col-12 col-md-6">

                      <label className="form-label fw-semibold">
                        Plate *
                      </label>

                      <input
                        type="text"
                        name="plate"
                        className={`form-control text-uppercase ${
                          formErrors.plate
                            ? "is-invalid"
                            : ""
                        }`}
                        placeholder="Example: 1234 ABC or AB-123-CD"
                        maxLength={MAX_PLATE_LENGTH}
                        value={formState.plate}
                        onChange={handleInputChange}
                        disabled={saving}
                      />

                      {formErrors.plate && (
                        <div className="invalid-feedback">
                          {formErrors.plate}
                        </div>
                      )}

                    </div>


                    <div className="col-12 col-md-6">

                      <label className="form-label fw-semibold">
                        VIN / Chassis number
                      </label>

                      <input
                        type="text"
                        name="vin"
                        className={`form-control text-uppercase ${
                          formErrors.vin
                            ? "is-invalid"
                            : ""
                        }`}
                        placeholder="17 characters"
                        maxLength={17}
                        value={formState.vin}
                        onChange={handleInputChange}
                        disabled={saving}
                      />

                      {formErrors.vin && (
                        <div className="invalid-feedback">
                          {formErrors.vin}
                        </div>
                      )}

                    </div>


                    <div className="col-12 col-md-6">

                      <label className="form-label fw-semibold">
                        Brand *
                      </label>

                      <input
                        type="text"
                        name="brand"
                        className={`form-control ${
                          formErrors.brand
                            ? "is-invalid"
                            : ""
                        }`}
                        placeholder="Example: Mazda"
                        value={formState.brand}
                        onChange={handleInputChange}
                        disabled={saving}
                      />

                      {formErrors.brand && (
                        <div className="invalid-feedback">
                          {formErrors.brand}
                        </div>
                      )}

                    </div>


                    <div className="col-12 col-md-6">

                      <label className="form-label fw-semibold">
                        Model *
                      </label>

                      <input
                        type="text"
                        name="model"
                        className={`form-control ${
                          formErrors.model
                            ? "is-invalid"
                            : ""
                        }`}
                        placeholder="Example: 6"
                        value={formState.model}
                        onChange={handleInputChange}
                        disabled={saving}
                      />

                      {formErrors.model && (
                        <div className="invalid-feedback">
                          {formErrors.model}
                        </div>
                      )}

                    </div>


                    <div className="col-12">

                      <label className="form-label fw-semibold">
                        Version
                      </label>

                      <input
                        type="text"
                        name="version"
                        className="form-control"
                        placeholder="Example: Sport"
                        value={formState.version}
                        onChange={handleInputChange}
                        disabled={saving}
                      />

                    </div>

                  </div>

                </div>


                {/* TECHNICAL INFORMATION */}

                <div className="vehicle-form-section">

                  <p className="vehicle-form-section-title">
                    Technical information
                  </p>


                  <div className="row g-3">

                    <div className="col-12 col-sm-6 col-lg-3">

                      <label className="form-label fw-semibold">
                        Year
                      </label>

                      <input
                        type="number"
                        name="year"
                        className={`form-control ${
                          formErrors.year
                            ? "is-invalid"
                            : ""
                        }`}
                        min="1900"
                        max={
                          new Date()
                            .getFullYear() + 1
                        }
                        value={formState.year}
                        onChange={handleInputChange}
                        disabled={saving}
                      />

                      {formErrors.year && (
                        <div className="invalid-feedback">
                          {formErrors.year}
                        </div>
                      )}

                    </div>


                    <div className="col-12 col-sm-6 col-lg-3">

                      <label className="form-label fw-semibold">
                        Fuel *
                      </label>

                      <select
                        name="fuel_type"
                        className={`form-select ${
                          formErrors.fuel_type
                            ? "is-invalid"
                            : ""
                        }`}
                        value={formState.fuel_type}
                        onChange={handleInputChange}
                        disabled={saving}
                      >

                        {FUEL_OPTIONS.map(
                          (fuel) => (

                            <option
                              key={fuel.value}
                              value={fuel.value}
                            >
                              {fuel.label}
                            </option>

                          )
                        )}

                      </select>

                      {formErrors.fuel_type && (
                        <div className="invalid-feedback">
                          {formErrors.fuel_type}
                        </div>
                      )}

                    </div>


                    <div className="col-12 col-sm-6 col-lg-3">

                      <label className="form-label fw-semibold">
                        Power HP
                      </label>

                      <input
                        type="number"
                        name="power_hp"
                        min="0"
                        className={`form-control ${
                          formErrors.power_hp
                            ? "is-invalid"
                            : ""
                        }`}
                        value={formState.power_hp}
                        onChange={handleInputChange}
                        disabled={saving}
                      />

                      {formErrors.power_hp && (
                        <div className="invalid-feedback">
                          {formErrors.power_hp}
                        </div>
                      )}

                    </div>


                    <div className="col-12 col-sm-6 col-lg-3">

                      <label className="form-label fw-semibold">
                        Engine CC
                      </label>

                      <input
                        type="number"
                        name="engine_cc"
                        min="0"
                        className={`form-control ${
                          formErrors.engine_cc
                            ? "is-invalid"
                            : ""
                        }`}
                        value={formState.engine_cc}
                        onChange={handleInputChange}
                        disabled={saving}
                      />

                      {formErrors.engine_cc && (
                        <div className="invalid-feedback">
                          {formErrors.engine_cc}
                        </div>
                      )}

                    </div>


                    <div className="col-12 col-md-6">

                      <label className="form-label fw-semibold">
                        Color
                      </label>

                      <input
                        type="text"
                        name="color"
                        className="form-control"
                        placeholder="Example: White"
                        value={formState.color}
                        onChange={handleInputChange}
                        disabled={saving}
                      />

                    </div>


                    <div className="col-12 col-md-6">

                      <label className="form-label fw-semibold">
                        Mileage
                      </label>

                      <div className="input-group">

                        <input
                          type="number"
                          name="mileage"
                          min="0"
                          className={`form-control ${
                            formErrors.mileage
                              ? "is-invalid"
                              : ""
                          }`}
                          value={formState.mileage}
                          onChange={handleInputChange}
                          disabled={saving}
                        />

                        <span className="input-group-text">
                          km
                        </span>

                      </div>

                      {formErrors.mileage && (
                        <div className="text-danger small mt-1">
                          {formErrors.mileage}
                        </div>
                      )}

                    </div>

                  </div>

                </div>


                {/* REGISTRATION */}

                <div className="vehicle-form-section">

                  <p className="vehicle-form-section-title">
                    Registration
                  </p>


                  <div className="row">

                    <div className="col-12 col-md-6">

                      <label className="form-label fw-semibold">
                        First registration date
                      </label>

                      <input
                        type="date"
                        name="first_registration_date"
                        className={`form-control ${
                          formErrors.first_registration_date
                            ? "is-invalid"
                            : ""
                        }`}
                        value={
                          formState.first_registration_date
                        }
                        onChange={handleInputChange}
                        disabled={saving}
                      />

                      {formErrors.first_registration_date && (
                        <div className="invalid-feedback">
                          {
                            formErrors.first_registration_date
                          }
                        </div>
                      )}

                    </div>

                  </div>

                </div>

              </div>


              {/* FOOTER */}

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
                  ) : editingVehicle ? (
                    "Save changes"
                  ) : (
                    "Save vehicle"
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