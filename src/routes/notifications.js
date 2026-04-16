const express = require("express");
const PushSubscription = require("../models/PushSubscription");
const { notifyAll, notifySpecific } = require("../utils/pushNotifications");
const asyncHandler = require("express-async-handler");
const router = express.Router();

/**
 * @desc    Subscribe to push notifications (Thursday Style)
 * Unified endpoint for all browsers.
 */
router.post(
  "/subscribe",
  asyncHandler(async (req, res) => {
    const subscription = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ message: "Suscripción inválida." });
    }

    const existing = await PushSubscription.findOne({ endpoint: subscription.endpoint });
    if (existing) {
      // Refresh current keys
      existing.keys = subscription.keys;
      await existing.save();
      return res.status(200).json({ message: "Suscripción actualizada." });
    }

    await PushSubscription.create({
      endpoint: subscription.endpoint,
      keys: subscription.keys
    });

    res.status(201).json({ message: "Suscripción guardada exitosamente." });
  }),
);

/**
 * @desc    Backward compatibility for admin endpoint
 */
router.post(
  "/subscribe-admin",
  asyncHandler(async (req, res) => {
    // Treat as a normal subscription but ensure we acknowledge it
    const subscription = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ message: "Suscripción inválida." });
    }

    const existing = await PushSubscription.findOne({ endpoint: subscription.endpoint });
    if (existing) {
      existing.isAdmin = true;
      existing.keys = subscription.keys;
      await existing.save();
    } else {
      await PushSubscription.create({
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        isAdmin: true
      });
    }

    res.status(201).json({ message: "Suscripción Admin guardada." });
  }),
);

/**
 * @desc    Send general test notification (All)
 */
router.post(
  "/test-notify",
  asyncHandler(async (req, res) => {
    const { title, body, url } = req.body;
    await notifyAll({
      title: title || "Teleremate Uruguay",
      body: body || "Prueba de notificación establecida.",
      url: url || "/"
    });
    res.json({ message: "Notificación global enviada." });
  }),
);

router.get(
  "/count",
  asyncHandler(async (req, res) => {
    const count = await PushSubscription.countDocuments();
    res.json({ count });
  }),
);

module.exports = router;
