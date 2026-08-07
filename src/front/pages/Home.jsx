import { Link } from "react-router-dom";

import {
  ArrowRight,
  CarFront,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  History,
  LogIn,
  ShieldCheck,
  Users,
} from "lucide-react";

import "./Home.css";

import carImg from "../assets/img/Car.png";
import car2Img from "../assets/img/car2.png";
import insideImg from "../assets/img/inside.png";
import mechanicImg from "../assets/img/mechanic.png";
import mechanicThumbsImg from "../assets/img/mechanic-thumbs.png";


const heroImages = [
  {
    src: carImg,
    alt: "Vehicle inside a mechanic workshop",
  },
  {
    src: car2Img,
    alt: "Vehicle inside a professional workshop",
  },
  {
    src: insideImg,
    alt: "Interior of a mechanic workshop",
  },
  {
    src: mechanicImg,
    alt: "Mechanic working on a vehicle",
  },
];


const capabilities = [
  {
    number: "01",
    Icon: ClipboardList,
    title: "Service management",
    text: "Create service tickets and keep vehicle, customer, status and priority information connected throughout the repair.",
  },
  {
    number: "02",
    Icon: CarFront,
    title: "Customers & vehicles",
    text: "Keep every vehicle connected to its owner and make the information your workshop needs easy to find.",
  },
  {
    number: "03",
    Icon: Users,
    title: "Team & assignments",
    text: "Admins organize the workshop while mechanics focus on the services and repairs assigned to them.",
  },
  {
    number: "04",
    Icon: History,
    title: "Service history",
    text: "Status changes, comments, images and important workshop updates remain attached to each service.",
  },
];


const workflow = [
  {
    number: "01",
    title: "Create",
    text: "Register the customer, vehicle and repair information.",
  },
  {
    number: "02",
    title: "Assign",
    text: "Give the service to the right mechanic.",
  },
  {
    number: "03",
    title: "Follow",
    text: "Track the repair as it moves through the workshop.",
  },
  {
    number: "04",
    title: "Deliver",
    text: "Complete the service while keeping its history available.",
  },
];


