require("dotenv").config({ path: "../../.env" });
const mongoose = require("mongoose");
const Article = require("../models/Article");
const connectDB = require("../config/db");

const autoCategorize = async () => {
  try {
    await connectDB();

    const articles = await Article.find({ category: "deposito" });
    console.log(`Encontrados ${articles.length} artículos en Venta Directa.`);

    let updatedCount = 0;

    for (const article of articles) {
      const title = article.title.toLowerCase();
      let newSubcategory = "Varios / Otros";

      // Simple keyword matching
      if (title.match(/heladera|cocina|estufa|microondas|licuadora|anafe|plancha electrica/)) {
        newSubcategory = "Electrodomésticos y Climatización";
      } else if (title.match(/cama|mesa|silla|comoda|modular|placard|zapatera|biblioteca|banqueta/)) {
        newSubcategory = "Muebles y Hogar";
      } else if (title.match(/plato|taza|vaso|olla|sarten|cuchilla|tabla|bollon|tortera|cubiertos|bazar/)) {
        newSubcategory = "Bazar y Cocina";
      } else if (title.match(/herramienta|llave|pala|martillo|candado|termofusora|cerrojo|foco led|lona|cuerda|mopa/)) {
        newSubcategory = "Herramientas y Ferretería";
      } else if (title.match(/bicicleta|reel|pesca|gazebo|surf|carpa|deporte/)) {
        newSubcategory = "Deportes y Tiempo Libre";
      } else if (title.match(/bebe|cuna|bañera|juguete/)) {
        newSubcategory = "Bebés y Niños";
      } else if (title.match(/auto|moto|llanta|chalana|trailer|vehiculo|defensa/)) {
        newSubcategory = "Vehículos y Accesorios";
      }

      // Update if changed or if it was null/missing
      if (article.subcategory !== newSubcategory) {
        article.subcategory = newSubcategory;
        await article.save();
        updatedCount++;
      }
    }

    console.log(`✅ Se actualizaron ${updatedCount} artículos con su nueva subcategoría.`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error durante la migración:", error);
    process.exit(1);
  }
};

autoCategorize();
