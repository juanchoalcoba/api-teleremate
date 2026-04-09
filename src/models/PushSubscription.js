const mongoose = require("mongoose");

const PushSubscriptionSchema = new mongoose.Schema({
  endpoint: {
    type: String,
    required: true,
    unique: true,
  },
  keys: {
    p256dh: {
      type: String,
      required: true,
    },
    auth: {
      type: String,
      required: true,
    },
  },
  isAdmin: {
    type: Boolean,
    default: true, // For now, we only care about admin notifications
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("PushSubscription", PushSubscriptionSchema);
