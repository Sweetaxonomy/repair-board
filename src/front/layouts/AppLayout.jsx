import { Outlet } from "react-router-dom";

import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

export const AppLayout = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />

      <main className="d-flex flex-column flex-grow-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};