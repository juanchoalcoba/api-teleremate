const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Article = require("../src/models/Article");

const MONGODB_URI = process.env.MONGODB_URI;

async function cleanRemateArticles() {
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI no está definido en el archivo .env");
    process.exit(1);
  }

  try {
    console.log("🔌 Conectando a MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Conectado a MongoDB con éxito\n");

    const countBefore = await Article.countDocuments({ category: "remate" });
    console.log(`📊 Total de artículos de categoría "remate" antes de eliminar: ${countBefore}`);

    const result = await Article.deleteMany({ category: "remate" });
    console.log(`🗑️ Se eliminaron ${result.deletedCount} artículos de categoría "remate".\n`);

    const countAfterRemate = await Article.countDocuments({ category: "remate" });
    const countDeposito = await Article.countDocuments({ category: "deposito" });
    const countVehiculos = await Article.countDocuments({ category: "vehiculo" });
    const countInmuebles = await Article.countDocuments({ category: "inmueble" });

    console.log("==================================================");
    console.log("📋 ESTADO ACTUAL DE LA BASE DE DATOS:");
    console.log(`   - Remate       : ${countAfterRemate} (esperado 0)`);
    console.log(`   - Venta Directa: ${countDeposito}`);
    console.log(`   - Vehículos    : ${countVehiculos}`);
    console.log(`   - Inmuebles    : ${countInmuebles}`);
    console.log("==================================================\n");

    await mongoose.disconnect();
    console.log("👋 Desconectado de MongoDB con éxito");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error crítico durante la limpieza:", err);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

cleanRemateArticles();
