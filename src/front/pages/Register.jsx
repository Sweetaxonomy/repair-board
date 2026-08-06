import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  CheckCircle2,
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
  const [showPasswordConfirm, setShowPasswordConfirm] =
    useState(false);

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
      nextErrors.company_name = "Workshop name is required";
    }

    /*
     * CIF is optional.
     * We only validate its format when the user writes something.
     */
    if (cif && !patterns.cif.test(cif)) {
      nextErrors.cif = "Invalid CIF. Example: B12345678";
    }

    /*
     * Workshop phone is optional.
     * When omitted, the backend uses the administrator phone.
     */
    if (
      workshopPhone &&
      !patterns.phone.test(workshopPhone)
    ) {
      nextErrors.phone = "Invalid phone number";
    }

    /*
     * Public workshop email is optional.
     * When omitted, the backend uses the administrator email.
     */
    if (
      workshopEmail &&
      !patterns.email.test(workshopEmail)
    ) {
      nextErrors.email = "Invalid email";
    }

    if (!form.address.trim()) {
      nextErrors.address = "Address is required";
    }

    if (!form.postal_code.trim()) {
      nextErrors.postal_code = "Postal code is required";
    } else if (
      !patterns.postal_code.test(form.postal_code.trim())
    ) {
      nextErrors.postal_code =
        "Postal code must have 5 digits";
    }

    if (!form.city.trim()) {
      nextErrors.city = "City is required";
    }

    if (!form.province.trim()) {
      nextErrors.province = "Province is required";
    }

    if (!form.country.trim()) {
      nextErrors.country = "Country is required";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const validateAdminStep = () => {
    const nextErrors = {};

    const dni = form.manager_dni.trim().toUpperCase();
    const phone = form.manager_phone.trim();
    const email = form.manager_email.trim();

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
      nextErrors.manager_email = "Invalid email";
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
    const workshopIsValid = validateWorkshopStep();

    if (!workshopIsValid) {
      setCurrentStep(1);
      return false;
    }

    const adminIsValid = validateAdminStep();

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

    return addressParts.filter(Boolean).join(", ");
  };

  const handlePreviousStep = () => {
    setServerMsg("");
    setErrors({});
    setCurrentStep(1);
  };

  const handleNextStep = () => {
    setServerMsg("");

    if (!validateWorkshopStep()) {
      return;
    }

    setErrors({});
    setCurrentStep(2);
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
        company_name: form.company_name.trim(),
        cif: form.cif.trim().toUpperCase(),

        workshop_phone: form.phone.trim(),
        workshop_email: form.email.trim(),

        address: buildFullAddress(),
        city: form.city.trim(),
        postal_code: form.postal_code.trim(),

        first_name: form.manager_first_name.trim(),
        last_name: form.manager_last_name.trim(),
        dni: form.manager_dni.trim().toUpperCase(),
        employee_phone: form.manager_phone.trim(),

        user_email: form.manager_email.trim(),
        password: form.manager_password,
        password_confirm:
          form.manager_password_confirm,
      };

      const response = await registerWorkshop(payload);

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
      console.error("Register error:", error);

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
            <span className="badge rounded-pill bg-light border text-secondary fw-normal">
              Optional
            </span>
          )}
        </label>

        <input
          id={name}
          type={type}
          name={name}
          value={form[name]}
          onChange={handleChange}
          className={`form-control form-control-lg rounded-3 ${
            errors[name] ? "is-invalid" : ""
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
            type={isVisible ? "text" : "password"}
            name={name}
            value={form[name]}
            onChange={handleChange}
            className={`form-control rounded-start-3 ${
              errors[name] ? "is-invalid" : ""
            }`}
            disabled={submitting}
            autoComplete="new-password"
            aria-invalid={Boolean(errors[name])}
          />

          <button
            type="button"
            className="btn btn-outline-secondary rounded-end-3"
            onClick={() =>
              setIsVisible(
                (previousValue) => !previousValue
              )
            }
            disabled={submitting}
            aria-label={
              isVisible
                ? "Hide password"
                : "Show password"
            }
            aria-pressed={isVisible}
            title={
              isVisible
                ? "Hide password"
                : "Show password"
            }
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

  if (registrationSuccess) {
    const {
      workshop,
      employee,
      user,
    } = registrationSuccess;

    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">
            <section className="card border-0 shadow-sm rounded-4 overflow-hidden">
              <div className="bg-dark text-white text-center p-4 p-md-5">
                <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-warning text-dark p-3 mb-3">
                  <CheckCircle2 size={30} />
                </div>

                <span className="d-block text-warning fw-semibold small text-uppercase mb-2">
                  Setup complete
                </span>

                <h1 className="h3 fw-bold mb-2">
                  Your workshop is ready
                </h1>

                <p className="text-white-50 mb-0">
                  Your workshop and administrator
                  account were created successfully.
                </p>
              </div>

              <div className="card-body p-4 p-md-5">
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="border rounded-4 p-4 h-100 bg-light">
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <Building2
                          size={20}
                          className="text-warning"
                        />

                        <small className="text-uppercase text-muted fw-semibold">
                          Workshop
                        </small>
                      </div>

                      <h2 className="h5 fw-bold mb-1">
                        {workshop?.company_name}
                      </h2>

                      <p className="text-muted mb-0">
                        {workshop?.email}
                      </p>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="border rounded-4 p-4 h-100 bg-light">
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <UserRound
                          size={20}
                          className="text-warning"
                        />

                        <small className="text-uppercase text-muted fw-semibold">
                          Administrator
                        </small>
                      </div>

                      <h2 className="h5 fw-bold mb-1">
                        {employee?.first_name}{" "}
                        {employee?.last_name}
                      </h2>

                      <p className="text-muted mb-0">
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

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-9 col-xl-8">
          <section className="card border-0 shadow-sm rounded-4 overflow-hidden">
            <header className="bg-dark text-white p-4 p-md-5">
              <span className="badge rounded-pill bg-warning text-dark mb-3">
                Workshop setup
              </span>

              <h1 className="h3 fw-bold mb-2">
                Create your workshop
              </h1>

              <p className="text-white-50 mb-0">
                {currentStep === 1
                  ? "Enter the public information for your workshop."
                  : "Create the administrator who will manage the platform."}
              </p>
            </header>

            <div className="card-body p-4 p-md-5">
              <div
                className="row g-2 mb-4"
                aria-label="Registration steps"
              >
                <div className="col-6">
                  <button
                    type="button"
                    className={`btn w-100 d-flex align-items-center justify-content-center gap-2 fw-bold py-3 rounded-3 ${
                      currentStep === 1
                        ? "btn-warning"
                        : "btn-outline-dark"
                    }`}
                    onClick={handlePreviousStep}
                    disabled={submitting}
                    aria-current={
                      currentStep === 1
                        ? "step"
                        : undefined
                    }
                  >
                    <Building2 size={19} />
                    <span>Workshop</span>
                  </button>
                </div>

                <div className="col-6">
                  <button
                    type="button"
                    className={`btn w-100 d-flex align-items-center justify-content-center gap-2 fw-bold py-3 rounded-3 ${
                      currentStep === 2
                        ? "btn-warning"
                        : "btn-outline-dark"
                    }`}
                    onClick={handleNextStep}
                    disabled={submitting}
                    aria-current={
                      currentStep === 2
                        ? "step"
                        : undefined
                    }
                  >
                    <UserRound size={19} />
                    <span>Administrator</span>
                  </button>
                </div>
              </div>

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
                {currentStep === 1 && (
                  <>
                    <div className="mb-4">
                      <h2 className="h5 fw-bold mb-1">
                        Workshop details
                      </h2>

                      <p className="text-muted small mb-0">
                        This information identifies your
                        workshop inside the platform.
                      </p>
                    </div>

                    {renderField(
                      "company_name",
                      "Workshop name",
                      "text",
                      {
                        placeholder:
                          "Example Motor Workshop",
                        autoComplete: "organization",
                      }
                    )}

                    <div className="row">
                      <div className="col-md-6">
                        {renderField(
                          "cif",
                          "CIF",
                          "text",
                          {
                            optional: true,
                            maxLength: 9,
                            placeholder: "B12345678",
                            autoCapitalize:
                              "characters",
                            helperText:
                              "Leave it empty when the workshop does not have a CIF.",
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
                              "The administrator phone will be used when omitted.",
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
                        autoComplete: "email",
                        helperText:
                          "The administrator email will be used when omitted.",
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

                    <div className="row">
                      <div className="col-md-4">
                        {renderField(
                          "postal_code",
                          "Postal code",
                          "text",
                          {
                            maxLength: 5,
                            placeholder: "28001",
                            inputMode: "numeric",
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
                        className="btn btn-warning fw-bold px-4 py-2 rounded-3"
                        onClick={handleNextStep}
                        disabled={submitting}
                      >
                        Continue
                      </button>
                    </div>
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    <div className="mb-4">
                      <h2 className="h5 fw-bold mb-1">
                        Administrator details
                      </h2>

                      <p className="text-muted small mb-0">
                        These credentials will be used to
                        access and manage the workshop.
                      </p>
                    </div>

                    <div className="row">
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

                    <div className="row">
                      <div className="col-md-6">
                        {renderField(
                          "manager_dni",
                          "DNI",
                          "text",
                          {
                            maxLength: 9,
                            placeholder:
                              "12345678A",
                            autoCapitalize:
                              "characters",
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
                            autoComplete: "tel",
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
                        autoComplete: "email",
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