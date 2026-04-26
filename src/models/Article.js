const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema(
  {
    lotNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    auctionLot: {
      type: String,
      default: "",
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      default: "",
      maxlength: 2000,
    },
    category: {
      type: String,
      required: true,
      enum: ["deposito", "remate", "inmueble", "vehiculo"],
      default: "deposito",
    },
    condition: {
      type: String,
      enum: ["Excelente", "Muy bueno", "Bueno", "Regular"],
      default: "Bueno",
    },
    status: {
      type: String,
      enum: ["depot", "upcoming", "reserved", "sold"],
      default: "depot",
    },
    estimatedPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: ["UYU", "USD"],
      default: "UYU",
    },
    salePrice: {
      type: Number,
      default: null,
    },
    images: [
      {
        filename: String,
        url: String,
      },
    ],
    featured: {
      type: Boolean,
      default: false,
    },
    soldAt: {
      type: Date,
      default: null,
    },
    auctionDate: {
      type: Date,
      default: null,
    },
    reservedUntil: {
      type: Date,
      default: null,
    },
    // AI-ready metadata field for future enhancements
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual: label from status
articleSchema.virtual("statusLabel").get(function () {
  const labels = {
    depot: "Venta Directa",
    upcoming: "Próximo Remate",
    reserved: "Reservado",
    sold: "Vendido",
  };
  return labels[this.status] || this.status;
});

// Index for search/filter performance
articleSchema.index({ category: 1, status: 1 });
articleSchema.index({ estimatedPrice: 1 });
articleSchema.index({ featured: 1 });
articleSchema.index({ createdAt: -1 });

const Article = mongoose.model("Article", articleSchema);

module.exports = Article;
