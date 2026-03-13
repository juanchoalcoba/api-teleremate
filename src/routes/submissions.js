const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const submissionController = require("../controllers/submissionController");
const { upload } = require("../middleware/upload");

router.post("/", asyncHandler(submissionController.createSubmission));
router.post(
  "/images",
  upload.array("images", 5),
  asyncHandler(submissionController.uploadPublicImages),
);

module.exports = router;
