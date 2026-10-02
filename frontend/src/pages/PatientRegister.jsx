import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  HeartPulse,
  RefreshCw,
  ScanFace,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";

import "./PatientRegister.css";
import { registerPatient } from "../services/api";

const FACE_SERVICE_URL =
  import.meta.env.VITE_FACE_SERVICE_LOCAL ||
  "http://127.0.0.1:5001";

const initialFormData = {
  fullName: "",
  dob: "",
  gender: "",
  bloodGroup: "",
  phone: "",
  email: "",
  allergies: "",
  medicalHistory: "",
  medications: "",
};

function PatientRegister() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);

  const [error, setError] = useState("");
  const [cameraError, setCameraError] = useState("");

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  const [faceDetected, setFaceDetected] = useState(false);
  const [embedding, setEmbedding] = useState(null);

  const [consent, setConsent] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const cameraRequestRef = useRef(0);
  const mountedRef = useRef(true);

  const updateField = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const stopCamera = () => {
    cameraRequestRef.current += 1;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (mountedRef.current) {
      setCameraActive(false);
      setCameraLoading(false);
    }
  };

  const startCamera = async () => {
    if (!consent) {
      setCameraError(
        "Please give consent to biometric processing before starting the camera."
      );
      return;
    }

    setCameraError("");
    setError("");
    setCameraLoading(true);

    const requestId = ++cameraRequestRef.current;

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Camera access is unavailable. Please use localhost or HTTPS in a supported browser."
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (
        !mountedRef.current ||
        requestId !== cameraRequestRef.current
      ) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;

      setCameraActive(true);
    } catch (err) {
      console.error("Camera error:", err);

      if (!mountedRef.current) return;

      if (err.name === "NotAllowedError") {
        setCameraError(
          "Camera permission was denied. Allow camera access in your browser and try again."
        );
      } else if (err.name === "NotFoundError") {
        setCameraError(
          "No webcam was found. Connect a camera and try again."
        );
      } else if (err.name === "NotReadableError") {
        setCameraError(
          "Your camera is being used by another application. Close that application and try again."
        );
      } else {
        setCameraError(
          err.message || "Unable to start the camera."
        );
      }
    } finally {
      if (
        mountedRef.current &&
        requestId === cameraRequestRef.current
      ) {
        setCameraLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!cameraActive || !videoRef.current) return;

    const video = videoRef.current;

    video.srcObject = streamRef.current;

    const handleReady = () => {
      video.play().catch((err) => {
        console.error("Video playback error:", err);

        if (mountedRef.current) {
          setCameraError(
            "Unable to display the camera preview. Please try again."
          );
        }
      });
    };

    video.addEventListener("loadedmetadata", handleReady);
    video.addEventListener("canplay", handleReady);

    return () => {
      video.removeEventListener("loadedmetadata", handleReady);
      video.removeEventListener("canplay", handleReady);
    };
  }, [cameraActive]);

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      throw new Error("Camera is not ready.");
    }

    if (
      video.readyState < 2 ||
      !video.videoWidth ||
      !video.videoHeight
    ) {
      throw new Error(
        "Camera is still loading. Wait a moment and try again."
      );
    }

    const maxWidth = 960;

    const scale = Math.min(
      1,
      maxWidth / video.videoWidth
    );

    canvas.width = Math.round(
      video.videoWidth * scale
    );

    canvas.height = Math.round(
      video.videoHeight * scale
    );

    const context = canvas.getContext("2d");

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

    return canvas.toDataURL("image/jpeg", 0.85);
  };

  const scanFace = async () => {
    if (!cameraActive || scanning) return;

    setScanning(true);
    setError("");
    setCameraError("");
    setFaceDetected(false);
    setEmbedding(null);

    try {
      const image = captureImage();

      const response = await fetch(
        `${FACE_SERVICE_URL}/embed`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image,
          }),
        }
      );

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The face service returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to process your face."
        );
      }

      if (
        data.success === false ||
        !Array.isArray(data.embedding)
      ) {
        throw new Error(
          data.error ||
            "Unable to detect your face."
        );
      }

      if (data.embedding.length !== 128) {
        throw new Error(
          "The face service returned an invalid 128-dimensional embedding."
        );
      }

      if (!mountedRef.current) return;

      setEmbedding(data.embedding);
      setFaceDetected(true);

      stopCamera();
    } catch (err) {
      console.error("Face scanning error:", err);

      if (!mountedRef.current) return;

      if (
        err instanceof TypeError ||
        err.message?.includes("Failed to fetch")
      ) {
        setError(
          `Cannot connect to the Python face service at ${FACE_SERVICE_URL}.`
        );
      } else {
        setError(
          err.message ||
            "Face scanning failed. Please try again."
        );
      }
    } finally {
      if (mountedRef.current) {
        setScanning(false);
      }
    }
  };

  const scanAgain = () => {
    setFaceDetected(false);
    setEmbedding(null);

    setError("");
    setCameraError("");

    startCamera();
  };

  const validateIdentity = () => {
    if (!formData.fullName.trim()) {
      return "Please enter your full name.";
    }

    if (!formData.dob) {
      return "Please select your date of birth.";
    }

    if (
      formData.dob >
      new Date().toISOString().slice(0, 10)
    ) {
      return "Date of birth cannot be in the future.";
    }

    if (!formData.gender) {
      return "Please select your gender.";
    }

    if (!formData.bloodGroup) {
      return "Please select your blood group.";
    }

    if (!/^\d{10}$/.test(formData.phone.trim())) {
      return "Please enter a valid 10-digit phone number.";
    }

    if (
      formData.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email.trim()
      )
    ) {
      return "Please enter a valid email address.";
    }

    return "";
  };

  const nextStep = () => {
    setError("");

    if (step === 1) {
      const validationError =
        validateIdentity();

      if (validationError) {
        setError(validationError);
        return;
      }
    }

    if (step < 3) {
      setStep((current) => current + 1);
    }
  };

  const previousStep = () => {
    setError("");
    setCameraError("");

    if (step === 3) {
      stopCamera();
    }

    if (step > 1) {
      setStep((current) => current - 1);
    }
  };

  const completeRegistration = async () => {
    setError("");

    if (!faceDetected || !embedding) {
      setError(
        "Please complete your face scan first."
      );
      return;
    }

    try {
      const response = await registerPatient({
        fullName:
          formData.fullName.trim(),
        dob: formData.dob,
        gender: formData.gender,
        bloodGroup:
          formData.bloodGroup,
        phone:
          formData.phone.trim(),
        email:
          formData.email.trim(),
        allergies:
          formData.allergies.trim(),
        medicalHistory:
          formData.medicalHistory.trim(),
        medications:
          formData.medications.trim(),
        embedding,
      });

      stopCamera();

      navigate("/", {
        replace: true,
        state: {
          registrationSuccess: true,
          patientName:
            formData.fullName,
          patientId:
            response.patientId,
        },
      });
    } catch (err) {
      console.error(
        "Registration save error:",
        err
      );

      setError(
        err.message ||
          "Unable to save the patient record. Please try again."
      );
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      cameraRequestRef.current += 1;

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => {
            track.stop();
          });

        streamRef.current = null;
      }
    };
  }, []);

  return (
    <div className="register-page">

      <div
        className="register-background"
        aria-hidden="true"
      >
        <div className="biometric-grid" />

        <div className="biometric-orb orb-one" />
        <div className="biometric-orb orb-two" />

        <div className="face-scan-circle scan-circle-one">
          <span />
        </div>

        <div className="face-scan-circle scan-circle-two">
          <span />
        </div>

        <div className="biometric-cross cross-one">
          +
        </div>

        <div className="biometric-cross cross-two">
          +
        </div>

        <div className="biometric-cross cross-three">
          +
        </div>

        <div className="biometric-particle particle-one" />
        <div className="biometric-particle particle-two" />
        <div className="biometric-particle particle-three" />
        <div className="biometric-particle particle-four" />
        <div className="biometric-particle particle-five" />

        <div className="scan-line-background" />
      </div>

      <header className="register-header">

        <Link
          to="/"
          className="register-logo"
          aria-label="CAREKEY Home"
        >
          <div className="register-logo-mark">
            <HeartPulse size={20} />
          </div>

          <div className="register-logo-text">
            <strong>CAREKEY</strong>

            <span>
              Emergency Medical Intelligence
            </span>
          </div>
        </Link>

        <div className="secure-badge">
          <ShieldCheck size={16} />
          Secure Registration
        </div>

      </header>

      <main className="register-container">

        <div className="register-top">

          <Link
            to="/"
            className="back-home"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          <div className="register-heading">

            <span className="register-label">
              PATIENT REGISTRATION
            </span>

            <h1>
              Create your{" "}
              <em>CAREKEY</em> profile
            </h1>

            <p>
              Register your essential medical
              information and enroll your face
              for emergency identification.
            </p>

          </div>

        </div>

        <div className="progress-wrapper">

          <div
            className={`progress-step ${
              step >= 1 ? "active" : ""
            }`}
          >
            <div className="progress-icon">
              <UserRound size={17} />
            </div>

            <div>
              <strong>Identity</strong>
              <small>Personal details</small>
            </div>
          </div>

          <div className="progress-line" />

          <div
            className={`progress-step ${
              step >= 2 ? "active" : ""
            }`}
          >
            <div className="progress-icon">
              <HeartPulse size={17} />
            </div>

            <div>
              <strong>Medical</strong>
              <small>Health information</small>
            </div>
          </div>

          <div className="progress-line" />

          <div
            className={`progress-step ${
              step >= 3 ? "active" : ""
            }`}
          >
            <div className="progress-icon">
              <ScanFace size={17} />
            </div>

            <div>
              <strong>Biometric</strong>
              <small>Face enrollment</small>
            </div>
          </div>

        </div>

        {error && (
          <div
            className="form-error"
            role="alert"
          >
            <XCircle size={17} />
            <span>{error}</span>
          </div>
        )}

        {step === 1 && (
          <section className="register-card">

            <div className="card-title">

              <div className="card-title-icon">
                <UserRound size={20} />
              </div>

              <div>
                <h2>
                  Identity Information
                </h2>

                <p>
                  Enter your basic personal
                  information.
                </p>
              </div>

            </div>

            <div className="form-content">

              <div className="form-grid">

                <div className="form-group full-width">
                  <label htmlFor="fullName">
                    Full Name <span>*</span>
                  </label>

                  <input
                    id="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(event) =>
                      updateField(
                        "fullName",
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="dob">
                    Date of Birth <span>*</span>
                  </label>

                  <input
                    id="dob"
                    type="date"
                    max={new Date()
                      .toISOString()
                      .slice(0, 10)}
                    value={formData.dob}
                    onChange={(event) =>
                      updateField(
                        "dob",
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="gender">
                    Gender <span>*</span>
                  </label>

                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(event) =>
                      updateField(
                        "gender",
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      Select gender
                    </option>

                    <option value="male">
                      Male
                    </option>

                    <option value="female">
                      Female
                    </option>

                    <option value="other">
                      Other
                    </option>

                    <option value="prefer-not-to-say">
                      Prefer not to say
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="bloodGroup">
                    Blood Group <span>*</span>
                  </label>

                  <select
                    id="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={(event) =>
                      updateField(
                        "bloodGroup",
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      Select blood group
                    </option>

                    {[
                      "A+",
                      "A-",
                      "B+",
                      "B-",
                      "AB+",
                      "AB-",
                      "O+",
                      "O-",
                      "Unknown",
                    ].map((group) => (
                      <option
                        key={group}
                        value={group}
                      >
                        {group}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="phone">
                    Phone Number <span>*</span>
                  </label>

                  <input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10-digit phone number"
                    value={formData.phone}
                    onChange={(event) =>
                      updateField(
                        "phone",
                        event.target.value.replace(
                          /\D/g,
                          ""
                        )
                      )
                    }
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="email">
                    Email Address
                  </label>

                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(event) =>
                      updateField(
                        "email",
                        event.target.value
                      )
                    }
                  />
                </div>

              </div>
            </div>

            <div className="form-actions">
              <span />

              <button
                type="button"
                className="primary-button"
                onClick={nextStep}
              >
                Continue
                <ArrowRight size={17} />
              </button>
            </div>

          </section>
        )}

        {step === 2 && (
          <section className="register-card">

            <div className="card-title medical-title">

              <div className="card-title-icon medical">
                <HeartPulse size={20} />
              </div>

              <div>
                <h2>
                  Medical Information
                </h2>

                <p>
                  Provide information that may help
                  medical professionals during an
                  emergency.
                </p>
              </div>

            </div>

            <div className="form-content">

              <div className="medical-notice">
                <HeartPulse size={18} />

                <span>
                  These details help authorized
                  medical professionals quickly
                  understand your emergency medical
                  needs.
                </span>
              </div>

              <div className="medical-fields">

                <div className="form-group">
                  <label htmlFor="allergies">
                    Known Allergies
                  </label>

                  <textarea
                    id="allergies"
                    placeholder="Example: Penicillin, peanuts. Enter None if you have no known allergies."
                    value={formData.allergies}
                    onChange={(event) =>
                      updateField(
                        "allergies",
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="medicalHistory">
                    Medical History
                  </label>

                  <textarea
                    id="medicalHistory"
                    placeholder="Example: Asthma, diabetes, previous surgeries..."
                    value={
                      formData.medicalHistory
                    }
                    onChange={(event) =>
                      updateField(
                        "medicalHistory",
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="medications">
                    Current Medications
                  </label>

                  <textarea
                    id="medications"
                    placeholder="Enter medication names and dosages, or None."
                    value={
                      formData.medications
                    }
                    onChange={(event) =>
                      updateField(
                        "medications",
                        event.target.value
                      )
                    }
                  />
                </div>

              </div>
            </div>

            <div className="form-actions split">

              <button
                type="button"
                className="secondary-button"
                onClick={previousStep}
              >
                <ArrowLeft size={17} />
                Back
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={nextStep}
              >
                Continue
                <ArrowRight size={17} />
              </button>

            </div>

          </section>
        )}

        {step === 3 && (
          <section className="register-card biometric-card">

            <div className="card-title biometric-title">

              <div className="card-title-icon biometric">
                <ScanFace size={20} />
              </div>

              <div>
                <h2>
                  Face Enrollment
                </h2>

                <p>
                  Capture your face to create a
                  biometric embedding for future
                  identification.
                </p>
              </div>

            </div>

            {!faceDetected && (
              <label className="consent-box">

                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) =>
                    setConsent(
                      event.target.checked
                    )
                  }
                  disabled={
                    cameraActive || scanning
                  }
                />

                <div>
                  <strong>
                    Consent to face enrollment
                  </strong>

                  <p>
                    I agree to capture and process
                    my face to create a biometric
                    template for CAREKEY emergency
                    identification.
                  </p>
                </div>

              </label>
            )}

            <div className="camera-wrapper">

              {!cameraActive && !faceDetected && (
                <div className="camera-placeholder">

                  <div className="camera-ring">
                    <Camera size={34} />
                  </div>

                  <h3>
                    Ready to scan your face
                  </h3>

                  <p>
                    Sit in a well-lit area and keep
                    your face clearly visible inside
                    the frame.
                  </p>

                  {cameraError && (
                    <div
                      className="camera-error"
                      role="alert"
                    >
                      {cameraError}
                    </div>
                  )}

                  <button
                    type="button"
                    className="camera-button"
                    onClick={startCamera}
                    disabled={
                      !consent ||
                      cameraLoading
                    }
                  >
                    <Camera size={18} />

                    {cameraLoading
                      ? "Opening Camera..."
                      : "Start Camera"}
                  </button>

                </div>
              )}

              {cameraActive && (
                <div className="live-camera">

                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                  />

                  <div className="camera-overlay-grid" />

                  <div className="face-frame">

                    <div className="corner top-left" />
                    <div className="corner top-right" />
                    <div className="corner bottom-left" />
                    <div className="corner bottom-right" />

                    <div className="face-scan-line" />

                  </div>

                  <div className="camera-status">

                    <span className="status-dot" />

                    Camera active — position your
                    face inside the frame

                  </div>

                </div>
              )}

              {faceDetected && (
                <div
                  className="face-success"
                  role="status"
                >

                  <div className="success-icon">
                    <CheckCircle2 size={48} />
                  </div>

                  <h3>
                    Face successfully scanned
                  </h3>

                  <p>
                    Your 128-dimensional biometric
                    template has been generated
                    successfully.
                  </p>

                  <div className="embedding-status">
                    <span className="status-dot" />
                    Biometric template ready
                  </div>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={scanAgain}
                  >
                    <RefreshCw size={17} />
                    Scan Again
                  </button>

                </div>
              )}

            </div>

            <canvas
              ref={canvasRef}
              style={{ display: "none" }}
            />

            {cameraActive && (
              <div className="camera-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={stopCamera}
                  disabled={scanning}
                >
                  Stop Camera
                </button>

                <button
                  type="button"
                  className="scan-button"
                  onClick={scanFace}
                  disabled={scanning}
                >

                  {scanning ? (
                    <>
                      <RefreshCw
                        size={18}
                        className="spin"
                      />

                      Scanning Face...
                    </>
                  ) : (
                    <>
                      <ScanFace size={18} />
                      Scan My Face
                    </>
                  )}

                </button>

              </div>
            )}

            <div className="biometric-security">

              <ShieldCheck
                size={19}
                className="security-icon"
              />

              <div>

                <strong>
                  Biometric Information
                </strong>

                <p>
                  Your captured image is sent to the
                  CAREKEY Python face service for
                  processing. A 128-dimensional
                  biometric embedding is generated
                  for identification.
                </p>

              </div>

            </div>

            <div className="form-actions split">

              <button
                type="button"
                className="secondary-button"
                onClick={previousStep}
                disabled={scanning}
              >
                <ArrowLeft size={17} />
                Back
              </button>

              <button
                type="button"
                className="primary-button"
                disabled={
                  !faceDetected ||
                  !embedding ||
                  scanning
                }
                onClick={completeRegistration}
              >
                Complete Registration
                <CheckCircle2 size={17} />
              </button>

            </div>

          </section>
        )}

        <div className="registration-footer-note">

          <ShieldCheck size={14} />

          CAREKEY biometric enrollment is protected
          during local development.

        </div>

      </main>

    </div>
  );
}

export default PatientRegister;