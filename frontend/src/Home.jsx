import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import {
  ArrowRight,
  ShieldCheck,
  ScanFace,
  Siren,
  Menu,
  X,
  LockKeyhole,
  HeartPulse,
} from "lucide-react";

import "./Home.css";


/* =========================================================
   PARTICLE DNA BACKGROUND
========================================================= */

function MedicalBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    let width = 0;
    let height = 0;
    let animationFrame;

    const dust = [];
    const dnaParticles = [];
    const dnaRungs = [];


    const isMobile = () => {
      return window.innerWidth < 700;
    };


    const random = (min, max) => {
      return Math.random() * (max - min) + min;
    };


    /* =====================================================
       RESIZE
    ===================================================== */

    const resize = () => {
      const ratio = Math.min(
        window.devicePixelRatio || 1,
        2
      );

      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = width * ratio;
      canvas.height = height * ratio;

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(
        ratio,
        0,
        0,
        ratio,
        0,
        0
      );

      createDust();
      createDNA();
    };


    /* =====================================================
       BACKGROUND PARTICLES
    ===================================================== */

    const createDust = () => {
      dust.length = 0;

      const amount = isMobile()
        ? 180
        : 450;

      for (let i = 0; i < amount; i++) {
        dust.push({
          x: Math.random() * width,

          y: Math.random() * height,

          radius:
            Math.random() * 1.05 + 0.15,

          alpha:
            Math.random() * 0.35 + 0.03,

          speed:
            Math.random() * 0.15 + 0.02,

          drift:
            Math.random() * 0.12 - 0.06,

          phase:
            Math.random() *
            Math.PI *
            2,
        });
      }
    };


    /* =====================================================
       CREATE DNA PARTICLES
    ===================================================== */

    const createDNA = () => {
      dnaParticles.length = 0;
      dnaRungs.length = 0;

      const mobile = isMobile();

      const centerX =
        width *
        (mobile ? 0.76 : 0.73);

      const centerY =
        height * 0.52;

      const dnaHeight =
        mobile
          ? height * 0.78
          : height * 1.04;

      const amplitude =
        mobile ? 58 : 108;

      const particleCount =
        mobile
          ? 850
          : 2600;


      /* -----------------------------------------------
         DNA particle cloud
      ----------------------------------------------- */

      for (
        let i = 0;
        i < particleCount;
        i++
      ) {
        const progress =
          Math.random();

        const angle =
          progress *
          Math.PI *
          6.4;

        const baseY =
          centerY -
          dnaHeight / 2 +
          progress *
          dnaHeight;

        const wave =
          Math.sin(angle) *
          amplitude;

        const side =
          Math.random() > 0.5
            ? 1
            : -1;

        const strandX =
          centerX +
          wave * side;

        const cloud =
          Math.random();

        let spread;

        if (cloud < 0.72) {
          spread = random(-9, 9);
        } else if (cloud < 0.94) {
          spread = random(-22, 22);
        } else {
          spread = random(-48, 48);
        }

        const x =
          strandX + spread;

        const y =
          baseY +
          random(-3, 3);

        dnaParticles.push({
          x,
          y,

          baseX: x,
          baseY: y,

          progress,

          side,

          radius:
            Math.random() < 0.9
              ? random(0.4, 1.25)
              : random(1.3, 2.5),

          alpha:
            random(0.12, 0.62),

          speed:
            random(
              0.000025,
              0.000075
            ),

          phase:
            Math.random() *
            Math.PI *
            2,

          drift:
            random(0.1, 0.7),

          bright:
            Math.random() < 0.055,
        });
      }


      /* -----------------------------------------------
         DNA particle connections
      ----------------------------------------------- */

      const rungCount =
        mobile ? 35 : 62;

      for (
        let i = 0;
        i < rungCount;
        i++
      ) {
        dnaRungs.push({
          progress:
            i / rungCount,

          phase:
            Math.random() *
            Math.PI *
            2,

          alpha:
            random(0.12, 0.32),
        });
      }
    };


    /* =====================================================
       DRAW BACKGROUND DUST
    ===================================================== */

    const drawDust = (time) => {
      for (const particle of dust) {
        particle.y -=
          particle.speed;

        particle.x +=
          Math.sin(
            time * 0.0003 +
            particle.phase
          ) *
          particle.drift;

        if (particle.y < -5) {
          particle.y =
            height + 5;

          particle.x =
            Math.random() * width;
        }

        const twinkle =
          0.55 +
          Math.sin(
            time * 0.0015 +
            particle.phase
          ) *
          0.45;

        ctx.beginPath();

        ctx.arc(
          particle.x,
          particle.y,
          particle.radius,
          0,
          Math.PI * 2
        );

        ctx.fillStyle =
          `rgba(110, 184, 221, ${
            particle.alpha *
            twinkle *
            0.5
          })`;

        ctx.fill();
      }
    };


    /* =====================================================
       DRAW DNA
    ===================================================== */

    const drawDNA = (time) => {
      const mobile = isMobile();

      const centerX =
        width *
        (mobile ? 0.76 : 0.73);

      const centerY =
        height * 0.52;

      const dnaHeight =
        mobile
          ? height * 0.78
          : height * 1.04;

      const amplitude =
        mobile ? 58 : 108;


      /* -----------------------------------------------
         SOFT DNA GLOW
      ----------------------------------------------- */

      const glow =
        ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          dnaHeight * 0.62
        );

      glow.addColorStop(
        0,
        "rgba(34, 132, 183, 0.055)"
      );

      glow.addColorStop(
        0.45,
        "rgba(24, 92, 133, 0.025)"
      );

      glow.addColorStop(
        1,
        "rgba(0, 0, 0, 0)"
      );

      ctx.fillStyle = glow;

      ctx.beginPath();

      ctx.arc(
        centerX,
        centerY,
        dnaHeight * 0.62,
        0,
        Math.PI * 2
      );

      ctx.fill();


      /* -----------------------------------------------
         DNA PARTICLES
      ----------------------------------------------- */

      for (
        const particle of dnaParticles
      ) {
        particle.progress +=
          particle.speed;

        if (
          particle.progress > 1
        ) {
          particle.progress = 0;
        }

        const angle =
          particle.progress *
            Math.PI *
            6.4 +
          time * 0.00016;

        const baseY =
          centerY -
          dnaHeight / 2 +
          particle.progress *
            dnaHeight;

        const wave =
          Math.sin(angle) *
          amplitude;

        const targetX =
          centerX +
          wave *
            particle.side;

        const movement =
          Math.sin(
            time *
              particle.drift *
              0.001 +
            particle.phase
          ) *
          2.5;

        const originalWave =
          Math.sin(
            particle.progress *
            Math.PI *
            6.4
          ) *
          amplitude;

        const x =
          targetX +
          (
            particle.baseX -
            centerX -
            originalWave *
              particle.side
          ) *
            0.72 +
          movement;

        const y =
          baseY +
          Math.cos(
            time * 0.001 +
            particle.phase
          ) *
          2.4;


        /* ---------------------------------------------
           MOVING ENERGY
        --------------------------------------------- */

        const energy =
          Math.sin(
            particle.progress *
              Math.PI *
              2 -
            time * 0.0011
          );

        const energyBrightness =
          Math.max(
            0,
            energy
          );


        const twinkle =
          0.55 +
          Math.sin(
            time * 0.002 +
            particle.phase
          ) *
          0.35;


        let alpha =
          particle.alpha *
          twinkle *
          0.48;

        alpha +=
          energyBrightness *
          0.23;

        alpha *= 0.7;


        const radius =
          particle.radius *
          (
            1 +
            energyBrightness *
              0.7
          );


        ctx.beginPath();

        ctx.arc(
          x,
          y,
          radius,
          0,
          Math.PI * 2
        );


        if (
          particle.bright &&
          energyBrightness > 0.45
        ) {
          ctx.fillStyle =
            `rgba(178, 232, 255, ${
              Math.min(
                0.8,
                alpha + 0.18
              )
            })`;

          ctx.shadowBlur = 8;

          ctx.shadowColor =
            "rgba(75, 185, 239, 0.65)";
        } else {
          ctx.fillStyle =
            `rgba(83, 174, 224, ${alpha})`;

          ctx.shadowBlur = 0;
        }

        ctx.fill();

        ctx.shadowBlur = 0;
      }


      /* -----------------------------------------------
         PARTICLE RINGS
      ----------------------------------------------- */

      for (
        const rung of dnaRungs
      ) {
        const angle =
          rung.progress *
          Math.PI *
          6.4;

        const y =
          centerY -
          dnaHeight / 2 +
          rung.progress *
            dnaHeight;

        const wave =
          Math.sin(angle) *
          amplitude;

        const leftX =
          centerX + wave;

        const rightX =
          centerX - wave;

        const particleCount =
          mobile ? 6 : 11;

        for (
          let j = 0;
          j < particleCount;
          j++
        ) {
          const t =
            j /
            (particleCount - 1);

          const x =
            leftX +
            (rightX - leftX) *
            t;

          const pulse =
            0.55 +
            Math.sin(
              time * 0.0017 +
              rung.phase +
              j
            ) *
            0.35;

          ctx.beginPath();

          ctx.arc(
            x,
            y +
              Math.cos(
                time * 0.001 +
                j
              ),
            0.6,
            0,
            Math.PI * 2
          );

          ctx.fillStyle =
            `rgba(88, 184, 230, ${
              rung.alpha *
              pulse *
              0.5
            })`;

          ctx.fill();
        }
      }


      /* -----------------------------------------------
         MOVING ENERGY CLUSTER
      ----------------------------------------------- */

      const energyProgress =
        (time * 0.000055) %
        1;

      const energyAngle =
        energyProgress *
        Math.PI *
        6.4;

      const energyY =
        centerY -
        dnaHeight / 2 +
        energyProgress *
          dnaHeight;

      const energyWave =
        Math.sin(
          energyAngle
        ) *
        amplitude;

      const energyX =
        centerX +
        energyWave;


      const energyGlow =
        ctx.createRadialGradient(
          energyX,
          energyY,
          0,
          energyX,
          energyY,
          58
        );

      energyGlow.addColorStop(
        0,
        "rgba(142, 220, 255, 0.13)"
      );

      energyGlow.addColorStop(
        0.3,
        "rgba(64, 175, 230, 0.065)"
      );

      energyGlow.addColorStop(
        1,
        "rgba(0, 120, 190, 0)"
      );

      ctx.fillStyle =
        energyGlow;

      ctx.beginPath();

      ctx.arc(
        energyX,
        energyY,
        58,
        0,
        Math.PI * 2
      );

      ctx.fill();


      /* -----------------------------------------------
         ENERGY PARTICLES
      ----------------------------------------------- */

      const burstCount =
        mobile ? 18 : 38;

      for (
        let i = 0;
        i < burstCount;
        i++
      ) {
        const angle =
          Math.random() *
          Math.PI *
          2;

        const distance =
          Math.random() *
          35;

        const px =
          energyX +
          Math.cos(angle) *
          distance;

        const py =
          energyY +
          Math.sin(angle) *
          distance;

        ctx.beginPath();

        ctx.arc(
          px,
          py,
          Math.random() *
            1.4 +
            0.4,
          0,
          Math.PI * 2
        );

        ctx.fillStyle =
          `rgba(157, 226, 255, ${
            Math.random() *
              0.3 +
            0.08
          })`;

        ctx.fill();
      }
    };


    /* =====================================================
       ECG LINE
    ===================================================== */

    const drawECG = (time) => {
      const y =
        height * 0.79;

      ctx.save();

      ctx.globalAlpha =
        isMobile()
          ? 0.018
          : 0.035;

      ctx.beginPath();

      const cycle =
        isMobile()
          ? 230
          : 330;

      for (
        let x = -cycle;
        x < width + cycle;
        x += 3
      ) {
        const moving =
          (x +
            time * 0.07) %
          cycle;

        let offset = 0;

        if (
          moving >
          cycle * 0.67
        ) {
          const local =
            moving -
            cycle * 0.67;

          if (local < 15) {
            offset =
              -local * 1.5;
          } else if (
            local < 28
          ) {
            offset =
              -22 +
              (local - 15) *
              3.4;
          } else if (
            local < 42
          ) {
            offset =
              22 -
              (local - 28) *
              1.55;
          }
        }

        if (x === -cycle) {
          ctx.moveTo(
            x,
            y + offset
          );
        } else {
          ctx.lineTo(
            x,
            y + offset
          );
        }
      }

      ctx.strokeStyle =
        "rgba(77, 173, 220, 0.5)";

      ctx.lineWidth = 0.7;

      ctx.stroke();

      ctx.restore();
    };


    /* =====================================================
       ANIMATION LOOP
    ===================================================== */

    const animate = (time) => {
      ctx.clearRect(
        0,
        0,
        width,
        height
      );

      drawDust(time);
      drawDNA(time);
      drawECG(time);

      animationFrame =
        requestAnimationFrame(
          animate
        );
    };


    resize();

    window.addEventListener(
      "resize",
      resize
    );

    animationFrame =
      requestAnimationFrame(
        animate
      );


    return () => {
      cancelAnimationFrame(
        animationFrame
      );

      window.removeEventListener(
        "resize",
        resize
      );
    };
  }, []);


  return (
    <canvas
      ref={canvasRef}
      className="medical-background"
      aria-hidden="true"
    />
  );
}


