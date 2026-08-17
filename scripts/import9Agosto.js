const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const fs = require("fs");
const Article = require("../src/models/Article");

const MONGODB_URI = process.env.MONGODB_URI;

async function import9Agosto() {
  try {
    const filePath = path.join(__dirname, "..", "9agosto.json");
    if (!fs.existsSync(filePath)) {
      console.error("❌ No se encontró el archivo 9agosto.json");
      process.exit(1);
    }

    const catalog = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!Array.isArray(catalog)) {
      console.error("❌ El formato de 9agosto.json debe ser un array");
      process.exit(1);
    }

    console.log(`\n📦 Sincronizando ${catalog.length} artículos de 9agosto.json...`);

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Conectado a MongoDB");

    const targetDate = new Date("2026-08-09T00:00:00.000Z");
    console.log("🧹 Limpiando artículos previos con fecha 9 de Agosto de 2026...");
    const deleted = await Article.deleteMany({ category: "remate", auctionDate: targetDate });
    console.log(`🗑️ Se eliminaron ${deleted.deletedCount} artículos anteriores para esa fecha.\n`);

    let importedCount = 0;
    let errorCount = 0;

    for (const item of catalog) {
      const lotNumber = String(item.id);
      const auctionLot = String(item.numero);
      const description = (item.descripcion || "").trim();
      const title = description.length > 80
        ? description.substring(0, 80).trimEnd() + "…"
        : description;

      const images = (item.imagenes || [])
        .filter((url) => typeof url === "string" && url.startsWith("http"))
        .map((url) => ({ url }));

      const articleData = {
        lotNumber,
        auctionLot,
        title,
        description,
        category: "remate",
        status: "upcoming",
        condition: "Excelente",
        isNewCondition: false,
        estimatedPrice: Number(item.precio) || 0,
        auctionDate: targetDate,
        featured: false,
        images,
      };

      try {
        await Article.findOneAndUpdate(
          { lotNumber },
          { $set: articleData },
          { upsert: true, returnDocument: "after" }
        );
        importedCount++;
      } catch (err) {
        console.error(`⚠️ Error al importar lote ${lotNumber}: ${err.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 Resumen de Importación (9agosto.json):`);
    console.log(`   - Artículos importados con éxito: ${importedCount}`);
    console.log(`   - Errores: ${errorCount}`);

    await mongoose.disconnect();
    console.log("\n🎉 Sincronización finalizada!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error crítico en la importación:", err);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

import9Agosto();
