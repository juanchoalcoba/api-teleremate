const mongoose = require("mongoose");

const sellerSubmissionSchema = new mongoose.Schema(
  {
    sellerName: {
      type: String,
      required: true,
      trim: true,
    },
    sellerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    sellerEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    estimatedPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    pickupLocation: {
      type: String,
      trim: true,
    },
    usageYears: {
      type: String,
      trim: true,
    },
    conditionDetails: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    images: [
      {
        type: String, // URLs
      },
    ],
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedArticleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Article",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const SellerSubmission = mongoose.model(
  "SellerSubmission",
  sellerSubmissionSchema
);

module.exports = SellerSubmission;
