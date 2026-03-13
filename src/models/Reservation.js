const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    articleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Article",
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    reservedUntil: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processed", "cancelled"],
      default: "pending",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
reservationSchema.index({ articleId: 1, status: 1 });
reservationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Reservation", reservationSchema);
