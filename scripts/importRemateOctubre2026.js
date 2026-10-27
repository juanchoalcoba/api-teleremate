const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const fs = require("fs");
const Article = require("../src/models/Article");

const MONGODB_URI = process.env.MONGODB_URI;

const CATALOG_FILES = [
  {
    fileName: "sabado10.json",
    date: new Date("2026-10-10T00:00:00.000Z"),
    label: "Sábado 10 de Octubre",
  },
  {
    fileName: "domingo11.json",
    date: new Date("2026-10-11T00:00:00.000Z"),
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

async function importRematesOctubre() {
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI no está definido en el archivo .env");
    process.exit(1);
  }

  try {
    console.log("🔌 Conectando a MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Conectado a MongoDB con éxito\n");

    let grandTotalImported = 0;
    let grandTotalErrors = 0;

    for (const itemConfig of CATALOG_FILES) {
      const filePath = path.join(__dirname, "..", itemConfig.fileName);

      if (!fs.existsSync(filePath)) {
        console.error(`❌ No se encontró el archivo: ${itemConfig.fileName}`);
        continue;
      }

      const rawData = fs.readFileSync(filePath, "utf8");
      let items;
      try {
        items = JSON.parse(rawData);
      } catch (parseErr) {
        console.error(`❌ Error al parsear JSON en ${itemConfig.fileName}:`, parseErr.message);
        continue;
      }

      if (!Array.isArray(items)) {
        console.error(`❌ El archivo ${itemConfig.fileName} no contiene un Array.`);
        continue;
      }

      console.log(`📦 Procesando ${items.length} lotes para ${itemConfig.label} (${itemConfig.fileName})...`);

      // Limpiar artículos de categoría remate con esta fecha para evitar duplicados si se reejecuta
      const deleted = await Article.deleteMany({
        category: "remate",
        auctionDate: itemConfig.date,
      });
      if (deleted.deletedCount > 0) {
        console.log(`   🧹 Se eliminaron ${deleted.deletedCount} artículos anteriores para la fecha ${itemConfig.date.toISOString().split("T")[0]}`);
      }

      let dayImported = 0;
      let dayErrors = 0;

      for (const item of items) {
        const lotNumber = String(item.id || item.numero);
        const auctionLot = String(item.numero || item.id);
        const description = (item.descripcion || "").trim();
        const title =
          description.length > 80
            ? description.substring(0, 80).trimEnd() + "…"
            : description;

        const images = (item.imagenes || [])
          .filter((url) => typeof url === "string" && url.startsWith("http"))
          .map((url) => ({ url }));

        const subcategory = classifyArticle(title, description);

        const articleData = {
          lotNumber,
          auctionLot,
          title,
          description,
          category: "remate",
          subcategory,
          status: "upcoming",
          condition: "Bueno",
          isNewCondition: false,
          estimatedPrice: Number(item.precio) || 0,
          currency: "UYU",
          auctionDate: itemConfig.date,
          featured: false,
          images,
        };

        try {
          await Article.findOneAndUpdate(
            { lotNumber },
            { $set: articleData },
            { upsert: true, returnDocument: "after" }
          );
          dayImported++;
        } catch (err) {
          console.error(`   ⚠️ Error en lote ${lotNumber}: ${err.message}`);
          dayErrors++;
        }
      }

      console.log(`   ✅ ${dayImported} lotes importados con éxito para ${itemConfig.label}`);
      if (dayErrors > 0) {
        console.log(`   ⚠️ ${dayErrors} errores en ${itemConfig.fileName}`);
      }
      console.log("--------------------------------------------------");

      grandTotalImported += dayImported;
      grandTotalErrors += dayErrors;
    }

    console.log("\n==================================================");
    console.log("🎉 IMPORTACIÓN DE REMATES OCTUBRE FINALIZADA");
    console.log(`   - Total Lotes Importados : ${grandTotalImported}`);
    console.log(`   - Total Errores          : ${grandTotalErrors}`);

    const finalRemateCount = await Article.countDocuments({ category: "remate" });
    console.log(`   - Total de lotes "remate" activos en BD: ${finalRemateCount}`);

    const breakdown = await Article.aggregate([
      { $match: { category: "remate" } },
      { $group: { _id: "$auctionDate", total: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    console.log("   - Desglose por fecha:");
    breakdown.forEach((b) => {
      console.log(`     * ${b._id ? b._id.toISOString().split("T")[0] : "Sin fecha"}: ${b.total} lotes`);
    });
    console.log("==================================================\n");

    await mongoose.disconnect();
    console.log("👋 Desconectado de MongoDB");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error crítico durante la importación:", err);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

importRematesOctubre();
