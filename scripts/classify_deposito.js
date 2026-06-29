require("dotenv").config();
const mongoose = require("mongoose");
const Article = require("../src/models/Article");

const keywords = {
  "Electrodomésticos y Climatización": [
    "heladera", "tv", "televisor", "lavarropa", "aire acondicionado", "estufa", "microondas", "licuadora", "ventilador", "secador", "plancha", "horno electrico", "calefactor", "freezer"
  ],
  "Muebles y Hogar": [
    "mesa", "silla", "cama", "sillon", "ropero", "comoda", "rack", "escritorio", "placard", "puerta", "ventana", "biblioteca", "espejo", "alfombra", "cortina", "sillon", "sofa", "mesita", "butaca", "colchon", "respaldo"
  ],
  "Bazar y Cocina": [
    "olla", "plato", "vaso", "sarten", "fuente", "cubierto", "vajilla", "taza", "ensaladera", "jarra", "cacerola", "termo", "bandeja"
  ],
  "Herramientas y Ferretería": [
    "taladro", "amoladora", "sierra", "pala", "martillo", "soldadora", "llave", "pinza", "destornillador", "hidrolavadora", "clavos", "tornillos", "escalera", "cinta metrica", "lija", "compresor", "motosierra", "bordeadora", "maquina de cortar"
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
      // Use regex to match whole words or parts where it makes sense
      const regex = new RegExp(`\\b${word}\\b`, "i");
      if (regex.test(text)) {
        return subcategory;
      }
    }
  }
  
  return "Varios / Otros";
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Conectado a MongoDB.");

    const articles = await Article.find({ category: "deposito" });
    console.log(`🔍 Se encontraron ${articles.length} artículos en Venta Directa.`);

    const stats = {
      "Electrodomésticos y Climatización": 0,
      "Muebles y Hogar": 0,
      "Bazar y Cocina": 0,
      "Herramientas y Ferretería": 0,
      "Deportes y Tiempo Libre": 0,
      "Bebés y Niños": 0,
      "Vehículos y Accesorios": 0,
      "Varios / Otros": 0
    };

    let updatedCount = 0;

    for (const article of articles) {
      const newSubcategory = classifyArticle(article.title, article.description);
      
      // Update if it's different, or if we just want to force a re-classification
      if (article.subcategory !== newSubcategory) {
        article.subcategory = newSubcategory;
        await article.save();
        updatedCount++;
      }
      
      stats[newSubcategory]++;
    }

    console.log(`\n✅ Proceso de clasificación terminado.`);
    console.log(`🔄 Se actualizaron las subcategorías de ${updatedCount} artículos.`);
    console.log(`\n📊 Resumen de clasificación actual en Venta Directa:`);
    for (const [subcat, count] of Object.entries(stats)) {
      console.log(`   - ${subcat}: ${count}`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en el proceso de clasificación:", error);
    process.exit(1);
  }
}

run();
