require("dotenv").config();
const mongoose = require("mongoose");
const Article = require("./src/models/Article");

const MONGODB_URI = process.env.MONGODB_URI;

async function fix() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Conectado a MongoDB");

    // Corregir status 'available' a 'depot'
    const result = await Article.updateMany(
      { status: "available" },
      { $set: { status: "depot" } }
    );

    console.log(`\n🛠️  Resultado de la corrección:`);
    console.log(`   - Artículos corregidos de 'available' a 'depot': ${result.modifiedCount}`);

    // Verificar conteo final en deposito
    const finalDepotCount = await Article.countDocuments({ status: "depot" });
    console.log(`\n📊 Conteo final de artículos en 'Venta Directa' (depot): ${finalDepotCount}`);

    await mongoose.disconnect();
    console.log("\n🎉 Proceso completado exitosamente!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error en la corrección:", err);
    process.exit(1);
  }
}

fix();
