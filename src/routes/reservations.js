const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const {
  createReservation,
} = require("../controllers/reservationsController");

// POST /api/reservations - Create new reservation (public)
router.post("/", asyncHandler(createReservation));

module.exports = router;
