const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");

const db = require("../db");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false
});

const doctorPasswordHash = bcrypt.hashSync("doctor123", 12);
const adminPasswordHash = bcrypt.hashSync("admin123", 12);

const doctorExists = db
  .prepare("SELECT id FROM users WHERE user_id = ?")
  .get("DOC001");

if (!doctorExists) {
  db.prepare(`
    INSERT INTO users (
      user_id,
      password_hash,
      role,
      name
    )
    VALUES (?, ?, ?, ?)
  `).run(
    "DOC001",
    doctorPasswordHash,
    "DOCTOR",
    "CAREKEY Doctor"
  );
}

const adminExists = db
  .prepare("SELECT id FROM users WHERE user_id = ?")
  .get("ADMIN001");

if (!adminExists) {
  db.prepare(`
    INSERT INTO users (
      user_id,
      password_hash,
      role,
      name
    )
    VALUES (?, ?, ?, ?)
  `).run(
    "ADMIN001",
    adminPasswordHash,
    "ADMIN",
    "CAREKEY Administrator"
  );
}

router.post("/login", loginLimiter, async (req, res) => {
  try {
    const {
      userId,
      password,
      role
    } = req.body;

    if (!userId || !password || !role) {
      return res.status(400).json({
        message: "User ID, password and role are required"
      });
    }

    const normalizedRole = String(role).toUpperCase();

    if (!["DOCTOR", "ADMIN"].includes(normalizedRole)) {
      return res.status(400).json({
        message: "Invalid role"
      });
    }

    const user = db
      .prepare(`
        SELECT
          id,
          user_id,
          password_hash,
          role,
          name
        FROM users
        WHERE user_id = ?
        AND role = ?
      `)
      .get(
        userId.trim(),
        normalizedRole
      );

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const passwordValid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordValid) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const token = jwt.sign(
      {
        userId: user.user_id,
        role: user.role,
        name: user.name
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h"
      }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        userId: user.user_id,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Login failed"
    });
  }
});

router.get("/me", require("../middleware/auth").authenticateToken, (req, res) => {
  return res.json({
    user: req.user
  });
});

module.exports = router;