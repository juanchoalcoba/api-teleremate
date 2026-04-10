const webPush = require("web-push");
const PushSubscription = require("../models/PushSubscription");

webPush.setVapidDetails(
  process.env.VAPID_EMAIL || "mailto:admin@teleremate.org",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * Send a push notification to all stored subscriptions
 * @param {Object} payload { title, body, url }
 */
const notifyAll = async (payload) => {
  const subscriptions = await PushSubscription.find({});
  console.log(`[PUSH] Intentando notificar a ${subscriptions.length} dispositivos registrados.`);
  
  const notifications = subscriptions.map(async (subscription) => {
    try {
      const response = await webPush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
        },
        JSON.stringify(payload),
        {
          urgency: 'high',   // Despierta el dispositivo aunque esté en Doze Mode
          TTL: 86400,        // Mensaje válido por 24 horas si el dispositivo está offline
        }
      );
      console.log(`[PUSH] Enviado OK a ${subscription.endpoint.split('/').pop().substring(0, 10)}... Status: ${response.statusCode}`);
    } catch (error) {
      if (error.statusCode === 410 || error.statusCode === 404) {
        console.log(`[PUSH] Removing expired subscription: ${subscription._id}`);
        await PushSubscription.deleteOne({ _id: subscription._id });
      } else {
        console.error(`[PUSH] Error sending to ${subscription.endpoint.split('/').pop().substring(0, 10)}... Status: ${error.statusCode || 'unknown'}. Error: ${error.message}`);
      }
    }
  });

  return Promise.all(notifications);
};

module.exports = { notifyAll };
