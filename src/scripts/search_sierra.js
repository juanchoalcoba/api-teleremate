require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Article = require("../models/Article");
const SellerSubmission = require("../models/SellerSubmission");

async function searchSierra() {
  try {
    await connectDB();
    console.log("Searching for articles/submissions around 3000 or containing 'sierra'...");

    const textQuery = {
      $or: [
        { title: { $regex: /sierra/i } },
        { description: { $regex: /sierra/i } }
      ]
    };

    const priceQuery = {
      estimatedPrice: { $gte: 2000, $lte: 4000 }
    };

    const combinedQuery = {
      $or: [
        { title: { $regex: /sierra/i } },
        { description: { $regex: /sierra/i } },
        { estimatedPrice: { $gte: 2500, $lte: 3500 } }
      ]
    };

    console.log("\n--- Searching in SellerSubmissions ---");
    const submissions = await SellerSubmission.find(combinedQuery).sort({ createdAt: -1 }).lean();
    if (submissions.length > 0) {
      submissions.forEach(s => {
        console.log(`ID: ${s._id}`);
        console.log(`Title: ${s.title}`);
        console.log(`Price: ${s.estimatedPrice} ${s.currency}`);
        console.log(`Status: ${s.status}`);
        console.log(`Seller: ${s.sellerName} (${s.sellerPhone})`);
        console.log(`Email: ${s.sellerEmail}`);
        console.log(`Created: ${s.createdAt}`);
        console.log(`Description: ${s.description.substring(0, 100)}...`);
        console.log("-------------------");
      });
    } else {
      console.log("No submissions found.");
    }

    console.log("\n--- Searching in Articles ---");
    const articles = await Article.find(combinedQuery).sort({ createdAt: -1 }).lean();
    if (articles.length > 0) {
      articles.forEach(a => {
        console.log(`ID: ${a._id}`);
        console.log(`Title: ${a.title}`);
        console.log(`Price: ${a.estimatedPrice} ${a.currency}`);
        console.log(`Status: ${a.status}`);
        console.log(`Category: ${a.category}`);
        console.log(`Lot: ${a.lotNumber}`);
        console.log(`Created: ${a.createdAt}`);
        console.log("-------------------");
      });
    } else {
      console.log("No articles found.");
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.connection.close();
    process.exit();
  }
}

searchSierra();
