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
  
  const notifications = subscriptions.map(async (subscription) => {
    try {
      await webPush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
        },
        JSON.stringify(payload)
      );
    } catch (error) {
      if (error.statusCode === 410 || error.statusCode === 404) {
        // Subscription expired or no longer valid, remove it
        console.log(`[PUSH] Removing expired subscription: ${subscription._id}`);
        await PushSubscription.deleteOne({ _id: subscription._id });
      } else {
        console.error("[PUSH] Error sending notification:", error.message);
      }
    }
  });

  return Promise.all(notifications);
};

module.exports = { notifyAll };
