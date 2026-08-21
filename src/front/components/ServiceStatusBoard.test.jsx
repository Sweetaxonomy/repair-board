/* If the backend returns a service with a Toyota Corolla,
plate 1234ABC, customer Michelle and mechanic Johannes,
does ServiceStatusBoard display it correctly on screen? */

import { render, screen, within, fireEvent } from "@testing-library/react";
import { ServiceStatusBoard } from "./ServiceStatusBoard";

jest.mock("../services/api", () => ({
  apiFetch: jest.fn(),
}));

jest.mock("./ServiceDetailsModal", () => ({
  ServiceDetailsModal: () => <div>Service details modal mock</div>,
}));

import { apiFetch } from "../services/api";

test("displays a workshop service on the board", async () => {
  apiFetch.mockImplementation((endpoint) => {
    if (endpoint === "/admin/dashboard") {
      return Promise.resolve({
        services_by_status: {
          pending: [
            {
              id: 1,
              title: "Oil change",
              status: "pending",
              vehicle_brand: "Toyota",
              vehicle_model: "Corolla",
              vehicle_plate: "1234ABC",
              customer_name: "Michelle",
              employee_name: "Johannes",
              employee_id: 2,
              priority: "normal",
              start_date: "2026-08-20T10:00:00Z",
              created_at: "2026-08-20T10:00:00Z",
            },
          ],
        },
      });
    }

    if (endpoint === "/services/1/status-logs") {
      return Promise.resolve({
        status_logs: [],
      });
    }

    return Promise.resolve({});
  });

  render(<ServiceStatusBoard role="admin" />);

  expect(
    await screen.findByText("Toyota Corolla")
  ).toBeInTheDocument();

  expect(
    screen.getByText("1234ABC")
  ).toBeInTheDocument();

  expect(
    screen.getByText("Oil change")
  ).toBeInTheDocument();

  expect(
    screen.getByText("Michelle")
  ).toBeInTheDocument();

  expect(
    screen.getByText("Johannes")
  ).toBeInTheDocument();
});


/* Checks that a service with status "in_repair"
is rendered inside the "In repair" column. */

test("displays a service in the correct status column", async () => {
  apiFetch.mockImplementation((endpoint) => {
    if (endpoint === "/admin/dashboard") {
      return Promise.resolve({
        services_by_status: {
          in_repair: [
            {
              id: 2,
              title: "Brake repair",
              status: "in_repair",
              vehicle_brand: "Honda",
              vehicle_model: "Civic",
              vehicle_plate: "5678DEF",
              customer_name: "Laura",
              employee_name: "Johannes",
              employee_id: 2,
              priority: "high",
              start_date: "2026-08-20T10:00:00Z",
              created_at: "2026-08-20T10:00:00Z",
            },
          ],
        },
      });
    }

    if (endpoint === "/services/2/status-logs") {
      return Promise.resolve({
        status_logs: [],
      });
    }

    return Promise.resolve({});
  });

  render(<ServiceStatusBoard role="admin" />);

  const inRepairHeading = await screen.findByRole("heading", {
    name: "In repair",
  });

  const inRepairRow = inRepairHeading.closest(".status-row");

  expect(inRepairRow).toBeInTheDocument();

  expect(
    within(inRepairRow).getByText("Honda Civic")
  ).toBeInTheDocument();

  expect(
    within(inRepairRow).getByText("Brake repair")
  ).toBeInTheDocument();
});


/* If a pending service is moved forward,
does ServiceStatusBoard request a status change to "diagnosis"? */

test("moves a pending service to diagnosis", async () => {
  apiFetch.mockImplementation((endpoint, options) => {
    if (endpoint === "/admin/dashboard") {
      return Promise.resolve({
        services_by_status: {
          pending: [
            {
              id: 3,
              title: "Engine check",
              status: "pending",
              vehicle_brand: "Ford",
              vehicle_model: "Focus",
              vehicle_plate: "9999XYZ",
              customer_name: "Laura",
              employee_name: "Johannes",
              employee_id: 2,
              priority: "normal",
              start_date: "2026-08-20T10:00:00Z",
              created_at: "2026-08-20T10:00:00Z",
            },
          ],
        },
      });
    }

    if (endpoint === "/services/3/status-logs") {
      return Promise.resolve({
        status_logs: [],
      });
    }

    if (
      endpoint === "/services/3/status" &&
      options?.method === "PATCH"
    ) {
      return Promise.resolve({
        message: "Status updated",
      });
    }

    return Promise.resolve({});
  });

  render(<ServiceStatusBoard role="admin" />);

  await screen.findByText("Ford Focus");

  const moveButton = screen.getByTitle("Move to Diagnosis");

  fireEvent.click(moveButton);

  expect(apiFetch).toHaveBeenCalledWith(
    "/services/3/status",
    {
      method: "PATCH",
      body: {
        status: "diagnosis",
        note: "Status updated from dashboard",
      },
    }
  );
});


/* If a mechanic sees an unassigned service and clicks "Assign",
does ServiceStatusBoard request to assign that service to the mechanic? */


test("allows a mechanic to assign an unassigned service", async () => {
  apiFetch.mockImplementation((endpoint, options) => {
    if (endpoint === "/mechanic/services") {
      return Promise.resolve({
        services: [
          {
            id: 4,
            title: "Tire replacement",
            status: "pending",
            vehicle_brand: "Volkswagen",
            vehicle_model: "Golf",
            vehicle_plate: "4567GHI",
            customer_name: "Daniel",
            employee_name: null,
            employee_id: null,
            priority: "normal",
            start_date: "2026-08-21T10:00:00Z",
            created_at: "2026-08-21T10:00:00Z",
          },
        ],
      });
    }

    if (endpoint === "/services/4/status-logs") {
      return Promise.resolve({
        status_logs: [],
      });
    }

    if (
      endpoint === "/services/4/assign-to-me" &&
      options?.method === "PATCH"
    ) {
      return Promise.resolve({
        message: "Service assigned",
      });
    }

    return Promise.resolve({});
  });

  render(<ServiceStatusBoard role="mechanic" />);

  await screen.findByText("Volkswagen Golf");

  const assignButton = screen.getByRole("button", {
    name: "Assign",
  });

  fireEvent.click(assignButton);

  expect(apiFetch).toHaveBeenCalledWith(
    "/services/4/assign-to-me",
    {
      method: "PATCH",
    }
  );
});