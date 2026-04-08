const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const { createAnnotation } = require("../controllers/annotationController");

// POST /api/annotations
router.post("/", asyncHandler(createAnnotation));

module.exports = router;
