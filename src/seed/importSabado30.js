require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Article = require("../models/Article");

const MONGODB_URI = process.env.MONGODB_URI;

async function importSabado30() {
  try {
    const filePath = path.join(__dirname, "../../sabado30.json");
    if (!fs.existsSync(filePath)) {
      console.error("❌ No se encontró el archivo sabado30.json en backend/");
      process.exit(1);
    }

    const catalog = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!Array.isArray(catalog)) {
      console.error("❌ El formato de sabado30.json debe ser un array");
      process.exit(1);
    }

    console.log(`\n📦 Sincronizando ${catalog.length} artículos de sabado30.json...`);

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Conectado a MongoDB");

    const targetDate = new Date("2026-05-30T00:00:00.000Z");
    console.log("🧹 Limpiando artículos previos con fecha 30 de Mayo de 2026...");
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
        condition: "Bueno",
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

    console.log(`\n📊 Resumen de Importación (sabado30.json):`);
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

importSabado30();
