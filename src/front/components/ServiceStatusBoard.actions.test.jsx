import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";

import { ServiceStatusBoard } from "./ServiceStatusBoard";

jest.mock("../services/api", () => ({
  apiFetch: jest.fn(),
}));

jest.mock("./ServiceDetailsModal", () => ({
  ServiceDetailsModal: () => <div>Service details modal mock</div>,
}));

import { apiFetch } from "../services/api";

beforeEach(() => {
  jest.clearAllMocks();
});


/* If an admin edits a service title and saves the changes,
does ServiceStatusBoard send the updated data to the backend? */

test("updates a service from the edit modal", async () => {
  apiFetch.mockImplementation((endpoint, options) => {
    if (endpoint === "/admin/dashboard") {
      return Promise.resolve({
        services_by_status: {
          pending: [
            {
              id: 5,
              title: "Old service title",
              status: "pending",
              vehicle_brand: "Peugeot",
              vehicle_model: "208",
              vehicle_plate: "1111AAA",
              customer_name: "Carlos",
              employee_name: "Johannes",
              employee_id: 2,
              priority: "normal",
              entry_mileage: 45000,
              description: "Old description",
              observations: "Old observations",
              start_date: "2026-08-21T10:00:00Z",
              created_at: "2026-08-21T10:00:00Z",
            },
          ],
        },
      });
    }

    if (endpoint === "/services/5/status-logs") {
      return Promise.resolve({
        status_logs: [],
      });
    }

    if (
      endpoint === "/services/5" &&
      options?.method === "PUT"
    ) {
      return Promise.resolve({
        message: "Service updated",
      });
    }

    return Promise.resolve({});
  });

  render(<ServiceStatusBoard role="admin" />);

  await screen.findByText("Peugeot 208");

  const editButton = screen.getByTitle("Edit service");

  fireEvent.click(editButton);

  const titleInput = screen.getByLabelText("Service title");

  fireEvent.change(titleInput, {
    target: {
      value: "Updated service title",
    },
  });

  const saveButton = screen.getByRole("button", {
    name: "Save changes",
  });

  fireEvent.click(saveButton);

  await waitFor(() => {
    expect(apiFetch).toHaveBeenCalledWith(
      "/services/5",
      {
        method: "PUT",
        body: {
          title: "Updated service title",
          priority: "normal",
          entry_mileage: 45000,
          description: "Old description",
          observations: "Old observations",
        },
      }
    );
  });
});


/* If an admin confirms the deletion of a service,
does ServiceStatusBoard send a DELETE request to the backend? */

test("deletes a service after confirmation", async () => {
  apiFetch.mockImplementation((endpoint, options) => {
    if (endpoint === "/admin/dashboard") {
      return Promise.resolve({
        services_by_status: {
          pending: [
            {
              id: 6,
              title: "Battery replacement",
              status: "pending",
              vehicle_brand: "Renault",
              vehicle_model: "Clio",
              vehicle_plate: "2222BBB",
              customer_name: "Sofia",
              employee_name: "Johannes",
              employee_id: 2,
              priority: "normal",
              start_date: "2026-08-21T10:00:00Z",
              created_at: "2026-08-21T10:00:00Z",
            },
          ],
        },
      });
    }

    if (endpoint === "/services/6/status-logs") {
      return Promise.resolve({
        status_logs: [],
      });
    }

    if (
      endpoint === "/services/6" &&
      options?.method === "DELETE"
    ) {
      return Promise.resolve({
        message: "Service deleted",
      });
    }

    return Promise.resolve({});
  });

  render(<ServiceStatusBoard role="admin" />);

  await screen.findByText("Renault Clio");

  const deleteButton = screen.getByTitle("Delete service");

  fireEvent.click(deleteButton);

  expect(
    screen.getByText("Delete service?")
  ).toBeInTheDocument();

  const confirmDeleteButton = screen.getByRole("button", {
    name: "Delete",
  });

  fireEvent.click(confirmDeleteButton);

  await waitFor(() => {
    expect(apiFetch).toHaveBeenCalledWith(
      "/services/6",
      {
        method: "DELETE",
        body: {
          confirm: true,
        },
      }
    );
  });
});