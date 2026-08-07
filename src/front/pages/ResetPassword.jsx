import { useState } from "react";

import {
  ArrowLeft,
  CheckCircle2,
  Cog,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";

import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  resetPassword,
} from "../services/api";

export const ResetPassword = () => {
  const navigate = useNavigate();

  const [searchParams] =
    useSearchParams();

  const token =
    searchParams.get("token") || "";

  const [password, setPassword] =
    useState("");

  const [
    passwordConfirm,
    setPasswordConfirm,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showPasswordConfirm,
    setShowPasswordConfirm,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleResetPassword =
    async (event) => {
      event.preventDefault();

      setError("");
      setSuccess("");

      if (!token) {
        setError(
          "This password reset link is invalid."
        );

        return;
      }

      if (password.length < 8) {
        setError(
          "Password must contain at least 8 characters."
        );

        return;
      }

      if (
        password !==
        passwordConfirm
      ) {
        setError(
          "Passwords do not match."
        );

        return;
      }

      setLoading(true);

      try {
        const response =
          await resetPassword(
            token,
            password,
            passwordConfirm
          );

        if (!response.ok) {
          setError(
            response.data?.error ||
              response.data?.message ||
              "Could not reset password."
          );

          return;
        }

        setSuccess(
          "Your password has been updated successfully."
        );

        setPassword("");
        setPasswordConfirm("");
      } catch (error) {
        console.error(
          "Reset password error:",
          error
        );

        setError(
          "Connection error. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="container py-5 flex-grow-1 d-flex align-items-center">
      <div className="row justify-content-center w-100">
        <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">

          <section className="card border-0 shadow-sm rounded-4 overflow-hidden">

            {/* Header */}

            <header className="bg-dark text-white position-relative overflow-hidden p-4 p-md-5 border-bottom border-warning border-4">

              <Cog
                className="register-gear register-gear-large text-warning"
                aria-hidden="true"
              />

              <Cog
                className="register-gear register-gear-small text-warning"
                aria-hidden="true"
              />

              <div className="register-hero-content position-relative">
                <div className="d-flex align-items-center gap-2 text-warning mb-3">
                  <KeyRound size={22} />

                  <span className="small fw-bold text-uppercase">
                    Account security
                  </span>
                </div>

                <h1 className="h2 fw-bold mb-2">
                  Create a new password
                </h1>

                <p className="text-white-50 mb-0">
                  Choose a secure new password
                  for your Workshop Manager account.
                </p>
              </div>
            </header>

            {/* Body */}

            <div className="card-body p-4 p-md-5">

              {!token && (
                <div
                  className="alert alert-danger rounded-3"
                  role="alert"
                >
                  This password reset link is
                  invalid or incomplete.
                </div>
              )}

              {error && (
                <div
                  className="alert alert-danger rounded-3"
                  role="alert"
                >
                  {error}
                </div>
              )}

              {success ? (
                <>
                  <div
                    className="alert alert-success rounded-3 d-flex align-items-start gap-2"
                    role="alert"
                  >
                    <CheckCircle2
                      size={20}
                      className="flex-shrink-0 mt-1"
                    />

                    <div>
                      <p className="fw-bold mb-1">
                        Password updated
                      </p>

                      <p className="mb-0">
                        {success}
                      </p>
                    </div>
                  </div>

                  <div className="d-grid">
                    <button
                      type="button"
                      className="btn btn-warning btn-lg fw-bold rounded-3"
                      onClick={() =>
                        navigate(
                          "/login",
                          {
                            replace: true,
                          }
                        )
                      }
                    >
                      Log in
                    </button>
                  </div>
                </>
              ) : (
                <form
                  onSubmit={
                    handleResetPassword
                  }
                >
                  <div className="mb-3">
                    <label
                      className="form-label fw-semibold"
                      htmlFor="reset-password"
                    >
                      New password
                    </label>

                    <div className="input-group input-group-lg">
                      <input
                        id="reset-password"
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        className="form-control"
                        placeholder="Enter your new password"
                        value={password}
                        required
                        minLength={8}
                        disabled={
                          loading ||
                          !token
                        }
                        autoComplete="new-password"
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
                        disabled={
                          loading ||
                          !token
                        }
                        onClick={() =>
                          setShowPassword(
                            (previousValue) =>
                              !previousValue
                          )
                        }
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={19} />
                        ) : (
                          <Eye size={19} />
                        )}
                      </button>
                    </div>

                    <div className="form-text">
                      Use at least 8 characters.
                    </div>
                  </div>

                  <div className="mb-4">
                    <label
                      className="form-label fw-semibold"
                      htmlFor="reset-password-confirm"
                    >
                      Confirm password
                    </label>

                    <div className="input-group input-group-lg">
                      <input
                        id="reset-password-confirm"
                        type={
                          showPasswordConfirm
                            ? "text"
                            : "password"
                        }
                        className="form-control"
                        placeholder="Repeat your new password"
                        value={passwordConfirm}
                        required
                        minLength={8}
                        disabled={
                          loading ||
                          !token
                        }
                        autoComplete="new-password"
                        onChange={(event) => {
                          setPasswordConfirm(
                            event.target.value
                          );

                          setError("");
                        }}
                      />

                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        disabled={
                          loading ||
                          !token
                        }
                        onClick={() =>
                          setShowPasswordConfirm(
                            (previousValue) =>
                              !previousValue
                          )
                        }
                        aria-label={
                          showPasswordConfirm
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showPasswordConfirm ? (
                          <EyeOff size={19} />
                        ) : (
                          <Eye size={19} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="d-grid">
                    <button
                      type="submit"
                      className="btn btn-warning btn-lg fw-bold rounded-3"
                      disabled={
                        loading ||
                        !token
                      }
                    >
                      {loading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            aria-hidden="true"
                          />

                          Updating password...
                        </>
                      ) : (
                        "Update password"
                      )}
                    </button>
                  </div>
                </form>
              )}

              {!success && (
                <div className="border-top mt-4 pt-4 text-center">
                  <Link
                    to="/login"
                    className="d-inline-flex align-items-center gap-2 link-dark fw-semibold text-decoration-none"
                  >
                    <ArrowLeft size={17} />
                    Back to login
                  </Link>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};