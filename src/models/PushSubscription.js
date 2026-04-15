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
    default: false,
  },
  userEmail: {
    type: String,
    required: false, // Optional for now to avoid breaking existing ones
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("PushSubscription", PushSubscriptionSchema);
