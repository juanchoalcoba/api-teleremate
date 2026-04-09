const express = require("express");
const PushSubscription = require("../models/PushSubscription");
const { notifyAll } = require("../utils/pushNotifications");
const asyncHandler = require("express-async-handler");
const router = express.Router();

/**
 * @desc    Subscribe to push notifications
 * @route   POST /api/notifications/subscribe
 * @access  Public (for dev, should be Auth in prod)
 */
router.post(
  "/subscribe",
  asyncHandler(async (req, res) => {
    const subscription = req.body;

    // Check if subscription already exists
    const existing = await PushSubscription.findOne({ endpoint: subscription.endpoint });
    if (existing) {
      return res.status(200).json({ message: "Suscripción ya registrada anteriormente." });
    }

    // Save new subscription
    await PushSubscription.create({
      endpoint: subscription.endpoint,
      keys: subscription.keys,
    });

    res.status(201).json({ message: "Suscripción guardada exitosamente." });
  })
);

/**
 * @desc    Send test notification
 * @route   POST /api/notifications/test-notify
 * @access  Public (for testing)
 */
router.post(
  "/test-notify",
  asyncHandler(async (req, res) => {
    const { title, body, url } = req.body;
    
    await notifyAll({
      title: title || "Test de Notificación",
      body: body || "Esto es un mensaje de prueba desde Teleremate",
      url: url || "/admin/notifications",
    });

    res.json({ message: "Notificación de prueba enviada." });
  })
);

module.exports = router;
