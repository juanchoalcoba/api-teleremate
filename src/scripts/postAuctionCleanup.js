require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Article = require("../models/Article");
const connectDB = require("../config/db");

const cleanup = async () => {
  console.log("--------------------------------------------------");
  console.log("🚀 Iniciando Limpieza Post-Remate");
  console.log("--------------------------------------------------");

  try {
    await connectDB();

    // 1. Read files
    const path13 = path.join(__dirname, "../../vendidos13.json");
    const path14 = path.join(__dirname, "../../vendidos14.json");

    let soldItems = [];

    if (fs.existsSync(path13)) {
      const data13 = JSON.parse(fs.readFileSync(path13, "utf-8"));
      soldItems = soldItems.concat(data13);
    } else {
      console.log("⚠️ No se encontró vendidos13.json");
    }

    if (fs.existsSync(path14)) {
      const data14 = JSON.parse(fs.readFileSync(path14, "utf-8"));
      soldItems = soldItems.concat(data14);
    } else {
      console.log("⚠️ No se encontró vendidos14.json");
    }

    if (soldItems.length === 0) {
      console.log("No hay items vendidos para eliminar.");
    } else {
      console.log(`✅ Se encontraron ${soldItems.length} lotes vendidos.`);
      
      // 2. Delete sold items
      const deleteResult = await Article.deleteMany({ lotNumber: { $in: soldItems } });
      console.log(`🗑️ Se eliminaron ${deleteResult.deletedCount} artículos de la base de datos.`);
    }

    // 3. Move remaining 'remate' items to 'deposito'
    console.log("🔄 Moviendo artículos remanentes a Venta Directa (deposito)...");
    const updateResult = await Article.updateMany(
      { category: "remate" },
      { $set: { category: "deposito", status: "depot", auctionDate: null } }
    );
    
    console.log(`✅ Se actualizaron ${updateResult.modifiedCount} artículos a Venta Directa.`);

    mongoose.connection.close();
    console.log("🚀 Limpieza completada exitosamente.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error durante la limpieza:", error.message);
    mongoose.connection.close();
    process.exit(1);
  }
};

cleanup();
