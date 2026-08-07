import {
  Link,
  NavLink,
} from "react-router-dom";

import {
  Home,
  ClipboardPlus,
  Users,
  Car,
  Wrench,
} from "lucide-react";

export const DashboardSidebar = ({
  role,
  user,
  employee,
  workshop,
}) => {
  const today = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(new Date());

  const displayName =
    employee?.first_name && employee?.last_name
      ? `${employee.first_name} ${employee.last_name}`
      : employee?.first_name ||
        user?.email ||
        "User";

  const isAdmin = role === "admin";

  const roleLabel = isAdmin
    ? "admin"
    : "mechanic";

  const homePath = isAdmin
    ? "/admin"
    : "/mechanic";

  const getNavClass = ({ isActive }) => {
    const classes = [
      "nav-link",
      "dashboard-sidebar-link",
      "d-flex",
      "align-items-center",
      "gap-2",
      "rounded-3",
      "px-3",
      "py-3",
      "fw-semibold",
    ];

    if (isActive) {
      classes.push("active");
    }

    return classes.join(" ");
  };

  return (
    <aside className="dashboard-sidebar d-flex flex-column flex-shrink-0 text-white p-3 p-lg-4">
      <div className="dashboard-sidebar-scroll flex-grow-1 pe-md-1">
        <header className="mb-4">
          <p className="small text-white-50 fw-semibold mb-2">
            Today is, {today}
          </p>

          <Link
            to={homePath}
            className="d-block text-decoration-none text-white mb-2"
          >
            <span className="d-block fw-bold mb-2">
              Welcome back {roleLabel},
            </span>

            <span className="dashboard-user-name d-block fw-bold lh-sm">
              {displayName}
            </span>
          </Link>

          <p className="small text-white-50 mb-0">
            {isAdmin
              ? "Admin dashboard"
              : "Mechanic dashboard"}
          </p>
        </header>

        {isAdmin ? (
          <>
            <Link
              to="/admin/services/new"
              className="btn btn-warning w-100 d-flex align-items-center justify-content-center gap-2 fw-bold py-3 rounded-3 mb-4"
            >
              <ClipboardPlus size={18} />

              <span>New Task</span>
            </Link>

            <nav
              className="nav flex-column gap-2"
              aria-label="Admin navigation"
            >
              <NavLink
                end
                to="/admin"
                className={getNavClass}
              >
                <Home size={18} />
                <span>Dashboard</span>
              </NavLink>

              <NavLink
                to="/admin/mechanics"
                className={getNavClass}
              >
                <Wrench size={18} />
                <span>Mechanics</span>
              </NavLink>

              <NavLink
                to="/admin/vehicles"
                className={getNavClass}
              >
                <Car size={18} />
                <span>Vehicles</span>
              </NavLink>

              <NavLink
                to="/admin/customers"
                className={getNavClass}
              >
                <Users size={18} />
                <span>Customers</span>
              </NavLink>
            </nav>
          </>
        ) : (
          <nav
            className="nav flex-column gap-2"
            aria-label="Mechanic navigation"
          >
            <NavLink
              end
              to="/mechanic"
              className={getNavClass}
            >
              <Wrench size={18} />
              <span>My Tasks</span>
            </NavLink>
          </nav>
        )}
      </div>

      {workshop && (
        <footer className="mt-auto pt-4 border-top border-secondary">
          <strong className="d-block fs-5 text-white lh-sm mb-2">
            {workshop.company_name}
          </strong>

          {workshop.email && (
            <span className="d-block small text-white-50 text-break">
              {workshop.email}
            </span>
          )}

          {workshop.phone && (
            <span className="d-block small text-white-50 text-break">
              {workshop.phone}
            </span>
          )}

          {workshop.address && (
            <span className="d-block small text-white-50 text-break mt-1">
              {workshop.address}
            </span>
          )}
        </footer>
      )}
    </aside>
  );
};