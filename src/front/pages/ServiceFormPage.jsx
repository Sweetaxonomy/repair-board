import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";

import {
  buildCustomerPayload,
  CustomerForm,
  EMPTY_CUSTOMER_FORM,
  validateCustomerForm,
} from "../components/CustomerForm";

import {
  buildVehiclePayload,
  EMPTY_VEHICLE_FORM,
  VehicleForm,
  validateVehicleForm,
} from "../components/VehicleForm";

import { apiFetch } from "../services/api";

const EMPTY_SERVICE_FORM = {
  employee_id: "",
  title: "",
  description: "",
  service_type: "repair",
  priority: "normal",
  entry_mileage: "",
  observations: "",
};

const SERVICE_TYPES = [
  { value: "repair", label: "Repair" },
  { value: "maintenance", label: "Maintenance" },
  { value: "diagnostic", label: "Diagnostic" },
  { value: "inspection", label: "Inspection" },
  { value: "bodywork", label: "Bodywork" },
  { value: "painting", label: "Painting" },
  { value: "cleaning", label: "Cleaning" },
  { value: "detailing", label: "Detailing" },
  { value: "other", label: "Other" },
];

const SERVICE_PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const getCustomerLabel = (customer) => {
  const fullName = [customer?.first_name, customer?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  const dni = customer?.dni ? ` · ${customer.dni}` : "";

  return `${fullName || "Customer"}${dni}`;
};

const getVehicleLabel = (vehicle) => {
  const vehicleName = [vehicle?.brand, vehicle?.model, vehicle?.version]
    .filter(Boolean)
    .join(" ")
    .trim();

  const year = vehicle?.year ? ` · ${vehicle.year}` : "";
  const plate = vehicle?.plate ? ` · ${vehicle.plate}` : "";

  return `${vehicleName || "Vehicle"}${year}${plate}`;
};

const getMechanicLabel = (mechanic) => {
  const fullName = [mechanic?.first_name, mechanic?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || mechanic?.email || `Mechanic #${mechanic?.id}`;
};

const hasErrors = (errors) => Object.keys(errors).length > 0;

export const ServiceFormPage = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [mechanics, setMechanics] = useState([]);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(false);

  const [customerForm, setCustomerForm] = useState({
    ...EMPTY_CUSTOMER_FORM,
  });
  const [customerErrors, setCustomerErrors] = useState({});

  const [vehicleForm, setVehicleForm] = useState({
    ...EMPTY_VEHICLE_FORM,
  });
  const [vehicleErrors, setVehicleErrors] = useState({});

  const [serviceForm, setServiceForm] = useState({
    ...EMPTY_SERVICE_FORM,
  });
  const [serviceErrors, setServiceErrors] = useState({});

  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  const [isSavingVehicle, setIsSavingVehicle] = useState(false);
  const [isSavingService, setIsSavingService] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isBusy =
    isSavingCustomer || isSavingVehicle || isSavingService;

  const customerVehicles = useMemo(() => {
    if (!selectedCustomer) {
      return [];
    }

    return vehicles.filter(
      (vehicle) =>
        Number(vehicle.customer_id) === Number(selectedCustomer.id)
    );
  }, [vehicles, selectedCustomer]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        setIsLoadingOptions(true);
        setError("");

        const [customersData, vehiclesData, mechanicsData] =
          await Promise.all([
            apiFetch("/customers"),
            apiFetch("/vehicles"),
            apiFetch("/mechanics"),
          ]);

        setCustomers(customersData.customers || []);
        setVehicles(vehiclesData.vehicles || []);
        setMechanics(mechanicsData.mechanics || []);
      } catch (loadError) {
        setError(
          loadError.message ||
            "Could not load customers, vehicles and mechanics."
        );
      } finally {
        setIsLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

  const clearMessages = () => {
    setError("");
    setSuccessMessage("");
  };

  const handleSelectCustomer = (event) => {
    const customerId = Number(event.target.value);
    const customer = customers.find(
      (item) => Number(item.id) === customerId
    );

    setSelectedCustomer(customer || null);
    setSelectedVehicle(null);
    setShowCustomerForm(false);
    setShowVehicleForm(false);
    setVehicleForm({ ...EMPTY_VEHICLE_FORM });
    setVehicleErrors({});
    setServiceForm((current) => ({
      ...current,
      entry_mileage: "",
    }));

    clearMessages();
  };

  const handleCustomerFormChange = (event) => {
    const { name, value } = event.target;

    setCustomerForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (customerErrors[name]) {
      setCustomerErrors((current) => ({
        ...current,
        [name]: undefined,
      }));
    }

    clearMessages();
  };

  const handleCreateCustomer = async (event) => {
    event.preventDefault();

    const validationErrors = validateCustomerForm(customerForm);

    if (hasErrors(validationErrors)) {
      setCustomerErrors(validationErrors);
      return;
    }

    try {
      setIsSavingCustomer(true);
      setCustomerErrors({});
      clearMessages();

      const data = await apiFetch("/customers", {
        method: "POST",
        body: buildCustomerPayload(customerForm),
      });

      const newCustomer = data.customer;

      if (!newCustomer) {
        throw new Error("Customer was created but no customer data was returned.");
      }

      setCustomers((current) => [newCustomer, ...current]);
      setSelectedCustomer(newCustomer);
      setSelectedVehicle(null);
      setCustomerForm({ ...EMPTY_CUSTOMER_FORM });
      setVehicleForm({ ...EMPTY_VEHICLE_FORM });
      setShowCustomerForm(false);
      setShowVehicleForm(false);
      setSuccessMessage("Customer created successfully.");
    } catch (saveError) {
      setError(saveError.message || "Could not create customer.");
    } finally {
      setIsSavingCustomer(false);
    }
  };

  const handleContinueFromCustomer = () => {
    if (!selectedCustomer) {
      setError("Select an existing customer or create a new one first.");
      return;
    }

    clearMessages();
    setStep(2);
  };

  const handleSelectVehicle = (event) => {
    const vehicleId = Number(event.target.value);
    const vehicle = customerVehicles.find(
      (item) => Number(item.id) === vehicleId
    );

    setSelectedVehicle(vehicle || null);
    setShowVehicleForm(false);
    setVehicleErrors({});

    setServiceForm((current) => ({
      ...current,
      entry_mileage:
        vehicle?.mileage === null || vehicle?.mileage === undefined
          ? ""
          : String(vehicle.mileage),
    }));

    clearMessages();
  };

  const handleVehicleFormChange = (event) => {
    const { name, value } = event.target;

    setVehicleForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (vehicleErrors[name]) {
      setVehicleErrors((current) => ({
        ...current,
        [name]: undefined,
      }));
    }

    clearMessages();
  };

  const handleCreateVehicle = async (event) => {
    event.preventDefault();

    if (!selectedCustomer) {
      setError("Select or create a customer before creating a vehicle.");
      setStep(1);
      return;
    }

    const validationErrors = validateVehicleForm(vehicleForm, {
      requireCustomer: false,
    });

    if (hasErrors(validationErrors)) {
      setVehicleErrors(validationErrors);
      return;
    }

    try {
      setIsSavingVehicle(true);
      setVehicleErrors({});
      clearMessages();

      const data = await apiFetch("/vehicles", {
        method: "POST",
        body: buildVehiclePayload(vehicleForm, {
          customerId: selectedCustomer.id,
        }),
      });

      const newVehicle = data.vehicle;

      if (!newVehicle) {
        throw new Error("Vehicle was created but no vehicle data was returned.");
      }

      setVehicles((current) => [newVehicle, ...current]);
      setSelectedVehicle(newVehicle);
      setVehicleForm({ ...EMPTY_VEHICLE_FORM });
      setShowVehicleForm(false);
      setServiceForm((current) => ({
        ...current,
        entry_mileage:
          newVehicle.mileage === null || newVehicle.mileage === undefined
            ? ""
            : String(newVehicle.mileage),
      }));
      setSuccessMessage("Vehicle created successfully.");
    } catch (saveError) {
      setError(saveError.message || "Could not create vehicle.");
    } finally {
      setIsSavingVehicle(false);
    }
  };

  const handleContinueFromVehicle = () => {
    if (!selectedVehicle) {
      setError("Select an existing vehicle or create a new one first.");
      return;
    }

    clearMessages();
    setStep(3);
  };

  const handleServiceFormChange = (event) => {
    const { name, value } = event.target;

    setServiceForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (serviceErrors[name]) {
      setServiceErrors((current) => ({
        ...current,
        [name]: undefined,
      }));
    }

    clearMessages();
  };

  const validateService = () => {
    const errors = {};

    if (!serviceForm.title.trim()) {
      errors.title = "Service title is required.";
    }

    if (!serviceForm.service_type) {
      errors.service_type = "Select a service type.";
    }

    if (!serviceForm.priority) {
      errors.priority = "Select a priority.";
    }

    if (serviceForm.entry_mileage !== "") {
      const mileage = Number(serviceForm.entry_mileage);

      if (Number.isNaN(mileage) || mileage < 0) {
        errors.entry_mileage =
          "Entry mileage must be zero or a positive number.";
      }
    }

    return errors;
  };

  const handleCreateService = async (event) => {
    event.preventDefault();

    if (!selectedCustomer) {
      setError("Select or create a customer first.");
      setStep(1);
      return;
    }

    if (!selectedVehicle) {
      setError("Select or create a vehicle first.");
      setStep(2);
      return;
    }

    const validationErrors = validateService();

    if (hasErrors(validationErrors)) {
      setServiceErrors(validationErrors);
      return;
    }

    try {
      setIsSavingService(true);
      setServiceErrors({});
      clearMessages();

      await apiFetch("/services", {
        method: "POST",
        body: {
          customer_id: Number(selectedCustomer.id),
          vehicle_id: Number(selectedVehicle.id),
          employee_id: serviceForm.employee_id
            ? Number(serviceForm.employee_id)
            : null,
          title: serviceForm.title.trim(),
          description: serviceForm.description.trim() || null,
          service_type: serviceForm.service_type,
          status: "pending",
          priority: serviceForm.priority,
          entry_mileage:
            serviceForm.entry_mileage !== ""
              ? Number(serviceForm.entry_mileage)
              : null,
          observations: serviceForm.observations.trim() || null,
        },
      });

      setSuccessMessage("Service ticket created successfully.");

      window.setTimeout(() => {
        navigate("/admin");
      }, 800);
    } catch (saveError) {
      setError(saveError.message || "Could not create service ticket.");
    } finally {
      setIsSavingService(false);
    }
  };

  const renderStepButton = (number, label) => {
    const isActive = step === number;
    const isCompleted = step > number;
    const isDisabled =
      isBusy ||
      (number === 2 && !selectedCustomer) ||
      (number === 3 && (!selectedCustomer || !selectedVehicle));

    return (
      <button
        key={number}
        type="button"
        className={`btn d-flex align-items-center gap-2 p-0 border-0 ${
          isActive ? "fw-bold text-dark" : "text-secondary"
        }`}
        onClick={() => setStep(number)}
        disabled={isDisabled}
      >
        <span
          className={`rounded-circle d-inline-flex align-items-center justify-content-center fw-bold ${
            isActive || isCompleted
              ? "bg-warning text-dark"
              : "bg-light text-secondary border"
          }`}
          style={{ width: 34, height: 34 }}
        >
          {isCompleted ? <Check size={18} /> : number}
        </span>

        <span>{label}</span>
      </button>
    );
  };

  return (
    <section className="container-fluid px-0">
      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-4">
        <div>
          <button
            type="button"
            className="btn btn-link text-dark text-decoration-none p-0 mb-3 d-inline-flex align-items-center gap-2"
            onClick={() => navigate("/admin")}
            disabled={isBusy}
          >
            <ArrowLeft size={18} />
            Back to dashboard
          </button>

          <h1 className="h3 fw-bold mb-1">New Service Ticket</h1>
          <p className="text-secondary mb-0">
            Select the customer and vehicle, then register the repair request.
          </p>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3 p-md-4">
          <div className="d-flex flex-column flex-md-row gap-3 gap-md-5">
            {renderStepButton(1, "Customer")}
            {renderStepButton(2, "Vehicle")}
            {renderStepButton(3, "Service")}
          </div>
        </div>
      </div>

      {isLoadingOptions && (
        <div className="alert alert-secondary d-flex align-items-center gap-2">
          <span
            className="spinner-border spinner-border-sm"
            role="status"
            aria-hidden="true"
          />
          Loading customers, vehicles and mechanics...
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success" role="alert">
          {successMessage}
        </div>
      )}

      {!isLoadingOptions && step === 1 && (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-3 p-md-4">
            <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4">
              <div>
                <h2 className="h5 fw-bold mb-1">1. Customer</h2>
                <p className="text-secondary mb-0">
                  Select an existing customer or create a new one.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-outline-dark d-inline-flex align-items-center justify-content-center gap-2"
                onClick={() => {
                  setShowCustomerForm((current) => !current);
                  setCustomerErrors({});
                  clearMessages();
                }}
                disabled={isBusy}
              >
                <Plus size={18} />
                {showCustomerForm ? "Cancel new customer" : "Add new customer"}
              </button>
            </div>

            {!showCustomerForm ? (
              <>
                <label
                  htmlFor="service-customer-select"
                  className="form-label fw-semibold"
                >
                  Customer *
                </label>

                <select
                  id="service-customer-select"
                  className="form-select"
                  value={selectedCustomer?.id || ""}
                  onChange={handleSelectCustomer}
                  disabled={isBusy}
                >
                  <option value="">Select customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {getCustomerLabel(customer)}
                    </option>
                  ))}
                </select>

                {customers.length === 0 && (
                  <p className="form-text mb-0">
                    There are no customers yet. Use “Add new customer”.
                  </p>
                )}
              </>
            ) : (
              <form onSubmit={handleCreateCustomer} noValidate>
                <CustomerForm
                  formData={customerForm}
                  errors={customerErrors}
                  disabled={isSavingCustomer}
                  onChange={handleCustomerFormChange}
                  idPrefix="service-customer"
                />

                <div className="d-flex justify-content-end mt-4">
                  <button
                    type="submit"
                    className="btn btn-warning fw-bold px-4"
                    disabled={isSavingCustomer}
                  >
                    {isSavingCustomer ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          aria-hidden="true"
                        />
                        Saving customer...
                      </>
                    ) : (
                      "Create customer"
                    )}
                  </button>
                </div>
              </form>
            )}

            {selectedCustomer && !showCustomerForm && (
              <div className="alert alert-light border mt-4 mb-0">
                <strong>Selected:</strong> {getCustomerLabel(selectedCustomer)}
              </div>
            )}

            <div className="d-flex justify-content-end mt-4 pt-3 border-top">
              <button
                type="button"
                className="btn btn-warning fw-bold d-inline-flex align-items-center gap-2"
                onClick={handleContinueFromCustomer}
                disabled={!selectedCustomer || isBusy}
              >
                Continue to vehicle
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {!isLoadingOptions && step === 2 && (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-3 p-md-4">
            <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4">
              <div>
                <h2 className="h5 fw-bold mb-1">2. Vehicle</h2>
                <p className="text-secondary mb-0">
                  Choose one of {getCustomerLabel(selectedCustomer)}’s vehicles or add a new one.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-outline-dark d-inline-flex align-items-center justify-content-center gap-2"
                onClick={() => {
                  setShowVehicleForm((current) => !current);
                  setVehicleErrors({});
                  clearMessages();
                }}
                disabled={isBusy}
              >
                <Plus size={18} />
                {showVehicleForm ? "Cancel new vehicle" : "Add new vehicle"}
              </button>
            </div>

            {!showVehicleForm ? (
              <>
                <label
                  htmlFor="service-vehicle-select"
                  className="form-label fw-semibold"
                >
                  Vehicle *
                </label>

                <select
                  id="service-vehicle-select"
                  className="form-select"
                  value={selectedVehicle?.id || ""}
                  onChange={handleSelectVehicle}
                  disabled={isBusy}
                >
                  <option value="">Select vehicle</option>
                  {customerVehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {getVehicleLabel(vehicle)}
                    </option>
                  ))}
                </select>

                {customerVehicles.length === 0 && (
                  <p className="form-text mb-0">
                    This customer has no vehicles yet. Use “Add new vehicle”.
                  </p>
                )}
              </>
            ) : (
              <form onSubmit={handleCreateVehicle} noValidate>
                <div className="alert alert-light border mb-4">
                  <strong>Owner:</strong> {getCustomerLabel(selectedCustomer)}
                </div>

                <VehicleForm
                  formData={vehicleForm}
                  errors={vehicleErrors}
                  disabled={isSavingVehicle}
                  onChange={handleVehicleFormChange}
                  showOwnerField={false}
                  idPrefix="service-vehicle"
                />

                <div className="d-flex justify-content-end mt-4">
                  <button
                    type="submit"
                    className="btn btn-warning fw-bold px-4"
                    disabled={isSavingVehicle}
                  >
                    {isSavingVehicle ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          aria-hidden="true"
                        />
                        Saving vehicle...
                      </>
                    ) : (
                      "Create vehicle"
                    )}
                  </button>
                </div>
              </form>
            )}

            {selectedVehicle && !showVehicleForm && (
              <div className="alert alert-light border mt-4 mb-0">
                <strong>Selected:</strong> {getVehicleLabel(selectedVehicle)}
              </div>
            )}

            <div className="d-flex flex-column flex-sm-row justify-content-between gap-2 mt-4 pt-3 border-top">
              <button
                type="button"
                className="btn btn-outline-secondary d-inline-flex align-items-center justify-content-center gap-2"
                onClick={() => {
                  clearMessages();
                  setStep(1);
                }}
                disabled={isBusy}
              >
                <ChevronLeft size={18} />
                Back to customer
              </button>

              <button
                type="button"
                className="btn btn-warning fw-bold d-inline-flex align-items-center justify-content-center gap-2"
                onClick={handleContinueFromVehicle}
                disabled={!selectedVehicle || isBusy}
              >
                Continue to service
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {!isLoadingOptions && step === 3 && (
        <form onSubmit={handleCreateService} noValidate>
          <div className="card border-0 shadow-sm">
            <div className="card-body p-3 p-md-4">
              <div className="mb-4">
                <h2 className="h5 fw-bold mb-1">3. Service</h2>
                <p className="text-secondary mb-0">
                  Register the work requested for the selected vehicle.
                </p>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-12 col-lg-6">
                  <div className="border rounded-3 p-3 h-100 bg-light">
                    <span className="small text-secondary d-block mb-1">
                      Customer
                    </span>
                    <strong>{getCustomerLabel(selectedCustomer)}</strong>
                  </div>
                </div>

                <div className="col-12 col-lg-6">
                  <div className="border rounded-3 p-3 h-100 bg-light">
                    <span className="small text-secondary d-block mb-1">
                      Vehicle
                    </span>
                    <strong>{getVehicleLabel(selectedVehicle)}</strong>
                  </div>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-12 col-lg-6">
                  <label
                    htmlFor="service-title"
                    className="form-label fw-semibold"
                  >
                    Service title *
                  </label>
                  <input
                    id="service-title"
                    type="text"
                    name="title"
                    className={`form-control ${
                      serviceErrors.title ? "is-invalid" : ""
                    }`}
                    placeholder="Example: Front brake replacement"
                    value={serviceForm.title}
                    onChange={handleServiceFormChange}
                    disabled={isSavingService}
                  />
                  {serviceErrors.title && (
                    <div className="invalid-feedback">
                      {serviceErrors.title}
                    </div>
                  )}
                </div>

                <div className="col-12 col-lg-6">
                  <label
                    htmlFor="service-mechanic"
                    className="form-label fw-semibold"
                  >
                    Assigned mechanic
                  </label>
                  <select
                    id="service-mechanic"
                    name="employee_id"
                    className="form-select"
                    value={serviceForm.employee_id}
                    onChange={handleServiceFormChange}
                    disabled={isSavingService}
                  >
                    <option value="">Unassigned</option>
                    {mechanics.map((mechanic) => (
                      <option key={mechanic.id} value={mechanic.id}>
                        {getMechanicLabel(mechanic)}
                      </option>
                    ))}
                  </select>
                  <div className="form-text">
                    You can leave the task unassigned and assign it later.
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <label
                    htmlFor="service-type"
                    className="form-label fw-semibold"
                  >
                    Service type *
                  </label>
                  <select
                    id="service-type"
                    name="service_type"
                    className={`form-select ${
                      serviceErrors.service_type ? "is-invalid" : ""
                    }`}
                    value={serviceForm.service_type}
                    onChange={handleServiceFormChange}
                    disabled={isSavingService}
                  >
                    {SERVICE_TYPES.map((serviceType) => (
                      <option key={serviceType.value} value={serviceType.value}>
                        {serviceType.label}
                      </option>
                    ))}
                  </select>
                  {serviceErrors.service_type && (
                    <div className="invalid-feedback">
                      {serviceErrors.service_type}
                    </div>
                  )}
                </div>

                <div className="col-12 col-md-6">
                  <label
                    htmlFor="service-priority"
                    className="form-label fw-semibold"
                  >
                    Priority *
                  </label>
                  <select
                    id="service-priority"
                    name="priority"
                    className={`form-select ${
                      serviceErrors.priority ? "is-invalid" : ""
                    }`}
                    value={serviceForm.priority}
                    onChange={handleServiceFormChange}
                    disabled={isSavingService}
                  >
                    {SERVICE_PRIORITIES.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                  {serviceErrors.priority && (
                    <div className="invalid-feedback">
                      {serviceErrors.priority}
                    </div>
                  )}
                </div>

                <div className="col-12 col-md-6">
                  <label
                    className="form-label fw-semibold"
                    htmlFor="service-entry-mileage"
                  >
                    Mileage at check-in
                  </label>

                  <div className="input-group">
                    <input
                      id="service-entry-mileage"
                      type="number"
                      name="entry_mileage"
                      min="0"
                      className="form-control"
                      value={serviceForm.entry_mileage}
                      onChange={handleServiceFormChange}
                    />

                    <span className="input-group-text">
                      km
                    </span>
                  </div>

                  <div className="form-text">
                    Pre-filled from the vehicle record. Update it if the mileage has changed since the last visit.
                  </div>
                </div>

                <div className="col-12">
                  <label
                    htmlFor="service-description"
                    className="form-label fw-semibold"
                  >
                    Description
                  </label>
                  <textarea
                    id="service-description"
                    name="description"
                    className="form-control"
                    rows="4"
                    placeholder="Describe the work requested, symptoms or customer complaint."
                    value={serviceForm.description}
                    onChange={handleServiceFormChange}
                    disabled={isSavingService}
                  />
                </div>

                <div className="col-12">
                  <label
                    htmlFor="service-observations"
                    className="form-label fw-semibold"
                  >
                    Observations
                  </label>
                  <textarea
                    id="service-observations"
                    name="observations"
                    className="form-control"
                    rows="3"
                    placeholder="Internal notes or additional information."
                    value={serviceForm.observations}
                    onChange={handleServiceFormChange}
                    disabled={isSavingService}
                  />
                </div>
              </div>

              <div className="alert alert-light border mt-4 mb-0">
                <strong>Initial status:</strong> Pending
                <span className="text-secondary ms-2">
                  New tickets always enter the workflow as pending.
                </span>
              </div>

              <div className="d-flex flex-column flex-sm-row justify-content-between gap-2 mt-4 pt-3 border-top">
                <button
                  type="button"
                  className="btn btn-outline-secondary d-inline-flex align-items-center justify-content-center gap-2"
                  onClick={() => {
                    clearMessages();
                    setStep(2);
                  }}
                  disabled={isSavingService}
                >
                  <ChevronLeft size={18} />
                  Back to vehicle
                </button>

                <button
                  type="submit"
                  className="btn btn-warning fw-bold px-4"
                  disabled={isSavingService}
                >
                  {isSavingService ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        aria-hidden="true"
                      />
                      Creating ticket...
                    </>
                  ) : (
                    "Create service ticket"
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </section>
  );
};