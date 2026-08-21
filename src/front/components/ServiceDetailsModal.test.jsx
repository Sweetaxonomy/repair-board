import { render, screen } from "@testing-library/react";

jest.mock("../services/api", () => ({
  apiFetch: jest.fn(),
}));

jest.mock("../config", () => ({
  BACKEND_URL: "http://localhost:3001",
}));

import { ServiceDetailsModal } from "./ServiceDetailsModal";
import { apiFetch } from "../services/api";

beforeEach(() => {
  jest.clearAllMocks();
});


/* If the backend returns comments written by an admin and a mechanic,
does ServiceDetailsModal display both comments correctly? */

test("displays admin and mechanic comments", async () => {
  apiFetch.mockImplementation((endpoint) => {
    if (endpoint === "/services/7") {
      return Promise.resolve({
        service: {
          id: 7,
          title: "Engine diagnosis",
          status: "diagnosis",
          priority: "normal",
          vehicle_brand: "Seat",
          vehicle_model: "Leon",
          vehicle_plate: "7777CCC",
          customer_name: "Andrea",
          employee_name: "Johannes",
          employee_id: 2,
          description: "Check engine warning light",
          start_date: "2026-08-21T10:00:00Z",
        },
      });
    }

    if (endpoint === "/services/7/comments") {
      return Promise.resolve({
        comments: [
          {
            id: 1,
            author_name: "Michelle Admin",
            comment_type: "admin_alert",
            comment: "Please check this service as soon as possible.",
            created_at: "2026-08-21T10:30:00Z",
          },
          {
            id: 2,
            author_name: "Johannes Mechanic",
            comment_type: "status_update",
            comment: "Diagnosis completed. Waiting for approval.",
            created_at: "2026-08-21T11:00:00Z",
          },
        ],
      });
    }

    return Promise.resolve({});
  });

  render(
    <ServiceDetailsModal
      serviceId={7}
      role="admin"
      onClose={jest.fn()}
      onServiceUpdated={jest.fn()}
    />
  );

  expect(
    await screen.findByText("Michelle Admin")
  ).toBeInTheDocument();

  expect(
    screen.getByText("Please check this service as soon as possible.")
  ).toBeInTheDocument();

  expect(
    screen.getByText("Johannes Mechanic")
  ).toBeInTheDocument();

  expect(
    screen.getByText("Diagnosis completed. Waiting for approval.")
  ).toBeInTheDocument();

  expect(
    screen.getAllByText("Admin alert").length
  ).toBeGreaterThan(0);

  expect(
    screen.getAllByText("Status update").length
  ).toBeGreaterThan(0);
});