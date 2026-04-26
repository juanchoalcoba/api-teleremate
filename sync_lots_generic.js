require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Article = require("./src/models/Article");

const MONGODB_URI = process.env.MONGODB_URI;

async function syncLots(filename) {
  try {
    const filePath = path.join(__dirname, filename);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ No se encontró el archivo ${filename}`);
      process.exit(1);
    }

    const catalog = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!Array.isArray(catalog)) {
      console.error(`❌ El formato de ${filename} debe ser un array`);
      process.exit(1);
    }

    console.log(`\n📦 Sincronizando ${catalog.length} artículos del archivo ${filename}...`);

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Conectado a MongoDB");

    let updatedCount = 0;
    let notFoundCount = 0;

    for (const item of catalog) {
      const lotNumber = String(item.id);
      const auctionLot = String(item.numero);

      // Solo actualizamos el auctionLot, sin tocar el estado ni nada más
      const result = await Article.updateOne(
        { lotNumber: lotNumber },
        { $set: { auctionLot: auctionLot } }
      );

      if (result.matchedCount > 0) {
        updatedCount++;
      } else {
        notFoundCount++;
      }
    }

    console.log(`\n📊 Resumen de Sincronización (${filename}):`);
    console.log(`   - Artículos encontrados y actualizados: ${updatedCount}`);
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

// Obtener el nombre del archivo desde los argumentos o usar catalogo2.json por defecto
const filename = process.argv[2] || "catalogo2.json";
syncLots(filename);
