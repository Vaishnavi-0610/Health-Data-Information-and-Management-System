const express = require("express");

const db = require("../db");

const {
  authenticateToken,
  requireRole,
} = require("../middleware/auth");

const router = express.Router();

const FACE_SERVICE_URL =
  process.env.FACE_SERVICE_URL ||
  "http://127.0.0.1:5001";

const FACE_MATCH_THRESHOLD =
  Number(
    process.env.FACE_MATCH_THRESHOLD || 0.6
  );

function parseEmbedding(value) {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const embedding = JSON.parse(value);

    if (
      !Array.isArray(embedding) ||
      embedding.length !== 128
    ) {
      return null;
    }

    const numbers = embedding.map(Number);

    if (
      numbers.some(
        (number) => !Number.isFinite(number)
      )
    ) {
      return null;
    }

    return numbers;
  } catch {
    return null;
  }
}

function publicPatient(patient) {
  return {
    id: patient.patientId,
    databaseId: patient.id,
    fullName: patient.fullName,
    dob: patient.dob,
    gender: patient.gender,
    bloodGroup: patient.bloodGroup,
    phone: patient.phone,
    email: patient.email,
    allergies: patient.allergies,
    medicalHistory: patient.medicalHistory,
    medications: patient.medications,
    createdAt: patient.createdAt,
  };
}

async function requestFaceMatch(
  image,
  candidates
) {
  const response = await fetch(
    `${FACE_SERVICE_URL}/match`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image,
        candidates,
      }),
    }
  );

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
        data?.message ||
        `Face service returned status ${response.status}`
    );
  }

  return data;
}

function createAuditId() {
  const timestamp = Date.now();

  const randomPart = Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase();

  return `AUD-${timestamp}-${randomPart}`;
}

function insertAuditLog({
  patientId,
  doctorId,
  similarity,
}) {
  const auditId = createAuditId();

  const timestamp =
    new Date().toISOString();

  db.prepare(
    `
      INSERT INTO audit_logs (
        audit_id,
        doctor_id,
        patient_id,
        similarity,
        access_type,
        access_status,
        read_only,
        timestamp
      )
      VALUES (
        @auditId,
        @doctorId,
        @patientId,
        @similarity,
        @accessType,
        @accessStatus,
        @readOnly,
        @timestamp
      )
    `
  ).run({
    auditId,
    doctorId,
    patientId,
    similarity,
    accessType:
      "EMERGENCY_BIOMETRIC_ACCESS",
    accessStatus:
      "AUTHORIZED",
    readOnly: 1,
    timestamp,
  });

  return auditId;
}

router.post(
  "/match",
  authenticateToken,
  requireRole("DOCTOR"),
  async (req, res) => {
    try {
      const { image } = req.body;

      if (
        typeof image !== "string" ||
        !image.trim()
      ) {
        return res.status(400).json({
          message:
            "A camera image is required.",
        });
      }

      const rows = db
        .prepare(
          `
            SELECT
              id,
              patient_id AS patientId,
              full_name AS fullName,
              dob,
              gender,
              blood_group AS bloodGroup,
              phone,
              email,
              allergies,
              medical_history AS medicalHistory,
              medications,
              created_at AS createdAt,
              embedding
            FROM patients
            WHERE embedding IS NOT NULL
              AND length(embedding) > 0
            ORDER BY created_at DESC
          `
        )
        .all();

      if (rows.length === 0) {
        return res.status(404).json({
          message:
            "No biometric patient records are available.",
        });
      }

      const candidates = rows
        .map((patient) => {
          const embedding =
            parseEmbedding(
              patient.embedding
            );

          if (!embedding) {
            return null;
          }

          return {
            id: patient.patientId,
            embedding,
          };
        })
        .filter(Boolean);

      if (candidates.length === 0) {
        return res.status(404).json({
          message:
            "No valid biometric records are available.",
        });
      }

      const matchResult =
        await requestFaceMatch(
          image,
          candidates
        );

      const matchId =
        matchResult.match_id ||
        matchResult.match?.id ||
        null;

      const similarity =
        typeof matchResult.similarity ===
        "number"
          ? matchResult.similarity
          : typeof matchResult.match?.similarity ===
            "number"
          ? matchResult.match.similarity
          : null;

      if (
        !matchId ||
        similarity === null
      ) {
        return res.status(404).json({
          message:
            "No matching patient was found.",
        });
      }

      if (
        similarity <
        FACE_MATCH_THRESHOLD
      ) {
        return res.status(404).json({
          message:
            "No sufficiently confident biometric match was found.",
          similarity,
        });
      }

      const patient = rows.find(
        (item) =>
          String(item.patientId)
            .toUpperCase() ===
          String(matchId).toUpperCase()
      );

      if (!patient) {
        return res.status(404).json({
          message:
            "The matched patient record could not be found.",
        });
      }

      const doctorId =
        req.user?.userId ||
        req.user?.id ||
        "UNKNOWN_DOCTOR";

      const auditId =
        insertAuditLog({
          patientId:
            patient.patientId,
          doctorId,
          similarity,
        });

      return res.json({
        success: true,

        match: {
          id: patient.patientId,
          similarity,
        },

        patient:
          publicPatient(patient),

        audit: {
          auditId,
          accessType:
            "EMERGENCY_BIOMETRIC_ACCESS",
          accessStatus:
            "AUTHORIZED",
          readOnly: true,
        },
      });
    } catch (error) {
      console.error(
        "Emergency match error:",
        error
      );

      return res.status(500).json({
        message:
          error.message ||
          "Emergency biometric matching failed.",
      });
    }
  }
);

module.exports = router;