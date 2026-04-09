const SellerSubmission = require("../models/SellerSubmission");
const Article = require("../models/Article");
const { notifyAll } = require("../utils/pushNotifications");

/**
 * Public: POST /api/submissions
 */
const createSubmission = async (req, res) => {
  try {
    const {
      sellerName,
      sellerPhone,
      sellerEmail,
      title,
      description,
      estimatedPrice,
      pickupLocation,
      usageYears,
      conditionDetails,
      images,
      currency,
    } = req.body;

    if (!sellerName || !sellerPhone || !title || !description || !estimatedPrice) {
      return res.status(400).json({ message: "Faltan campos requeridos." });
    }

    const submission = new SellerSubmission({
      sellerName,
      sellerPhone,
      sellerEmail,
      title,
      description,
      estimatedPrice: Number(estimatedPrice),
      pickupLocation,
      usageYears,
      conditionDetails,
      images: Array.isArray(images) ? images : [],
      currency: currency || "UYU",
    });

    await submission.save();

    // Notify Admin
    notifyAll({
      title: "Nuevo Pedido de Ingreso 📥",
      body: `De: ${sellerName} - Artículo: ${title}`,
      url: "/admin/pedidos",
    }).catch((err) => console.error("Error sending push notification:", err));

    res.status(201).json({
      message: "Tu pedido ha sido enviado con éxito. Lo revisaremos pronto.",
      submissionId: submission._id,
    });
  } catch (error) {
    console.error("Error creating submission:", error);
    res.status(500).json({ message: "Error al procesar el pedido." });
  }
};

/**
 * Admin: GET /api/backoffice/submissions
 */
const getAllSubmissions = async (req, res) => {
  try {
    // Only return pending submissions as per user request
    const submissions = await SellerSubmission.find({ status: "pending" }).sort({
      createdAt: -1,
    });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los pedidos." });
  }
};

/**
 * Admin: GET /api/backoffice/submissions/:id
 */
const getSubmissionById = async (req, res) => {
  try {
    const submission = await SellerSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: "Pedido no encontrado." });
    }
    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el pedido." });
  }
};

/**
 * Admin: PUT /api/backoffice/submissions/:id/approve
 */
const approveSubmission = async (req, res) => {
  try {
    const submission = await SellerSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: "Pedido no encontrado." });
    }

    if (submission.status !== "pending") {
      return res.status(400).json({ message: "Este pedido ya ha sido procesado." });
    }

    const { category, auctionDate } = req.body;
    if (!category) {
      return res.status(400).json({ message: "La categoría es requerida para la aprobación." });
    }

    // Generate lotNumber: SUB-TIMESTAMP
    const lotNumber = `SUB-${Date.now()}`;

    // Transform images from String[] (urls) to [{ filename, url }]
    const transformedImages = submission.images.map((url, index) => {
      const filename = url.split("/").pop() || `submission-image-${index}`;
      return { filename, url };
    });

    // Create new Article
    const article = new Article({
      lotNumber,
      title: submission.title,
      description: submission.description,
      category,
      condition: "Bueno", // Default condition
      status: category === "remate" ? "upcoming" : "depot",
      auctionDate: (category === "remate" && auctionDate) ? new Date(auctionDate) : null,
      estimatedPrice: submission.estimatedPrice,
      currency: submission.currency || "UYU",
      images: transformedImages,
      metadata: {
        sellerSubmissionId: submission._id,
        sellerName: submission.sellerName,
        sellerPhone: submission.sellerPhone,
        pickupLocation: submission.pickupLocation,
        usageYears: submission.usageYears,
        conditionDetails: submission.conditionDetails,
      },
    });

    await article.save();

    // Update submission status
    submission.status = "approved";
    submission.approvedArticleId = article._id;
    await submission.save();

    res.json({
      message: "Pedido aprobado y artículo creado.",
      articleId: article._id,
    });
  } catch (error) {
    console.error("Error approving submission:", error);
    res.status(500).json({ message: "Error al aprobar el pedido." });
  }
};

/**
 * Admin/Public: PUT /api/backoffice/submissions/:id/reject
 * UPDATED: Now deletes the submission as requested.
 */
const rejectSubmission = async (req, res) => {
  try {
    const submission = await SellerSubmission.findByIdAndDelete(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: "Pedido no encontrado." });
    }

    res.json({ message: "Pedido rechazado y eliminado correctamente." });
  } catch (error) {
    res.status(500).json({ message: "Error al rechazar el pedido." });
  }
};

/**
 * Public: POST /api/submissions/images
 */
const uploadPublicImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No se subieron imágenes." });
    }

    const imageUrls = req.files.map((file) => file.path);

    res.json({
      images: imageUrls,
      message: "Imágenes subidas correctamente.",
    });
  } catch (error) {
    console.error("Error uploading public images:", error);
    res.status(500).json({ message: "Error al subir imágenes." });
  }
};

module.exports = {
  createSubmission,
  getAllSubmissions,
  getSubmissionById,
  approveSubmission,
  rejectSubmission,
  uploadPublicImages,
};
