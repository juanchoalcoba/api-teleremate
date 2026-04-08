const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const { protect, authorize } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const {
  getAllArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  uploadImage,
  deleteImage,
  getDashboard,
} = require("../controllers/adminController");
const {
  getAllReservations,
  updateReservationStatus,
  deleteReservation,
} = require("../controllers/reservationsController");
const {
  getAllPurchases,
  updatePurchaseStatus,
  deletePurchase,
} = require("../controllers/purchasesController");
const {
  getAllAnnotations,
  deleteAnnotation,
} = require("../controllers/annotationController");

// All admin routes require auth and admin role
router.use(protect);
router.use(authorize("admin"));

// Dashboard
router.get("/dashboard", asyncHandler(getDashboard));

// Articles CRUD
router.get("/articles", asyncHandler(getAllArticles));
router.post("/articles", asyncHandler(createArticle));
router.put("/articles/:id", asyncHandler(updateArticle));
router.delete("/articles/:id", asyncHandler(deleteArticle));

// Images
router.post(
  "/articles/:id/images",
  upload.array("images", 10),
  asyncHandler(uploadImage),
);
router.delete("/articles/:id/images/:filename", asyncHandler(deleteImage));

// Reservations CRUD
router.get("/reservations", asyncHandler(getAllReservations));
router.put("/reservations/:id", asyncHandler(updateReservationStatus));
router.delete("/reservations/:id", asyncHandler(deleteReservation));

// Purchases CRUD
router.get("/purchases", asyncHandler(getAllPurchases));
router.put("/purchases/:id", asyncHandler(updatePurchaseStatus));
router.delete("/purchases/:id", asyncHandler(deletePurchase));

// Annotations CRUD
router.get("/annotations", asyncHandler(getAllAnnotations));
router.delete("/annotations/:id", asyncHandler(deleteAnnotation));

module.exports = router;
