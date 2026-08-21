import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Building2,
  CheckCircle2,
  Cog,
  Eye,
  EyeOff,
  UserRound,
} from "lucide-react";

import { registerWorkshop } from "../services/api";

const initialState = {
  company_name: "",
  cif: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  postal_code: "",
  province: "",
  country: "Spain",

  manager_first_name: "",
  manager_last_name: "",
  manager_dni: "",
  manager_phone: "",
  manager_email: "",
  manager_password: "",
  manager_password_confirm: "",
};

const patterns = {
  cif: /^[A-HJ-NP-SUVW]\d{7}[0-9A-J]$/i,
  dni: /^\d{8}[A-HJ-NP-TV-Z]$/i,
  postal_code: /^\d{5}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?\d{9,15}$/,
};

export const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [serverMsg, setServerMsg] = useState("");
  const [registrationSuccess, setRegistrationSuccess] =
    useState(null);

  const [showPassword, setShowPassword] = useState(false);

  const [
    showPasswordConfirm,
    setShowPasswordConfirm,
  ] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));

    setErrors((previousErrors) => ({
      ...previousErrors,
      [name]: "",
    }));

    setServerMsg("");
  };

  const validateWorkshopStep = () => {
    const nextErrors = {};

    const companyName = form.company_name.trim();
    const cif = form.cif.trim().toUpperCase();
    const workshopPhone = form.phone.trim();
    const workshopEmail = form.email.trim();

    if (!companyName) {
      nextErrors.company_name =
        "Workshop name is required";
    }

    /*
     * CIF is optional.
     * It is validated only when the user enters one.
     */
    if (cif && !patterns.cif.test(cif)) {
      nextErrors.cif =
        "Invalid CIF. Example: B12345678";
    }

    /*
     * Workshop phone is optional.
     * The backend uses the administrator phone
     * when this field is empty.
     */
    if (
      workshopPhone &&
      !patterns.phone.test(workshopPhone)
    ) {
      nextErrors.phone =
        "Invalid phone number";
    }

    /*
     * Workshop email is optional.
     * The backend uses the administrator email
     * when this field is empty.
     */
    if (
      workshopEmail &&
      !patterns.email.test(workshopEmail)
    ) {
      nextErrors.email =
        "Invalid email";
    }

    if (!form.address.trim()) {
      nextErrors.address =
        "Address is required";
    }

    if (!form.postal_code.trim()) {
      nextErrors.postal_code =
        "Postal code is required";
    } else if (
      !patterns.postal_code.test(
        form.postal_code.trim()
      )
    ) {
      nextErrors.postal_code =
        "Postal code must have 5 digits";
    }

    if (!form.city.trim()) {
      nextErrors.city =
        "City is required";
    }

    if (!form.province.trim()) {
      nextErrors.province =
        "Province is required";
    }

    if (!form.country.trim()) {
      nextErrors.country =
        "Country is required";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const validateAdminStep = () => {
    const nextErrors = {};

    const dni =
      form.manager_dni.trim().toUpperCase();

    const phone =
      form.manager_phone.trim();

    const email =
      form.manager_email.trim();

    if (!form.manager_first_name.trim()) {
      nextErrors.manager_first_name =
        "First name is required";
    }

    if (!form.manager_last_name.trim()) {
      nextErrors.manager_last_name =
        "Last name is required";
    }

    if (!patterns.dni.test(dni)) {
      nextErrors.manager_dni =
        "Invalid DNI. Example: 12345678A";
    }

    if (!patterns.phone.test(phone)) {
      nextErrors.manager_phone =
        "Invalid phone number";
    }

    if (!patterns.email.test(email)) {
      nextErrors.manager_email =
        "Invalid email";
    }

    if (form.manager_password.length < 8) {
      nextErrors.manager_password =
        "Password must contain at least 8 characters";
    }

    if (
      form.manager_password !==
      form.manager_password_confirm
    ) {
      nextErrors.manager_password_confirm =
        "Passwords do not match";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const validateAll = () => {
    const workshopIsValid =
      validateWorkshopStep();

    if (!workshopIsValid) {
      setCurrentStep(1);
      return false;
    }

    const adminIsValid =
      validateAdminStep();

    if (!adminIsValid) {
      setCurrentStep(2);
      return false;
    }

    return true;
  };

  const buildFullAddress = () => {
    const addressParts = [
      form.address.trim(),
      `${form.postal_code.trim()} ${form.city.trim()}`.trim(),
      form.province.trim(),
      form.country.trim(),
    ];

    return addressParts
      .filter(Boolean)
      .join(", ");
  };

  const handleNextStep = () => {
    setServerMsg("");

    /*
     * Administrator cannot be reached until
     * the workshop information is valid.
     */
    if (!validateWorkshopStep()) {
      return;
    }

    setErrors({});
    setCurrentStep(2);
  };

  const handlePreviousStep = () => {
    setServerMsg("");
    setErrors({});
    setCurrentStep(1);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerMsg("");

    if (!validateAll()) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        company_name:
          form.company_name.trim(),

        cif:
          form.cif.trim().toUpperCase(),

        workshop_phone:
          form.phone.trim(),

        workshop_email:
          form.email.trim(),

        address:
          buildFullAddress(),

        city:
          form.city.trim(),

        postal_code:
          form.postal_code.trim(),

        first_name:
          form.manager_first_name.trim(),

        last_name:
          form.manager_last_name.trim(),

        dni:
          form.manager_dni
            .trim()
            .toUpperCase(),

        employee_phone:
          form.manager_phone.trim(),

        user_email:
          form.manager_email.trim(),

        password:
          form.manager_password,

        password_confirm:
          form.manager_password_confirm,
      };

      const response =
        await registerWorkshop(payload);

      if (!response.ok) {
        setServerMsg(
          response.data?.error ||
            response.data?.message ||
            "Error creating workshop"
        );

        return;
      }

      localStorage.setItem(
        "token",
        response.data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      localStorage.setItem(
        "employee",
        JSON.stringify(response.data.employee)
      );

      localStorage.setItem(
        "workshop",
        JSON.stringify(response.data.workshop)
      );

      setRegistrationSuccess({
        workshop: response.data.workshop,
        user: response.data.user,
        employee: response.data.employee,
      });
    } catch (error) {
      console.error(
        "Register error:",
        error
      );

      setServerMsg(
        "Network error. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (
    name,
    label,
    type = "text",
    options = {}
  ) => {
    const {
      optional = false,
      helperText = "",
      ...inputProps
    } = options;

    return (
      <div className="mb-3">
        <label
          className="form-label d-flex justify-content-between align-items-center gap-2 fw-semibold"
          htmlFor={name}
        >
          <span>{label}</span>

          {optional && (
            <small className="text-secondary fw-normal">
              Optional
            </small>
          )}
        </label>

        <input
          id={name}
          type={type}
          name={name}
          value={form[name]}
          onChange={handleChange}
          className={`form-control form-control-lg rounded-3 ${
            errors[name]
              ? "is-invalid"
              : ""
          }`}
          disabled={submitting}
          aria-invalid={Boolean(errors[name])}
          {...inputProps}
        />

        {errors[name] && (
          <div className="invalid-feedback">
            {errors[name]}
          </div>
        )}

        {helperText && !errors[name] && (
          <div className="form-text">
            {helperText}
          </div>
        )}
      </div>
    );
  };

  const renderPasswordField = (
    name,
    label,
    isVisible,
    setIsVisible,
    helperText = ""
  ) => {
    return (
      <div className="mb-3">
        <label
          className="form-label fw-semibold"
          htmlFor={name}
        >
          {label}
        </label>

        <div className="input-group input-group-lg">
          <input
            id={name}
            type={
              isVisible
                ? "text"
                : "password"
            }
            name={name}
            value={form[name]}
            onChange={handleChange}
            className={`form-control ${
              errors[name]
                ? "is-invalid"
                : ""
            }`}
            disabled={submitting}
            autoComplete="new-password"
            aria-invalid={Boolean(errors[name])}
          />

          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() =>
              setIsVisible(
                (previousValue) =>
                  !previousValue
              )
            }
            disabled={submitting}
            aria-label={
              isVisible
                ? "Hide password"
                : "Show password"
            }
            aria-pressed={isVisible}
          >
            {isVisible ? (
              <EyeOff size={19} />
            ) : (
              <Eye size={19} />
            )}
          </button>
        </div>

        {errors[name] && (
          <div className="invalid-feedback d-block">
            {errors[name]}
          </div>
        )}

        {helperText && !errors[name] && (
          <div className="form-text">
            {helperText}
          </div>
        )}
      </div>
    );
  };

  /*
   * REGISTRATION SUCCESS
   */
  if (registrationSuccess) {
    const {
      workshop,
      employee,
      user,
    } = registrationSuccess;

    return (
      <div className="container py-5 flex-grow-1">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">
            <section className="card border-0 shadow-sm rounded-4 overflow-hidden">
              <header className="bg-dark text-white border-bottom border-warning border-4 p-4 p-md-5">
                <CheckCircle2
                  size={36}
                  className="text-warning mb-3"
                />

                <h1 className="h2 fw-bold mb-3">
                  Your workshop is ready
                </h1>

                <p className="fs-5 text-white-50 mb-0">
                  Your workshop and administrator
                  account were created successfully.
                </p>
              </header>

              <div className="card-body p-4 p-md-5">
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="border rounded-4 p-4 h-100 bg-body-tertiary">
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <Building2
                          size={20}
                          className="text-warning"
                        />

                        <small className="text-uppercase text-secondary fw-semibold">
                          Workshop
                        </small>
                      </div>

                      <h2 className="h5 fw-bold mb-1">
                        {workshop?.company_name}
                      </h2>

                      <p className="text-secondary mb-0">
                        {workshop?.email}
                      </p>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="border rounded-4 p-4 h-100 bg-body-tertiary">
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <UserRound
                          size={20}
                          className="text-warning"
                        />

                        <small className="text-uppercase text-secondary fw-semibold">
                          Administrator
                        </small>
                      </div>

                      <h2 className="h5 fw-bold mb-1">
                        {employee?.first_name}{" "}
                        {employee?.last_name}
                      </h2>

                      <p className="text-secondary mb-0">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="d-grid d-sm-flex justify-content-sm-end">
                  <button
                    type="button"
                    className="btn btn-warning fw-bold px-4 py-2 rounded-3"
                    onClick={() =>
                      navigate("/dashboard")
                    }
                  >
                    Go to dashboard
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  /*
   * REGISTRATION FORM
   */
  return (
    <div className="container py-5 flex-grow-1">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-9 col-xl-8">
          <section className="card border-0 shadow-sm rounded-4 overflow-hidden">

            {/* HERO */}

            <header className="register-hero position-relative overflow-hidden bg-dark text-white border-bottom border-warning border-4 p-4 p-md-5">
              <div className="register-hero-content">
                <h1 className="h2 fw-bold mb-3">
                  Create your workshop
                </h1>

                <p className="fs-5 text-white-50 lh-base mb-0">
                  Add your workshop information and create
                  the administrator account that will
                  manage it.
                </p>
              </div>

              <Cog
                className="register-gear register-gear-large text-warning"
                aria-hidden="true"
              />

              <Cog
                className="register-gear register-gear-small text-warning"
                aria-hidden="true"
              />
            </header>

            <div className="card-body p-4 p-md-5">

              {/* STEPS */}

              <div className="mb-5">
                <div className="d-flex justify-content-between align-items-center gap-3 mb-3">

                  {/* STEP 1 */}

                  <div className="d-flex align-items-center gap-3">
                    <span className="register-step-number d-inline-flex align-items-center justify-content-center rounded-circle bg-warning text-dark fw-bold flex-shrink-0">
                      1
                    </span>

                    <div>
                      <p className="fw-bold mb-0">
                        Workshop details
                      </p>

                      <small className="text-secondary">
                        {currentStep === 2
                          ? "Completed"
                          : "Step 1"}
                      </small>
                    </div>
                  </div>

                  {/* STEP 2 */}

                  <div className="d-flex align-items-center gap-3">
                    <div className="text-end">
                      <p
                        className={`fw-bold mb-0 ${
                          currentStep === 2
                            ? "text-dark"
                            : "text-secondary"
                        }`}
                      >
                        Administrator
                      </p>

                      <small className="text-secondary">
                        Step 2
                      </small>
                    </div>

                    <span
                      className={`register-step-number d-inline-flex align-items-center justify-content-center rounded-circle fw-bold flex-shrink-0 ${
                        currentStep === 2
                          ? "bg-warning text-dark"
                          : "bg-body-secondary text-secondary border"
                      }`}
                    >
                      2
                    </span>
                  </div>
                </div>

                <div
                  className="progress rounded-pill"
                  style={{ height: "6px" }}
                  role="progressbar"
                  aria-label="Registration progress"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-valuenow={
                    currentStep === 1
                      ? 50
                      : 100
                  }
                >
                  <div
                    className="progress-bar bg-warning"
                    style={{
                      width:
                        currentStep === 1
                          ? "50%"
                          : "100%",
                    }}
                  />
                </div>
              </div>

              {/* SERVER ERROR */}

              {serverMsg && (
                <div
                  className="alert alert-danger rounded-3"
                  role="alert"
                >
                  {serverMsg}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                noValidate
              >

                {/* STEP 1 */}

                {currentStep === 1 && (
                  <>
                    <div className="mb-4">
                      <h2 className="h5 fw-bold mb-2">
                        Business information
                      </h2>

                      <p className="text-secondary mb-0">
                        Enter the contact and location
                        details for your workshop.
                      </p>
                    </div>

                    {renderField(
                      "company_name",
                      "Workshop name",
                      "text",
                      {
                        placeholder:
                          "Example Motor Workshop",
                        autoComplete:
                          "organization",
                      }
                    )}

                    <div className="row g-3">
                      <div className="col-md-6">
                        {renderField(
                          "cif",
                          "CIF",
                          "text",
                          {
                            optional: true,
                            maxLength: 9,
                            placeholder:
                              "B12345678",
                          }
                        )}
                      </div>

                      <div className="col-md-6">
                        {renderField(
                          "phone",
                          "Workshop phone",
                          "tel",
                          {
                            optional: true,
                            placeholder:
                              "+34600000000",
                            autoComplete: "tel",
                            helperText:
                              "Administrator phone will be used when omitted.",
                          }
                        )}
                      </div>
                    </div>

                    {renderField(
                      "email",
                      "Public workshop email",
                      "email",
                      {
                        optional: true,
                        placeholder:
                          "workshop@example.com",
                        autoComplete:
                          "email",
                        helperText:
                          "Administrator email will be used when omitted.",
                      }
                    )}

                    {renderField(
                      "address",
                      "Street address",
                      "text",
                      {
                        placeholder:
                          "Calle Example 25",
                        autoComplete:
                          "street-address",
                      }
                    )}

                    <div className="row g-3">
                      <div className="col-md-4">
                        {renderField(
                          "postal_code",
                          "Postal code",
                          "text",
                          {
                            maxLength: 5,
                            placeholder:
                              "28001",
                            inputMode:
                              "numeric",
                            autoComplete:
                              "postal-code",
                          }
                        )}
                      </div>

                      <div className="col-md-4">
                        {renderField(
                          "city",
                          "City",
                          "text",
                          {
                            autoComplete:
                              "address-level2",
                          }
                        )}
                      </div>

                      <div className="col-md-4">
                        {renderField(
                          "province",
                          "Province",
                          "text",
                          {
                            autoComplete:
                              "address-level1",
                          }
                        )}
                      </div>
                    </div>

                    {renderField(
                      "country",
                      "Country",
                      "text",
                      {
                        autoComplete:
                          "country-name",
                      }
                    )}

                    <div className="d-grid d-sm-flex justify-content-sm-end mt-4">
                      <button
                        type="button"
                        className="btn btn-dark fw-bold px-4 py-2 rounded-3"
                        onClick={handleNextStep}
                        disabled={submitting}
                      >
                        Continue
                      </button>
                    </div>
                  </>
                )}

                {/* STEP 2 */}

                {currentStep === 2 && (
                  <>
                    <div className="mb-4">
                      <h2 className="h5 fw-bold mb-2">
                        Administrator account
                      </h2>

                      <p className="text-secondary mb-0">
                        Create the account that will manage
                        employees, customers, vehicles and
                        services.
                      </p>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        {renderField(
                          "manager_first_name",
                          "First name",
                          "text",
                          {
                            autoComplete:
                              "given-name",
                          }
                        )}
                      </div>

                      <div className="col-md-6">
                        {renderField(
                          "manager_last_name",
                          "Last name",
                          "text",
                          {
                            autoComplete:
                              "family-name",
                          }
                        )}
                      </div>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        {renderField(
                          "manager_dni",
                          "DNI",
                          "text",
                          {
                            maxLength: 9,
                            placeholder:
                              "12345678A",
                          }
                        )}
                      </div>

                      <div className="col-md-6">
                        {renderField(
                          "manager_phone",
                          "Administrator phone",
                          "tel",
                          {
                            placeholder:
                              "+34600000000",
                            autoComplete:
                              "tel",
                          }
                        )}
                      </div>
                    </div>

                    {renderField(
                      "manager_email",
                      "Login email",
                      "email",
                      {
                        placeholder:
                          "admin@example.com",
                        autoComplete:
                          "email",
                      }
                    )}

                    {renderPasswordField(
                      "manager_password",
                      "Password",
                      showPassword,
                      setShowPassword,
                      "Use at least 8 characters."
                    )}

                    {renderPasswordField(
                      "manager_password_confirm",
                      "Confirm password",
                      showPasswordConfirm,
                      setShowPasswordConfirm
                    )}

                    <div className="d-flex flex-column flex-sm-row justify-content-between gap-2 mt-4">
                      <button
                        type="button"
                        className="btn btn-outline-secondary fw-bold px-4 py-2 rounded-3"
                        onClick={handlePreviousStep}
                        disabled={submitting}
                      >
                        Back
                      </button>

                      <button
                        type="submit"
                        className="btn btn-warning fw-bold px-4 py-2 rounded-3"
                        disabled={submitting}
                      >
                        {submitting && (
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          />
                        )}

                        {submitting
                          ? "Creating workshop..."
                          : "Create workshop"}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};