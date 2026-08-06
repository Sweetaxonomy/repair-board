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
  <>
    {/* Public area */}
    <Route
      path="/"
      element={<AppLayout />}
      errorElement={<NotFound />}
    >
      <Route index element={<Home />} />
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route
        path="forgot-password"
        element={<ForgotPassword />}
      />
    </Route>

    {/* Redirect according to the logged-in user's role */}
    <Route
      path="/dashboard"
      element={<DashboardRedirect />}
      errorElement={<NotFound />}
    />

    {/* Admin area */}
    <Route
      path="/admin"
      element={<DashboardLayout allowedRole="admin" />}
      errorElement={<NotFound />}
    >
      <Route index element={<AdminDashboard />} />
      <Route path="customers" element={<CustomerList />} />
      <Route path="mechanics" element={<MechanicList />} />
      <Route path="vehicles" element={<VehicleList />} />
      <Route
        path="services/new"
        element={<ServiceFormPage />}
      />
    </Route>

    {/* Mechanic area */}
    <Route
      path="/mechanic"
      element={<DashboardLayout allowedRole="mechanic" />}
      errorElement={<NotFound />}
    >
      <Route index element={<MechanicDashboard />} />
    </Route>

    {/* Any unknown URL */}
    <Route path="*" element={<NotFound />} />
  </>
);

export const router = createBrowserRouter(Routes);