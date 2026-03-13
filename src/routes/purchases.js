const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const {
  createPurchase,
} = require("../controllers/purchasesController");

// POST /api/purchases - Create new purchase (public)
router.post("/", asyncHandler(createPurchase));

module.exports = router;
