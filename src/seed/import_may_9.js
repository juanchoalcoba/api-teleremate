/**
 * import_may_9.js
 *
 * Importa los artículos de catalogo2.json a MongoDB como artículos "remate"
 * para el Sábado 9 de Mayo.
 *
 * ESTRATEGIA:
 *   1. NO limpia ni borra artículos existentes.
 *   2. Guarda el número original en `auctionLot`.
 *
 * USO: node src/seed/import_may_9.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Article = require("../models/Article");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/teleremate";

// Definición exclusiva de la importación del Sábado 9 de Mayo
const CATALOGS = [
  {
    file: "catalogo2.json",
    date: new Date("2026-05-09T00:00:00.000Z"),
  },
];

async function importMay9() {
  // ── 1. Conectar a MongoDB ────────────────────────────────────────────────
  try {
    await mongoose.connect(MONGODB_URI, { dbName: "teleremate-db" });
    console.log("✅ Conectado a MongoDB (dbName: teleremate-db)");
  } catch (err) {
    console.error("❌ Error al conectar a MongoDB:", err.message);
    process.exit(1);
  }

  // NO HACEMOS LIMPIEZA PREVIA PARA NO BORRAR ARTÍCULOS VIEJOS
  console.log('🚀 Iniciando importación SEGURA (sin borrar) para Sábado 9 de Mayo...');

  let totalUpserted = 0;
  let totalErrored = 0;

  // ── 2. Procesar el catálogo ─────────────────────────────────────────────
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
      // USAR item.id para lotNumber (Ref) y item.numero para auctionLot (Lote)
      const lotNumber = String(item.id || item.numero);
      const auctionLot = String(item.numero || item.id);
      
      const description = (item.descripcion || "").trim();
      const title =
        description.length > 80
          ? description.substring(0, 80).trimEnd() + "…"
          : description;

      const images = (item.imagenes || [])
        .filter((url) => typeof url === "string" && url.startsWith("http"))
        .map((url) => ({ url }));

      const articleData = {
        lotNumber,            // Ej. 55854 (Ref)
        auctionLot,           // Ej. 1, 2, 3... (Lote)
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
    if (fileErrored > 0)
      console.log(`  ⚠️  ${fileErrored} errores en este archivo.`);

    totalUpserted += fileUpserted;
    totalErrored += fileErrored;
  }

  // ── 3. Resumen Final ──────────────────────────────────────────────────────
  console.log("\n-------------------------------------------");
  console.log("📋 IMPORTACIÓN COMPLETADA");
  console.log(`   ✅ Total Procesados OK : ${totalUpserted}`);
  if (totalErrored > 0)
    console.log(`   ⚠️  Total Con Errores  : ${totalErrored}`);

  const finalCount = await Article.countDocuments({ auctionDate: CATALOGS[0].date });
  console.log(`   📊 Total artículos del 9 de Mayo en BD: ${finalCount}`);
  console.log("-------------------------------------------\n");

  await mongoose.disconnect();
  console.log("👋 Desconectado de MongoDB\n");
  process.exit(0);
}

importMay9().catch((err) => {
  console.error("❌ Error crítico:", err);
  process.exit(1);
});
