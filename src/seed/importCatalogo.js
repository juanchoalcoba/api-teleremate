/**
 * importCatalogo.js
 *
 * Importa los artículos de catalogo.json a MongoDB como artículos "A Rematar".
 *
 * ESTRATEGIA: upsert por lotNumber (= campo "id" del JSON).
 *   - Si el artículo ya existe → se actualiza.
 *   - Si no existe → se crea.
 *   - Artículos ya cargados con otros lotNumbers → intactos.
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

// Fecha del remate
const AUCTION_DATE = new Date("2026-03-21T00:00:00.000Z");

async function importCatalogo() {
  // ── 1. Leer JSON ──────────────────────────────────────────────────────────
  const jsonPath = path.join(__dirname, "../../catalogo.json");

  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ No se encontró: ${jsonPath}`);
    process.exit(1);
  }

  let catalog;
  try {
    catalog = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  } catch (e) {
    console.error("❌ Error al parsear catalogo.json:", e.message);
    process.exit(1);
  }

  if (!Array.isArray(catalog) || catalog.length === 0) {
    console.error("❌ catalogo.json está vacío o no es un array válido.");
    process.exit(1);
  }

  console.log(`📦 ${catalog.length} artículos encontrados en catalogo.json`);

  // ── 2. Conectar a MongoDB ────────────────────────────────────────────────
  await mongoose.connect(MONGODB_URI, { dbName: "teleremate-db" });
  console.log("✅ Conectado a MongoDB (dbName: teleremate-db)");


  // ── 3. Importar con upsert ────────────────────────────────────────────────
  let upserted = 0;
  let errored = 0;

  for (const item of catalog) {
    // El "id" del JSON es el identificador único del lote
    const lotNumber = String(item.id || item.numero);

    // Descripción completa como descripción; título truncado para display
    const description = (item.descripcion || "").trim();
    const title =
      description.length > 80
        ? description.substring(0, 80).trimEnd() + "…"
        : description;

    // Las imágenes vienen como array de strings (URLs absolutas)
    // Se mapean al formato { url } que usa el modelo Article
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
      auctionDate: AUCTION_DATE,
      featured: false,
      images,
    };

    try {
      await Article.findOneAndUpdate(
        { lotNumber },
        { $set: articleData },
        { upsert: true, returnDocument: "after" }
      );
      upserted++;
    } catch (err) {
      console.error(`  ⚠️  Error en lote ${lotNumber}: ${err.message}`);
      errored++;
    }

    // Feedback cada 50 artículos
    if (upserted % 50 === 0 && upserted > 0) {
      console.log(`  ⏳ ${upserted}/${catalog.length} procesados…`);
    }
  }

  // ── 4. Resumen ─────────────────────────────────────────────────────────────
  const totalRemate = await Article.countDocuments({ category: "remate" });

  console.log("\n📋 IMPORTACIÓN COMPLETADA");
  console.log(`   ✅ Procesados OK : ${upserted}`);
  if (errored > 0) console.log(`   ⚠️  Con errores  : ${errored}`);
  console.log(`   📊 Total "A Rematar" en BD: ${totalRemate}`);

  await mongoose.disconnect();
  console.log("👋 Desconectado de MongoDB\n");
  process.exit(0);
}

importCatalogo().catch((err) => {
  console.error("❌ Error crítico:", err);
  process.exit(1);
});