/* =========================================================
   HOME PAGE
========================================================= */

function Home() {
  const [menuOpen, setMenuOpen] =
    useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };


  return (
    <div className="carekey-app">

      <MedicalBackground />

      <div className="page-vignette" />


      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="header">

        <a
          href="#home"
          className="logo"
          onClick={closeMenu}
          aria-label="CAREKEY Home"
        >
          <span className="logo-shield">
            <ShieldCheck size={20} />
          </span>

          <span className="logo-name">
            CARE<span>KEY</span>
          </span>
        </a>


        <nav className="desktop-navigation">

          <a href="#how-it-works">
            How It Works
          </a>

          <a href="#security">
            Security
          </a>

          <a href="#about">
            About
          </a>

        </nav>


        <div className="header-right">

          {/* ADMIN LOGIN */}

          <Link
            to="/admin/login"
            className="admin-button"
            onClick={closeMenu}
          >
            Admin Login
          </Link>


          {/* DOCTOR LOGIN */}

          <Link
            to="/doctor/login"
            className="doctor-button"
            onClick={closeMenu}
          >
            Doctor Login
          </Link>


          <button
            className="mobile-menu-button"
            onClick={() =>
              setMenuOpen(
                !menuOpen
              )
            }
            aria-label="Open navigation"
          >
            {menuOpen ? (
              <X size={21} />
            ) : (
              <Menu size={21} />
            )}
          </button>

        </div>

      </header>


      {/* ===================================================
          MOBILE MENU
      =================================================== */}

      <div
        className={
          menuOpen
            ? "mobile-navigation open"
            : "mobile-navigation"
        }
      >

        <a
          href="#home"
          onClick={closeMenu}
        >
          Home
        </a>

        <a
          href="#how-it-works"
          onClick={closeMenu}
        >
          How It Works
        </a>

        <a
          href="#security"
          onClick={closeMenu}
        >
          Security
        </a>

        <a
          href="#about"
          onClick={closeMenu}
        >
          About
        </a>


        {/* MOBILE ADMIN LOGIN */}

        <Link
          to="/admin/login"
          className="mobile-admin"
          onClick={closeMenu}
        >
          Admin Login
        </Link>


        {/* MOBILE DOCTOR LOGIN */}

        <Link
          to="/doctor/login"
          className="mobile-doctor"
          onClick={closeMenu}
        >
          Doctor Login
        </Link>

      </div>


      {/* ===================================================
          HERO
      =================================================== */}

      <main id="home">

        <section className="hero">

          <div className="hero-content">

            <div className="hero-badge">

              <span />

              Emergency Medical Intelligence

            </div>


            <h1>
              Your medical
              <br />

              identity,
              <br />

              <em>
                ready when it matters.
              </em>
            </h1>


            <p className="hero-text">
              CAREKEY securely connects patients
              and authorized healthcare professionals
              through biometric identification,
              making critical medical information
              accessible when every second counts.
            </p>


            <div className="hero-buttons">

              <Link
                to="/patient/register"
                className="register-button"
              >
                Register Patient

                <ArrowRight size={17} />
              </Link>


              <Link
                to="/emergency"
                className="emergency-button"
              >
                <Siren size={17} />

                Emergency Access
              </Link>

            </div>


            <div className="trust">

              <ShieldCheck size={14} />

              <span>
                Secure
              </span>

              <b />

              <span>
                Authorized
              </span>

              <b />

              <span>
                Emergency-ready
              </span>

            </div>

          </div>


          {/* =================================================
              STATUS CARDS
          ================================================= */}

          <div className="hero-status">

            <div className="status-card top-card">

              <div className="status-icon blue">
                <ScanFace size={16} />
              </div>

              <div>
                <small>
                  BIOMETRIC ID
                </small>

                <strong>
                  VERIFIED
                </strong>
              </div>

              <span className="status-light" />

            </div>


            <div className="status-card middle-card">

              <div className="status-icon red">
                <HeartPulse size={16} />
              </div>

              <div>
                <small>
                  EMERGENCY MODE
                </small>

                <strong>
                  READY
                </strong>
              </div>

            </div>


            <div className="status-card bottom-card">

              <div className="status-icon green">
                <LockKeyhole size={16} />
              </div>

              <div>
                <small>
                  RECORD SECURITY
                </small>

                <strong>
                  PROTECTED
                </strong>
              </div>

            </div>

          </div>

        </section>


        {/* ===================================================
            FEATURES
        =================================================== */}

        <section className="feature-bar">

          <div className="feature-item">

            <div className="feature-symbol">
              <ScanFace size={18} />
            </div>

            <div>
              <strong>
                Biometric Access
              </strong>

              <span>
                Fast patient identification
              </span>
            </div>

          </div>


          <div className="feature-item">

            <div className="feature-symbol">
              <ShieldCheck size={18} />
            </div>

            <div>
              <strong>
                Protected Records
              </strong>

              <span>
                Authorized medical access
              </span>
            </div>

          </div>


          <div className="feature-item">

            <div className="feature-symbol red">
              <Siren size={18} />
            </div>

            <div>
              <strong>
                Emergency Ready
              </strong>

              <span>
                Critical information instantly
              </span>
            </div>

          </div>

        </section>


        {/* ===================================================
            HOW IT WORKS
        =================================================== */}

        <section
          id="how-it-works"
          className="simple-section"
        >

          <span className="section-label">
            HOW IT WORKS
          </span>

          <h2>
            Identify. Access. Care.
          </h2>

          <p>
            CAREKEY helps authorized healthcare
            professionals identify patients and
            securely access essential emergency
            information when time matters.
          </p>

        </section>


        {/* ===================================================
            SECURITY
        =================================================== */}

        <section
          id="security"
          className="simple-section"
        >

          <span className="section-label">
            SECURITY
          </span>

          <h2>
            Critical information,
            securely protected.
          </h2>

          <p>
            Patient information is accessed through
            controlled authentication and authorized
            medical workflows.
          </p>

        </section>


        {/* ===================================================
            ABOUT
        =================================================== */}

        <section
          id="about"
          className="simple-section"
        >

          <span className="section-label">
            ABOUT CAREKEY
          </span>

          <h2>
            Built for moments
            that cannot wait.
          </h2>

          <p>
            CAREKEY is an emergency medical record
            platform designed to help medical teams
            reach critical patient information faster.
          </p>

        </section>

      </main>


      {/* ===================================================
          FOOTER
      =================================================== */}

      <footer className="footer">

        <div className="footer-brand">

          <a
            href="#home"
            className="footer-logo"
          >
            <span className="logo-shield small">
              <ShieldCheck size={15} />
            </span>

            CAREKEY
          </a>

          <p>
            Emergency medical information,
            when it matters.
          </p>

        </div>


        <div className="footer-links">

          <a href="#how-it-works">
            How It Works
          </a>

          <a href="#security">
            Security
          </a>

          <a href="#about">
            About
          </a>

          <a href="mailto:support@carekey.in">
            support@carekey.in
          </a>

        </div>


        <div className="copyright">
          © {new Date().getFullYear()} CAREKEY.
          All rights reserved.
        </div>

      </footer>

    </div>
  );
}

export default Home;