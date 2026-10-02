const express = require("express");

const db = require("../db");
const {
  authenticateToken,
  requireRole
} = require("../middleware/auth");

const router = express.Router();

router.get(
  "/",
  authenticateToken,
  requireRole("ADMIN"),
  (req, res) => {
    try {
      const logs = db
        .prepare(`
          SELECT
            id,
            audit_id AS auditId,
            doctor_id AS doctorId,
            patient_id AS patientId,
            similarity,
            access_type AS accessType,
            access_status AS accessStatus,
            read_only AS readOnly,
            timestamp
          FROM audit_logs
          ORDER BY datetime(timestamp) DESC
          LIMIT 100
        `)
        .all();

      return res.json({
        logs
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Unable to load audit logs"
      });
    }
  }
);

router.get(
  "/doctor",
  authenticateToken,
  requireRole("DOCTOR"),
  (req, res) => {
    try {
      const logs = db
        .prepare(`
          SELECT
            id,
            audit_id AS auditId,
            doctor_id AS doctorId,
            patient_id AS patientId,
            similarity,
            access_type AS accessType,
            access_status AS accessStatus,
            read_only AS readOnly,
            timestamp
          FROM audit_logs
          WHERE doctor_id = ?
          ORDER BY datetime(timestamp) DESC
          LIMIT 100
        `)
        .all(req.user.userId);

      return res.json({
        logs
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Unable to load audit history"
      });
    }
  }
);

module.exports = router;