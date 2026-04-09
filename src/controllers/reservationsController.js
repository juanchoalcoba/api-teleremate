const Reservation = require("../models/Reservation");
const Article = require("../models/Article");
const asyncHandler = require("express-async-handler");
const cloudinary = require("../config/cloudinary");
const { notifyAll } = require("../utils/pushNotifications");

// @desc    Create a new reservation
// @route   POST /api/reservations
// @access  Public
exports.createReservation = asyncHandler(async (req, res) => {
  const { articleId, fullName, phone, reservedUntil } = req.body;

  // Validation
  if (!articleId || !fullName || !phone || !reservedUntil) {
    return res.status(400).json({
      success: false,
      message: "Faltan campos obligatorios",
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
      message: "El artículo no está disponible para reservar",
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

  // Validate date is in the future
  const reserveDate = new Date(reservedUntil);
  if (reserveDate <= new Date()) {
    return res.status(400).json({
      success: false,
      message: "La fecha de reserva debe ser en el futuro",
    });
  }

  const reservation = await Reservation.create({
    articleId,
    fullName: fullName.trim(),
    phone: phone.trim(),
    reservedUntil: reserveDate,
  });

  // Update article status to reserved unless already sold
  if (article && article.status !== "sold") {
    article.status = "reserved";
    article.reservedUntil = reserveDate;
    await article.save();
  }

  // Notify Admin
  notifyAll({
    title: "Nueva Reserva 🗓️",
    body: `${fullName} reservó: ${article?.title || "Artículo"}`,
    url: "/admin/reservas",
  }).catch((err) => console.error("Error sending push notification:", err));

  res.status(201).json({
    success: true,
    message: "Reserva creada exitosamente",
    data: reservation,
  });
});

// @desc    Get all reservations (admin)
// @route   GET /api/backoffice/reservations
// @access  Private (Admin only)
exports.getAllReservations = asyncHandler(async (req, res) => {
  const { status = "pending", page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const query = { status };

  const reservations = await Reservation.find(query)
    .populate("articleId", "lotNumber title")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Reservation.countDocuments(query);

  res.json({
    reservations,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// @desc    Update reservation status
// @route   PUT /api/backoffice/reservations/:id
// @access  Private (Admin only)
exports.updateReservationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["pending", "processed", "cancelled"].includes(status)) {
    return res.status(400).json({
      message: "Estado inválido",
    });
  }

  const reservation = await Reservation.findByIdAndUpdate(
    id,
    {
      status,
      processedAt: status === "processed" ? new Date() : null,
    },
    { new: true }
  ).populate("articleId", "lotNumber title");

  if (!reservation) {
    return res.status(404).json({
      message: "Reserva no encontrada",
    });
  }

  // Update article status based on new reservation status
  const article = await Article.findById(reservation.articleId);
  if (article) {
    if (status === "cancelled") {
      article.status = "depot"; // or upcoming?
      article.reservedUntil = null;
      await article.save();
    } else if (status === "processed") {
      article.status = "sold";
      article.reservedUntil = null;
      await article.save();
    }
  }

  res.json(reservation);
});

// @desc    Delete a reservation
// @route   DELETE /api/backoffice/reservations/:id
// @access  Private (Admin only)
exports.deleteReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);

  if (!reservation) {
    return res.status(404).json({
      message: "Reserva no encontrada",
    });
  }

  const article = await Article.findById(reservation.articleId);

  // If the reservation was PROCESSED, we delete the article
  if (reservation.status === "processed") {
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
  } else if (reservation.status === "pending") {
    // If it was PENDING, return to depot
    if (article) {
      article.status = "depot";
      article.reservedUntil = null;
      await article.save();
    }
  }

  await reservation.deleteOne();
  res.json({ message: "Reserva eliminada y artículo actualizado/removido" });
});
