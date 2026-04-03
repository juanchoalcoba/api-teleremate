const express = require("express");
const router = express.Router();
const { sendPushNotification } = require("../utils/firebaseAdmin");

/**
 * @route POST /api/send-notification
 * @desc  Direct endpoint to test or send push notifications manually.
 */
router.post("/send-notification", async (req, res) => {
  const { title, body, data } = req.body;

  if (!title || !body) {
    return res.status(400).json({
      success: false,
      message: "Se requieren título y cuerpo para la notificación.",
    });
  }

  try {
    const response = await sendPushNotification(title, body, data || {});
    if (response) {
      res.status(200).json({
        success: true,
        message: "Notificación enviada con éxito.",
        response,
      });
    } else {
      res.status(500).json({
        success: false,
        message:
          "No se pudo enviar la notificación. Es posible que el OWNER_TOKEN no esté configurado o sea inválido.",
      });
    }
  } catch (error) {
    console.error("Error manual notification endpoint:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
