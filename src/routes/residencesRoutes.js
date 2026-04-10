const express = require("express");
const router = express.Router();
const { getResidenceArticles } = require("../controllers/residencesController");
const { protect, authorize } = require("../middleware/auth");

// All routes require authentication and admin role
router.use(protect);
router.use(authorize("admin"));

router.get("/", getResidenceArticles);

module.exports = router;
