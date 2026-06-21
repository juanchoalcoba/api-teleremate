const Purchase = require("../models/Purchase");
const Article = require("../models/Article");
const asyncHandler = require("express-async-handler");
const cloudinary = require("../config/cloudinary");
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const { notifyAdmin } = require("../utils/pushNotifications");

// @desc    Create a new purchase
// @route   POST /api/purchases
// @access  Public
exports.createPurchase = asyncHandler(async (req, res) => {
  const { articleId, fullName, phone, deliveryMethod, deliveryAddress, paymentMethod } =
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
    paymentMethod: paymentMethod === 'mercadopago' ? 'mercadopago' : 'deposit',
  });

  // Calculate final price
  const finalPrice = article.category === 'deposito' 
    ? Math.round((article.price || article.estimatedPrice) * 1.2) 
    : (article.price || article.estimatedPrice);

  let init_point = null;

  if (paymentMethod === 'mercadopago') {
    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
    const preference = new Preference(client);

    try {
      const result = await preference.create({
        body: {
          items: [
            {
              id: article._id.toString(),
              title: article.title,
              quantity: 1,
              unit_price: finalPrice,
              currency_id: article.currency === 'USD' ? 'USD' : 'UYU'
            }
          ],
          back_urls: {
            success: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pago-exitoso`,
            failure: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/catalogo`,
            pending: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pago-exitoso`
          },
          auto_return: 'approved',
          external_reference: purchase._id.toString(),
        }
      });
      
      purchase.preferenceId = result.id;
      await purchase.save();
      init_point = result.init_point;
    } catch (error) {
      console.error("Error creating MercadoPago preference:", error);
      // Fallback or delete purchase? We will just keep it and let frontend know it failed?
      // Better to throw error and delete purchase to allow retry
      await purchase.deleteOne();
      return res.status(500).json({
        success: false,
        message: "Error al generar el pago con MercadoPago"
      });
    }
  }

  // mark article sold or reserved
  if (article) {
    if (paymentMethod === 'mercadopago') {
      // Reserving for 15 minutes to give time to pay
      article.status = "reserved";
      article.reservedUntil = new Date(Date.now() + 15 * 60 * 1000);
      await article.save();
    } else {
      // Deposit -> Sold immediately
      article.status = "sold";
      article.soldAt = new Date();
      await article.save();

      // Notify Admin immediately for Deposit
      notifyAdmin({
        title: "Nueva Compra 🛍️",
        body: `${fullName} ha comprado (Depósito): ${article?.title || "Artículo"}`,
        url: "/backoffice/compras",
        tag: `purchase-${purchase._id}`,
      }).catch((err) => console.error("Error sending push notification:", err));
    }
  }

  res.status(201).json({
    success: true,
    message: "Compra creada exitosamente",
    data: purchase,
    init_point: init_point
  });
});

// @desc    MercadoPago Webhook
// @route   POST /api/purchases/webhook
// @access  Public
exports.webhookMercadoPago = asyncHandler(async (req, res) => {
  const { type, 'data.id': dataId } = req.query;
  
  if (type === 'payment' && dataId) {
    try {
      const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
      const paymentClient = new Payment(client);
      const payment = await paymentClient.get({ id: dataId });
      
      if (payment.status === 'approved') {
        const purchaseId = payment.external_reference;
        const purchase = await Purchase.findById(purchaseId);
        
        if (purchase && purchase.paymentStatus !== 'approved') {
           purchase.paymentStatus = 'approved';
           purchase.status = 'processed'; // Optionally mark as processed directly
           await purchase.save();
           
           // Notify admin about successful payment
           const article = await Article.findById(purchase.articleId);
           if (article) {
             article.status = "sold";
             article.soldAt = new Date();
             article.reservedUntil = null;
             await article.save();
           }

           notifyAdmin({
             title: "Pago Recibido 💰",
             body: `${purchase.fullName} ha pagado vía MP: ${article?.title || "Artículo"}`,
             url: "/backoffice/compras",
             tag: `payment-${purchase._id}`,
           }).catch((err) => console.error("Error sending push notification:", err));
        }
      }
    } catch (error) {
      console.error("Error processing MercadoPago webhook:", error);
    }
  }
  
  res.status(200).send('OK');
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
      article.reservedUntil = null;
      await article.save();
    } else if (status === "processed") {
      // keep sold
      article.status = "sold";
      article.reservedUntil = null;
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
      article.reservedUntil = null;
      await article.save();
    }
  }

  await purchase.deleteOne();
  res.json({ message: "Compra eliminada y artículo actualizado/removido" });
});
