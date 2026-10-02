import React from "react";
import { Routes, Route } from "react-router-dom";

import Home from "./Home";

import PatientRegister from "./pages/PatientRegister";
import Emergency from "./pages/Emergency";

import DoctorLogin from "./pages/DoctorLogin";
import DoctorDashboard from "./pages/DoctorDashboard";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";


function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "12px",
        background: "#05090d",
        color: "#e5edf3",
        fontFamily: "Arial, sans-serif",
        textAlign: "center",
        padding: "30px",
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: "48px",
          color: "#7fc8f3",
        }}
      >
        404
      </h1>

      <h2
        style={{
          margin: 0,
          fontSize: "24px",
        }}
      >
        Page Not Found
      </h2>

      <p
        style={{
          margin: 0,
          color: "#8da0ad",
        }}
      >
        The CAREKEY page you are looking for does not exist.
      </p>

      <a
        href="/"
        style={{
          marginTop: "10px",
          padding: "11px 18px",
          borderRadius: "8px",
          textDecoration: "none",
          background: "#ffffff",
          color: "#10161a",
          fontWeight: "600",
        }}
      >
        Back to Home
      </a>
    </div>
  );
}


function App() {
  return (
    <Routes>

      {/* HOME */}
      <Route
        path="/"
        element={<Home />}
      />

      {/* PATIENT */}
      <Route
        path="/patient/register"
        element={<PatientRegister />}
      />

      {/* EMERGENCY */}
      <Route
        path="/emergency"
        element={<Emergency />}
      />

      {/* DOCTOR */}
      <Route
        path="/doctor/login"
        element={<DoctorLogin />}
      />

      <Route
        path="/doctor/dashboard"
        element={<DoctorDashboard />}
      />

      {/* ADMIN */}
      <Route
        path="/admin/login"
        element={<AdminLogin />}
      />

      <Route
        path="/admin/dashboard"
        element={<AdminDashboard />}
      />

      {/* FALLBACK */}
      <Route
        path="*"
        element={<NotFound />}
      />

    </Routes>
  );
}


export default App;