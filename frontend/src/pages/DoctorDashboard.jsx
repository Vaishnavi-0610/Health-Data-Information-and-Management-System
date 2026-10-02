import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Droplets,
  HeartPulse,
  LogOut,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  getCurrentUser,
  getDoctorAuditLogs,
  getPatients,
  logout,
} from "../services/api";

import "./DoctorDashboard.css";


function MedicalNetworkBackground() {
  return (
    <div
      className="doctor-dashboard-background"
      aria-hidden="true"
    >
      <div className="dashboard-medical-grid" />
    </div>
  );
}


function DoctorDashboard() {
  const navigate =
    useNavigate();

  const [
    patients,
    setPatients,
  ] = useState([]);

  const [
    selectedPatient,
    setSelectedPatient,
  ] = useState(null);

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    auditLogs,
    setAuditLogs,
  ] = useState([]);

  const [
    doctorUserId,
    setDoctorUserId,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);


  useEffect(() => {
    document.title =
      "Doctor Dashboard | CAREKEY";

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
              "DOCTOR"
          ) {
            logout();

            navigate(
              "/doctor/login",
              {
                replace: true,
              }
            );

            return;
          }

          const currentDoctorId =
            user.userId ||
            user.id ||
            "";

          if (active) {
            setDoctorUserId(
              currentDoctorId
            );
          }

          const [
            loadedPatients,
            loadedAuditLogs,
          ] = await Promise.all([
            getPatients(),
            getDoctorAuditLogs(),
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
            "Unable to load doctor dashboard:",
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
              "/doctor/login",
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
      const query =
        searchTerm
          .trim()
          .toLowerCase();

      if (!query) {
        return patients;
      }

      return patients.filter(
        (patient) => {
          return (
            String(
              patient.fullName ||
                ""
            )
              .toLowerCase()
              .includes(query) ||

            String(
              patient.id ||
                ""
            )
              .toLowerCase()
              .includes(query) ||

            String(
              patient.bloodGroup ||
                ""
            )
              .toLowerCase()
              .includes(query) ||

            String(
              patient.phone ||
                ""
            )
              .toLowerCase()
              .includes(query) ||

            String(
              patient.email ||
                ""
            )
              .toLowerCase()
              .includes(query) ||

            String(
              patient.gender ||
                ""
            )
              .toLowerCase()
              .includes(query) ||

            String(
              patient.dob ||
                ""
            )
              .toLowerCase()
              .includes(query) ||

            String(
              patient.allergies ||
                ""
            )
              .toLowerCase()
              .includes(query) ||

            String(
              patient.medicalHistory ||
                ""
            )
              .toLowerCase()
              .includes(query) ||

            String(
              patient.medications ||
                ""
            )
              .toLowerCase()
              .includes(query)
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
        "/doctor/login",
        {
          replace: true,
        }
      );
    };


  const openPatient =
    (patient) => {
      setSelectedPatient(
        patient
      );
    };


  const closePatient =
    () => {
      setSelectedPatient(
        null
      );
    };


  const formatDateTime =
    (value) => {
      if (!value) {
        return "Not available";
      }

      try {
        return new Date(
          value
        ).toLocaleString();
      } catch {
        return String(value);
      }
    };


  return (
    <div className="doctor-dashboard-page">

      <MedicalNetworkBackground />


      <header className="doctor-dashboard-header">

        <Link
          to="/"
          className="dashboard-brand"
        >
          <span className="dashboard-brand-icon">
            <ShieldCheck size={19} />
          </span>

          <span>
            <strong>
              CAREKEY
            </strong>

            <small>
              DOCTOR PORTAL
            </small>
          </span>
        </Link>


        <div className="dashboard-header-right">

          <div className="doctor-online-status">
            <span />

            DOCTOR SESSION ACTIVE
          </div>


          <div className="doctor-online-status">
            {doctorUserId}
          </div>


          <button
            type="button"
            className="dashboard-logout"
            onClick={
              handleLogout
            }
          >
            <LogOut size={15} />

            Logout
          </button>

        </div>

      </header>


      <main className="doctor-dashboard-main">

        <div className="dashboard-top-row">

          <div>

            <Link
              to="/"
              className="dashboard-back"
            >
              <ArrowLeft size={15} />

              Back to Home
            </Link>


            <div className="dashboard-eyebrow">

              <Activity size={14} />

              CLINICAL COMMAND CENTER

            </div>


            <h1>
              Doctor
              <em> Dashboard</em>
            </h1>


            <p>
              Manage registered emergency
              medical records and quickly
              access essential patient information.
            </p>

          </div>


          <Link
            to="/emergency"
            className="dashboard-emergency-button"
          >
            <HeartPulse size={18} />

            Emergency Identification
          </Link>

        </div>


        <section className="dashboard-stats">

          <div className="dashboard-stat-card">

            <div className="dashboard-stat-icon">
              <Users size={19} />
            </div>

            <div>
              <span>
                REGISTERED PATIENTS
              </span>

              <strong>
                {patients.length}
              </strong>
            </div>

          </div>


          <div className="dashboard-stat-card">

            <div className="dashboard-stat-icon">
              <ShieldCheck size={19} />
            </div>

            <div>
              <span>
                SECURITY STATUS
              </span>

              <strong className="status-text">
                PROTECTED
              </strong>
            </div>

          </div>


          <div className="dashboard-stat-card">

            <div className="dashboard-stat-icon">
              <Activity size={19} />
            </div>

            <div>
              <span>
                BIOMETRIC ENGINE
              </span>

              <strong className="status-text">
                ONLINE
              </strong>
            </div>

          </div>

        </section>


        <section className="dashboard-patient-section">

          <div className="dashboard-section-header">

            <div>
              <span>
                PATIENT RECORDS
              </span>

              <h2>
                Registered patients
              </h2>
            </div>


            <div className="dashboard-search">

              <Search size={16} />

              <input
                type="text"
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
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                    "Escape"
                  ) {
                    setSearchTerm(
                      ""
                    );
                  }
                }}
                placeholder="Search by ID, name, phone, email, blood group..."
                aria-label="Search registered patients"
              />

            </div>

          </div>


          {loading ? (

            <div className="dashboard-empty">

              <div className="dashboard-empty-icon">
                <Users size={22} />
              </div>

              <h3>
                Loading patient records
              </h3>

              <p>
                Connecting to the CAREKEY database.
              </p>

            </div>

          ) : filteredPatients.length ===
            0 ? (

            <div className="dashboard-empty">

              <div className="dashboard-empty-icon">
                <Users size={22} />
              </div>

              <h3>
                No patients found
              </h3>

              <p>
                Registered CAREKEY patient
                records will appear here.
              </p>

              <Link
                to="/patient/register"
                className="dashboard-register-link"
              >
                Register a patient
              </Link>

            </div>

          ) : (

            <div className="patient-table">

              <div className="patient-table-header">

                <span>
                  PATIENT
                </span>

                <span>
                  ID
                </span>

                <span>
                  BLOOD GROUP
                </span>

                <span>
                  CONTACT
                </span>

                <span>
                  ACTION
                </span>

              </div>


              {filteredPatients.map(
                (patient) => (

                  <button
                    type="button"
                    className="patient-row"
                    key={
                      patient.id ||
                      patient.fullName
                    }
                    onClick={() =>
                      openPatient(
                        patient
                      )
                    }
                  >

                    <span className="patient-name-cell">

                      <span className="patient-avatar">
                        <UserRound size={16} />
                      </span>

                      <span>

                        <strong>
                          {
                            patient.fullName ||
                            "Unnamed Patient"
                          }
                        </strong>

                        <small>
                          {
                            patient.gender ||
                            "Not specified"
                          }
                        </small>

                      </span>

                    </span>


                    <span className="patient-id">
                      {
                        patient.id ||
                        "N/A"
                      }
                    </span>


                    <span className="patient-blood">

                      <Droplets size={14} />

                      {
                        patient.bloodGroup ||
                        "Unknown"
                      }

                    </span>


                    <span className="patient-contact">

                      {
                        patient.phone ||
                        patient.email ||
                        "Not provided"
                      }

                    </span>


                    <span className="patient-open">

                      View

                      <ChevronRight
                        size={15}
                      />

                    </span>

                  </button>

                )
              )}

            </div>

          )}

        </section>


        <section className="dashboard-quick-access">

          <div className="quick-access-copy">

            <span>
              EMERGENCY WORKFLOW
            </span>

            <h2>
              Identify a patient
              <br />
              when every second matters.
            </h2>

            <p>
              Use CAREKEY facial identification
              to locate a registered patient and
              view their essential emergency record.
            </p>

          </div>


          <Link
            to="/emergency"
            className="quick-access-button"
          >

            <HeartPulse size={19} />

            Open Emergency Scanner

            <ChevronRight size={17} />

          </Link>

        </section>


        <section className="dashboard-audit-section">

          <div className="dashboard-section-header">

            <div>

              <span>
                SECURITY AUDIT
              </span>

              <h2>
                Emergency access history
              </h2>

            </div>

          </div>


          {auditLogs.length === 0 ? (

            <div className="dashboard-empty">

              <div className="dashboard-empty-icon">
                <ShieldCheck size={22} />
              </div>

              <h3>
                No emergency access recorded
              </h3>

              <p>
                Successful biometric emergency
                access events will appear here.
              </p>

            </div>

          ) : (

            <div className="doctor-audit-list">

              {auditLogs
                .slice(0, 10)
                .map(
                  (log) => (

                    <div
                      className="doctor-audit-row"
                      key={
                        log.auditId ||
                        log.id ||
                        `${log.patientId}-${log.timestamp}`
                      }
                    >

                      <div className="doctor-audit-icon">
                        <ShieldCheck size={16} />
                      </div>


                      <div className="doctor-audit-main">

                        <div className="doctor-audit-identity">

                          <strong>
                            {
                              log.patientId ||
                              "—"
                            }
                          </strong>

                          <span>
                            Doctor{" "}
                            {
                              log.doctorId ||
                              doctorUserId ||
                              "—"
                            }
                          </span>

                        </div>


                        <small>
                          {
                            log.accessType ||
                            "EMERGENCY_BIOMETRIC_ACCESS"
                          }
                        </small>

                      </div>


                      <div className="doctor-audit-score">

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


                      <div className="doctor-audit-status">

                        <span>
                          ACCESS
                        </span>

                        <strong>
                          {
                            log.accessStatus ||
                            "AUTHORIZED"
                          }
                        </strong>

                      </div>


                      <div className="doctor-audit-time">

                        <span>
                          TIME
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

      </main>


      {selectedPatient && (

        <div
          className="patient-modal-overlay"
          onClick={
            closePatient
          }
        >

          <div
            className="patient-modal"
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            <div className="patient-modal-header">

              <div>

                <span>
                  EMERGENCY MEDICAL RECORD
                </span>

                <h2>
                  {
                    selectedPatient.fullName ||
                    "Patient"
                  }
                </h2>

              </div>


              <button
                type="button"
                className="patient-modal-close"
                onClick={
                  closePatient
                }
                aria-label="Close patient record"
              >
                <X size={18} />
              </button>

            </div>


            <div className="patient-record-status">

              <ShieldCheck size={15} />

              REGISTERED CAREKEY RECORD

            </div>


            <div className="patient-record-grid">

              <div className="record-item">

                <span>
                  PATIENT ID
                </span>

                <strong>
                  {
                    selectedPatient.id ||
                    "N/A"
                  }
                </strong>

              </div>


              <div className="record-item">

                <span>
                  BLOOD GROUP
                </span>

                <strong className="blood-record">

                  <Droplets size={14} />

                  {
                    selectedPatient.bloodGroup ||
                    "Unknown"
                  }

                </strong>

              </div>


              <div className="record-item">

                <span>
                  DATE OF BIRTH
                </span>

                <strong>
                  {
                    selectedPatient.dob ||
                    "Not provided"
                  }
                </strong>

              </div>


              <div className="record-item">

                <span>
                  GENDER
                </span>

                <strong>
                  {
                    selectedPatient.gender ||
                    "Not provided"
                  }
                </strong>

              </div>


              <div className="record-item">

                <span>
                  PHONE
                </span>

                <strong>

                  <Phone size={13} />

                  {
                    selectedPatient.phone ||
                    "Not provided"
                  }

                </strong>

              </div>


              <div className="record-item">

                <span>
                  EMAIL
                </span>

                <strong>

                  <Mail size={13} />

                  {
                    selectedPatient.email ||
                    "Not provided"
                  }

                </strong>

              </div>


              <div className="record-item">

                <span>
                  BIOMETRIC
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


            <div className="record-medical-section">

              <h3>
                Critical medical information
              </h3>


              <div className="medical-record-box allergy">

                <AlertTriangle size={16} />

                <div>

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

              </div>


              <div className="medical-record-box">

                <Activity size={16} />

                <div>

                  <span>
                    PAST MEDICAL HISTORY
                  </span>

                  <p>
                    {
                      selectedPatient.medicalHistory ||
                      "No medical history recorded."
                    }
                  </p>

                </div>

              </div>


              <div className="medical-record-box">

                <HeartPulse size={16} />

                <div>

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

            </div>


            <div className="patient-modal-footer">

              <CalendarDays size={14} />

              Registered:

              {" "}

              {
                formatDateTime(
                  selectedPatient.createdAt
                )
              }

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


export default DoctorDashboard;