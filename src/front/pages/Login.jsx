import { useState } from "react";
import {
  Eye,
  EyeOff,
  LogIn,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import littleLogo from "../assets/img/little_logo.png";
import { loginUser } from "../services/api";

export const Login = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] =
    useState(false);

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await loginUser(
        email.trim(),
        password
      );

      if (!response.ok) {
        setError(
          response.data?.error ||
            response.data?.message ||
            "Login failed. Please try again."
        );

        return;
      }

      const data = response.data;

      if (
        !data.token ||
        !data.user ||
        !data.employee
      ) {
        console.error(
          "Login response:",
          data
        );

        setError(
          "Login response is missing required account data."
        );

        return;
      }

      localStorage.setItem(
        "token",
        data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      localStorage.setItem(
        "employee",
        JSON.stringify(data.employee)
      );

      if (data.workshop) {
        localStorage.setItem(
          "workshop",
          JSON.stringify(data.workshop)
        );
      }

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      setError(
        "Failed to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5 flex-grow-1 d-flex align-items-center">
      <div className="row justify-content-center w-100">
        <div className="col-12 col-sm-10 col-md-7 col-lg-5">
          <section className="card border-0 shadow-sm rounded-4 overflow-hidden">

            {/* Yellow accent */}

            <div className="border-top border-warning border-4" />

            <div className="card-body p-4 p-md-5">

              {/* Logo and title */}

              <div className="text-center mb-4">
                <img
                  src={littleLogo}
                  alt="Workshop Manager logo"
                  className="img-fluid mb-4"
                  style={{
                    width: "82px",
                    height: "82px",
                    objectFit: "contain",
                  }}
                />

                <h1 className="h2 fw-bold mb-2">
                  Welcome back
                </h1>

                <p className="text-secondary mb-0">
                  Sign in to manage your workshop.
                </p>
              </div>

              {/* Error */}

              {error && (
                <div
                  className="alert alert-danger rounded-3"
                  role="alert"
                >
                  {error}
                </div>
              )}

              {/* Form */}

              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label
                    className="form-label fw-semibold"
                    htmlFor="login-email"
                  >
                    Email address
                  </label>

                  <input
                    id="login-email"
                    type="email"
                    className="form-control form-control-lg rounded-3"
                    placeholder="admin@workshop.com"
                    value={email}
                    required
                    disabled={loading}
                    autoComplete="email"
                    onChange={(event) => {
                      setEmail(
                        event.target.value
                      );

                      setError("");
                    }}
                  />
                </div>

                <div className="mb-2">
                  <label
                    className="form-label fw-semibold"
                    htmlFor="login-password"
                  >
                    Password
                  </label>

                  <div className="input-group input-group-lg">
                    <input
                      id="login-password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      className="form-control"
                      placeholder="Enter your password"
                      value={password}
                      required
                      disabled={loading}
                      autoComplete="current-password"
                      onChange={(event) => {
                        setPassword(
                          event.target.value
                        );

                        setError("");
                      }}
                    />

                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() =>
                        setShowPassword(
                          (previousValue) =>
                            !previousValue
                        )
                      }
                      disabled={loading}
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      aria-pressed={
                        showPassword
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={19} />
                      ) : (
                        <Eye size={19} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="text-end mb-4">
                  <Link
                    to="/forgot-password"
                    className="link-dark small fw-semibold text-decoration-none"
                  >
                    Forgot your password?
                  </Link>
                </div>

                <div className="d-grid">
                  <button
                    type="submit"
                    className="btn btn-warning btn-lg fw-bold rounded-3"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          aria-hidden="true"
                        />

                        Signing in...
                      </>
                    ) : (
                      <>
                        <LogIn
                          size={18}
                          className="me-2"
                        />

                        Log in
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Register */}

              <div className="text-center border-top mt-4 pt-4">
                <span className="text-secondary">
                  Don&apos;t have an account?{" "}
                </span>

                <Link
                  to="/register"
                  className="link-dark fw-bold text-decoration-none"
                >
                  Create a workshop
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};