require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Article = require("./src/models/Article");

const MONGODB_URI = process.env.MONGODB_URI;

async function syncAuctionLots() {
  try {
    const filePath = path.join(__dirname, "vendidos.json");
    if (!fs.existsSync(filePath)) {
      console.error("❌ No se encontró el archivo vendidos.json");
      process.exit(1);
    }

    const catalog = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!Array.isArray(catalog)) {
      console.error("❌ El formato de vendidos.json debe ser un array");
      process.exit(1);
    }

    console.log(`\n📦 Sincronizando ${catalog.length} artículos del catálogo...`);

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Conectado a MongoDB");

    let updatedCount = 0;
    let notFoundCount = 0;
    let soldMarkedCount = 0;

    for (const item of catalog) {
      const lotNumber = String(item.id);
      const auctionLot = String(item.numero);
      const isSold = item.vendido === true;

      const updateData = {
        $set: {
          auctionLot: auctionLot
        }
      };

      // Si en el JSON dice que está vendido, aseguramos el estado en BD
      if (isSold) {
        updateData.$set.status = "sold";
        // Si no tiene fecha de venta, le ponemos hoy
        updateData.$set.soldAt = new Date();
      } else {
        // Si no está vendido en el JSON, nos aseguramos que esté como 'upcoming'
        // SOLO si pertenece a la categoría de remate (para no romper artículos de depósito)
        const article = await Article.findOne({ lotNumber });
        if (article && article.category === "remate") {
           updateData.$set.status = "upcoming";
        }
      }

      const result = await Article.updateOne(
        { lotNumber: lotNumber },
        updateData
      );

      if (result.matchedCount > 0) {
        updatedCount++;
        if (isSold) soldMarkedCount++;
      } else {
        notFoundCount++;
      }
    }

    console.log(`\n📊 Resumen de Sincronización:`);
    console.log(`   - Artículos encontrados y actualizados: ${updatedCount}`);
    console.log(`   - Artículos marcados como VENDIDOS: ${soldMarkedCount}`);
    console.log(`   - Artículos no encontrados en la BD: ${notFoundCount}`);

    await mongoose.disconnect();
    console.log("\n🎉 Sincronización completada exitosamente!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error durante la sincronización:", err);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

syncAuctionLots();
