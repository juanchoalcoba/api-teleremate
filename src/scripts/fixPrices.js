require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Article = require("../models/Article");
const connectDB = require("../config/db");

const fixPrices = async () => {
  console.log("--------------------------------------------------");
  console.log("🚀 Iniciando Corrección de Precios");
  console.log("--------------------------------------------------");

  try {
    await connectDB();

    const pathPrimero = path.join(__dirname, "../../primero.json");
    const pathSegundo = path.join(__dirname, "../../segundo.json");

    let allItems = [];

    if (fs.existsSync(pathPrimero)) {
      allItems = allItems.concat(JSON.parse(fs.readFileSync(pathPrimero, "utf-8")));
    }
    if (fs.existsSync(pathSegundo)) {
      allItems = allItems.concat(JSON.parse(fs.readFileSync(pathSegundo, "utf-8")));
    }

    // Crear un mapa para búsqueda rápida: lotNumber -> precio
    const priceMap = {};
    allItems.forEach(item => {
      if (item.id && item.precio != null) {
        priceMap[item.id] = item.precio;
      }
    });

    console.log(`✅ Se cargaron ${Object.keys(priceMap).length} precios desde los JSON.`);

    // Buscar artículos de Venta Directa con precio 0 o nulo
    const articlesToFix = await Article.find({
      category: "deposito",
      $or: [{ estimatedPrice: 0 }, { estimatedPrice: null }]
    });

    console.log(`🔍 Se encontraron ${articlesToFix.length} artículos en Venta Directa con precio 0 o nulo.`);

    let updatedCount = 0;

    for (const article of articlesToFix) {
      const correctPrice = priceMap[article.lotNumber];
      if (correctPrice !== undefined && correctPrice > 0) {
        article.estimatedPrice = correctPrice;
        await article.save();
        updatedCount++;
        console.log(`✔️ Actualizado: Lote ${article.lotNumber} -> Nuevo precio: $${correctPrice}`);
      }
    }

    console.log(`✅ Se actualizaron exitosamente ${updatedCount} artículos.`);

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    mongoose.connection.close();
    process.exit(1);
  }
};

fixPrices();
