const webPush = require("web-push");
const PushSubscription = require("../models/PushSubscription");

if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.error("❌ ERROR: VAPID keys are missing in environment variables!");
} else {
  console.log("[PUSH] Configurando VAPID con Public Key:", process.env.VAPID_PUBLIC_KEY.substring(0, 10) + "...");
}

webPush.setVapidDetails(
  process.env.VAPID_EMAIL || "mailto:admin@teleremate.org",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

/**
 * Internal helper to send push to an array of subscriptions
 */
const sendPushToSubscriptions = async (subscriptions, payload) => {
  console.log(`[PUSH] Intentando notificar a ${subscriptions.length} dispositivos.`);

  const notifications = subscriptions.map(async (subscription) => {
    try {
      await webPush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
        },
        JSON.stringify(payload),
        {
          urgency: "high", // Crucial Friday Optimization for Android
          TTL: 86400,      // 24 Hour TTL
        },
      );
    } catch (error) {
      console.error(`[PUSH] Error enviando a ${subscription.endpoint}:`, error.message);
      if (error.statusCode === 410 || error.statusCode === 404) {
        console.log(`[PUSH] Eliminando suscripción inválida/expirada: ${subscription._id}`);
        await PushSubscription.deleteOne({ _id: subscription._id });
      }
    }
  });

  return Promise.all(notifications);
};

const notifyAll = async (payload) => {
  // Ahora notifyAll es un alias de notifyAdmin para seguridad
  const subscriptions = await PushSubscription.find({ isAdmin: true });
  return sendPushToSubscriptions(subscriptions, payload);
};

const notifyAdmin = async (payload) => {
  const subscriptions = await PushSubscription.find({ isAdmin: true });
  return sendPushToSubscriptions(subscriptions, payload);
};

const notifyPublic = async (payload) => {
  // Desactivado por orden del usuario
  console.log("[PUSH] Intento de notificación pública abortado.");
  return Promise.resolve();
};

const notifySpecific = async (subscriptionData, payload) => {
  try {
    if (!subscriptionData || !subscriptionData.endpoint) {
      throw new Error("Datos de suscripción incompletos (falta endpoint).");
    }
    if (!subscriptionData.keys || !subscriptionData.keys.p256dh || !subscriptionData.keys.auth) {
      throw new Error("Datos de suscripción incompletos (faltan llaves p256dh/auth).");
    }

    const response = await webPush.sendNotification(
      {
        endpoint: subscriptionData.endpoint,
        keys: subscriptionData.keys,
      },
      JSON.stringify(payload),
      {
        urgency: "high",
        TTL: 86400,
      },
    );
    return response;
  } catch (error) {
    console.error(`[PUSH] Error crítico en envío específico: ${error.message}`);
    if (error.body) console.error(`[PUSH] Detalle del proveedor: ${error.body}`);
    throw error;
  }
};

module.exports = { notifyAll, notifyAdmin, notifyPublic, notifySpecific };
