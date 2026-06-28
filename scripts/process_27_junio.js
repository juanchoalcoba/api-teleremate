require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Article = require("../src/models/Article");

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Conectado a MongoDB.");

    const file = path.join(__dirname, "..", "vendidos27junio.json");
    if (!fs.existsSync(file)) {
      console.error(`❌ No se encontró ${file}`);
      process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    const soldArticles = data.filter(item => item.vendido === true);
    // Use the ID from the object (id corresponds to lotNumber in DB)
    const soldIds = soldArticles.map(item => item.id ? item.id.toString() : null).filter(Boolean);
    
    console.log(`📦 Total de artículos vendidos (vendido: true) a borrar: ${soldIds.length}`);

    if (soldIds.length > 0) {
      const deleteResult = await Article.deleteMany({
        lotNumber: { $in: soldIds }
      });
      console.log(
        `🗑️ Se borraron ${deleteResult.deletedCount} artículos vendidos en base al JSON.`,
      );
    }

    // Pasar lo que queda de 27 de junio a venta directa
    const unsoldStats = await Article.countDocuments({ 
      category: "remate", 
      auctionDate: new Date("2026-06-27T00:00:00.000Z") 
    });
    console.log(
      `\n🔄 Artículos del 27 de junio restantes para pasar a venta directa: ${unsoldStats}`,
    );

    if (unsoldStats > 0) {
      const resultCategory = await Article.collection.updateMany(
        { category: "remate", auctionDate: new Date("2026-06-27T00:00:00.000Z") },
        {
          $set: {
            category: "deposito",
            auctionLot: "",
            auctionDate: null,
            createdAt: new Date(),
          },
        }
      );
      console.log(
        `🏷️ Se actualizaron ${resultCategory.modifiedCount} artículos a categoría 'deposito'.`,
      );

      const statusResult = await Article.updateMany(
        { category: "deposito", status: "upcoming" },
        { $set: { status: "depot" } }
      );
      console.log(
        `✅ Se actualizó el status a 'depot' en artículos de deposito.`,
      );
    } else {
      console.log("No hay artículos en remate del 27 de junio para migrar a venta directa.");
    }

    await mongoose.disconnect();
    console.log("\n🎉 Proceso completado exitosamente.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en el proceso:", error);
    process.exit(1);
  }
}

run();
