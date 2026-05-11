require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Article = require("./src/models/Article");

const MONGODB_URI = process.env.MONGODB_URI;

async function check() {
  await mongoose.connect(MONGODB_URI);
  const soldIds = JSON.parse(fs.readFileSync(path.join(__dirname, "vendidos10.json"), "utf8"));
  
  const soldCount = await Article.countDocuments({ lotNumber: { $in: soldIds } });
  console.log(`Artículos vendidos a eliminar: ${soldCount} de ${soldIds.length} listados`);
  
  // Find remaining from day 10. The user says "Domingo 10 de Mayo". 
  // In frontend we see: auctionDate: "2026-05-10T00:00:00.000Z"
  const day10Date = new Date("2026-05-10T00:00:00.000Z");
  
  const remainingCount = await Article.countDocuments({ 
    auctionDate: day10Date, 
    lotNumber: { $nin: soldIds } 
  });
  
  console.log(`Artículos sobrantes del día 10 a migrar a venta directa: ${remainingCount}`);
  
  // Muestra un ejemplo de artículo sobrante
  const sample = await Article.findOne({ auctionDate: day10Date, lotNumber: { $nin: soldIds } });
  if (sample) {
      console.log("Ejemplo de artículo a migrar:");
      console.log(JSON.stringify(sample, null, 2));
  }

  await mongoose.disconnect();
}

check();
