import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  HeartPulse,
  RefreshCw,
  ScanFace,
  ShieldCheck,
  Siren,
  UserRound,
  XCircle,
} from "lucide-react";

import "./Emergency.css";

import {
  emergencyMatch,
  getCurrentUser,
  getPatients,
  logout,
} from "../services/api";

function Emergency() {
  const [cameraActive, setCameraActive] =
    useState(false);

  const [cameraLoading, setCameraLoading] =
    useState(false);

  const [scanning, setScanning] =
    useState(false);

  const [cameraError, setCameraError] =
    useState("");

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [patients, setPatients] =
    useState([]);

  const [matchedPatient, setMatchedPatient] =
    useState(null);

  const [similarity, setSimilarity] =
    useState(null);

  const [doctorId, setDoctorId] =
    useState("");

  const videoRef =
    useRef(null);

  const canvasRef =
    useRef(null);

  const streamRef =
    useRef(null);

  const mountedRef =
    useRef(true);

  const cameraRequestRef =
    useRef(0);

  const navigate =
    useNavigate();

  useEffect(() => {
    let active = true;

    const initializeEmergencyAccess =
      async () => {
        const token =
          localStorage.getItem(
            "carekeyAuthToken"
          );

        if (!token) {
          navigate(
            "/doctor/login",
            {
              replace: true,
            }
          );

          return;
        }

        try {
          const [
            userData,
            patientData,
          ] = await Promise.all([
            getCurrentUser(),
            getPatients(),
          ]);

          if (!active) {
            return;
          }

          if (
            userData.user?.role !==
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

          setDoctorId(
            userData.user.userId ||
              "DOC001"
          );

          setPatients(
            patientData
          );
        } catch (err) {
          console.error(
            "Unable to initialize emergency access:",
            err
          );

          if (
            err.status === 401 ||
            err.status === 403
          ) {
            logout();

            navigate(
              "/doctor/login",
              {
                replace: true,
              }
            );
          }
        }
      };

    initializeEmergencyAccess();

    return () => {
      active = false;
    };
  }, [navigate]);

  const stopCamera = () => {
    cameraRequestRef.current += 1;

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject =
        null;
    }

    if (mountedRef.current) {
      setCameraActive(false);
      setCameraLoading(false);
    }
  };

  const startCamera =
    async () => {
      setCameraError("");
      setError("");
      setSuccessMessage("");

      setMatchedPatient(null);
      setSimilarity(null);

      setCameraLoading(true);

      const requestId =
        ++cameraRequestRef.current;

      try {
        if (
          !navigator.mediaDevices?.getUserMedia
        ) {
          throw new Error(
            "Camera access is unavailable. Please use localhost or HTTPS."
          );
        }

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: {
                facingMode: "user",
                width: {
                  ideal: 1280,
                },
                height: {
                  ideal: 720,
                },
              },
              audio: false,
            }
          );

        if (
          !mountedRef.current ||
          requestId !==
            cameraRequestRef.current
        ) {
          stream
            .getTracks()
            .forEach((track) => {
              track.stop();
            });

          return;
        }

        streamRef.current =
          stream;

        setCameraActive(true);
      } catch (err) {
        console.error(
          "Emergency camera error:",
          err
        );

        if (
          !mountedRef.current
        ) {
          return;
        }

        if (
          err.name ===
          "NotAllowedError"
        ) {
          setCameraError(
            "Camera permission was denied. Allow camera access and try again."
          );
        } else if (
          err.name ===
          "NotFoundError"
        ) {
          setCameraError(
            "No webcam was found. Connect a camera and try again."
          );
        } else if (
          err.name ===
          "NotReadableError"
        ) {
          setCameraError(
            "Your camera is being used by another application. Close it and try again."
          );
        } else {
          setCameraError(
            err.message ||
              "Unable to start the emergency camera."
          );
        }
      } finally {
        if (
          mountedRef.current &&
          requestId ===
            cameraRequestRef.current
        ) {
          setCameraLoading(
            false
          );
        }
      }
    };

  useEffect(() => {
    if (
      !cameraActive ||
      !videoRef.current
    ) {
      return;
    }

    const video =
      videoRef.current;

    video.srcObject =
      streamRef.current;

    const playVideo = () => {
      video
        .play()
        .catch((err) => {
          console.error(
            "Emergency video playback error:",
            err
          );

          if (
            mountedRef.current
          ) {
            setCameraError(
              "Unable to display the camera preview. Please try again."
            );
          }
        });
    };

    video.addEventListener(
      "loadedmetadata",
      playVideo
    );

    video.addEventListener(
      "canplay",
      playVideo
    );

    return () => {
      video.removeEventListener(
        "loadedmetadata",
        playVideo
      );

      video.removeEventListener(
        "canplay",
        playVideo
      );
    };
  }, [cameraActive]);

  const captureImage = () => {
    const video =
      videoRef.current;

    const canvas =
      canvasRef.current;

    if (!video || !canvas) {
      throw new Error(
        "Camera is not ready."
      );
    }

    if (
      video.readyState < 2 ||
      !video.videoWidth ||
      !video.videoHeight
    ) {
      throw new Error(
        "Camera is still loading. Please wait a moment and try again."
      );
    }

    const maxWidth = 960;

    const scale =
      Math.min(
        1,
        maxWidth /
          video.videoWidth
      );

    canvas.width =
      Math.round(
        video.videoWidth *
          scale
      );

    canvas.height =
      Math.round(
        video.videoHeight *
          scale
      );

    const context =
      canvas.getContext("2d");

    if (!context) {
      throw new Error(
        "Unable to capture the camera image."
      );
    }

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return canvas.toDataURL(
      "image/jpeg",
      0.85
    );
  };

  const identifyPatient =
    async () => {
      if (
        !cameraActive ||
        scanning
      ) {
        return;
      }

      setScanning(true);

      setError("");
      setCameraError("");
      setSuccessMessage("");

      setMatchedPatient(null);
      setSimilarity(null);

      try {
        const image =
          captureImage();

        const data =
          await emergencyMatch(
            image
          );

        const matchId =
          data.match?.id ||
          data.match_id ||
          null;

        const matchSimilarity =
          typeof data.match?.similarity ===
          "number"
            ? data.match.similarity
            : typeof data.similarity ===
              "number"
            ? data.similarity
            : null;

        if (
          !matchId ||
          !data.patient
        ) {
          setError(
            "No matching patient was found. Please ensure the patient is registered and try again."
          );

          return;
        }

        if (
          !mountedRef.current
        ) {
          return;
        }

        setMatchedPatient(
          data.patient
        );

        setSimilarity(
          matchSimilarity
        );

        setSuccessMessage(
          "Patient identity verified successfully. Emergency access has been logged."
        );

        stopCamera();
      } catch (err) {
        console.error(
          "Emergency identification error:",
          err
        );

        if (
          !mountedRef.current
        ) {
          return;
        }

        if (
          err.status === 401 ||
          err.status === 403
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

        setError(
          err.message ||
            "Emergency identification failed. Please try again."
        );
      } finally {
        if (
          mountedRef.current
        ) {
          setScanning(false);
        }
      }
    };

  const scanAgain = () => {
    stopCamera();

    setMatchedPatient(null);
    setSimilarity(null);
    setSuccessMessage("");
    setError("");
    setCameraError("");

    startCamera();
  };

  useEffect(() => {
    mountedRef.current =
      true;

    return () => {
      mountedRef.current =
        false;

      cameraRequestRef.current +=
        1;

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => {
            track.stop();
          });

        streamRef.current =
          null;
      }
    };
  }, []);

  const similarityPercent =
    typeof similarity ===
    "number"
      ? `${(
          similarity * 100
        ).toFixed(1)}%`
      : null;

  return (
    <div className="emergency-page">

      <div
        className="emergency-background"
        aria-hidden="true"
      >
        <div className="emergency-grid" />

        <div className="emergency-radar radar-one">
          <span />
        </div>

        <div className="emergency-radar radar-two">
          <span />
        </div>

        <div className="emergency-pulse pulse-one" />

        <div className="emergency-pulse pulse-two" />

        <div className="emergency-particle particle-one" />

        <div className="emergency-particle particle-two" />

        <div className="emergency-particle particle-three" />

        <div className="emergency-particle particle-four" />

        <div className="emergency-particle particle-five" />

        <div className="emergency-particle particle-six" />

        <div className="medical-cross cross-one">
          +
        </div>

        <div className="medical-cross cross-two">
          +
        </div>

        <div className="medical-cross cross-three">
          +
        </div>
      </div>

      <header className="emergency-header">

        <Link
          to="/"
          className="emergency-logo"
          aria-label="CAREKEY Home"
        >
          <div className="emergency-logo-mark">
            <HeartPulse size={19} />
          </div>

          <div className="emergency-logo-text">
            <strong>
              CAREKEY
            </strong>

            <span>
              Emergency Medical Intelligence
            </span>
          </div>
        </Link>

        <div className="emergency-header-status">

          <span className="header-status-dot" />

          EMERGENCY SYSTEM ONLINE

        </div>

      </header>

      <main className="emergency-container">

        <Link
          to="/"
          className="emergency-back"
        >
          <ArrowLeft size={16} />

          Back to Home
        </Link>

        <section className="emergency-heading">

          <div className="emergency-label">
            <Siren size={14} />

            EMERGENCY ACCESS
          </div>

          <h1>
            Identify a
            <br />

            <em>
              patient instantly.
            </em>
          </h1>

          <p>
            Use facial identification to securely
            locate a registered CAREKEY patient
            and access critical emergency medical
            information.
          </p>

        </section>

        <div className="emergency-authorized-access">

          <ShieldCheck size={18} />

          <span>

            Authorized emergency access:

            <strong>
              {" "}
              {doctorId ||
                "DOC001"}
            </strong>

            <span className="access-role">
              {" "}
              • DOCTOR • READ-ONLY SNAPSHOT
            </span>

          </span>

        </div>

        <div className="emergency-status-bar">

          <div className="emergency-status-item">

            <div className="status-icon">
              <ShieldCheck size={16} />
            </div>

            <div>
              <small>
                SECURITY
              </small>

              <strong>
                PROTECTED
              </strong>
            </div>

          </div>

          <div className="emergency-status-divider" />

          <div className="emergency-status-item">

            <div className="status-icon">
              <ScanFace size={16} />
            </div>

            <div>
              <small>
                BIOMETRIC
              </small>

              <strong>
                128-D EMBEDDING
              </strong>
            </div>

          </div>

          <div className="emergency-status-divider" />

          <div className="emergency-status-item">

            <div className="status-icon">
              <UserRound size={16} />
            </div>

            <div>
              <small>
                REGISTERED PATIENTS
              </small>

              <strong>
                {patients.length}
              </strong>
            </div>

          </div>

        </div>

        {error && (
          <div
            className="emergency-error"
            role="alert"
          >
            <XCircle size={17} />

            <span>
              {error}
            </span>
          </div>
        )}

        {successMessage &&
          matchedPatient && (
            <div
              className="emergency-success"
              role="status"
            >
              <CheckCircle2 size={17} />

              <span>
                {successMessage}
              </span>
            </div>
          )}

        {!matchedPatient && (
          <section className="emergency-scanner-card">

            <div className="scanner-card-header">

              <div>

                <span className="scanner-eyebrow">
                  BIOMETRIC IDENTIFICATION
                </span>

                <h2>
                  Emergency Face Scanner
                </h2>

                <p>
                  Position the patient's face
                  inside the scanning frame.
                </p>

              </div>

              <div className="scanner-live-indicator">

                <span />

                LIVE

              </div>

            </div>

            <div className="emergency-camera-wrapper">

              {!cameraActive && (
                <div className="emergency-camera-placeholder">

                  <div className="scanner-icon-ring">
                    <ScanFace size={42} />
                  </div>

                  <h3>
                    Ready for patient
                    identification
                  </h3>

                  <p>
                    Start the camera and position
                    the patient's face clearly
                    inside the scanning area.
                  </p>

                  {cameraError && (
                    <div
                      className="emergency-camera-error"
                      role="alert"
                    >
                      {cameraError}
                    </div>
                  )}

                  <button
                    type="button"
                    className="emergency-start-button"
                    onClick={
                      startCamera
                    }
                    disabled={
                      cameraLoading
                    }
                  >
                    <Camera size={18} />

                    {cameraLoading
                      ? "Opening Camera..."
                      : "Start Emergency Scanner"}
                  </button>

                </div>
              )}

              {cameraActive && (
                <div className="emergency-live-camera">

                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                  />

                  <div className="emergency-camera-grid" />

                  <div className="emergency-face-frame">

                    <div className="scanner-corner top-left" />

                    <div className="scanner-corner top-right" />

                    <div className="scanner-corner bottom-left" />

                    <div className="scanner-corner bottom-right" />

                    <div className="emergency-scan-line" />

                    <div className="face-frame-label">
                      FACE DETECTION
                    </div>

                  </div>

                  <div className="emergency-camera-status">

                    <span className="status-dot" />

                    Camera active — align
                    patient's face

                  </div>

                </div>
              )}

            </div>

            <canvas
              ref={canvasRef}
              style={{
                display: "none",
              }}
            />

            {cameraActive && (
              <div className="emergency-camera-actions">

                <button
                  type="button"
                  className="emergency-secondary-button"
                  onClick={
                    stopCamera
                  }
                  disabled={
                    scanning
                  }
                >
                  Stop Camera
                </button>

                <button
                  type="button"
                  className="emergency-scan-button"
                  onClick={
                    identifyPatient
                  }
                  disabled={
                    scanning
                  }
                >

                  {scanning ? (
                    <>
                      <RefreshCw
                        size={18}
                        className="spin"
                      />

                      Identifying Patient...
                    </>
                  ) : (
                    <>
                      <ScanFace size={18} />

                      Identify Patient
                    </>
                  )}

                </button>

              </div>
            )}

            <div className="scanner-security">

              <ShieldCheck size={18} />

              <div>

                <strong>
                  Secure Emergency Identification
                </strong>

                <p>
                  The camera image is sent to the
                  CAREKEY backend. The backend performs
                  biometric matching using protected
                  patient records and returns only the
                  matched emergency record.
                </p>

              </div>

            </div>

          </section>
        )}

        {matchedPatient && (
          <section className="patient-result-card">

            <div className="patient-result-header">

              <div className="verified-badge">

                <CheckCircle2 size={17} />

                IDENTITY VERIFIED

              </div>

              <div className="match-score">

                <small>
                  FACE MATCH
                </small>

                <strong>
                  {similarityPercent ||
                    "Verified"}
                </strong>

              </div>

            </div>

            <div className="patient-identity">

              <div className="patient-avatar">
                <UserRound size={32} />
              </div>

              <div className="patient-name-block">

                <span>
                  PATIENT ID
                </span>

                <h2>
                  {matchedPatient.id}
                </h2>

                <strong>
                  {matchedPatient.fullName}
                </strong>

              </div>

            </div>

            <div className="patient-info-grid">

              <div className="patient-info-item">

                <small>
                  DATE OF BIRTH
                </small>

                <strong>
                  {matchedPatient.dob ||
                    "Not provided"}
                </strong>

              </div>

              <div className="patient-info-item">

                <small>
                  GENDER
                </small>

                <strong>
                  {matchedPatient.gender ||
                    "Not provided"}
                </strong>

              </div>

              <div className="patient-info-item blood-group">

                <small>
                  BLOOD GROUP
                </small>

                <strong>
                  {matchedPatient.bloodGroup ||
                    "Unknown"}
                </strong>

              </div>

              <div className="patient-info-item">

                <small>
                  PHONE
                </small>

                <strong>
                  {matchedPatient.phone ||
                    "Not provided"}
                </strong>

              </div>

            </div>

            <div className="medical-result-section">

              <div className="medical-result-heading">

                <HeartPulse size={18} />

                <div>

                  <span>
                    EMERGENCY MEDICAL INFORMATION
                  </span>

                  <h3>
                    Critical Patient Data
                  </h3>

                </div>

              </div>

              <div className="medical-result-grid">

                <div className="medical-result-card allergy-card">

                  <span>
                    KNOWN ALLERGIES
                  </span>

                  <strong>
                    {matchedPatient.allergies
                      ?.trim() ||
                      "No known allergies recorded"}
                  </strong>

                </div>

                <div className="medical-result-card">

                  <span>
                    MEDICAL HISTORY
                  </span>

                  <strong>
                    {matchedPatient.medicalHistory
                      ?.trim() ||
                      "No medical history recorded"}
                  </strong>

                </div>

                <div className="medical-result-card">

                  <span>
                    CURRENT MEDICATIONS
                  </span>

                  <strong>
                    {matchedPatient.medications
                      ?.trim() ||
                      "No current medications recorded"}
                  </strong>

                </div>

              </div>

            </div>

            <div className="emergency-readonly-notice">

              <ShieldCheck size={18} />

              <div>

                <strong>
                  Read-only emergency snapshot
                </strong>

                <span>
                  This record is available only to
                  the authenticated doctor and cannot
                  be edited from Emergency Access.
                  The access event has been recorded
                  in the CAREKEY audit log.
                </span>

              </div>

            </div>

            <div className="patient-contact">

              <div>

                <small>
                  PATIENT CONTACT
                </small>

                <strong>
                  {matchedPatient.phone ||
                    "Not provided"}
                </strong>

              </div>

              <div>

                <small>
                  EMAIL
                </small>

                <strong>
                  {matchedPatient.email ||
                    "Not provided"}
                </strong>

              </div>

            </div>

            <div className="patient-result-actions">

              <button
                type="button"
                className="emergency-secondary-button"
                onClick={
                  scanAgain
                }
              >
                <RefreshCw size={17} />

                Scan Another Patient
              </button>

              <Link
                to="/"
                className="emergency-primary-link"
              >
                <ArrowLeft size={17} />

                Return Home
              </Link>

            </div>

          </section>
        )}

        {!matchedPatient &&
          patients.length === 0 && (
            <div className="no-patients-notice">

              <UserRound size={20} />

              <div>

                <strong>
                  No registered patients
                </strong>

                <p>
                  Register a patient with their
                  biometric information before
                  using Emergency Access.
                </p>

              </div>

              <Link
                to="/patient/register"
              >
                Register Patient
              </Link>

            </div>
          )}

        <div className="emergency-footer-security">

          <ShieldCheck size={14} />

          CAREKEY Emergency Access
          • Authorized medical use only

        </div>

      </main>

    </div>
  );
}

export default Emergency;