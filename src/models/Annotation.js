const mongoose = require("mongoose");

const annotationSchema = new mongoose.Schema(
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
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying by article and to potentially prevent exact duplicates
annotationSchema.index({ articleId: 1, phone: 1 }, { unique: true });
annotationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Annotation", annotationSchema);
