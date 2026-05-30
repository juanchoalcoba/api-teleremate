require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Article = require("../models/Article");
const SellerSubmission = require("../models/SellerSubmission");

async function recoverSierra() {
  try {
    await connectDB();
    const submissionId = "69ee503b0d158e1553f2036c";
    const submission = await SellerSubmission.findById(submissionId);

    if (!submission) {
      console.error("Submission not found.");
      return;
    }

    console.log(`Recovering: ${submission.title}`);

    // Generate lotNumber: SUB-TIMESTAMP (or use a fresh one)
    const lotNumber = `REC-${Date.now()}`; // REC for Recovered

    // Transform images from String[] (urls) to [{ filename, url }]
    const transformedImages = submission.images.map((url, index) => {
      const filename = url.split("/").pop() || `submission-image-${index}`;
      return { filename, url };
    });

    // Create new Article
    const article = new Article({
      lotNumber,
      title: submission.title,
      description: submission.description,
      category: "deposito",
      condition: "Bueno",
      status: "depot",
      estimatedPrice: submission.estimatedPrice,
      currency: submission.currency || "UYU",
      images: transformedImages,
      metadata: {
        sellerSubmissionId: submission._id,
        sellerName: submission.sellerName,
        sellerPhone: submission.sellerPhone,
        pickupLocation: submission.pickupLocation,
        usageYears: submission.usageYears,
        conditionDetails: submission.conditionDetails,
        recoveryDate: new Date(),
      },
    });

    await article.save();
    console.log(`✅ Article created with ID: ${article._id} and Lot: ${lotNumber}`);

    // Update submission status and link
    submission.status = "approved";
    submission.approvedArticleId = article._id;
    await submission.save();
    console.log(`✅ Submission updated with new article link.`);

    console.log("\n--- RECOVERY COMPLETE ---");
    console.log(`Title: ${article.title}`);
    console.log(`Price: ${article.estimatedPrice} ${article.currency}`);
    console.log(`Seller: ${submission.sellerName} (${submission.sellerPhone})`);

  } catch (error) {
    console.error("Error during recovery:", error);
  } finally {
    await mongoose.connection.close();
    process.exit();
  }
}

recoverSierra();
