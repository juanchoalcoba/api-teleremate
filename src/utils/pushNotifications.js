const webPush = require("web-push");
const PushSubscription = require("../models/PushSubscription");

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
      if (error.statusCode === 410 || error.statusCode === 404) {
        await PushSubscription.deleteOne({ _id: subscription._id });
      }
    }
  });

  return Promise.all(notifications);
};

const notifyAll = async (payload) => {
  const subscriptions = await PushSubscription.find({});
  return sendPushToSubscriptions(subscriptions, payload);
};

const notifyAdmin = async (payload) => {
  const subscriptions = await PushSubscription.find({ isAdmin: true });
  return sendPushToSubscriptions(subscriptions, payload);
};

const notifyPublic = async (payload) => {
  const subscriptions = await PushSubscription.find({ isAdmin: false });
  return sendPushToSubscriptions(subscriptions, payload);
};

const notifySpecific = async (subscriptionData, payload) => {
  try {
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
    console.error(`[PUSH] Error en envío específico: ${error.message}`);
    throw error;
  }
};

module.exports = { notifyAll, notifyAdmin, notifyPublic, notifySpecific };
