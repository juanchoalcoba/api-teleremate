const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const fs = require("fs");
const Article = require("../src/models/Article");

const DAYS = [
  {
    fileName: "vendidos10octubre.json",
    label: "Sábado 10 de Octubre",
  },
  {
    fileName: "vendidos11octubre.json",
    label: "Domingo 11 de Octubre",
  },
];

const keywords = {
  "Electrodomésticos y Climatización": [
    "heladera", "tv", "televisor", "lavarropa", "aire acondicionado", "estufa", "microondas",
    "licuadora", "ventilador", "secador", "plancha", "horno electrico", "calefactor", "freezer",
    "horno", "cocina", "lavavajillas", "calefon", "anafe", "aspiradora", "lustraspiradora",
    "centrifugador", "extractor", "caloventilador", "exprimidor", "batidora", "freidora"
  ],
  "Muebles y Hogar": [
    "mesa", "silla", "cama", "sillon", "ropero", "comoda", "rack", "escritorio", "placard",
    "puerta", "ventana", "biblioteca", "espejo", "alfombra", "cortina", "sofa", "mesita",
    "butaca", "colchon", "respaldo", "banderola", "reja", "hoja", "marcos", "mampara",
    "mueble", "estanteria", "banqueta", "banco", "puff", "sommier", "cucheta", "repisa",
    "botiquin", "vitrina", "vinera", "candelabro", "catre", "marinera", "perezoso", "almohadon",
    "almohada", "araña", "lampara", "foco", "colgante", "aplique"
  ],
  "Bazar y Cocina": [
    "olla", "plato", "vaso", "sarten", "fuente", "cubierto", "vajilla", "taza", "ensaladera",
    "jarra", "cacerola", "termo", "bandeja", "copas", "bowl", "copa", "cubiertos", "matera",
    "mate", "azucarero", "frasco", "panera", "cuchillo", "tenedor"
  ],
  "Herramientas y Ferretería": [
    "taladro", "amoladora", "sierra", "pala", "martillo", "soldadora", "llave", "pinza",
    "destornillador", "hidrolavadora", "clavos", "tornillos", "escalera", "cinta metrica",
    "lija", "compresor", "motosierra", "bordeadora", "maquina de cortar", "caño", "sargento",
    "gato", "nivel", "berbiqui", "rotomartillo", "alargue", "inyector", "cebolla", "cizalla",
    "tenaza", "puntera", "serrucho", "herramientas", "mechas"
  ],
  "Vehículos y Accesorios": [
    "auto", "moto", "cubierta", "llanta", "casco", "bateria", "espejo retrovisor",
    "luces", "faro", "trailer", "camioneta", "triciclo", "carburador", "rueda"
  ],
  "Deportes y Tiempo Libre": [
    "bicicleta", "pelota", "carpa", "pesa", "caña", "reel", "raqueta", "patin", "rollers",
    "monopatin", "bolsa de dormir", "camping", "conservadora", "mancuerna", "gimnasio",
    "surf", "golf", "bote", "paleta", "pesas"
  ],
  "Bebés y Niños": [
    "cuna", "cochecito", "juguete", "andador", "muñeca", "peluche", "ropa bebe",
    "silla de comer", "saltarin", "patineta"
  ],
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

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI no está definido en .env");
    process.exit(1);
  }

  try {
    console.log("🔌 Conectando a MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Conectado con éxito a MongoDB.\n");

    let allSoldIds = [];

    for (const day of DAYS) {
      const filePath = path.join(__dirname, "..", day.fileName);
      console.log(`==================================================`);
      console.log(`📅 LEYENDO: ${day.label} (${day.fileName})`);
      console.log(`==================================================`);

      if (!fs.existsSync(filePath)) {
        console.error(`❌ Archivo no encontrado: ${day.fileName}`);
        continue;
      }

      const fileContent = JSON.parse(fs.readFileSync(filePath, "utf8"));
      if (!Array.isArray(fileContent)) {
        console.error(`❌ ${day.fileName} no contiene un Array de IDs.`);
        continue;
      }

      const soldIds = fileContent.map((item) =>
        (typeof item === "object" ? String(item.id || item.numero) : String(item)).trim()
      );
      console.log(`📦 IDs vendidos leídos del archivo: ${soldIds.length}`);
      allSoldIds.push(...soldIds);
    }

    allSoldIds = [...new Set(allSoldIds)];
    console.log(`\n📦 Total de IDs vendidos únicos entre ambos días: ${allSoldIds.length}`);

    // 1. Borrar artículos vendidos
    let totalDeleted = 0;
    if (allSoldIds.length > 0) {
      const deleteRes = await Article.deleteMany({
        lotNumber: { $in: allSoldIds },
      });
      totalDeleted = deleteRes.deletedCount;
      console.log(`🗑️  Artículos vendidos ELIMINADOS de la BD: ${totalDeleted}`);
    }

    // 2. Buscar artículos restantes en remate para migrar a Venta Directa
    const unsoldArticles = await Article.find({ category: "remate" });
    console.log(`\n🔄 Artículos NO VENDIDOS restantes en remate a migrar a Venta Directa: ${unsoldArticles.length}`);

    let totalMigrated = 0;
    const now = new Date();

    for (const article of unsoldArticles) {
      let currentSubcategory = article.subcategory;
      if (!currentSubcategory || currentSubcategory === "Varios / Otros") {
        currentSubcategory = classifyArticle(article.title || "", article.description || "");
      }

      await Article.collection.updateOne(
        { _id: article._id },
        {
          $set: {
            category: "deposito",
            status: "depot",
            auctionLot: "",
            auctionDate: null,
            subcategory: currentSubcategory,
            createdAt: now,
            updatedAt: now,
          },
        }
      );
      totalMigrated++;
    }

    console.log(`✅ Artículos migrados exitosamente a Venta Directa (deposito): ${totalMigrated}`);

    // Comprobación de seguridad final
    const remainingRemate = await Article.countDocuments({ category: "remate" });
    const totalDeposito = await Article.countDocuments({ category: "deposito", status: "depot" });

    console.log("\n==================================================");
    console.log("🎉 RESUMEN FINAL DEL PROCESAMIENTO (OCTUBRE)");
    console.log("==================================================");
    console.log(`🗑️  Total artículos vendidos eliminados : ${totalDeleted}`);
    console.log(`📦 Total no vendidos pasados a V. Directa: ${totalMigrated}`);
    console.log(`🏷️  Artículos restantes en categoría 'remate' : ${remainingRemate}`);
    console.log(`🏪 Total artículos activos en Venta Directa   : ${totalDeposito}`);
    console.log("==================================================\n");

    await mongoose.disconnect();
    console.log("👋 Desconectado de MongoDB.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error durante el procesamiento:", err);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

run();
