const express = require("express");
const PushSubscription = require("../models/PushSubscription");
const { notifyAll, notifySpecific } = require("../utils/pushNotifications");
const asyncHandler = require("express-async-handler");
const router = express.Router();

/**
 * @desc    Subscribe to push notifications (Public)
 */
router.post(
  "/subscribe",
  asyncHandler(async (req, res) => {
    const { subscription, userEmail } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ message: "Suscripción inválida." });
    }

    const existing = await PushSubscription.findOne({ endpoint: subscription.endpoint });
    if (existing) {
      existing.isAdmin = false;
      existing.userEmail = userEmail || existing.userEmail;
      existing.keys = subscription.keys;
      await existing.save();
      return res.status(200).json({ message: "Suscripción actualizada (Público)." });
    }

    await PushSubscription.create({
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      isAdmin: false,
      userEmail: userEmail
    });

    res.status(201).json({ message: "Suscripción (Público) guardada." });
  }),
);

/**
 * @desc    Subscribe to push notifications (Admin)
 */
router.post(
  "/subscribe-admin",
  asyncHandler(async (req, res) => {
    const { subscription, userEmail } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ message: "Suscripción inválida." });
    }

    const existing = await PushSubscription.findOne({ endpoint: subscription.endpoint });
    if (existing) {
      existing.isAdmin = true;
      existing.userEmail = userEmail || existing.userEmail;
      existing.keys = subscription.keys;
      await existing.save();
      return res.status(200).json({ message: "Suscripción actualizada (Admin)." });
    }

    await PushSubscription.create({
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      isAdmin: true,
      userEmail: userEmail
    });

    res.status(201).json({ message: "Suscripción (Admin) guardada." });
  }),
);

/**
 * @desc    Send test notification to a SPECIFIC device
 */
router.post(
  "/test-notify-device",
  asyncHandler(async (req, res) => {
    const { subscription, title, body, url } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ message: "Se requiere la suscripción del equipo." });
    }

    await notifySpecific(subscription, {
      title: title || "Test Directo",
      body: body || "Esta es una prueba solo para tu equipo",
      url: url || "/backoffice/"
    });

    res.json({ message: "Notificación enviada al equipo." });
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
      title: title || "Teleremate",
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
