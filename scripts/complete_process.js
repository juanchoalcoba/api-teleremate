const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const fs = require("fs");
const Article = require("../src/models/Article");

const DAYS = [
  { fileName: "viernes25.json", label: "Viernes 25" },
  { fileName: "sabado26.json", label: "Sábado 26" },
  { fileName: "domingo27.json", label: "Domingo 27" },
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Conectado a MongoDB");

  let allSold = [];
  for (const day of DAYS) {
    const fPath = path.join(__dirname, "..", day.fileName);
    const list = JSON.parse(fs.readFileSync(fPath, "utf8"));
    const stringIds = list.map(x => (typeof x === "object" ? String(x.id || x.numero) : String(x)).trim());
    console.log(`📁 ${day.label} (${day.fileName}): ${stringIds.length} IDs vendidos`);
    allSold.push(...stringIds);
  }

  allSold = [...new Set(allSold)];
  console.log(`\n📦 Total de IDs vendidos únicos en los 3 días: ${allSold.length}`);

  // Verificar cuántos existen en la base de datos actualmente
  const existingSold = await Article.countDocuments({ lotNumber: { $in: allSold } });
  console.log(`🔍 Artículos vendidos encontrados en la BD: ${existingSold}`);

  // Eliminar todos los artículos vendidos
  const deleteResult = await Article.deleteMany({ lotNumber: { $in: allSold } });
  console.log(`🗑️  Artículos vendidos ELIMINADOS de la BD: ${deleteResult.deletedCount}`);

  // Comprobar si quedó algún artículo en 'remate' sin migrar
  const remainingRemate = await Article.find({ category: "remate" });
  console.log(`\n🔍 Artículos en categoría 'remate' restantes: ${remainingRemate.length}`);

  if (remainingRemate.length > 0) {
    for (const art of remainingRemate) {
      art.category = "deposito";
      art.status = "depot";
      art.auctionLot = "";
      art.auctionDate = null;
      art.createdAt = new Date();
      await art.save();
    }
    console.log(`✅ Se migraron ${remainingRemate.length} artículos restantes a Venta Directa.`);
  }

  // Estado final
  const totalRemateFinal = await Article.countDocuments({ category: "remate" });
  const totalDepositoFinal = await Article.countDocuments({ category: "deposito", status: "depot" });

  console.log("\n==================================================");
  console.log("🎉 ESTADO FINAL DE LA BASE DE DATOS");
  console.log("==================================================");
  console.log(`🗑️  Total artículos vendidos eliminados : ${deleteResult.deletedCount}`);
  console.log(`🏷️  Artículos en remate (debe ser 0)     : ${totalRemateFinal}`);
  console.log(`🏪 Total artículos activos en V. Directa: ${totalDepositoFinal}`);
  console.log("==================================================\n");

  await mongoose.disconnect();
  console.log("👋 Desconectado de MongoDB");
  process.exit(0);
}

run();
