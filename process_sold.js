require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Article = require("./src/models/Article");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI no está definida en el archivo .env");
  process.exit(1);
}

async function processSold() {
  try {
    // Leer el archivo vendidos.json
    const filePath = path.join(__dirname, "vendidos.json");
    if (!fs.existsSync(filePath)) {
      console.error("❌ No se encontró el archivo vendidos.json en el directorio backend");
      process.exit(1);
    }

    const soldLotNumbers = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!Array.isArray(soldLotNumbers)) {
      console.error("❌ El formato de vendidos.json debe ser un array de strings");
      process.exit(1);
    }

    console.log(`\n📦 Procesando ${soldLotNumbers.length} artículos vendidos...`);

    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Conectado a MongoDB");

    // Realizar la actualización masiva
    // Solo actualizamos aquellos que están en estado 'upcoming' (Próximo Remate)
    // para evitar sobreescribir otros estados por error si se repiten IDs.
    const result = await Article.updateMany(
      { 
        lotNumber: { $in: soldLotNumbers },
        status: "upcoming" // Seguridad: solo pasar a vendido lo que estaba para rematar
      },
      { 
        $set: { 
          status: "sold",
          soldAt: new Date()
        } 
      }
    );

    console.log(`\n📊 Resumen de la operación:`);
    console.log(`   - Artículos encontrados y actualizados: ${result.modifiedCount}`);
    console.log(`   - Artículos que no estaban en 'Próximo Remate' o no existen: ${soldLotNumbers.length - result.modifiedCount}`);

    // Verificar si hay artículos que ya eran 'sold'
    const alreadySold = await Article.countDocuments({
        lotNumber: { $in: soldLotNumbers },
        status: "sold"
    });
    console.log(`   - Artículos que ahora están marcados como 'Vendido': ${alreadySold}`);

    await mongoose.disconnect();
    console.log("\n🎉 Proceso completado exitosamente!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error procesando artículos vendidos:", err);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

processSold();
