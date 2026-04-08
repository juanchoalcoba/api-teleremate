/**
 * importCatalogo.js
 *
 * Importa los artículos de catalogo1.json y catalogo2.json a MongoDB como artículos "remate".
 *
 * ESTRATEGIA:
 *   1. Limpiar todos los artículos de categoría "remate".
 *   2. Iterar sobre los archivos JSON definidos.
 *   3. Upsert por lotNumber.
 *
 * USO: node src/seed/importCatalogo.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Article = require("../models/Article");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/teleremate";

// Definición de catálogos y sus fechas
const CATALOGS = [
  {
    file: "catalogo1.json",
    date: new Date("2026-04-11T00:00:00.000Z"),
  },
  {
    file: "catalogo2.json",
    date: new Date("2026-04-12T00:00:00.000Z"),
  },
];

async function importCatalogo() {
  // ── 1. Conectar a MongoDB ────────────────────────────────────────────────
  try {
    await mongoose.connect(MONGODB_URI, { dbName: "teleremate-db" });
    console.log("✅ Conectado a MongoDB (dbName: teleremate-db)");
  } catch (err) {
    console.error("❌ Error al conectar a MongoDB:", err.message);
    process.exit(1);
  }

  // ── 2. Limpieza previa (Opcional pero solicitado) ────────────────────────
  console.log('🧹 Limpiando artículos de categoría "remate" existentes...');
  const deleted = await Article.deleteMany({ category: "remate" });
  console.log(`🗑️  Se eliminaron ${deleted.deletedCount} artículos antiguos.\n`);

  let totalUpserted = 0;
  let totalErrored = 0;

  // ── 3. Procesar cada catálogo ─────────────────────────────────────────────
  for (const catInfo of CATALOGS) {
    const jsonPath = path.join(__dirname, "../../", catInfo.file);

    if (!fs.existsSync(jsonPath)) {
      console.error(`❌ No se encontró: ${jsonPath}. Saltando...`);
      continue;
    }

    console.log(`📖 Procesando ${catInfo.file}...`);
    let catalog;
    try {
      catalog = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    } catch (e) {
      console.error(`  ❌ Error al parsear ${catInfo.file}:`, e.message);
      continue;
    }

    if (!Array.isArray(catalog)) {
      console.error(`  ❌ ${catInfo.file} no es un array válido.`);
      continue;
    }

    let fileUpserted = 0;
    let fileErrored = 0;

    for (const item of catalog) {
      const lotNumber = String(item.id || item.numero);
      const description = (item.descripcion || "").trim();
      const title =
        description.length > 80
          ? description.substring(0, 80).trimEnd() + "…"
          : description;

      const images = (item.imagenes || [])
        .filter((url) => typeof url === "string" && url.startsWith("http"))
        .map((url) => ({ url }));

      const articleData = {
        lotNumber,
        title,
        description,
        category: "remate",
        status: "upcoming",
        condition: "Bueno",
        estimatedPrice: Number(item.precio) || 0,
        auctionDate: catInfo.date,
        featured: false,
        images,
      };

      try {
        await Article.findOneAndUpdate(
          { lotNumber },
          { $set: articleData },
          { upsert: true, returnDocument: "after" },
        );
        fileUpserted++;
      } catch (err) {
        console.error(`  ⚠️  Error en lote ${lotNumber}: ${err.message}`);
        fileErrored++;
      }
    }

    console.log(`  ✅ ${fileUpserted} artículos importados de ${catInfo.file}`);
    if (fileErrored > 0) console.log(`  ⚠️  ${fileErrored} errores en este archivo.`);
    
    totalUpserted += fileUpserted;
    totalErrored += fileErrored;
  }

  // ── 4. Resumen Final ──────────────────────────────────────────────────────
  console.log("\n-------------------------------------------");
  console.log("📋 IMPORTACIÓN COMPLETADA");
  console.log(`   ✅ Total Procesados OK : ${totalUpserted}`);
  if (totalErrored > 0) console.log(`   ⚠️  Total Con Errores  : ${totalErrored}`);
  
  const finalCount = await Article.countDocuments({ category: "remate" });
  console.log(`   📊 Total "remate" en BD: ${finalCount}`);
  console.log("-------------------------------------------\n");

  await mongoose.disconnect();
  console.log("👋 Desconectado de MongoDB\n");
  process.exit(0);
}

importCatalogo().catch((err) => {
  console.error("❌ Error crítico:", err);
  process.exit(1);
});

