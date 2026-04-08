const Annotation = require("../models/Annotation");
const Article = require("../models/Article");
const asyncHandler = require("express-async-handler");

// @desc    Create a new annotation (sign up for auction item)
// @route   POST /api/annotations
// @access  Public
exports.createAnnotation = asyncHandler(async (req, res) => {
  const { articleId, fullName, phone } = req.body;

  // Validation
  if (!articleId || !fullName || !phone) {
    return res.status(400).json({
      success: false,
      message: "Por favor, completa todos los campos obligatorios.",
    });
  }

  // Check if article exists and is a "remate" item
  const article = await Article.findById(articleId);
  if (!article) {
    return res.status(404).json({
      success: false,
      message: "Artículo no encontrado.",
    });
  }

  if (article.category !== "remate") {
    return res.status(400).json({
      success: false,
      message: "Este artículo no permite anotaciones.",
    });
  }

  // Check for duplicate (same phone for same article)
  const existingAnnotation = await Annotation.findOne({ articleId, phone: phone.trim() });
  if (existingAnnotation) {
    return res.status(400).json({
      success: false,
      message: "Ya te has anotado a este artículo con este número de teléfono.",
    });
  }

  const annotation = await Annotation.create({
    articleId,
    fullName: fullName.trim(),
    phone: phone.trim(),
  });

  res.status(201).json({
    success: true,
    message: "Te has anotado correctamente.",
    data: annotation,
  });
});

// @desc    Get all annotations (admin)
// @route   GET /api/backoffice/annotations
// @access  Private (Admin only)
exports.getAllAnnotations = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, articleId } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const query = {};
  if (articleId) query.articleId = articleId;

  const annotations = await Annotation.find(query)
    .populate("articleId", "lotNumber title category")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Annotation.countDocuments(query);

  res.json({
    annotations,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// @desc    Delete an annotation
// @route   DELETE /api/backoffice/annotations/:id
// @access  Private (Admin only)
exports.deleteAnnotation = asyncHandler(async (req, res) => {
  const annotation = await Annotation.findById(req.params.id);

  if (!annotation) {
    return res.status(404).json({
      message: "Anotación no encontrada.",
    });
  }

  await annotation.deleteOne();
  res.json({ message: "Anotación eliminada correctamente." });
});
