require("dotenv").config();
const mongoose = require("mongoose");
const Article = require("../src/models/Article");

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const articles = await Article.find({
      category: "deposito",
      auctionDate: { $ne: null },
    })
      .select("lotNumber title condition auctionDate")
      .lean();
    console.log("Count with auctionDate:", articles.length);
    console.log(articles.slice(0, 10));

    // Also let's check what auctionDates exist in the DB (any category)
    const dates = await Article.aggregate([
      { $group: { _id: "$auctionDate", count: { $sum: 1 } } },
    ]);
    console.log("Auction Dates:", dates);

    await mongoose.disconnect();
  } catch (e) {
    console.error(e);
  }
}
run();
