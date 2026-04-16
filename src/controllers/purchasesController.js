const Purchase = require("../models/Purchase");
const Article = require("../models/Article");
const asyncHandler = require("express-async-handler");
const cloudinary = require("../config/cloudinary");
const { notifyAdmin } = require("../utils/pushNotifications");

// @desc    Create a new purchase
// @route   POST /api/purchases
// @access  Public
exports.createPurchase = asyncHandler(async (req, res) => {
  const { articleId, fullName, phone, deliveryMethod, deliveryAddress } =
    req.body;

  // Validation
  if (!articleId || !fullName || !phone || !deliveryMethod) {
    return res.status(400).json({
      success: false,
      message: "Faltan campos obligatorios",
    });
  }

  // Validate delivery method
  if (!["pickup", "delivery"].includes(deliveryMethod)) {
    return res.status(400).json({
      success: false,
      message: "Método de entrega inválido",
    });
  }

  // Validate address for delivery
  if (deliveryMethod === "delivery" && !deliveryAddress) {
    return res.status(400).json({
      success: false,
      message: "La dirección es obligatoria para envío a domicilio",
    });
  }

  // Validate that article exists and is not sold
  const article = await Article.findById(articleId);
  if (!article) {
    return res.status(404).json({
      success: false,
      message: "Artículo no encontrado",
    });
  }

  if (article.status === "sold" || article.status === "reserved") {
    return res.status(400).json({
      success: false,
      message: "El artículo no está disponible para comprar",
    });
  }

  // Validate phone format (basic validation)
  const phoneRegex = /^[0-9+\-\s()]{6,20}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({
      success: false,
      message: "Número de teléfono inválido",
    });
  }

  const purchase = await Purchase.create({
    articleId,
    fullName: fullName.trim(),
    phone: phone.trim(),
    deliveryMethod,
    deliveryAddress: deliveryAddress ? deliveryAddress.trim() : null,
  });

  // mark article sold
  if (article) {
    article.status = "sold";
    article.soldAt = new Date();
    await article.save();
  }

  // Notify Admin
  notifyAdmin({
    title: "Nueva Compra 🛍️",
    body: `${fullName} ha comprado: ${article?.title || "Artículo"}`,
    url: "/backoffice/compras",
  }).catch((err) => console.error("Error sending push notification:", err));

  res.status(201).json({
    success: true,
    message: "Compra creada exitosamente",
    data: purchase,
  });
});

// @desc    Get all purchases (admin)
// @route   GET /api/backoffice/purchases
// @access  Private (Admin only)
exports.getAllPurchases = asyncHandler(async (req, res) => {
  const { status = "pending", page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const query = { status };

  const purchases = await Purchase.find(query)
    .populate("articleId", "lotNumber title")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Purchase.countDocuments(query);

  res.json({
    purchases,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// @desc    Update purchase status
// @route   PUT /api/backoffice/purchases/:id
// @access  Private (Admin only)
exports.updatePurchaseStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["pending", "processed", "cancelled"].includes(status)) {
    return res.status(400).json({
      message: "Estado inválido",
    });
  }

  const purchase = await Purchase.findByIdAndUpdate(
    id,
    {
      status,
      processedAt: status === "processed" ? new Date() : null,
    },
    { new: true }
  ).populate("articleId", "lotNumber title");

  if (!purchase) {
    return res.status(404).json({
      message: "Compra no encontrada",
    });
  }

  // update article status if needed
  const article = await Article.findById(purchase.articleId);
  if (article) {
    if (status === "cancelled") {
      article.status = "depot";
      await article.save();
    } else if (status === "processed") {
      // keep sold
      article.status = "sold";
      await article.save();
    }
  }

  res.json(purchase);
});

// @desc    Delete a purchase
// @route   DELETE /api/backoffice/purchases/:id
// @access  Private (Admin only)
exports.deletePurchase = asyncHandler(async (req, res) => {
  const purchase = await Purchase.findById(req.params.id);

  if (!purchase) {
    return res.status(404).json({
      message: "Compra no encontrada",
    });
  }

  const article = await Article.findById(purchase.articleId);

  // If the purchase was already PROCESSED, we delete the article as well
  if (purchase.status === "processed") {
    if (article) {
      // Delete associated images from Cloudinary
      try {
        for (const img of article.images) {
          if (img.filename) {
            await cloudinary.uploader.destroy(img.filename).catch(err => console.error("Cloudinary delete error:", err));
          }
        }
      } catch (err) {
        console.error("Error al borrar imágenes en Cloudinary:", err);
      }
      await article.deleteOne();
    }
  } else if (purchase.status === "pending") {
    // If it was PENDING, we return the article to depot status
    if (article) {
      article.status = "depot";
      await article.save();
    }
  }

  await purchase.deleteOne();
  res.json({ message: "Compra eliminada y artículo actualizado/removido" });
});
