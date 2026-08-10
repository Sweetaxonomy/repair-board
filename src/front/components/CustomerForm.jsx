const PHONE_REGEX = /^\+?[0-9\s()-]{7,20}$/;
const DNI_REGEX = /^\d{8}[A-Z]$/;
const NIE_REGEX = /^[XYZ]\d{7}[A-Z]$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const EMPTY_CUSTOMER_FORM = {
  first_name: "",
  last_name: "",
  dni: "",
  driving_license: "",
  phone: "",
  email: "",
  address: "",
};

export const normalizeCustomerField = (name, value = "") => {
  if (name === "dni") {
    return value
      .replace(/[\s-]/g, "")
      .toUpperCase();
  }

  return value;
};

export const validateCustomerForm = (formData) => {
  const errors = {};

  const firstName = (formData.first_name || "").trim();
  const lastName = (formData.last_name || "").trim();
  const dni = (formData.dni || "")
    .replace(/[\s-]/g, "")
    .toUpperCase();
  const drivingLicense = (formData.driving_license || "").trim();
  const phone = (formData.phone || "").trim();
  const email = (formData.email || "").trim();

  if (!firstName) {
    errors.first_name = "First name is required.";
  }

  if (!lastName) {
    errors.last_name = "Last name is required.";
  }

  if (!dni) {
    errors.dni = "DNI or NIE is required.";
  } else if (!DNI_REGEX.test(dni) && !NIE_REGEX.test(dni)) {
    errors.dni =
      "Enter a valid DNI or NIE. Example: 12345678Z or X1234567L.";
  }

  if (!drivingLicense) {
    errors.driving_license = "Driving licence is required.";
  }

  if (!phone) {
    errors.phone = "Phone is required.";
  } else if (!PHONE_REGEX.test(phone)) {
    errors.phone = "Enter a valid phone number.";
  }

  if (email && !EMAIL_REGEX.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  return errors;
};

export const buildCustomerPayload = (formData) => ({
  first_name: (formData.first_name || "").trim(),
  last_name: (formData.last_name || "").trim(),
  dni: (formData.dni || "")
    .replace(/[\s-]/g, "")
    .trim()
    .toUpperCase(),
  driving_license: (formData.driving_license || "").trim(),
  phone: (formData.phone || "").trim(),
  email: (formData.email || "").trim() || null,
  address: (formData.address || "").trim() || null,
});

export function CustomerForm({
  formData,
  errors = {},
  disabled = false,
  onChange,
  idPrefix = "customer",
}) {
  const handleFieldChange = (event) => {
    const { name, value, type } = event.target;

    onChange({
      target: {
        name,
        value: normalizeCustomerField(name, value),
        type,
      },
    });
  };

  return (
    <div className="row g-3">
      <div className="col-12 col-md-6">
        <label
          className="form-label fw-semibold"
          htmlFor={`${idPrefix}-first-name`}
        >
          First name *
        </label>

        <input
          id={`${idPrefix}-first-name`}
          type="text"
          name="first_name"
          className={`form-control ${
            errors.first_name ? "is-invalid" : ""
          }`}
          value={formData.first_name}
          disabled={disabled}
          onChange={handleFieldChange}
        />

        {errors.first_name && (
          <div className="invalid-feedback">
            {errors.first_name}
          </div>
        )}
      </div>

      <div className="col-12 col-md-6">
        <label
          className="form-label fw-semibold"
          htmlFor={`${idPrefix}-last-name`}
        >
          Last name *
        </label>

        <input
          id={`${idPrefix}-last-name`}
          type="text"
          name="last_name"
          className={`form-control ${
            errors.last_name ? "is-invalid" : ""
          }`}
          value={formData.last_name}
          disabled={disabled}
          onChange={handleFieldChange}
        />

        {errors.last_name && (
          <div className="invalid-feedback">
            {errors.last_name}
          </div>
        )}
      </div>

      <div className="col-12 col-md-6">
        <label
          className="form-label fw-semibold"
          htmlFor={`${idPrefix}-dni`}
        >
          DNI / NIE *
        </label>

        <input
          id={`${idPrefix}-dni`}
          type="text"
          name="dni"
          maxLength={9}
          placeholder="12345678Z or X1234567L"
          className={`form-control text-uppercase ${
            errors.dni ? "is-invalid" : ""
          }`}
          value={formData.dni}
          disabled={disabled}
          onChange={handleFieldChange}
        />

        {errors.dni && (
          <div className="invalid-feedback">
            {errors.dni}
          </div>
        )}
      </div>

      <div className="col-12 col-md-6">
        <label
          className="form-label fw-semibold"
          htmlFor={`${idPrefix}-driving-license`}
        >
          Driving licence *
        </label>

        <input
          id={`${idPrefix}-driving-license`}
          type="text"
          name="driving_license"
          className={`form-control ${
            errors.driving_license ? "is-invalid" : ""
          }`}
          value={formData.driving_license}
          disabled={disabled}
          onChange={handleFieldChange}
        />

        {errors.driving_license && (
          <div className="invalid-feedback">
            {errors.driving_license}
          </div>
        )}
      </div>

      <div className="col-12 col-md-6">
        <label
          className="form-label fw-semibold"
          htmlFor={`${idPrefix}-phone`}
        >
          Phone *
        </label>

        <input
          id={`${idPrefix}-phone`}
          type="tel"
          name="phone"
          className={`form-control ${
            errors.phone ? "is-invalid" : ""
          }`}
          value={formData.phone}
          disabled={disabled}
          onChange={handleFieldChange}
        />

        {errors.phone && (
          <div className="invalid-feedback">
            {errors.phone}
          </div>
        )}
      </div>

      <div className="col-12 col-md-6">
        <label
          className="form-label fw-semibold"
          htmlFor={`${idPrefix}-email`}
        >
          Email
        </label>

        <input
          id={`${idPrefix}-email`}
          type="email"
          name="email"
          className={`form-control ${
            errors.email ? "is-invalid" : ""
          }`}
          value={formData.email}
          disabled={disabled}
          onChange={handleFieldChange}
        />

        {errors.email && (
          <div className="invalid-feedback">
            {errors.email}
          </div>
        )}
      </div>

      <div className="col-12">
        <label
          className="form-label fw-semibold"
          htmlFor={`${idPrefix}-address`}
        >
          Address
        </label>

        <input
          id={`${idPrefix}-address`}
          type="text"
          name="address"
          className="form-control"
          value={formData.address}
          disabled={disabled}
          onChange={handleFieldChange}
        />
      </div>
    </div>
  );
}