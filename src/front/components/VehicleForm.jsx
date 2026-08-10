const MAX_PLATE_LENGTH = 20;

const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

export const FUEL_OPTIONS = [
  { value: "gasoline", label: "Gasoline" },
  { value: "diesel", label: "Diesel" },
  { value: "hybrid", label: "Hybrid" },
  { value: "plug_in_hybrid", label: "Plug-in hybrid" },
  { value: "electric", label: "Electric" },
  { value: "lpg", label: "LPG" },
];

const VALID_FUEL_TYPES = FUEL_OPTIONS.map(
  (fuel) => fuel.value
);

export const EMPTY_VEHICLE_FORM = {
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

export const normalizePlate = (value = "") =>
  value.trim().toUpperCase();

export const normalizeVehicleField = (
  name,
  value = ""
) => {
  if (name === "plate") {
    return value.toUpperCase();
  }

  if (name === "vin") {
    return value
      .replace(/\s/g, "")
      .toUpperCase();
  }

  return value;
};

export const getFuelLabel = (fuelValue) =>
  FUEL_OPTIONS.find(
    (fuel) => fuel.value === fuelValue
  )?.label ||
  fuelValue ||
  "Not specified";

export const validateVehicleForm = (
  formData,
  { requireCustomer = true } = {}
) => {
  const errors = {};

  if (
    requireCustomer &&
    !formData.customer_id
  ) {
    errors.customer_id =
      "Select a customer.";
  }

  const plate = normalizePlate(
    formData.plate || ""
  );

  if (!plate) {
    errors.plate =
      "Plate is required.";
  } else if (
    plate.length >
    MAX_PLATE_LENGTH
  ) {
    errors.plate =
      `Plate cannot exceed ${MAX_PLATE_LENGTH} characters.`;
  }

  const vin = (
    formData.vin || ""
  )
    .trim()
    .toUpperCase();

  if (
    vin &&
    !VIN_REGEX.test(vin)
  ) {
    errors.vin =
      "Invalid VIN. It must have 17 characters and no I/O/Q.";
  }

  if (
    !(formData.brand || "").trim()
  ) {
    errors.brand =
      "Brand is required.";
  }

  if (
    !(formData.model || "").trim()
  ) {
    errors.model =
      "Model is required.";
  }

  if (
    !formData.fuel_type ||
    !VALID_FUEL_TYPES.includes(
      formData.fuel_type
    )
  ) {
    errors.fuel_type =
      "Select a valid fuel type.";
  }

  const year = Number(
    formData.year
  );

  const currentYear =
    new Date().getFullYear();

  if (
    formData.year !== "" &&
    (
      Number.isNaN(year) ||
      year < 1900 ||
      year > currentYear + 1
    )
  ) {
    errors.year =
      `Enter a year between 1900 and ${currentYear + 1}.`;
  }

  const mileage = Number(
    formData.mileage
  );

  if (
    formData.mileage !== "" &&
    (
      Number.isNaN(mileage) ||
      mileage < 0
    )
  ) {
    errors.mileage =
      "Mileage must be zero or a positive number.";
  }

  const powerHp = Number(
    formData.power_hp
  );

  if (
    formData.power_hp !== "" &&
    (
      Number.isNaN(powerHp) ||
      powerHp <= 0 ||
      !Number.isInteger(powerHp)
    )
  ) {
    errors.power_hp =
      "Enter power in whole HP. Example: 150.";
  }

  const engineCc = Number(
    formData.engine_cc
  );

  if (
    formData.engine_cc !== "" &&
    (
      Number.isNaN(engineCc) ||
      engineCc <= 0 ||
      !Number.isInteger(engineCc)
    )
  ) {
    errors.engine_cc =
      "Enter displacement in whole cc. Example: 1800 for a 1.8 L engine.";
  }

  if (
    formData.first_registration_date
  ) {
    const registrationDate =
      new Date(
        `${formData.first_registration_date}T00:00:00`
      );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const vehicleYear = Number(
      formData.year
    );

    const registrationYear =
      registrationDate.getFullYear();

    if (
      Number.isNaN(
        registrationDate.getTime()
      ) ||
      registrationDate > today
    ) {
      errors.first_registration_date =
        "Registration date cannot be in the future.";
    } else if (
      formData.year !== "" &&
      !Number.isNaN(vehicleYear) &&
      registrationYear < vehicleYear
    ) {
      errors.first_registration_date =
        `Registration date cannot be earlier than the manufacturing year (${vehicleYear}).`;
    }
  }

  return errors;
};

export const buildVehiclePayload = (
  formData,
  { customerId } = {}
) => ({
  customer_id: Number(
    customerId ??
      formData.customer_id
  ),
  plate: normalizePlate(
    formData.plate || ""
  ),
  vin: (formData.vin || "").trim()
    ? (formData.vin || "")
        .trim()
        .toUpperCase()
    : null,
  brand: (formData.brand || "").trim(),
  model: (formData.model || "").trim(),
  version:
    (formData.version || "").trim() ||
    null,
  year:
    formData.year !== ""
      ? Number(formData.year)
      : null,
  fuel_type: formData.fuel_type,
  power_hp:
    formData.power_hp !== ""
      ? Number(formData.power_hp)
      : null,
  engine_cc:
    formData.engine_cc !== ""
      ? Number(formData.engine_cc)
      : null,
  color:
    (formData.color || "").trim() ||
    null,
  mileage:
    formData.mileage !== ""
      ? Number(formData.mileage)
      : 0,
  first_registration_date:
    formData.first_registration_date ||
    null,
});

const getCustomerName = (customer) =>
  [
    customer?.first_name,
    customer?.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

export function VehicleForm({
  formData,
  errors = {},
  disabled = false,
  onChange,
  customers = [],
  showOwnerField = true,
  idPrefix = "vehicle",
}) {
  const handleFieldChange = (
    event
  ) => {
    const {
      name,
      value,
      type,
    } = event.target;

    onChange({
      target: {
        name,
        value:
          normalizeVehicleField(
            name,
            value
          ),
        type,
      },
    });
  };

  return (
    <>
      {showOwnerField && (
        <div className="mb-4">
          <p className="vehicle-form-section-title">
            Owner
          </p>

          <label
            className="form-label fw-semibold"
            htmlFor={`${idPrefix}-customer`}
          >
            Customer *
          </label>

          <select
            id={`${idPrefix}-customer`}
            name="customer_id"
            className={`form-select ${
              errors.customer_id
                ? "is-invalid"
                : ""
            }`}
            value={formData.customer_id}
            onChange={handleFieldChange}
            disabled={disabled}
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

          {errors.customer_id && (
            <div className="invalid-feedback">
              {errors.customer_id}
            </div>
          )}
        </div>
      )}

      <div className="vehicle-form-section">
        <p className="vehicle-form-section-title">
          Vehicle identification
        </p>

        <div className="row g-3">
          <div className="col-12 col-md-6">
            <label
              className="form-label fw-semibold"
              htmlFor={`${idPrefix}-plate`}
            >
              Plate *
            </label>

            <input
              id={`${idPrefix}-plate`}
              type="text"
              name="plate"
              className={`form-control text-uppercase ${
                errors.plate
                  ? "is-invalid"
                  : ""
              }`}
              placeholder="Example: 1234 ABC or AB-123-CD"
              maxLength={
                MAX_PLATE_LENGTH
              }
              value={formData.plate}
              onChange={handleFieldChange}
              disabled={disabled}
            />

            {errors.plate && (
              <div className="invalid-feedback">
                {errors.plate}
              </div>
            )}
          </div>

          <div className="col-12 col-md-6">
            <label
              className="form-label fw-semibold"
              htmlFor={`${idPrefix}-vin`}
            >
              VIN / Chassis number
            </label>

            <input
              id={`${idPrefix}-vin`}
              type="text"
              name="vin"
              className={`form-control text-uppercase ${
                errors.vin
                  ? "is-invalid"
                  : ""
              }`}
              placeholder="17 characters"
              maxLength={17}
              value={formData.vin}
              onChange={handleFieldChange}
              disabled={disabled}
            />

            {errors.vin && (
              <div className="invalid-feedback">
                {errors.vin}
              </div>
            )}
          </div>

          <div className="col-12 col-md-6">
            <label
              className="form-label fw-semibold"
              htmlFor={`${idPrefix}-brand`}
            >
              Brand *
            </label>

            <input
              id={`${idPrefix}-brand`}
              type="text"
              name="brand"
              className={`form-control ${
                errors.brand
                  ? "is-invalid"
                  : ""
              }`}
              placeholder="Example: Mazda"
              value={formData.brand}
              onChange={handleFieldChange}
              disabled={disabled}
            />

            {errors.brand && (
              <div className="invalid-feedback">
                {errors.brand}
              </div>
            )}
          </div>

          <div className="col-12 col-md-6">
            <label
              className="form-label fw-semibold"
              htmlFor={`${idPrefix}-model`}
            >
              Model *
            </label>

            <input
              id={`${idPrefix}-model`}
              type="text"
              name="model"
              className={`form-control ${
                errors.model
                  ? "is-invalid"
                  : ""
              }`}
              placeholder="Example: 6"
              value={formData.model}
              onChange={handleFieldChange}
              disabled={disabled}
            />

            {errors.model && (
              <div className="invalid-feedback">
                {errors.model}
              </div>
            )}
          </div>

          <div className="col-12">
            <label
              className="form-label fw-semibold"
              htmlFor={`${idPrefix}-version`}
            >
              Version
            </label>

            <input
              id={`${idPrefix}-version`}
              type="text"
              name="version"
              className="form-control"
              placeholder="Example: Sport"
              value={formData.version}
              onChange={handleFieldChange}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      <div className="vehicle-form-section">
        <p className="vehicle-form-section-title">
          Technical information
        </p>

        <div className="row g-3">
          <div className="col-12 col-sm-6 col-lg-3">
            <label
              className="form-label fw-semibold"
              htmlFor={`${idPrefix}-year`}
            >
              Year
            </label>

            <input
              id={`${idPrefix}-year`}
              type="number"
              name="year"
              className={`form-control ${
                errors.year
                  ? "is-invalid"
                  : ""
              }`}
              min="1900"
              max={
                new Date().getFullYear() +
                1
              }
              value={formData.year}
              onChange={handleFieldChange}
              disabled={disabled}
            />

            {errors.year && (
              <div className="invalid-feedback">
                {errors.year}
              </div>
            )}
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <label
              className="form-label fw-semibold"
              htmlFor={`${idPrefix}-fuel`}
            >
              Fuel *
            </label>

            <select
              id={`${idPrefix}-fuel`}
              name="fuel_type"
              className={`form-select ${
                errors.fuel_type
                  ? "is-invalid"
                  : ""
              }`}
              value={formData.fuel_type}
              onChange={handleFieldChange}
              disabled={disabled}
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

            {errors.fuel_type && (
              <div className="invalid-feedback">
                {errors.fuel_type}
              </div>
            )}
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <label
              className="form-label fw-semibold"
              htmlFor={`${idPrefix}-power`}
            >
              Power
            </label>

            <div className="input-group has-validation">
              <input
                id={`${idPrefix}-power`}
                type="number"
                name="power_hp"
                min="1"
                step="1"
                placeholder="150"
                className={`form-control ${
                  errors.power_hp
                    ? "is-invalid"
                    : ""
                }`}
                value={formData.power_hp}
                onChange={handleFieldChange}
                disabled={disabled}
              />

              <span className="input-group-text">
                HP
              </span>

              {errors.power_hp && (
                <div className="invalid-feedback">
                  {errors.power_hp}
                </div>
              )}
            </div>

            <div className="form-text">
              Example: 90, 120, 150 or 200 HP.
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <label
              className="form-label fw-semibold"
              htmlFor={`${idPrefix}-engine`}
            >
              Engine displacement
            </label>

            <div className="input-group has-validation">
              <input
                id={`${idPrefix}-engine`}
                type="number"
                name="engine_cc"
                min="1"
                step="1"
                placeholder="1800"
                className={`form-control ${
                  errors.engine_cc
                    ? "is-invalid"
                    : ""
                }`}
                value={formData.engine_cc}
                onChange={handleFieldChange}
                disabled={disabled}
              />

              <span className="input-group-text">
                cc
              </span>

              {errors.engine_cc && (
                <div className="invalid-feedback">
                  {errors.engine_cc}
                </div>
              )}
            </div>

            <div className="form-text">
              Example: 1800 cc ≈ 1.8 L. Leave blank if not applicable.
            </div>
          </div>

          <div className="col-12 col-md-6">
            <label
              className="form-label fw-semibold"
              htmlFor={`${idPrefix}-color`}
            >
              Color
            </label>

            <input
              id={`${idPrefix}-color`}
              type="text"
              name="color"
              className="form-control"
              placeholder="Example: White"
              value={formData.color}
              onChange={handleFieldChange}
              disabled={disabled}
            />
          </div>

          <div className="col-12 col-md-6">
            <label
              className="form-label fw-semibold"
              htmlFor={`${idPrefix}-mileage`}
            >
              Mileage
            </label>

            <div className="input-group has-validation">
              <input
                id={`${idPrefix}-mileage`}
                type="number"
                name="mileage"
                min="0"
                className={`form-control ${
                  errors.mileage
                    ? "is-invalid"
                    : ""
                }`}
                value={formData.mileage}
                onChange={handleFieldChange}
                disabled={disabled}
              />

              <span className="input-group-text">
                km
              </span>

              {errors.mileage && (
                <div className="invalid-feedback">
                  {errors.mileage}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="vehicle-form-section">
        <p className="vehicle-form-section-title">
          Registration
        </p>

        <div className="row">
          <div className="col-12 col-md-6">
            <label
              className="form-label fw-semibold"
              htmlFor={`${idPrefix}-registration`}
            >
              First registration date
            </label>

            <input
              id={`${idPrefix}-registration`}
              type="date"
              name="first_registration_date"
              className={`form-control ${
                errors.first_registration_date
                  ? "is-invalid"
                  : ""
              }`}
              value={
                formData.first_registration_date
              }
              onChange={handleFieldChange}
              disabled={disabled}
            />

            {errors.first_registration_date && (
              <div className="invalid-feedback">
                {
                  errors.first_registration_date
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}