const Article = require("../models/Article");
const Reservation = require("../models/Reservation");
const Purchase = require("../models/Purchase");
const path = require("path");
const fs = require("fs");

/**
 * GET /api/admin/articles
 */
const getAllArticles = async (req, res) => {
  const { page = 1, limit = 20, status, category, search } = req.query;

  const filter = {};

  if (status) filter.status = status;
  if (category) filter.category = category;

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { lotNumber: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [articles, total] = await Promise.all([
    Article.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Article.countDocuments(filter),
  ]);

  res.json({
    articles,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
};

/**
 * POST /api/admin/articles
 */
const createArticle = async (req, res) => {
  const {
    lotNumber,
    title,
    description,
    category,
    condition,
    status,
    estimatedPrice,
    salePrice,
    featured,
    auctionDate,
    reservedUntil,
  } = req.body;

  const exists = await Article.findOne({ lotNumber });
  if (exists) {
    return res.status(400).json({ message: "El número de lote ya existe." });
  }

  const article = new Article({
    lotNumber,
    title,
    description,
    category,
    condition,
    status,
    estimatedPrice: Number(estimatedPrice),
    salePrice: salePrice ? Number(salePrice) : null,
    featured: featured === "true" || featured === true,
    auctionDate: auctionDate || null,
    reservedUntil: reservedUntil || null,
  });

  await article.save();
  res.status(201).json(article);
};

/**
 * PUT /api/admin/articles/:id
 */
const updateArticle = async (req, res) => {
  const article = await Article.findById(req.params.id);
  if (!article)
    return res.status(404).json({ message: "Artículo no encontrado." });

  const {
    lotNumber,
    title,
    description,
    category,
    condition,
    status,
    estimatedPrice,
    salePrice,
    featured,
    auctionDate,
    reservedUntil,
  } = req.body;

  if (lotNumber) article.lotNumber = lotNumber;
  if (title) article.title = title;
  if (description !== undefined) article.description = description;
  if (category) article.category = category;
  if (condition) article.condition = condition;
  if (status) {
    // If status is changing to "sold", cancel all pending reservations and purchases
    if (status === "sold" && article.status !== "sold") {
      await Reservation.updateMany(
        { articleId: req.params.id, status: "pending" },
        { status: "cancelled", cancelledAt: new Date(), cancelReason: "Artículo vendido por administrador" }
      );
      await Purchase.updateMany(
        { articleId: req.params.id, status: "pending" },
        { status: "cancelled", cancelledAt: new Date(), cancelReason: "Artículo vendido por administrador" }
      );
    }
    
    article.status = status;
    if (status === "sold" && !article.soldAt) {
      article.soldAt = new Date();
      if (salePrice) article.salePrice = Number(salePrice);
    }
  }
  if (estimatedPrice !== undefined)
    article.estimatedPrice = Number(estimatedPrice);
  if (featured !== undefined)
    article.featured = featured === "true" || featured === true;
  if (auctionDate !== undefined) article.auctionDate = auctionDate || null;
  if (reservedUntil !== undefined) article.reservedUntil = reservedUntil || null;

  await article.save();
  res.json(article);
};

/**
 * DELETE /api/admin/articles/:id
 */
const deleteArticle = async (req, res) => {
  const article = await Article.findById(req.params.id);
  if (!article)
    return res.status(404).json({ message: "Artículo no encontrado." });

  // Delete associated images from filesystem
  for (const img of article.images) {
    const imgPath = path.join(__dirname, "../../uploads", img.filename);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }

  await article.deleteOne();
  res.json({ message: "Artículo eliminado correctamente." });
};

/**
 * POST /api/admin/articles/:id/images
 */
const uploadImage = async (req, res) => {
  const article = await Article.findById(req.params.id);
  if (!article)
    return res.status(404).json({ message: "Artículo no encontrado." });

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "No se subieron imágenes." });
  }

  const newImages = req.files.map((file) => ({
    filename: file.filename,
    url: `/uploads/${file.filename}`,
  }));

  article.images.push(...newImages);
  await article.save();
  res.json({
    images: article.images,
    message: "Imágenes subidas correctamente.",
  });
};

/**
 * DELETE /api/admin/articles/:id/images/:filename
 */
const deleteImage = async (req, res) => {
  const article = await Article.findById(req.params.id);
  if (!article)
    return res.status(404).json({ message: "Artículo no encontrado." });

  const { filename } = req.params;
  const imgPath = path.join(__dirname, "../../uploads", filename);
  if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);

  article.images = article.images.filter((img) => img.filename !== filename);
  await article.save();
  res.json({ images: article.images, message: "Imagen eliminada." });
};

/**
 * GET /api/admin/dashboard
 */
const getDashboard = async (req, res) => {
  const [totalDepot, totalUpcoming, totalSold, allArticles] = await Promise.all(
    [
      Article.countDocuments({ status: "depot" }),
      Article.countDocuments({ status: "upcoming" }),
      Article.countDocuments({ status: "sold" }),
      Article.find({ status: { $in: ["depot", "upcoming"] } }),
    ],
  );

  const estimatedValue = allArticles.reduce(
    (sum, a) => sum + (a.estimatedPrice || 0),
    0,
  );

  // Sales by month (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const soldArticles = await Article.find({
    status: "sold",
    soldAt: { $gte: sixMonthsAgo },
  });

  const salesByMonth = {};
  soldArticles.forEach((a) => {
    if (a.soldAt) {
      const key = `${a.soldAt.getFullYear()}-${String(a.soldAt.getMonth() + 1).padStart(2, "0")}`;
      if (!salesByMonth[key]) salesByMonth[key] = { count: 0, value: 0 };
      salesByMonth[key].count += 1;
      salesByMonth[key].value += a.salePrice || a.estimatedPrice || 0;
    }
  });

  const salesByMonthArray = Object.entries(salesByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }));

  // Featured / top articles
  const featuredArticles = await Article.find({ featured: true })
    .limit(5)
    .sort({ estimatedPrice: -1 });

  res.json({
    kpis: {
      totalDepot,
      totalUpcoming,
      totalSold,
      estimatedValue,
    },
    salesByMonth: salesByMonthArray,
    featuredArticles,
  });
};

module.exports = {
  getAllArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  uploadImage,
  deleteImage,
  getDashboard,
};
