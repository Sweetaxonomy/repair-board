import { useState } from "react";

import {
  ArrowLeft,
  Cog,
  KeyRound,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  forgotPassword,
} from "../services/api";

export const ForgotPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [resetUrl, setResetUrl] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleForgotPassword =
    async (event) => {
      event.preventDefault();

      setLoading(true);
      setError("");
      setMessage("");
      setResetUrl("");

      try {
        const response =
          await forgotPassword(
            email.trim()
          );

        if (!response.ok) {
          setError(
            response.data?.error ||
              response.data?.message ||
              "Could not process the password recovery request."
          );

          return;
        }

        /*
         * User-friendly message.
         * We do not expose technical information
         * about reset tokens in the interface.
         */
        setMessage(
          "If an account exists for this email, you will receive instructions to reset your password."
        );

        /*
         * DEVELOPMENT ONLY
         *
         * Until email delivery is configured,
         * the backend gives us the reset token
         * directly so we can test the complete flow.
         */
        if (response.data?.reset_token) {
          const token =
            encodeURIComponent(
              response.data.reset_token
            );

          setResetUrl(
            `/reset-password?token=${token}`
          );
        }
      } catch (error) {
        console.error(
          "Forgot password error:",
          error
        );

        setError(
          "Connection error. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

  const handleGoToResetPassword = () => {
    if (!resetUrl) return;

    navigate(resetUrl);
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
                    Account recovery
                  </span>
                </div>

                <h1 className="h2 fw-bold mb-2">
                  Recover your password
                </h1>

                <p className="text-white-50 mb-0">
                  Enter the email associated with
                  your Workshop Manager account.
                </p>
              </div>
            </header>

            {/* Body */}

            <div className="card-body p-4 p-md-5">

              {error && (
                <div
                  className="alert alert-danger rounded-3"
                  role="alert"
                >
                  {error}
                </div>
              )}

              {message && (
                <div
                  className="alert alert-success rounded-3"
                  role="alert"
                >
                  {message}
                </div>
              )}

              {/* Development helper */}

              {resetUrl && (
                <div
                  className="alert alert-warning rounded-3"
                  role="alert"
                >
                  <p className="fw-bold mb-1">
                    Development mode
                  </p>

                  <p className="small mb-3">
                    Email delivery is not connected
                    yet. Continue below to test the
                    password recovery flow.
                  </p>

                  <button
                    type="button"
                    className="btn btn-dark btn-sm fw-bold"
                    onClick={
                      handleGoToResetPassword
                    }
                  >
                    Continue to password reset
                  </button>
                </div>
              )}

              <form
                onSubmit={
                  handleForgotPassword
                }
              >
                <div className="mb-4">
                  <label
                    className="form-label fw-semibold"
                    htmlFor="forgot-email"
                  >
                    Email address
                  </label>

                  <input
                    id="forgot-email"
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
                      setMessage("");
                      setResetUrl("");
                    }}
                  />
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

                        Processing...
                      </>
                    ) : (
                      "Continue"
                    )}
                  </button>
                </div>
              </form>

              <div className="border-top mt-4 pt-4 text-center">
                <Link
                  to="/login"
                  className="d-inline-flex align-items-center gap-2 link-dark fw-semibold text-decoration-none"
                >
                  <ArrowLeft size={17} />
                  Back to login
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};