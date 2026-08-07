import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";

import { AppLayout } from "./layouts/AppLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";

import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { DashboardRedirect } from "./pages/DashboardRedirect";

import { AdminDashboard } from "./pages/AdminDashboard";
import { MechanicDashboard } from "./pages/MechanicDashboard";

import CustomerList from "./pages/CustomerList";
import MechanicList from "./pages/MechanicList";
import VehicleList from "./pages/VehicleList";
import { ServiceFormPage } from "./pages/ServiceFormPage";

const NotFound = () => {
  return (
    <main className="container py-5">
      <h1 className="h3">Page not found</h1>

      <p className="text-muted mb-0">
        The page you are looking for does not exist.
      </p>
    </main>
  );
};

const Routes = createRoutesFromElements(
  <Route
    path="/"
    element={<AppLayout />}
    errorElement={<NotFound />}
  >
    {/* Public area */}

    <Route index element={<Home />} />

    <Route
      path="login"
      element={<Login />}
    />

    <Route
      path="register"
      element={<Register />}
    />

    <Route
      path="forgot-password"
      element={<ForgotPassword />}
    />

    {/* Redirect according to logged-in role */}

    <Route
      path="dashboard"
      element={<DashboardRedirect />}
    />

    {/* Admin area */}

    <Route
      path="admin"
      element={
        <DashboardLayout allowedRole="admin" />
      }
    >
      <Route
        index
        element={<AdminDashboard />}
      />

      <Route
        path="customers"
        element={<CustomerList />}
      />

      <Route
        path="mechanics"
        element={<MechanicList />}
      />

      <Route
        path="vehicles"
        element={<VehicleList />}
      />

      <Route
        path="services/new"
        element={<ServiceFormPage />}
      />
    </Route>

    {/* Mechanic area */}

    <Route
      path="mechanic"
      element={
        <DashboardLayout allowedRole="mechanic" />
      }
    >
      <Route
        index
        element={<MechanicDashboard />}
      />
    </Route>

    {/* Unknown routes */}

    <Route
      path="*"
      element={<NotFound />}
    />
  </Route>
);

export const router =
  createBrowserRouter(Routes);