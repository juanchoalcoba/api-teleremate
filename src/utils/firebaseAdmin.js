const admin = require("firebase-admin");

const initializeFirebase = () => {
  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !process.env.FIREBASE_PRIVATE_KEY
  ) {
    console.warn(
      "Firebase Admin environment variables are missing. Notifications will not be sent."
    );
    return null;
  }

  try {
    // Ensure the private key is correctly formatted
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");

    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
      console.log("Firebase Admin initialized successfully");
    }
    return admin;
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
    return null;
  }
};

const firebaseAdmin = initializeFirebase();

/**
 * Sends a push notification to the owner's device.
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional metadata
 */
const sendPushNotification = async (title, body, data = {}) => {
  const OWNER_TOKEN = process.env.OWNER_TOKEN;

  if (!OWNER_TOKEN || OWNER_TOKEN === "TEMP") {
    console.log("OWNER_TOKEN not set or TEMP. Skipping notification.");
    return null;
  }

  if (!firebaseAdmin) {
    console.warn("Firebase Admin not initialized. Cannot send notification.");
    return null;
  }

  const message = {
    notification: {
      title,
      body,
    },
    token: OWNER_TOKEN,
    data: {
      ...data,
      click_action: "/backoffice", // Default redirect to admin panel
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("Successfully sent FCM message:", response);
    return response;
  } catch (error) {
    console.error("Error sending FCM message:", error);
    if (error.code === 'messaging/registration-token-not-registered') {
      console.error("The OWNER_TOKEN is no longer valid. Please update it in Railway.");
    }
    return null;
  }
};

module.exports = { admin: firebaseAdmin, sendPushNotification };
