const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const {
  createPurchase,
  webhookMercadoPago,
  verifyPurchasePayment
} = require("../controllers/purchasesController");

// POST /api/purchases - Create new purchase (public)
router.post("/", asyncHandler(createPurchase));

// POST /api/purchases/verify-payment - Verify payment (public/client)
router.post("/verify-payment", asyncHandler(verifyPurchasePayment));

// POST /api/purchases/webhook - MercadoPago webhook
router.post("/webhook", asyncHandler(webhookMercadoPago));

module.exports = router;
