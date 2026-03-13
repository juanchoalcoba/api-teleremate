const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const {
  getArticles,
  getArticleById,
} = require("../controllers/articlesController");

// GET /api/articles
router.get("/", asyncHandler(getArticles));

// GET /api/articles/:id
router.get("/:id", asyncHandler(getArticleById));

module.exports = router;
