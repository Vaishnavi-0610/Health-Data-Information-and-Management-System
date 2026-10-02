const express = require("express");

const db = require("../db");

const {
  authenticateToken,
  requireRole,
} = require("../middleware/auth");

const router = express.Router();

function cleanString(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
}

function parseEmbedding(value) {
  if (!Array.isArray(value)) {
    return null;
  }

  if (value.length !== 128) {
    return null;
  }

  const embedding = value.map(Number);

  if (
    embedding.some(
      (number) => !Number.isFinite(number)
    )
  ) {
    return null;
  }

  return embedding;
}

function serializeEmbedding(embedding) {
  return JSON.stringify(embedding);
}

function createCarekeyId(databaseId) {
  return `CK${String(databaseId).padStart(4, "0")}`;
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
    hasBiometric: Boolean(patient.hasBiometric),
  };
}

router.get(
  "/",
  authenticateToken,
  requireRole("ADMIN", "DOCTOR"),
  (req, res) => {
    try {
      const patients = db
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
              CASE
                WHEN embedding IS NOT NULL
                  AND length(embedding) > 0
                THEN 1
                ELSE 0
              END AS hasBiometric
            FROM patients
            ORDER BY created_at DESC
          `
        )
        .all();

      res.json({
        patients: patients.map(publicPatient),
      });
    } catch (error) {
      console.error("Get patients error:", error);

      res.status(500).json({
        message: "Unable to load patient records.",
      });
    }
  }
);

router.post("/", (req, res) => {
  try {
    const {
      fullName,
      dob,
      gender,
      bloodGroup,
      phone,
      email,
      allergies,
      medicalHistory,
      medications,
      embedding,
    } = req.body;

    const cleanedName = cleanString(fullName);
    const cleanedDob = cleanString(dob);
    const cleanedGender = cleanString(gender);
    const cleanedBloodGroup = cleanString(bloodGroup);
    const cleanedPhone = cleanString(phone);
    const cleanedEmail = cleanString(email);
    const cleanedAllergies = cleanString(allergies);
    const cleanedMedicalHistory =
      cleanString(medicalHistory);
    const cleanedMedications =
      cleanString(medications);

    if (
      !cleanedName ||
      !cleanedDob ||
      !cleanedGender ||
      !cleanedBloodGroup ||
      !cleanedPhone
    ) {
      return res.status(400).json({
        message:
          "Full name, date of birth, gender, blood group and phone are required.",
      });
    }

    if (!/^\d{10}$/.test(cleanedPhone)) {
      return res.status(400).json({
        message:
          "Phone number must contain exactly 10 digits.",
      });
    }

    if (
      cleanedEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        cleanedEmail
      )
    ) {
      return res.status(400).json({
        message: "Please provide a valid email address.",
      });
    }

    const parsedEmbedding = parseEmbedding(embedding);

    if (!parsedEmbedding) {
      return res.status(400).json({
        message:
          "A valid 128-dimensional biometric embedding is required.",
      });
    }

    const nextPatient = db
      .prepare(
        `
          SELECT
            id
          FROM patients
          ORDER BY id DESC
          LIMIT 1
        `
      )
      .get();

    const nextDatabaseId = nextPatient
      ? Number(nextPatient.id) + 1
      : 1;

    const patientId = createCarekeyId(nextDatabaseId);

    const existingPatient = db
      .prepare(
        `
          SELECT id
          FROM patients
          WHERE patient_id = ?
        `
      )
      .get(patientId);

    if (existingPatient) {
      return res.status(409).json({
        message:
          "Unable to generate a unique patient ID. Please try again.",
      });
    }

    const createdAt = new Date().toISOString();

    const insertPatient = db.prepare(
      `
        INSERT INTO patients (
          patient_id,
          full_name,
          dob,
          gender,
          blood_group,
          phone,
          email,
          allergies,
          medical_history,
          medications,
          embedding,
          created_at
        )
        VALUES (
          @patientId,
          @fullName,
          @dob,
          @gender,
          @bloodGroup,
          @phone,
          @email,
          @allergies,
          @medicalHistory,
          @medications,
          @embedding,
          @createdAt
        )
      `
    );

    const result = insertPatient.run({
      patientId,
      fullName: cleanedName,
      dob: cleanedDob,
      gender: cleanedGender,
      bloodGroup: cleanedBloodGroup,
      phone: cleanedPhone,
      email: cleanedEmail,
      allergies: cleanedAllergies,
      medicalHistory: cleanedMedicalHistory,
      medications: cleanedMedications,
      embedding: serializeEmbedding(
        parsedEmbedding
      ),
      createdAt,
    });

    const databaseId = Number(result.lastInsertRowid);

    const patient = db
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
            CASE
              WHEN embedding IS NOT NULL
                AND length(embedding) > 0
              THEN 1
              ELSE 0
            END AS hasBiometric
          FROM patients
          WHERE id = ?
        `
      )
      .get(databaseId);

    if (!patient) {
      return res.status(500).json({
        message:
          "Patient was inserted but could not be retrieved.",
      });
    }

    return res.status(201).json({
      message: "Patient registered successfully.",
      patientId: patient.patientId,
      patient: publicPatient(patient),
    });
  } catch (error) {
    console.error("Register patient error:", error);

    return res.status(500).json({
      message: "Unable to register the patient.",
    });
  }
});

router.get(
  "/:patientId",
  authenticateToken,
  requireRole("ADMIN", "DOCTOR"),
  (req, res) => {
    try {
      const requestedId = cleanString(
        req.params.patientId
      );

      const patient = db
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
              CASE
                WHEN embedding IS NOT NULL
                  AND length(embedding) > 0
                THEN 1
                ELSE 0
              END AS hasBiometric
            FROM patients
            WHERE patient_id = ?
          `
        )
        .get(requestedId);

      if (!patient) {
        return res.status(404).json({
          message: "Patient not found.",
        });
      }

      return res.json({
        patient: publicPatient(patient),
      });
    } catch (error) {
      console.error("Get patient error:", error);

      return res.status(500).json({
        message:
          "Unable to load the patient record.",
      });
    }
  }
);

module.exports = router;