export const Home = () => {
  const isAuthenticated =
    Boolean(localStorage.getItem("token"));

  return (
    <div className="home-page">

      {/* =====================================================
          HERO
          ===================================================== */}

      <section className="home-hero position-relative overflow-hidden bg-dark">

        {/* Carousel */}

        <div
          id="homeHeroCarousel"
          className="carousel slide carousel-fade position-absolute top-0 start-0 w-100 h-100"
          data-bs-ride="carousel"
          data-bs-interval="4000"
          data-bs-pause="false"
          data-bs-touch="true"
        >
          <div className="carousel-inner h-100">

            {heroImages.map((image, index) => (
              <div
                key={image.src}
                className={`carousel-item h-100 ${
                  index === 0 ? "active" : ""
                }`}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="d-block w-100 h-100 home-hero-image"
                />
              </div>
            ))}

          </div>
        </div>


        {/* Dark overlay */}

        <div className="home-hero-overlay position-absolute top-0 start-0 w-100 h-100" />


        {/* Hero content */}

        <div className="container position-relative home-hero-content">

          <div className="row align-items-center home-hero-inner">

            <div className="col-12 col-lg-7 col-xl-6 offset-xl-1">

              <h1 className="fw-bold text-white mb-4 home-hero-title">
                Keep every repair

                <span className="d-block text-warning">
                  under control.
                </span>
              </h1>


              <p className="text-white-50 mb-4 home-hero-description">
                A clearer way to manage services,
                customers, vehicles and your workshop
                team from one organized platform.
              </p>


              <div className="d-flex flex-column flex-sm-row gap-3">

                {isAuthenticated ? (

                  <Link
                    to="/dashboard"
                    className="btn btn-warning btn-lg fw-bold px-4 py-3 d-inline-flex align-items-center justify-content-center gap-2"
                  >
                    Open dashboard

                    <ArrowRight size={19} />
                  </Link>

                ) : (

                  <>
                    <Link
                      to="/register"
                      className="btn btn-warning btn-lg fw-bold px-4 py-3 d-inline-flex align-items-center justify-content-center gap-2"
                    >
                      Start your workshop

                      <ArrowRight size={19} />
                    </Link>


                    <Link
                      to="/login"
                      className="btn btn-outline-light btn-lg fw-semibold px-4 py-3 d-inline-flex align-items-center justify-content-center gap-2"
                    >
                      <LogIn size={19} />

                      Sign in
                    </Link>
                  </>

                )}

              </div>

            </div>

          </div>

        </div>


        {/* Discreet carousel controls */}

        <div className="home-carousel-controls position-absolute d-flex gap-2">

          <button
            type="button"
            className="btn btn-outline-light d-flex align-items-center justify-content-center"
            data-bs-target="#homeHeroCarousel"
            data-bs-slide="prev"
            aria-label="Previous image"
          >
            <ChevronLeft size={20} />
          </button>


          <button
            type="button"
            className="btn btn-outline-light d-flex align-items-center justify-content-center"
            data-bs-target="#homeHeroCarousel"
            data-bs-slide="next"
            aria-label="Next image"
          >
            <ChevronRight size={20} />
          </button>

        </div>

      </section>


      {/* =====================================================
          CAPABILITIES
          ===================================================== */}

      <section className="bg-white py-5">

        <div className="container py-4 py-lg-5">

          {/* Centered section heading */}

          <div className="row justify-content-center text-center mb-5 pb-lg-4">

            <div className="col-12 col-lg-9 col-xl-8">

              <div className="d-flex align-items-center justify-content-center gap-3 mb-4">

                <span className="home-section-line" />

                <p className="home-section-index fw-bold text-uppercase mb-0">
                  <span>01</span>
                  Workshop management
                </p>

                <span className="home-section-line" />

              </div>


              <h2 className="display-4 fw-bold mb-3 home-section-title">
                Everything your workshop needs.
              </h2>


              <p className="display-6 text-secondary fw-light mb-4">
                Nothing it doesn&apos;t.
              </p>


              <p className="fs-5 text-secondary mx-auto mb-0 home-section-description">
                Keep the information behind every repair
                organized without adding unnecessary
                complexity to the daily work of your team.
              </p>

            </div>

          </div>


          {/* Editorial feature rows */}

          <div className="border-top border-dark">

            {capabilities.map((capability) => {
              const Icon = capability.Icon;

              return (
                <article
                  className="home-capability-row border-bottom py-4 py-lg-5"
                  key={capability.number}
                >

                  <div className="row align-items-center g-4">

                    <div className="col-3 col-md-2 col-lg-1">

                      <span className="home-capability-number fw-bold">
                        {capability.number}
                      </span>

                    </div>


                    <div className="col-9 col-md-4 col-lg-4">

                      <div className="d-flex align-items-center gap-3">

                        <Icon
                          size={28}
                          strokeWidth={1.7}
                          className="text-warning flex-shrink-0"
                        />

                        <h3 className="h3 fw-bold mb-0">
                          {capability.title}
                        </h3>

                      </div>

                    </div>


                    <div className="col-12 col-md-6 col-lg-5 offset-lg-2">

                      <p className="text-secondary fs-5 mb-0">
                        {capability.text}
                      </p>

                    </div>

                  </div>

                </article>
              );
            })}

          </div>

        </div>

      </section>


      {/* =====================================================
          WORKFLOW
          ===================================================== */}

      <section className="home-workflow overflow-hidden text-white">

        <div className="container">

          <div className="row align-items-stretch">

            {/* Large mechanic */}

            <div className="col-12 col-lg-6 position-relative d-none d-lg-flex align-items-end justify-content-center home-mechanic-side">

              <img
                src={mechanicThumbsImg}
                alt="Mechanic giving a thumbs up"
                className="home-mechanic-image"
              />

            </div>


            {/* Workflow */}

            <div className="col-12 col-lg-6 py-5">

              <div className="py-4 py-lg-5 ps-lg-4">

                <div className="d-flex align-items-center gap-3 mb-4">

                  <span className="home-workflow-line" />

                  <p className="home-section-index home-section-index-light fw-bold text-uppercase mb-0">
                    <span>02</span>
                    A clear workflow
                  </p>

                </div>


                <h2 className="display-4 fw-bold mb-4">
                  From arrival

                  <span className="d-block text-warning">
                    to delivery.
                  </span>
                </h2>


                <p className="text-white-50 fs-5 mb-5 home-workflow-intro">
                  Every service follows a clear process,
                  making it easier for the whole workshop
                  to understand what happens next.
                </p>


                <div className="border-top border-secondary">

                  {workflow.map((step) => (

                    <div
                      className="row align-items-center g-3 py-4 border-bottom border-secondary home-workflow-row"
                      key={step.number}
                    >

                      <div className="col-2">

                        <span className="text-warning fw-bold">
                          {step.number}
                        </span>

                      </div>


                      <div className="col-3">

                        <h3 className="h4 fw-bold mb-0">
                          {step.title}
                        </h3>

                      </div>


                      <div className="col-7">

                        <p className="text-white-50 mb-0">
                          {step.text}
                        </p>

                      </div>

                    </div>

                  ))}

                </div>


                <div className="mt-5">

                  {isAuthenticated ? (

                    <Link
                      to="/dashboard"
                      className="btn btn-warning btn-lg fw-bold px-4 py-3 d-inline-flex align-items-center gap-2"
                    >
                      Open dashboard

                      <ArrowRight size={18} />
                    </Link>

                  ) : (

                    <Link
                      to="/register"
                      className="btn btn-warning btn-lg fw-bold px-4 py-3 d-inline-flex align-items-center gap-2"
                    >
                      Create your workshop

                      <ArrowRight size={18} />
                    </Link>

                  )}

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          PRODUCT STATEMENT
          ===================================================== */}

      <section className="bg-white py-5">

        <div className="container py-lg-4">

          <div className="row align-items-center g-4">

            <div className="col-lg-3">

              <div className="d-flex align-items-center gap-3">

                <ShieldCheck
                  size={38}
                  strokeWidth={1.6}
                  className="text-warning"
                />

                <span className="fw-bold text-uppercase small">
                  Built around
                  <br />
                  clear roles
                </span>

              </div>

            </div>


            <div className="col-lg-8 offset-lg-1">

              <p className="h3 fw-normal mb-0 home-product-statement">
                Admins keep control of the workshop.
                Mechanics see the work that matters to them.

                <span className="fw-bold">
                  {" "}Everyone works from the same information.
                </span>
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          CTA
          ===================================================== */}

      <section className="bg-warning py-5">

        <div className="container py-3 py-lg-4">

          <div className="row align-items-center g-4">

            <div className="col-lg-8">

              <p className="small fw-bold text-uppercase mb-2">
                Workshop Manager
              </p>

              <h2 className="display-5 fw-bold mb-0">
                Ready to bring order to your workshop?
              </h2>

            </div>


            <div className="col-lg-4 text-lg-end">

              {isAuthenticated ? (

                <Link
                  to="/dashboard"
                  className="btn btn-dark btn-lg fw-bold px-4 py-3 d-inline-flex align-items-center gap-2"
                >
                  Open dashboard

                  <ArrowRight size={18} />
                </Link>

              ) : (

                <Link
                  to="/register"
                  className="btn btn-dark btn-lg fw-bold px-4 py-3 d-inline-flex align-items-center gap-2"
                >
                  Create your workshop

                  <ArrowRight size={18} />
                </Link>

              )}

            </div>

          </div>

        </div>

      </section>

    </div>
  );
};