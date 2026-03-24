require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const Article = require("../models/Article");
const connectDB = require("../config/db");

const countArticles = async () => {
  try {
    await connectDB();
    const total = await Article.countDocuments();
    const depotStatus = await Article.countDocuments({ status: "depot" });
    const depositoCategory = await Article.countDocuments({ category: "deposito" });
    const remateCategory = await Article.countDocuments({ category: "remate" });
    const sold = await Article.countDocuments({ status: "sold" });
    const reserved = await Article.countDocuments({ status: "reserved" });

    const results = `
--------------------------------------------------
📊 ESTADO ACTUAL DE LA BASE DE DATOS:
- Total de artículos: ${total}
- Status 'depot': ${depotStatus}
- Category 'deposito': ${depositoCategory}
- Category 'remate': ${remateCategory}
- Status 'sold': ${sold}
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
