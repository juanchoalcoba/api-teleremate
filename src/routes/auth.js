const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const { login } = require("../controllers/authController");

// POST /api/auth/login
router.post("/login", asyncHandler(login));

module.exports = router;
