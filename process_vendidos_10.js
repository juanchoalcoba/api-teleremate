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

async function processVendidos10() {
  try {
    const filePath = path.join(__dirname, "vendidos10.json");
    if (!fs.existsSync(filePath)) {
      console.error("❌ No se encontró el archivo vendidos10.json en el directorio backend");
      process.exit(1);
    }

    const soldLotNumbers = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!Array.isArray(soldLotNumbers)) {
      console.error("❌ El formato de vendidos10.json debe ser un array de strings");
      process.exit(1);
    }

    console.log(`\n📦 Procesando ${soldLotNumbers.length} artículos del Domingo 10 de Mayo...`);

    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Conectado a MongoDB");

    // 1. Eliminar los artículos vendidos
    const deleteResult = await Article.deleteMany({ lotNumber: { $in: soldLotNumbers } });
    console.log(`\n🗑️  Artículos vendidos eliminados: ${deleteResult.deletedCount}`);

    // 2. Migrar los artículos restantes del Domingo 10 a Venta Directa (deposito)
    const day10Date = new Date("2026-05-10T00:00:00.000Z");
    
    // Contamos antes para verificar
    const remainingCount = await Article.countDocuments({ 
        auctionDate: day10Date 
    });
    console.log(`\n📦 Artículos restantes del 10 de Mayo a migrar: ${remainingCount}`);

    const updateResult = await Article.updateMany(
      { 
        auctionDate: day10Date
      },
      { 
        $set: { 
          category: "deposito",
          status: "available"
        },
        $unset: {
          auctionDate: "",
          auctionLot: ""
        }
      }
    );

    console.log(`✅ Artículos migrados a Venta Directa: ${updateResult.modifiedCount}`);

    await mongoose.disconnect();
    console.log("\n🎉 Proceso completado exitosamente!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error procesando:", err);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

processVendidos10();
