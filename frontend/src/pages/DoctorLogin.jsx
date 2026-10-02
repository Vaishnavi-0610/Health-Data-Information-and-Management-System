import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ShieldCheck,
  LockKeyhole,
  ArrowLeft,
  Eye,
  EyeOff,
  Activity,
  Wifi,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  getCurrentUser,
  login,
  logout,
} from "../services/api";

import "./DoctorLogin.css";


function SecurityBackground() {

  const canvasRef =
    useRef(null);


  useEffect(() => {

    const canvas =
      canvasRef.current;


    if (!canvas) {
      return;
    }


    const context =
      canvas.getContext("2d");


    if (!context) {
      return;
    }


    let animationFrame = null;

    let width = 0;

    let height = 0;


    const nodes = [];

    const NODE_COUNT = 42;


    const resize = () => {

      width =
        window.innerWidth;

      height =
        window.innerHeight;


      const pixelRatio =
        Math.min(
          window.devicePixelRatio || 1,
          2
        );


      canvas.width =
        width * pixelRatio;

      canvas.height =
        height * pixelRatio;


      canvas.style.width =
        `${width}px`;

      canvas.style.height =
        `${height}px`;


      context.setTransform(
        pixelRatio,
        0,
        0,
        pixelRatio,
        0,
        0
      );
    };


    const createNodes = () => {

      nodes.length = 0;


      for (
        let index = 0;
        index < NODE_COUNT;
        index++
      ) {

        nodes.push({
          x:
            Math.random() *
            width,

          y:
            Math.random() *
            height,

          radius:
            Math.random() *
              1.8 +
            0.8,

          speedX:
            (
              Math.random() -
              0.5
            ) * 0.12,

          speedY:
            (
              Math.random() -
              0.5
            ) * 0.12,

          phase:
            Math.random() *
            Math.PI *
            2,
        });
      }
    };


    const drawShieldPulse =
      (time) => {

        const centerX =
          width / 2;

        const centerY =
          height / 2;


        const pulse =
          (
            Math.sin(
              time *
              0.0007
            ) + 1
          ) / 2;


        const radius =
          150 +
          pulse * 100;


        const gradient =
          context.createRadialGradient(
            centerX,
            centerY,
            20,
            centerX,
            centerY,
            radius
          );


        gradient.addColorStop(
          0,
          "rgba(82, 201, 255, 0.035)"
        );


        gradient.addColorStop(
          0.65,
          "rgba(82, 201, 255, 0.012)"
        );


        gradient.addColorStop(
          1,
          "rgba(82, 201, 255, 0)"
        );


        context.fillStyle =
          gradient;


        context.beginPath();


        context.arc(
          centerX,
          centerY,
          radius,
          0,
          Math.PI * 2
        );


        context.fill();
      };


    const drawConnections = () => {

      for (
        let first = 0;
        first < nodes.length;
        first++
      ) {

        for (
          let second =
            first + 1;
          second < nodes.length;
          second++
        ) {

          const nodeA =
            nodes[first];

          const nodeB =
            nodes[second];


          const dx =
            nodeA.x -
            nodeB.x;

          const dy =
            nodeA.y -
            nodeB.y;


          const distance =
            Math.sqrt(
              dx * dx +
              dy * dy
            );


          if (
            distance < 135
          ) {

            const opacity =
              (
                1 -
                distance / 135
              ) * 0.11;


            context.strokeStyle =
              `rgba(82, 201, 255, ${opacity})`;


            context.lineWidth =
              0.6;


            context.beginPath();


            context.moveTo(
              nodeA.x,
              nodeA.y
            );


            context.lineTo(
              nodeB.x,
              nodeB.y
            );


            context.stroke();
          }
        }
      }
    };


    const drawNodes =
      (time) => {

        nodes.forEach(
          (node) => {

            node.x +=
              node.speedX;

            node.y +=
              node.speedY;


            if (
              node.x < -20
            ) {
              node.x =
                width + 20;
            }


            if (
              node.x >
              width + 20
            ) {
              node.x =
                -20;
            }


            if (
              node.y < -20
            ) {
              node.y =
                height + 20;
            }


            if (
              node.y >
              height + 20
            ) {
              node.y =
                -20;
            }


            const glow =
              0.22 +
              Math.sin(
                time *
                  0.001 +
                node.phase
              ) *
                0.08;


            context.fillStyle =
              `rgba(82, 201, 255, ${glow})`;


            context.beginPath();


            context.arc(
              node.x,
              node.y,
              node.radius,
              0,
              Math.PI * 2
            );


            context.fill();
          }
        );
      };


    const animate =
      (time) => {

        context.clearRect(
          0,
          0,
          width,
          height
        );


        drawShieldPulse(
          time
        );


        drawConnections();


        drawNodes(
          time
        );


        animationFrame =
          requestAnimationFrame(
            animate
          );
      };


    resize();

    createNodes();


    window.addEventListener(
      "resize",
      resize
    );


    animationFrame =
      requestAnimationFrame(
        animate
      );


    return () => {

      if (
        animationFrame
      ) {
        cancelAnimationFrame(
          animationFrame
        );
      }


      window.removeEventListener(
        "resize",
        resize
      );
    };

  }, []);


  return (
    <canvas
      ref={canvasRef}
      className="doctor-security-background"
      aria-hidden="true"
    />
  );
}


