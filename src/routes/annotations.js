const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const { createAnnotation } = require("../controllers/annotationController");

// GET /api/annotations/test
router.get("/test", (req, res) => res.json({ message: "Annotations route is active" }));

// POST /api/annotations
router.post("/", asyncHandler(createAnnotation));

module.exports = router;
