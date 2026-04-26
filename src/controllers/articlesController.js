const Article = require("../models/Article");
const Reservation = require("../models/Reservation");
const Purchase = require("../models/Purchase");
const { getAccentInsensitiveRegex } = require("../utils/searchUtils");

/**
 * GET /api/articles
 * Supports: ?category=&status=&minPrice=&maxPrice=&page=&limit=&search=
 */
const getArticles = async (req, res) => {
  const {
    category,
    status,
    minPrice,
    maxPrice,
    search,
    featured,
    auctionDate,
    page = 1,
    limit = 12,
  } = req.query;

  const filter = {};

  if (category) {
    const categories = category.split(",");
    filter.category =
      categories.length > 1 ? { $in: categories } : categories[0];
  }
  if (status) filter.status = status;
  if (featured === "true") filter.featured = true;
  if (auctionDate) filter.auctionDate = new Date(auctionDate);
  if (minPrice || maxPrice) {
    filter.estimatedPrice = {};
    if (minPrice) filter.estimatedPrice.$gte = Number(minPrice);
    if (maxPrice) filter.estimatedPrice.$lte = Number(maxPrice);
  }
  if (search) {
    const searchRegex = getAccentInsensitiveRegex(search);
    filter.$or = [
      { title: { $regex: searchRegex, $options: "i" } },
      { description: { $regex: searchRegex, $options: "i" } },
      { lotNumber: { $regex: search, $options: "i" } },
      { auctionLot: { $regex: search, $options: "i" } },
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
 * GET /api/articles/:id
 */
const getArticleById = async (req, res) => {
  const article = await Article.findById(req.params.id);
  if (!article) {
    return res.status(404).json({ message: "Artículo no encontrado." });
  }

  // Get active reservations and purchases for this article
  // Only count as active if article is not sold
  const activeReservation =
    article.status !== "sold"
      ? await Reservation.findOne({
          articleId: req.params.id,
          status: "pending",
        }).sort({ createdAt: -1 })
      : null;

  const activePurchases =
    article.status !== "sold"
      ? await Purchase.countDocuments({
          articleId: req.params.id,
          status: "pending",
        })
      : 0;

  // Include reservation/purchase counts in response
  const articleWithStatus = {
    ...article.toObject(),
    hasActiveReservation: !!activeReservation || article.status === "reserved",
    reservedUntil: activeReservation
      ? activeReservation.reservedUntil
      : article.reservedUntil,
    hasActivePurchase: activePurchases > 0,
  };

  res.json(articleWithStatus);
};

module.exports = { getArticles, getArticleById };
