import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Activity,
  ArrowLeft,
  Database,
  LockKeyhole,
  MonitorCog,
  Radio,
  Server,
  ShieldCheck,
  Terminal,
  User,
  Wifi,
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

import "./AdminLogin.css";


function AdminMonitoringBackground() {

  const canvasRef =
    useRef(null);


  useEffect(() => {

    const canvas =
      canvasRef.current;


    if (!canvas) {
      return;
    }


    const ctx =
      canvas.getContext(
        "2d"
      );


    if (!ctx) {
      return;
    }


    let width = 0;

    let height = 0;

    let animationFrame = null;

    let radarAngle = 0;


    const nodes = [];

    const pulses = [];

    const telemetry = [];


    const NODE_COUNT = 30;

    const PULSE_COUNT = 12;

    const TELEMETRY_COUNT = 7;


    const resize = () => {

      const ratio =
        Math.min(
          window.devicePixelRatio || 1,
          2
        );


      width =
        window.innerWidth;


      height =
        window.innerHeight;


      canvas.width =
        width * ratio;


      canvas.height =
        height * ratio;


      canvas.style.width =
        `${width}px`;


      canvas.style.height =
        `${height}px`;


      ctx.setTransform(
        ratio,
        0,
        0,
        ratio,
        0,
        0
      );
    };


    const createNodes = () => {

      nodes.length = 0;


      for (
        let i = 0;
        i < NODE_COUNT;
        i++
      ) {

        nodes.push({

          angle:
            Math.random() *
            Math.PI *
            2,

          distance:
            100 +
            Math.random() *
              Math.min(
                width,
                height
              ) *
              0.36,

          speed:
            0.00004 +
            Math.random() *
              0.00015,

          size:
            Math.random() *
              1.5 +
            0.7,

          phase:
            Math.random() *
            Math.PI *
            2,

          opacity:
            Math.random() *
              0.35 +
            0.2,

        });

      }
    };


    const createPulses = () => {

      pulses.length = 0;


      for (
        let i = 0;
        i < PULSE_COUNT;
        i++
      ) {

        pulses.push({

          angle:
            Math.random() *
            Math.PI *
            2,

          distance:
            Math.random() *
            300,

          speed:
            0.25 +
            Math.random() *
              0.5,

          size:
            Math.random() *
              1.5 +
            0.7,

        });

      }
    };


    const createTelemetry = () => {

      telemetry.length = 0;


      for (
        let i = 0;
        i < TELEMETRY_COUNT;
        i++
      ) {

        telemetry.push({

          progress:
            Math.random(),

          speed:
            0.0004 +
            Math.random() *
              0.0008,

          amplitude:
            4 +
            Math.random() *
              8,

          phase:
            Math.random() *
            Math.PI *
            2,

        });

      }
    };


    const getRadarCenter =
      () => {

        return {

          x:
            width *
            (
              width < 700
                ? 0.5
                : 0.72
            ),

          y:
            height *
            0.53,

        };

      };


    const getMaxRadius =
      () => {

        return (
          Math.min(
            width,
            height
          ) *
          (
            width < 700
              ? 0.38
              : 0.34
          )
        );

      };


    const drawGrid = () => {

      const gridSize =
        width < 700
          ? 52
          : 68;


      ctx.save();


      ctx.strokeStyle =
        "rgba(67, 135, 162, 0.055)";


      ctx.lineWidth =
        0.5;


      for (
        let x = 0;
        x < width;
        x += gridSize
      ) {

        ctx.beginPath();

        ctx.moveTo(
          x,
          0
        );

        ctx.lineTo(
          x,
          height
        );

        ctx.stroke();

      }


      for (
        let y = 0;
        y < height;
        y += gridSize
      ) {

        ctx.beginPath();

        ctx.moveTo(
          0,
          y
        );

        ctx.lineTo(
          width,
          y
        );

        ctx.stroke();

      }


      ctx.restore();
    };


    const drawRadar =
      (time) => {

        const {
          x,
          y,
        } =
          getRadarCenter();


        const maxRadius =
          getMaxRadius();


        ctx.save();


        const glow =
          ctx.createRadialGradient(
            x,
            y,
            0,
            x,
            y,
            maxRadius
          );


        glow.addColorStop(
          0,
          "rgba(42, 152, 195, 0.07)"
        );


        glow.addColorStop(
          0.45,
          "rgba(28, 108, 145, 0.025)"
        );


        glow.addColorStop(
          1,
          "rgba(0, 0, 0, 0)"
        );


        ctx.fillStyle =
          glow;


        ctx.beginPath();


        ctx.arc(
          x,
          y,
          maxRadius,
          0,
          Math.PI * 2
        );


        ctx.fill();


        for (
          let i = 1;
          i <= 5;
          i++
        ) {

          const radius =
            maxRadius *
            (
              i / 5
            );


          ctx.beginPath();


          ctx.arc(
            x,
            y,
            radius,
            0,
            Math.PI * 2
          );


          ctx.strokeStyle =
            `rgba(73, 166, 202, ${
              0.08 -
              i * 0.009
            })`;


          ctx.lineWidth =
            0.7;


          ctx.stroke();

        }


        ctx.beginPath();


        ctx.moveTo(
          x - maxRadius,
          y
        );


        ctx.lineTo(
          x + maxRadius,
          y
        );


        ctx.moveTo(
          x,
          y - maxRadius
        );


        ctx.lineTo(
          x,
          y + maxRadius
        );


        ctx.strokeStyle =
          "rgba(75, 169, 204, 0.055)";


        ctx.lineWidth =
          0.5;


        ctx.stroke();


        radarAngle +=
          0.007;


        const endX =
          x +
          Math.cos(
            radarAngle
          ) *
            maxRadius;


        const endY =
          y +
          Math.sin(
            radarAngle
          ) *
            maxRadius;


        ctx.beginPath();


        ctx.moveTo(
          x,
          y
        );


        ctx.lineTo(
          endX,
          endY
        );


        ctx.strokeStyle =
          "rgba(88, 194, 229, 0.25)";


        ctx.lineWidth =
          0.8;


        ctx.stroke();


        ctx.restore();
      };


    const drawNodes =
      (time) => {

        const {
          x: centerX,
          y: centerY,
        } =
          getRadarCenter();


        const maxRadius =
          getMaxRadius();


        for (
          const node of nodes
        ) {

          node.angle +=
            node.speed;


          const distance =
            Math.min(
              node.distance,
              maxRadius - 8
            );


          const x =
            centerX +
            Math.cos(
              node.angle
            ) *
              distance;


          const y =
            centerY +
            Math.sin(
              node.angle
            ) *
              distance;


          const pulse =
            0.65 +
            Math.sin(
              time *
                0.0015 +
              node.phase
            ) *
              0.35;


          ctx.beginPath();


          ctx.arc(
            x,
            y,
            node.size,
            0,
            Math.PI * 2
          );


          ctx.fillStyle =
            `rgba(91, 192, 226, ${
              node.opacity *
              pulse
            })`;


          ctx.fill();

        }
      };


    const drawPulses = () => {

      const {
        x: centerX,
        y: centerY,
      } =
        getRadarCenter();


      const maxRadius =
        getMaxRadius();


      for (
        const pulse of pulses
      ) {

        pulse.distance +=
          pulse.speed;


        if (
          pulse.distance >
          maxRadius
        ) {

          pulse.distance =
            0;

          pulse.angle =
            Math.random() *
            Math.PI *
            2;
        }


        const x =
          centerX +
          Math.cos(
            pulse.angle
          ) *
            pulse.distance;


        const y =
          centerY +
          Math.sin(
            pulse.angle
          ) *
            pulse.distance;


        ctx.beginPath();


        ctx.arc(
          x,
          y,
          pulse.size,
          0,
          Math.PI * 2
        );


        ctx.fillStyle =
          "rgba(147, 222, 247, 0.7)";


        ctx.shadowBlur =
          7;


        ctx.shadowColor =
          "rgba(61, 181, 224, 0.65)";


        ctx.fill();


        ctx.shadowBlur =
          0;
      }
    };


    const drawTelemetry =
      (time) => {

        const baseY =
          height * 0.84;


        const startX =
          width < 700
            ? 30
            : width * 0.46;


        const endX =
          width < 700
            ? width - 30
            : width - 55;


        const totalWidth =
          endX - startX;


        for (
          let i = 0;
          i < telemetry.length;
          i++
        ) {

          const item =
            telemetry[i];


          item.progress +=
            item.speed;


          if (
            item.progress > 1
          ) {
            item.progress = 0;
          }


          const y =
            baseY +
            i * 7;


          ctx.beginPath();


          for (
            let x = startX;
            x <= endX;
            x += 4
          ) {

            const progress =
              (
                x - startX
              ) /
              totalWidth;


            const wave =
              Math.sin(
                progress *
                  Math.PI *
                  8 +
                time *
                  0.0012 +
                item.phase
              ) *
              item.amplitude;


            const signal =
              progress >
                item.progress -
                  0.035 &&
              progress <
                item.progress +
                  0.035
                ? wave * 2.3
                : wave * 0.18;


            const py =
              y + signal;


            if (
              x === startX
            ) {

              ctx.moveTo(
                x,
                py
              );

            } else {

              ctx.lineTo(
                x,
                py
              );

            }
          }


          ctx.strokeStyle =
            `rgba(61, 145, 177, ${
              0.035 +
              i * 0.003
            })`;


          ctx.lineWidth =
            0.7;


          ctx.stroke();
        }
      };


    const drawMarkers =
      (time) => {

        const positions = [

          {
            x:
              width * 0.08,

            y:
              height * 0.28,
          },

          {
            x:
              width * 0.28,

            y:
              height * 0.73,
          },

          {
            x:
              width * 0.91,

            y:
              height * 0.25,
          },

          {
            x:
              width * 0.83,

            y:
              height * 0.78,
          },

        ];


        positions.forEach(
          (
            marker,
            index
          ) => {

            const pulse =
              0.5 +
              Math.sin(
                time *
                  0.0015 +
                index
              ) *
                0.5;


            ctx.beginPath();


            ctx.arc(
              marker.x,
              marker.y,
              2,
              0,
              Math.PI * 2
            );


            ctx.fillStyle =
              `rgba(79, 184, 219, ${
                0.15 *
                pulse
              })`;


            ctx.fill();


            ctx.beginPath();


            ctx.moveTo(
              marker.x - 12,
              marker.y
            );


            ctx.lineTo(
              marker.x + 12,
              marker.y
            );


            ctx.moveTo(
              marker.x,
              marker.y - 12
            );


            ctx.lineTo(
              marker.x,
              marker.y + 12
            );


            ctx.strokeStyle =
              `rgba(70, 160, 193, ${
                0.035 *
                pulse
              })`;


            ctx.lineWidth =
              0.5;


            ctx.stroke();

          }
        );
      };


    const animate =
      (time) => {

        ctx.clearRect(
          0,
          0,
          width,
          height
        );


        drawGrid();

        drawRadar(
          time
        );

        drawNodes(
          time
        );

        drawPulses();

        drawTelemetry(
          time
        );

        drawMarkers(
          time
        );


        animationFrame =
          requestAnimationFrame(
            animate
          );
      };


    resize();

    createNodes();

    createPulses();

    createTelemetry();


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
      className="admin-monitoring-background"
      aria-hidden="true"
    />
  );
}


function AdminLogin() {

  const navigate =
    useNavigate();


  const [
    adminId,
    setAdminId,
  ] = useState("");


  const [
    password,
    setPassword,
  ] = useState("");


  const [
    error,
    setError,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(false);


  useEffect(() => {

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
            "ADMIN"
          ) {

            navigate(
              "/admin/dashboard",
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


      const cleanId =
        adminId
          .trim()
          .toUpperCase();


      if (!cleanId) {

        setError(
          "Please enter the Admin ID."
        );

        return;
      }


      if (!password) {

        setError(
          "Please enter the password."
        );

        return;
      }


      setLoading(true);


      try {

        const response =
          await login(
            cleanId,
            password,
            "ADMIN"
          );


        if (
          response?.user?.role !==
          "ADMIN"
        ) {

          logout();

          throw new Error(
            "This account is not authorized for the Admin Portal."
          );
        }


        navigate(
          "/admin/dashboard",
          {
            replace:
              true,
          }
        );

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
    <div className="admin-login-page">

      <AdminMonitoringBackground />

      <div className="admin-login-vignette" />


      <header className="admin-login-header">

        <Link
          to="/"
          className="admin-login-brand"
        >

          <span className="admin-login-brand-icon">
            <MonitorCog size={19} />
          </span>

          <span>

            <strong>
              CAREKEY
            </strong>

            <small>
              ADMIN CONTROL
            </small>

          </span>

        </Link>


        <div className="admin-login-status">

          <span />

          ADMIN SYSTEM MONITORING

        </div>

      </header>


      <main className="admin-login-main">

        <section className="admin-login-shell">

          <div className="admin-login-information">

            <div className="admin-login-label">

              <Radio size={14} />

              ADMINISTRATIVE CONTROL SYSTEM

            </div>


            <h1>

              Monitor.

              <br />

              Manage.

              <br />

              <em>
                Protect CAREKEY.
              </em>

            </h1>


            <p>

              The CAREKEY administrative console
              provides authorized personnel with
              centralized access to patient records,
              biometric enrollment information and
              system activity.

            </p>


            <div className="admin-monitor-status">

              <div className="admin-monitor-icon">
                <MonitorCog size={18} />
              </div>

              <div>

                <strong>
                  SYSTEM MONITOR
                </strong>

                <span>
                  Administrative services operational
                </span>

              </div>

              <div className="admin-monitor-bars">

                <span />
                <span />
                <span />
                <span />

              </div>

            </div>


            <div className="admin-feature-list">

              <div>

                <Database size={16} />

                <span>
                  Patient record management
                </span>

              </div>


              <div>

                <Server size={16} />

                <span>
                  Administrative system monitoring
                </span>

              </div>


              <div>

                <Wifi size={16} />

                <span>
                  Biometric service connectivity
                </span>

              </div>

            </div>

          </div>


          <div className="admin-login-card">

            <div className="admin-login-card-top">

              <div className="admin-login-card-icon">
                <LockKeyhole size={22} />
              </div>

              <div>

                <span>
                  ADMINISTRATIVE ACCESS
                </span>

                <h2>
                  Admin Login
                </h2>

              </div>

            </div>


            <div className="admin-login-divider" />


            <form
              onSubmit={
                handleSubmit
              }
              className="admin-login-form"
            >

              <div className="admin-form-field">

                <label htmlFor="admin-id">
                  ADMIN ID
                </label>

                <div className="admin-input-wrapper">

                  <User size={17} />

                  <input
                    id="admin-id"
                    type="text"
                    value={adminId}
                    onChange={(event) =>
                      setAdminId(
                        event.target.value
                      )
                    }
                    placeholder="Enter Admin ID"
                    autoComplete="username"
                    disabled={loading}
                  />

                </div>

              </div>


              <div className="admin-form-field">

                <label htmlFor="admin-password">
                  PASSWORD
                </label>

                <div className="admin-input-wrapper">

                  <LockKeyhole size={17} />

                  <input
                    id="admin-password"
                    type="password"
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

                </div>

              </div>


              {error && (
                <div
                  className="admin-login-error"
                  role="alert"
                >

                  <Terminal size={15} />

                  <span>
                    {error}
                  </span>

                </div>
              )}


              <button
                type="submit"
                className="admin-login-submit"
                disabled={loading}
              >

                {loading ? (
                  <>

                    <span className="admin-button-spinner" />

                    Authenticating...

                  </>
                ) : (
                  <>

                    <ShieldCheck size={17} />

                    Access Admin Console

                  </>
                )}

              </button>


              <div className="admin-demo-note">

                <span>
                  Prototype credentials
                </span>

                <code>
                  ADMIN001 / admin123
                </code>

              </div>

            </form>


            <div className="admin-login-card-footer">

              <span className="admin-footer-dot" />

              Administrative access only

            </div>

          </div>

        </section>


        <Link
          to="/"
          className="admin-back-home"
        >

          <ArrowLeft size={15} />

          Back to Home

        </Link>

      </main>


      <footer className="admin-login-footer">

        <span>
          CAREKEY ADMINISTRATIVE CONTROL
        </span>

        <span>

          <Activity size={12} />

          MONITORING ACTIVE

        </span>

      </footer>

    </div>
  );
}


export default AdminLogin;