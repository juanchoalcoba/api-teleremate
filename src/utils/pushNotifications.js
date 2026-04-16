const webPush = require("web-push");
const PushSubscription = require("../models/PushSubscription");

webPush.setVapidDetails(
  process.env.VAPID_EMAIL || "mailto:admin@teleremate.org",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * Send a push notification to all stored subscriptions (Thursday Style)
 * Supports title, body, and url in the payload.
 */
const notifyAll = async (payload) => {
  const subscriptions = await PushSubscription.find({});
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
          urgency: "high", // Keep high urgency for reliable delivery
          TTL: 86400,
        }
      );
    } catch (error) {
      if (error.statusCode === 410 || error.statusCode === 404) {
        console.log(`[PUSH] Eliminando suscripción expirada: ${subscription._id}`);
        await PushSubscription.deleteOne({ _id: subscription._id });
      } else {
        console.error(`[PUSH] Error enviando a ${subscription._id}:`, error.message);
      }
    }
  });

  return Promise.all(notifications);
};

// Aliases to maintain compatibility with existing route imports if any
const notifyAdmin = notifyAll;
const notifyPublic = notifyAll;

const notifySpecific = async (subscriptionData, payload) => {
  try {
    await webPush.sendNotification(
      {
        endpoint: subscriptionData.endpoint,
        keys: subscriptionData.keys,
      },
      JSON.stringify(payload),
      {
        urgency: "high",
        TTL: 86400,
      }
    );
  } catch (error) {
    console.error(`[PUSH] Error en envío específico: ${error.message}`);
    throw error;
  }
};

module.exports = { notifyAll, notifyAdmin, notifyPublic, notifySpecific };
