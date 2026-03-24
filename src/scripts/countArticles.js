require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const Article = require("../models/Article");
const connectDB = require("../config/db");

const countArticles = async () => {
  try {
    await connectDB();
    const total = await Article.countDocuments();
    const depot = await Article.countDocuments({ status: "depot" });
    const sold = await Article.countDocuments({ status: "sold" });
    const upcoming = await Article.countDocuments({ status: "upcoming" });
    const reserved = await Article.countDocuments({ status: "reserved" });

    const results = `
--------------------------------------------------
📊 ESTADO ACTUAL DE LA BASE DE DATOS:
- Total de artículos: ${total}
- En Depósito: ${depot}
- Próximos (Remate): ${upcoming}
- Reservados: ${reserved}
- Vendidos: ${sold}
--------------------------------------------------
`;
    console.log(results);
    fs.writeFileSync("verification_results.tmp", results);

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error de conteo:", error.message);
    process.exit(1);
  }
};

countArticles();
