const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const fs = require("fs");
const Article = require("../src/models/Article");

const keywords = {
  "Electrodomésticos y Climatización": [
    "heladera", "tv", "televisor", "lavarropa", "aire acondicionado", "estufa", "microondas", "licuadora", "ventilador", "secador", "plancha", "horno electrico", "calefactor", "freezer", "horno", "cocina", "lavavajillas"
  ],
  "Muebles y Hogar": [
    "mesa", "silla", "cama", "sillon", "ropero", "comoda", "rack", "escritorio", "placard", "puerta", "ventana", "biblioteca", "espejo", "alfombra", "cortina", "sofa", "mesita", "butaca", "colchon", "respaldo", "banderola", "reja", "hoja", "marcos", "mampara", "mueble"
  ],
  "Bazar y Cocina": [
    "olla", "plato", "vaso", "sarten", "fuente", "cubierto", "vajilla", "taza", "ensaladera", "jarra", "cacerola", "termo", "bandeja"
  ],
  "Herramientas y Ferretería": [
    "taladro", "amoladora", "sierra", "pala", "martillo", "soldadora", "llave", "pinza", "destornillador", "hidrolavadora", "clavos", "tornillos", "escalera", "cinta metrica", "lija", "compresor", "motosierra", "bordeadora", "maquina de cortar", "caño"
  ],
  "Vehículos y Accesorios": [
    "auto", "moto", "cubierta", "llanta", "casco", "gato", "bateria", "espejo retrovisor", "luces", "faro", "trailer", "camioneta", "triciclo"
  ],
  "Deportes y Tiempo Libre": [
    "bicicleta", "pelota", "carpa", "pesa", "caña", "reel", "raqueta", "patin", "rollers", "monopatin", "bolsa de dormir", "camping", "conservadora"
  ],
  "Bebés y Niños": [
    "cuna", "cochecito", "juguete", "andador", "muñeca", "peluche", "triciclo niño", "ropa bebe", "silla de comer", "saltarin"
  ]
};

function classifyArticle(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  for (const [subcategory, words] of Object.entries(keywords)) {
    for (const word of words) {
      const regex = new RegExp(`\\b${word}\\b`, "i");
      if (regex.test(text)) {
        return subcategory;
      }
    }
  }
  return "Varios / Otros";
}

async function process8Agosto() {
  try {
    const filePath = path.join(__dirname, "../8agosto.json");
    if (!fs.existsSync(filePath)) {
      console.error("❌ No se encontró el archivo 8agosto.json en backend/");
      process.exit(1);
    }

    const catalog = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!Array.isArray(catalog)) {
      console.error("❌ El formato de 8agosto.json debe ser un array");
      process.exit(1);
    }

    console.log(`\n📦 Leídos ${catalog.length} artículos de 8agosto.json`);

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Conectado a MongoDB");

    // Identificar vendidos y no vendidos
    const soldItems = catalog.filter((item) => {
      const hasSoldImg = Array.isArray(item.imagenes) && item.imagenes.some(
        img => typeof img === "string" && img.toUpperCase().includes("VENDIDO")
      );
      return item.vendido === true || hasSoldImg;
    });

    const unsoldItems = catalog.filter((item) => !soldItems.includes(item));

    const soldLotNumbers = soldItems.map(item => String(item.id));
    console.log(`\n🗑️ Procesando ${soldLotNumbers.length} artículos vendidos para eliminar de la BD...`);

    const deleteResult = await Article.deleteMany({
      lotNumber: { $in: soldLotNumbers }
    });
    console.log(`   - Artículos eliminados de la BD: ${deleteResult.deletedCount}`);

    const targetDate = new Date("2026-08-08T00:00:00.000Z");
    
    console.log(`\n🔄 Pasar ${unsoldItems.length} artículos NO VENDIDOS a VENTA DIRECTA (categoría 'deposito', estado 'depot')...`);

    let importedCount = 0;
    let errorCount = 0;
    const statsSubcategory = {};

    for (const item of unsoldItems) {
      const lotNumber = String(item.id);
      const description = (item.descripcion || "").trim();
      const title = description.length > 80
        ? description.substring(0, 80).trimEnd() + "…"
        : description;

      const images = (item.imagenes || [])
        .filter((url) => typeof url === "string" && url.startsWith("http") && !url.toUpperCase().includes("VENDIDO"))
        .map((url) => ({ url }));

      const subcategory = classifyArticle(title, description);
      statsSubcategory[subcategory] = (statsSubcategory[subcategory] || 0) + 1;

      const articleData = {
        lotNumber,
        auctionLot: "", // Quitar lote de remate
        title,
        description,
        category: "deposito", // Venta Directa
        subcategory,
        status: "depot", // Venta Directa
        condition: "Excelente",
        isNewCondition: false,
        estimatedPrice: Number(item.precio) || 0,
        currency: "UYU",
        auctionDate: null,
        featured: false,
        images,
      };

      try {
        await Article.findOneAndUpdate(
          { lotNumber },
          { 
            $set: articleData,
            $setOnInsert: { createdAt: new Date() } 
          },
          { upsert: true, returnDocument: "after" }
        );
        importedCount++;
      } catch (err) {
        console.error(`⚠️ Error procesando artículo ${lotNumber}: ${err.message}`);
        errorCount++;
      }
    }

    // Por seguridad, si queda algún artículo en la BD marcado como 'remate' para el 8 de agosto no incluido en unsold, limpiarlo
    const remainingRemate = await Article.deleteMany({
      category: "remate",
      auctionDate: targetDate
    });
    if (remainingRemate.deletedCount > 0) {
      console.log(`🧹 Se limpiaron ${remainingRemate.deletedCount} artículos remanentes del remate del 8 de agosto.`);
    }

    console.log(`\n📊 Resumen del Proceso (8 de Agosto):`);
    console.log(`   - Total en JSON: ${catalog.length}`);
    console.log(`   - Vendidos eliminados: ${deleteResult.deletedCount}`);
    console.log(`   - Pasados a Venta Directa (Depósito): ${importedCount}`);
    console.log(`   - Errores: ${errorCount}`);
    console.log(`\n🏷️ Clasificación en Venta Directa de los nuevos artículos:`);
    for (const [subcat, count] of Object.entries(statsSubcategory)) {
      console.log(`   - ${subcat}: ${count}`);
    }

    await mongoose.disconnect();
    console.log("\n🎉 ¡Proceso finalizado exitosamente!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error crítico en el proceso:", err);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

process8Agosto();
