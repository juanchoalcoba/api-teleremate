const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const {
  createPurchase,
  webhookMercadoPago
} = require("../controllers/purchasesController");

// POST /api/purchases - Create new purchase (public)
router.post("/", asyncHandler(createPurchase));

// POST /api/purchases/webhook - MercadoPago webhook
router.post("/webhook", asyncHandler(webhookMercadoPago));

module.exports = router;
