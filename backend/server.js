import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import db from "./db.js";

import authRoutes from "./routes/auth.js";
import patientRoutes from "./routes/patients.js";
import emergencyRoutes from "./routes/emergency.js";
import auditRoutes from "./routes/audit.js";


const app =
  express();


const PORT =
  Number(
    process.env.PORT || 5000
  );


const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  "http://localhost:5173";


app.use(
  helmet()
);


app.use(
  cors({
    origin:
      FRONTEND_URL,

    credentials:
      true,
  })
);


app.use(
  express.json({
    limit:
      "10mb",
  })
);


const authLimiter =
  rateLimit({

    windowMs:
      15 * 60 * 1000,

    limit:
      process.env.NODE_ENV ===
      "production"
        ? 15
        : 100,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    skipSuccessfulRequests:
      true,

    message: {
      success:
        false,

      message:
        "Too many unsuccessful login attempts. Please wait a moment and try again.",
    },

  });


app.get(
  "/api/health",
  (req, res) => {

    try {

      db.prepare(
        "SELECT 1"
      ).get();


      res.json({

        status:
          "online",

        service:
          "CAREKEY Backend",

        database:
          "connected",

        timestamp:
          new Date().toISOString(),

      });

    } catch (
      error
    ) {

      res.status(500).json({

        status:
          "offline",

        service:
          "CAREKEY Backend",

        database:
          "disconnected",

        error:
          error.message,

      });

    }
  }
);


app.use(
  "/api/auth",
  authLimiter,
  authRoutes
);


app.use(
  "/api/patients",
  patientRoutes
);


app.use(
  "/api/emergency",
  emergencyRoutes
);


app.use(
  "/api/audit",
  auditRoutes
);


app.use(
  (req, res) => {

    res.status(404).json({

      success:
        false,

      message:
        "API route not found.",

    });

  }
);


app.use(
  (
    error,
    req,
    res,
    next
  ) => {

    console.error(
      "CAREKEY backend error:",
      error
    );


    if (
      res.headersSent
    ) {

      return next(
        error
      );

    }


    res.status(500).json({

      success:
        false,

      message:
        "Internal server error.",

    });

  }
);


app.listen(
  PORT,
  () => {

    console.log(
      `CAREKEY backend running on http://localhost:${PORT}`
    );

    console.log(
      `Frontend allowed: ${FRONTEND_URL}`
    );

  }
);