function DoctorLogin() {

  const navigate =
    useNavigate();


  const [
    doctorId,
    setDoctorId,
  ] = useState("");


  const [
    password,
    setPassword,
  ] = useState("");


  const [
    showPassword,
    setShowPassword,
  ] = useState(false);


  const [
    rememberMe,
    setRememberMe,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    success,
    setSuccess,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(false);


  useEffect(() => {

    document.title =
      "Doctor Login | CAREKEY";


    let active = true;


    const checkSession =
      async () => {

        try {

          const response =
            await getCurrentUser();


          if (
            !active
          ) {
            return;
          }


          if (
            response?.user?.role ===
            "DOCTOR"
          ) {

            navigate(
              "/doctor/dashboard",
              {
                replace:
                  true,
              }
            );

          }

        } catch {

          logout();

        }
      };


    checkSession();


    return () => {
      active = false;
    };

  }, [navigate]);


  const handleSubmit =
    async (event) => {

      event.preventDefault();


      if (
        loading
      ) {
        return;
      }


      setError("");

      setSuccess("");


      const cleanId =
        doctorId
          .trim()
          .toUpperCase();


      if (
        !cleanId ||
        !password
      ) {

        setError(
          "Please enter your Doctor ID and password."
        );

        return;
      }


      setLoading(true);


      try {

        const response =
          await login(
            cleanId,
            password,
            "DOCTOR"
          );


        if (
          response?.user?.role !==
          "DOCTOR"
        ) {

          logout();

          throw new Error(
            "This account is not authorized for the Doctor Portal."
          );
        }


        if (
          rememberMe
        ) {

          localStorage.setItem(
            "carekeyRememberDoctor",
            "true"
          );

        } else {

          localStorage.removeItem(
            "carekeyRememberDoctor"
          );

        }


        setSuccess(
          "Authentication successful. Opening secure dashboard..."
        );


        setTimeout(() => {

          navigate(
            "/doctor/dashboard",
            {
              replace:
                true,
            }
          );

        }, 500);

      } catch (
        loginError
      ) {

        setLoading(false);


        if (
          loginError?.status ===
          429
        ) {

          setError(
            "Too many login attempts. Please wait a moment and try again."
          );

        } else {

          setError(
            loginError?.message ||
            "Unable to authenticate. Please try again."
          );

        }
      }
    };


  return (
    <div className="doctor-login-page">

      <SecurityBackground />

      <div className="doctor-login-grid" />

      <div className="doctor-login-glow" />


      <header className="doctor-login-header">

        <Link
          to="/"
          className="doctor-login-brand"
          aria-label="CAREKEY Home"
        >

          <span className="doctor-brand-icon">
            <ShieldCheck size={20} />
          </span>

          <span>

            <strong>
              CAREKEY
            </strong>

            <small>
              Emergency Medical Intelligence
            </small>

          </span>

        </Link>


        <div className="doctor-system-status">

          <span className="status-pulse" />

          SECURE SYSTEM ONLINE

        </div>

      </header>


      <main className="doctor-login-main">

        <Link
          to="/"
          className="doctor-back-home"
        >

          <ArrowLeft size={16} />

          Back to Home

        </Link>


        <section className="doctor-login-layout">

          <div className="doctor-login-intro">

            <div className="doctor-intro-label">

              <LockKeyhole size={15} />

              AUTHORIZED MEDICAL ACCESS

            </div>


            <h1>

              Secure access to

              <br />

              <em>
                critical care.
              </em>

            </h1>


            <p>

              Authorized healthcare professionals
              can securely access registered patient
              emergency information through CAREKEY.

            </p>


            <div className="doctor-security-features">

              <div className="doctor-feature">

                <div className="doctor-feature-icon">
                  <ShieldCheck size={18} />
                </div>

                <div>

                  <strong>
                    Protected Access
                  </strong>

                  <span>
                    Controlled doctor authentication
                  </span>

                </div>

              </div>


              <div className="doctor-feature">

                <div className="doctor-feature-icon">
                  <Activity size={18} />
                </div>

                <div>

                  <strong>
                    Emergency Ready
                  </strong>

                  <span>
                    Rapid access to essential records
                  </span>

                </div>

              </div>


              <div className="doctor-feature">

                <div className="doctor-feature-icon">
                  <Wifi size={18} />
                </div>

                <div>

                  <strong>
                    Secure Network
                  </strong>

                  <span>
                    Authenticated CAREKEY workflow
                  </span>

                </div>

              </div>

            </div>

          </div>


          <div className="doctor-login-card">

            <div className="doctor-card-top">

              <div className="doctor-card-icon">
                <ShieldCheck size={23} />
              </div>

              <div>

                <span>
                  DOCTOR PORTAL
                </span>

                <h2>
                  Sign in
                </h2>

              </div>

            </div>


            <div className="doctor-card-divider" />


            <form
              onSubmit={
                handleSubmit
              }
              className="doctor-login-form"
            >

              <label
                htmlFor="doctor-id"
              >
                Doctor ID
              </label>


              <div className="doctor-input-wrapper">

                <LockKeyhole size={17} />

                <input
                  id="doctor-id"
                  type="text"
                  value={doctorId}
                  onChange={(event) =>
                    setDoctorId(
                      event.target.value
                    )
                  }
                  placeholder="Enter Doctor ID"
                  autoComplete="username"
                  disabled={loading}
                />

              </div>


              <label
                htmlFor="doctor-password"
              >
                Password
              </label>


              <div className="doctor-input-wrapper">

                <LockKeyhole size={17} />

                <input
                  id="doctor-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Enter password"
                  autoComplete="current-password"
                  disabled={loading}
                />


                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >

                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}

                </button>

              </div>


              <div className="doctor-login-options">

                <label className="remember-option">

                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) =>
                      setRememberMe(
                        event.target.checked
                      )
                    }
                    disabled={loading}
                  />

                  <span>
                    Remember this device
                  </span>

                </label>


                <span className="demo-label">
                  Secure portal
                </span>

              </div>


              {error && (
                <div className="doctor-login-message error">

                  <AlertCircle size={17} />

                  <span>
                    {error}
                  </span>

                </div>
              )}


              {success && (
                <div className="doctor-login-message success">

                  <CheckCircle2 size={17} />

                  <span>
                    {success}
                  </span>

                </div>
              )}


              <button
                type="submit"
                className="doctor-login-submit"
                disabled={loading}
              >

                {loading ? (
                  <>
                    <span className="doctor-button-spinner" />

                    Authenticating...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />

                    Access Doctor Dashboard
                  </>
                )}

              </button>


              <div className="doctor-demo-note">

                <span>
                  Prototype credentials
                </span>

                <code>
                  DOC001 / doctor123
                </code>

              </div>

            </form>


            <div className="doctor-card-footer">

              <ShieldCheck size={14} />

              Authorized healthcare access only

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}


export default DoctorLogin;