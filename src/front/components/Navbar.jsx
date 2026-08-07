import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import logoTaller from "../assets/img/logoTaller.png";

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = Boolean(
    localStorage.getItem("token")
  );

  const currentPath = location.pathname;

  const isHome = currentPath === "/";
  const isLogin = currentPath === "/login";
  const isRegister = currentPath === "/register";

  const isDashboardArea =
    currentPath === "/dashboard" ||
    currentPath.startsWith("/admin") ||
    currentPath.startsWith("/mechanic");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("employee");
    localStorage.removeItem("workshop");

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark border-bottom border-warning p-0">
      <div className="container-fluid px-4">
        <Link
          className="navbar-brand d-flex align-items-center"
          to="/"
          aria-label="Go to home"
        >
          <img
            src={logoTaller}
            alt="Workshop Manager logo"
            height="48"
            className="d-inline-block align-text-top"
          />
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
          aria-controls="mainNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div
          className="collapse navbar-collapse"
          id="mainNavbar"
        >
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center gap-lg-2">
            {!isHome && (
              <li className="nav-item">
                <NavLink
                  className="nav-link fw-semibold"
                  to="/"
                >
                  Home
                </NavLink>
              </li>
            )}

            {isAuthenticated ? (
              <>
                {!isDashboardArea && (
                  <li className="nav-item">
                    <NavLink
                      className="nav-link fw-semibold"
                      to="/dashboard"
                    >
                      Dashboard
                    </NavLink>
                  </li>
                )}

                <li className="nav-item">
                  <button
                    type="button"
                    className="btn btn-warning fw-bold px-3"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                {!isLogin && (
                  <li className="nav-item">
                    <NavLink
                      className="nav-link fw-semibold"
                      to="/login"
                    >
                      Login
                    </NavLink>
                  </li>
                )}

                {!isRegister && (
                  <li className="nav-item">
                    <NavLink
                      className="btn btn-warning fw-bold px-3"
                      to="/register"
                    >
                      Register
                    </NavLink>
                  </li>
                )}
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};