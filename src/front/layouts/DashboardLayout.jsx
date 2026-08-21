import {
  Navigate,
  Outlet,
} from "react-router-dom";

import { DashboardSidebar } from "../components/DashboardSidebar";

const getStoredObject = (key) => {
  const storedValue = localStorage.getItem(key);

  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue);
  } catch (error) {
    console.error(
      `Error reading ${key} from localStorage`,
      error
    );

    localStorage.removeItem(key);
    return null;
  }
};

export const DashboardLayout = ({ allowedRole }) => {
  const token = localStorage.getItem("token");
  const user = getStoredObject("user");
  const employee = getStoredObject("employee");
  const workshop = getStoredObject("workshop");

  if (!token || !user || !employee) {
    return <Navigate to="/login" replace />;
  }

  const role = employee.role?.toLowerCase();

  if (role !== "admin" && role !== "mechanic") {
    return <Navigate to="/login" replace />;
  }

  if (role !== allowedRole) {
    const correctDashboard =
      role === "admin" ? "/admin" : "/mechanic";

    return (
      <Navigate
        to={correctDashboard}
        replace
      />
    );
  }

  return (
    <div className="dashboard-shell d-flex flex-column flex-md-row flex-grow-1">
      <DashboardSidebar
        role={role}
        user={user}
        employee={employee}
        workshop={workshop}
      />

      <main className="dashboard-main flex-grow-1 p-3 p-lg-4">
        <Outlet />
      </main>
    </div>
  );
};