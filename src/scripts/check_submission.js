require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Article = require("../models/Article");
const SellerSubmission = require("../models/SellerSubmission");

async function checkSubmission() {
  try {
    await connectDB();
    const submissionId = "69ee503b0d158e1553f2036c";
    const submission = await SellerSubmission.findById(submissionId).lean();

    if (submission) {
      console.log("--- Submission Found ---");
      console.log(JSON.stringify(submission, null, 2));

      if (submission.approvedArticleId) {
        console.log("\n--- Linked Article ---");
        const article = await Article.findById(submission.approvedArticleId).lean();
        if (article) {
          console.log(JSON.stringify(article, null, 2));
        } else {
          console.log("Linked article ID exists in submission but Article not found in database!");
        }
      } else {
        console.log("\nNo approvedArticleId linked to this submission.");
      }
    } else {
      console.log("Submission not found.");
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.connection.close();
    process.exit();
  }
}

checkSubmission();
