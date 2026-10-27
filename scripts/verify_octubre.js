require("dotenv").config();
const mongoose = require("mongoose");
const Article = require("../src/models/Article");

async function verify() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB");

  const totalRemate = await Article.countDocuments({ category: "remate" });
  console.log(`Total remate: ${totalRemate}`);

  const sabado10 = await Article.countDocuments({
    category: "remate",
    auctionDate: new Date("2026-10-10T00:00:00.000Z"),
  });
  console.log(`Sábado 10: ${sabado10}`);

  const domingo11 = await Article.countDocuments({
    category: "remate",
    auctionDate: new Date("2026-10-11T00:00:00.000Z"),
  });
  console.log(`Domingo 11: ${domingo11}`);

  const sampleSabado = await Article.findOne({
    category: "remate",
    auctionDate: new Date("2026-10-10T00:00:00.000Z"),
  }).sort({ auctionLot: 1 }).collation({ locale: "en_US", numericOrdering: true });
  console.log("Primer lote Sabado 10:", {
    lotNumber: sampleSabado?.lotNumber,
    auctionLot: sampleSabado?.auctionLot,
    title: sampleSabado?.title,
    estimatedPrice: sampleSabado?.estimatedPrice,
    images: sampleSabado?.images?.length,
  });

  const sampleDomingo = await Article.findOne({
    category: "remate",
    auctionDate: new Date("2026-10-11T00:00:00.000Z"),
  }).sort({ auctionLot: 1 }).collation({ locale: "en_US", numericOrdering: true });
  console.log("Primer lote Domingo 11:", {
    lotNumber: sampleDomingo?.lotNumber,
    auctionLot: sampleDomingo?.auctionLot,
    title: sampleDomingo?.title,
    estimatedPrice: sampleDomingo?.estimatedPrice,
    images: sampleDomingo?.images?.length,
  });

  await mongoose.disconnect();
}

verify().catch(console.error);
