const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Article = require("../src/models/Article");

async function checkRemates() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const rematesByDate = await Article.aggregate([
    { $match: { category: "remate" } },
    { $group: { _id: "$auctionDate", count: { $sum: 1 } } }
  ]);
  
  console.log("Remate articles by auctionDate:", rematesByDate);

  const rematesByStatus = await Article.aggregate([
    { $match: { category: "remate" } },
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);
  
  console.log("Remate articles by status:", rematesByStatus);

  await mongoose.disconnect();
}

checkRemates().catch(console.error);
