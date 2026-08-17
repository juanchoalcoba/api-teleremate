const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Article = require("../src/models/Article");

async function checkFinal() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const total = await Article.countDocuments();
  const deposito = await Article.countDocuments({ category: "deposito" });
  const remate = await Article.countDocuments({ category: "remate" });
  
  console.log("=== ESTADO FINAL DE LA BASE DE DATOS ===");
  console.log(`Total de artículos: ${total}`);
  console.log(`Venta Directa (categoría 'deposito'): ${deposito}`);
  console.log(`Próximo Remate (categoría 'remate'): ${remate}`);

  const rematesByDate = await Article.aggregate([
    { $match: { category: "remate" } },
    { $group: { _id: "$auctionDate", count: { $sum: 1 } } }
  ]);
  console.log("Distribución de remates activos por fecha:", rematesByDate);

  await mongoose.disconnect();
}

checkFinal().catch(console.error);
