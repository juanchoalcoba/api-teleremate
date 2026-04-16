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
    default: true,
  },
  userEmail: {
    type: String,
    required: false, // Association added on Friday to track device ownership
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("PushSubscription", PushSubscriptionSchema);
