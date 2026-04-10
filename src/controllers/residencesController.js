const Article = require("../models/Article");
const Purchase = require("../models/Purchase");
const Reservation = require("../models/Reservation");
const asyncHandler = require("express-async-handler");

/**
 * @desc    Get all articles that were submitted from homes (External Entries)
 * @route   GET /api/backoffice/residences
 * @access  Private/Admin
 */
const getResidenceArticles = asyncHandler(async (req, res) => {
  // Query for articles that have seller metadata
  const articles = await Article.find({
    "metadata.sellerSubmissionId": { $exists: true }
  }).sort({ createdAt: -1 });

  // For each article, fetch associated buyer/reserver info
  const enrichedArticles = await Promise.all(
    articles.map(async (article) => {
      const articleObj = article.toObject();
      let customerInfo = null;

      // Check if it's sold
      if (article.status === "sold") {
        const purchase = await Purchase.findOne({ articleId: article._id, status: { $ne: "cancelled" } })
          .sort({ createdAt: -1 });
        if (purchase) {
          customerInfo = {
            type: "buyer",
            fullName: purchase.fullName,
            phone: purchase.phone,
            deliveryMethod: purchase.deliveryMethod,
            deliveryAddress: purchase.deliveryAddress,
            date: purchase.createdAt
          };
        }
      } 
      // Check if it's reserved
      else if (article.status === "reserved") {
        const reservation = await Reservation.findOne({ articleId: article._id, status: "pending" })
          .sort({ createdAt: -1 });
        if (reservation) {
          customerInfo = {
            type: "reserver",
            fullName: reservation.fullName,
            phone: reservation.phone,
            date: reservation.createdAt
          };
        }
      }

      return {
        ...articleObj,
        customerInfo
      };
    })
  );

  res.json(enrichedArticles);
});

module.exports = {
  getResidenceArticles
};
