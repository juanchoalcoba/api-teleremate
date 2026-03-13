const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const { protect, authorize } = require("../middleware/auth");
const submissionController = require("../controllers/submissionController");

// All admin routes require auth and admin role
router.use(protect);
router.use(authorize("admin"));

router.get("/", asyncHandler(submissionController.getAllSubmissions));
router.get("/:id", asyncHandler(submissionController.getSubmissionById));
router.put("/:id/approve", asyncHandler(submissionController.approveSubmission));
router.put("/:id/reject", asyncHandler(submissionController.rejectSubmission));

module.exports = router;
