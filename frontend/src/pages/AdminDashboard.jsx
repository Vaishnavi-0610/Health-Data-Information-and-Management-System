import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  Activity,
  ArrowLeft,
  Clock3,
  Database,
  Eye,
  FileText,
  HeartPulse,
  LogOut,
  Menu,
  Network,
  Search,
  ShieldCheck,
  Siren,
  Stethoscope,
  UserCheck,
  Users,
  X,
} from "lucide-react";

import {
  getAdminAuditLogs,
  getCurrentUser,
  getPatients,
  logout,
} from "../services/api";

import "./AdminDashboard.css";


function AdminDashboardBackground() {
  return (
    <div
      className="admin-dashboard-background"
      aria-hidden="true"
    >
      <div className="admin-grid-layer" />

      <div className="admin-orb admin-orb-one" />

      <div className="admin-orb admin-orb-two" />

      {Array.from({
        length: 18,
      }).map(
        (_, index) => (
          <span
            key={index}
            className="admin-floating-node"
            style={{
              left:
                `${(index * 17) % 100}%`,

              top:
                `${(index * 29) % 100}%`,

              animationDelay:
                `${index * 0.35}s`,
            }}
          />
        )
      )}
    </div>
  );
}


function AdminDashboard() {
  const navigate =
    useNavigate();

  const [
    patients,
    setPatients,
  ] = useState([]);

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    selectedPatient,
    setSelectedPatient,
  ] = useState(null);

  const [
    mobileMenu,
    setMobileMenu,
  ] = useState(false);

  const [
    auditLogs,
    setAuditLogs,
  ] = useState([]);

  const [
    adminUserId,
    setAdminUserId,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);


  useEffect(() => {
    document.title =
      "Admin Dashboard | CAREKEY";

    let active = true;

    const loadDashboard =
      async () => {
        try {
          const userResponse =
            await getCurrentUser();

          const user =
            userResponse?.user;

          if (
            !user ||
            user.role !==
              "ADMIN"
          ) {
            logout();

            navigate(
              "/admin/login",
              {
                replace: true,
              }
            );

            return;
          }

          if (active) {
            setAdminUserId(
              user.userId ||
                user.id ||
                ""
            );
          }

          const [
            loadedPatients,
            loadedAuditLogs,
          ] = await Promise.all([
            getPatients(),
            getAdminAuditLogs(),
          ]);

          if (!active) {
            return;
          }

          setPatients(
            Array.isArray(
              loadedPatients
            )
              ? loadedPatients
              : []
          );

          setAuditLogs(
            Array.isArray(
              loadedAuditLogs
            )
              ? loadedAuditLogs
              : []
          );
        } catch (error) {
          console.error(
            "Unable to load admin dashboard:",
            error
          );

          if (
            error?.status ===
              401 ||
            error?.status ===
              403
          ) {
            logout();

            navigate(
              "/admin/login",
              {
                replace: true,
              }
            );

            return;
          }

          if (active) {
            setPatients([]);
            setAuditLogs([]);
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };

    loadDashboard();

    return () => {
      active = false;
    };
  }, [navigate]);


  const filteredPatients =
    useMemo(() => {
      const term =
        searchTerm
          .trim()
          .toLowerCase();

      if (!term) {
        return patients;
      }

      return patients.filter(
        (patient) => {
          return (
            String(
              patient.id ||
                ""
            )
              .toLowerCase()
              .includes(term) ||

            String(
              patient.fullName ||
                ""
            )
              .toLowerCase()
              .includes(term) ||

            String(
              patient.phone ||
                ""
            )
              .toLowerCase()
              .includes(term) ||

            String(
              patient.email ||
                ""
            )
              .toLowerCase()
              .includes(term) ||

            String(
              patient.bloodGroup ||
                ""
            )
              .toLowerCase()
              .includes(term)
          );
        }
      );
    }, [
      patients,
      searchTerm,
    ]);


  const handleLogout =
    () => {
      logout();

      navigate(
        "/admin/login",
        {
          replace: true,
        }
      );
    };


  const formatDate =
    (value) => {
      if (!value) {
        return "—";
      }

      try {
        return new Date(
          value
        ).toLocaleDateString();
      } catch {
        return String(value);
      }
    };


  const formatDateTime =
    (value) => {
      if (!value) {
        return "—";
      }

      try {
        return new Date(
          value
        ).toLocaleString();
      } catch {
        return String(value);
      }
    };


  const totalPatients =
    patients.length;


  const biometricPatients =
    patients.filter(
      (patient) =>
        patient.hasBiometric ===
        true
    ).length;


  const todayPatients =
    patients.filter(
      (patient) => {
        if (
          !patient.createdAt
        ) {
          return false;
        }

        const created =
          new Date(
            patient.createdAt
          );

        const today =
          new Date();

        return (
          created.getDate() ===
            today.getDate() &&
          created.getMonth() ===
            today.getMonth() &&
          created.getFullYear() ===
            today.getFullYear()
        );
      }
    ).length;


  return (
    <div className="admin-dashboard-page">

      <AdminDashboardBackground />


      <header className="admin-dashboard-header">

        <Link
          to="/"
          className="admin-dashboard-brand"
        >

          <span className="admin-brand-icon">
            <ShieldCheck size={18} />
          </span>

          <span>

            <strong>
              CAREKEY
            </strong>

            <small>
              ADMIN CONSOLE
            </small>

          </span>

        </Link>


        <div className="admin-header-center">

          <span className="admin-live-dot" />

          ADMINISTRATIVE SYSTEM ONLINE

        </div>


        <div className="admin-header-actions">

          <span className="admin-user-label">

            <UserCheck size={15} />

            {
              adminUserId ||
              "ADMIN"
            }

          </span>


          <button
            className="admin-logout-button"
            onClick={
              handleLogout
            }
          >

            <LogOut size={15} />

            Logout

          </button>

        </div>


        <button
          className="admin-mobile-menu-button"
          onClick={() =>
            setMobileMenu(
              (value) =>
                !value
            )
          }
          aria-label="Open menu"
        >
          {
            mobileMenu
              ? <X size={21} />
              : <Menu size={21} />
          }
        </button>

      </header>


      {mobileMenu && (

        <div className="admin-mobile-menu">

          <Link
            to="/"
            onClick={() =>
              setMobileMenu(
                false
              )
            }
          >
            <ArrowLeft size={15} />
            Home
          </Link>


          <Link
            to="/doctor/dashboard"
            onClick={() =>
              setMobileMenu(
                false
              )
            }
          >
            <Stethoscope size={15} />
            Doctor Dashboard
          </Link>


          <Link
            to="/emergency"
            onClick={() =>
              setMobileMenu(
                false
              )
            }
          >
            <Siren size={15} />
            Emergency Access
          </Link>


          <button
            onClick={
              handleLogout
            }
          >
            <LogOut size={15} />
            Logout
          </button>

        </div>

      )}


      <main className="admin-dashboard-main">

        <div className="admin-dashboard-top">

          <div>

            <Link
              to="/"
              className="admin-dashboard-back"
            >

              <ArrowLeft size={14} />

              Back to Home

            </Link>


            <div className="admin-page-label">

              <Activity size={13} />

              SYSTEM ADMINISTRATION

            </div>


            <h1>
              CAREKEY
              <em>
                control center.
              </em>
            </h1>


            <p>
              Monitor registered patient records and
              administrative system activity.
            </p>

          </div>


          <div className="admin-dashboard-actions">

            <Link
              to="/emergency"
              className="admin-emergency-button"
            >

              <Siren size={16} />

              Emergency Access

            </Link>

          </div>

        </div>


        <section className="admin-stat-grid">

          <div className="admin-stat-card blue">

            <div className="admin-stat-icon">
              <Users size={19} />
            </div>

            <div>

              <span>
                REGISTERED PATIENTS
              </span>

              <strong>
                {totalPatients}
              </strong>

            </div>

            <small>
              CAREKEY records
            </small>

          </div>


          <div className="admin-stat-card cyan">

            <div className="admin-stat-icon">
              <Database size={19} />
            </div>

            <div>

              <span>
                BIOMETRIC RECORDS
              </span>

              <strong>
                {biometricPatients}
              </strong>

            </div>

            <small>
              128-D embeddings
            </small>

          </div>


          <div className="admin-stat-card green">

            <div className="admin-stat-icon">
              <UserCheck size={19} />
            </div>

            <div>

              <span>
                REGISTERED TODAY
              </span>

              <strong>
                {todayPatients}
              </strong>

            </div>

            <small>
              New registrations
            </small>

          </div>


          <div className="admin-stat-card purple">

            <div className="admin-stat-icon">
              <Network size={19} />
            </div>

            <div>

              <span>
                SYSTEM STATUS
              </span>

              <strong>
                ONLINE
              </strong>

            </div>

            <small>
              All services active
            </small>

          </div>

        </section>


        <section className="admin-system-strip">

          <div className="admin-system-strip-left">

            <div className="admin-pulse-icon">
              <HeartPulse size={20} />
            </div>

            <div>

              <strong>
                CAREKEY MEDICAL DATA NETWORK
              </strong>

              <span>
                SQLite database and biometric service operational
              </span>

            </div>

          </div>


          <div className="admin-system-strip-status">

            <span />

            PROTECTED

          </div>

        </section>


        <section className="admin-patients-section">

          <div className="admin-section-header">

            <div>

              <span className="admin-section-label">
                PATIENT DATABASE
              </span>

              <h2>
                Registered patients
              </h2>

            </div>


            <div className="admin-patient-count">

              {
                filteredPatients.length
              }

              {" RECORD"}

              {
                filteredPatients.length ===
                1
                  ? ""
                  : "S"
              }

            </div>

          </div>


          <div className="admin-search-bar">

            <Search size={17} />

            <input
              type="text"
              placeholder="Search by patient ID, name, phone or blood group..."
              value={
                searchTerm
              }
              onChange={(
                event
              ) =>
                setSearchTerm(
                  event.target.value
                )
              }
            />

          </div>


          {loading ? (

            <div className="admin-empty-state">

              <div className="admin-empty-icon">
                <Database size={27} />
              </div>

              <h3>
                Loading patient database
              </h3>

              <p>
                Connecting to the CAREKEY backend.
              </p>

            </div>

          ) : filteredPatients.length ===
            0 ? (

            <div className="admin-empty-state">

              <div className="admin-empty-icon">
                <FileText size={27} />
              </div>

              <h3>

                {
                  patients.length ===
                  0
                    ? "No patients registered"
                    : "No matching patients"
                }

              </h3>

              <p>

                {
                  patients.length ===
                  0
                    ? "Patient registrations will appear here after successful biometric enrollment."
                    : "Try another search term."
                }

              </p>

              {
                patients.length ===
                0 && (

                  <Link
                    to="/patient/register"
                    className="dashboard-register-link"
                  >
                    Register a patient
                  </Link>

                )
              }

            </div>

          ) : (

            <div className="admin-table-container">

              <table className="admin-patient-table">

                <thead>

                  <tr>

                    <th>
                      PATIENT
                    </th>

                    <th>
                      CAREKEY ID
                    </th>

                    <th>
                      BLOOD GROUP
                    </th>

                    <th>
                      BIOMETRIC
                    </th>

                    <th>
                      REGISTERED
                    </th>

                    <th>
                      ACTION
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filteredPatients.map(
                    (patient) => (

                      <tr
                        key={
                          patient.id
                        }
                      >

                        <td>

                          <div className="admin-patient-name">

                            <div className="admin-avatar">

                              {
                                String(
                                  patient.fullName ||
                                    "P"
                                )
                                  .charAt(
                                    0
                                  )
                                  .toUpperCase()
                              }

                            </div>


                            <div>

                              <strong>
                                {
                                  patient.fullName ||
                                  "Unknown Patient"
                                }
                              </strong>

                              <span>
                                {
                                  patient.phone ||
                                  "No phone"
                                }
                              </span>

                            </div>

                          </div>

                        </td>


                        <td>

                          <code>
                            {
                              patient.id ||
                              "—"
                            }
                          </code>

                        </td>


                        <td>

                          <span className="admin-blood-badge">

                            {
                              patient.bloodGroup ||
                              "—"
                            }

                          </span>

                        </td>


                        <td>

                          {
                            patient.hasBiometric ? (

                              <span className="admin-biometric-ok">

                                <span />

                                VERIFIED

                              </span>

                            ) : (

                              <span className="admin-biometric-missing">
                                NOT AVAILABLE
                              </span>

                            )
                          }

                        </td>


                        <td>

                          {
                            formatDate(
                              patient.createdAt
                            )
                          }

                        </td>


                        <td>

                          <button
                            className="admin-view-button"
                            onClick={() =>
                              setSelectedPatient(
                                patient
                              )
                            }
                          >

                            <Eye size={14} />

                            View

                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>


        <section className="admin-audit-section">

          <div className="admin-section-header">

            <div>

              <span className="admin-section-label">
                SECURITY AUDIT
              </span>

              <h2>
                Emergency access history
              </h2>

            </div>


            <div className="admin-patient-count">

              {auditLogs.length}

              {" ACCESS"}

              {
                auditLogs.length ===
                1
                  ? ""
                  : "ES"
              }

            </div>

          </div>


          {auditLogs.length ===
          0 ? (

            <div className="admin-audit-empty">

              <div className="admin-audit-empty-icon">
                <ShieldCheck size={24} />
              </div>

              <div>

                <strong>
                  No emergency access recorded
                </strong>

                <span>
                  Successful biometric emergency access events will appear here.
                </span>

              </div>

            </div>

          ) : (

            <div className="admin-audit-list">

              {auditLogs
                .slice(0, 10)
                .map(
                  (log) => (

                    <div
                      className="admin-audit-row"
                      key={
                        log.id ||
                        `${log.patientId}-${log.timestamp}`
                      }
                    >

                      <div className="admin-audit-icon">
                        <Clock3 size={16} />
                      </div>


                      <div className="admin-audit-main">

                        <div className="admin-audit-topline">

                          <strong>
                            {
                              log.patientId ||
                              "—"
                            }
                          </strong>

                          <span>
                            {
                              log.accessStatus ||
                              "AUTHORIZED"
                            }
                          </span>

                        </div>


                        <small>

                          Doctor{" "}
                          {
                            log.doctorId ||
                            "—"
                          }

                          {" • "}

                          {
                            log.accessType ||
                            "EMERGENCY_BIOMETRIC_ACCESS"
                          }

                        </small>

                      </div>


                      <div className="admin-audit-score">

                        <span>
                          MATCH
                        </span>

                        <strong>

                          {
                            typeof log.similarity ===
                            "number"
                              ? `${(
                                  log.similarity *
                                  100
                                ).toFixed(
                                  1
                                )}%`
                              : "—"
                          }

                        </strong>

                      </div>


                      <div className="admin-audit-time">

                        <span>
                          ACCESS TIME
                        </span>

                        <strong>
                          {
                            formatDateTime(
                              log.timestamp
                            )
                          }
                        </strong>

                      </div>

                    </div>

                  )
                )}

            </div>

          )}

        </section>


        <section className="admin-quick-grid">

          <Link
            to="/doctor/dashboard"
            className="admin-quick-card"
          >

            <div>
              <Stethoscope size={20} />
            </div>

            <span>

              <strong>
                Doctor Dashboard
              </strong>

              <small>
                Open the medical professional workspace
              </small>

            </span>

            <ArrowLeft
              className="admin-quick-arrow"
              size={17}
            />

          </Link>


          <Link
            to="/patient/register"
            className="admin-quick-card"
          >

            <div>
              <Users size={20} />
            </div>

            <span>

              <strong>
                Patient Registration
              </strong>

              <small>
                Register a new CAREKEY patient
              </small>

            </span>

            <ArrowLeft
              className="admin-quick-arrow"
              size={17}
            />

          </Link>


          <Link
            to="/emergency"
            className="admin-quick-card emergency"
          >

            <div>
              <Siren size={20} />
            </div>

            <span>

              <strong>
                Emergency Scanner
              </strong>

              <small>
                Identify a patient through biometrics
              </small>

            </span>

            <ArrowLeft
              className="admin-quick-arrow"
              size={17}
            />

          </Link>

        </section>

      </main>


      <footer className="admin-dashboard-footer">

        <span>
          © {new Date().getFullYear()} CAREKEY
        </span>

        <span>
          Emergency Medical Information & Management System
        </span>

        <span>

          <ShieldCheck size={12} />

          ADMINISTRATIVE ACCESS

        </span>

      </footer>


      {selectedPatient && (

        <div
          className="admin-modal-overlay"
          onClick={() =>
            setSelectedPatient(
              null
            )
          }
        >

          <div
            className="admin-patient-modal"
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            <div className="admin-modal-header">

              <div>

                <span>
                  CAREKEY MEDICAL RECORD
                </span>

                <h2>
                  {
                    selectedPatient.fullName ||
                    "Patient Record"
                  }
                </h2>

              </div>


              <button
                className="admin-modal-close"
                onClick={() =>
                  setSelectedPatient(
                    null
                  )
                }
                aria-label="Close"
              >
                <X size={19} />
              </button>

            </div>


            <div className="admin-modal-id">

              <span>
                PATIENT ID
              </span>

              <code>
                {
                  selectedPatient.id ||
                  "—"
                }
              </code>

            </div>


            <div className="admin-record-grid">

              <div>

                <span>
                  Date of Birth
                </span>

                <strong>
                  {
                    selectedPatient.dob ||
                    "—"
                  }
                </strong>

              </div>


              <div>

                <span>
                  Gender
                </span>

                <strong>
                  {
                    selectedPatient.gender ||
                    "—"
                  }
                </strong>

              </div>


              <div>

                <span>
                  Blood Group
                </span>

                <strong>
                  {
                    selectedPatient.bloodGroup ||
                    "—"
                  }
                </strong>

              </div>


              <div>

                <span>
                  Phone
                </span>

                <strong>
                  {
                    selectedPatient.phone ||
                    "—"
                  }
                </strong>

              </div>


              <div>

                <span>
                  Email
                </span>

                <strong>
                  {
                    selectedPatient.email ||
                    "—"
                  }
                </strong>

              </div>


              <div>

                <span>
                  Registered
                </span>

                <strong>
                  {
                    formatDateTime(
                      selectedPatient.createdAt
                    )
                  }
                </strong>

              </div>


              <div>

                <span>
                  Biometric
                </span>

                <strong>
                  {
                    selectedPatient.hasBiometric
                      ? "VERIFIED"
                      : "NOT AVAILABLE"
                  }
                </strong>

              </div>

            </div>


            <div className="admin-medical-records">

              <div className="admin-medical-box">

                <span>
                  ALLERGIES
                </span>

                <p>
                  {
                    selectedPatient.allergies ||
                    "No allergies recorded."
                  }
                </p>

              </div>


              <div className="admin-medical-box">

                <span>
                  MEDICAL HISTORY
                </span>

                <p>
                  {
                    selectedPatient.medicalHistory ||
                    "No medical history recorded."
                  }
                </p>

              </div>


              <div className="admin-medical-box">

                <span>
                  CURRENT MEDICATIONS
                </span>

                <p>
                  {
                    selectedPatient.medications ||
                    "No medications recorded."
                  }
                </p>

              </div>

            </div>


            <div className="admin-modal-security">

              <ShieldCheck size={15} />

              This administrative record is loaded
              securely from the CAREKEY backend database.

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


export default AdminDashboard;