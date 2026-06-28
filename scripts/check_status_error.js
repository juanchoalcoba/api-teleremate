require("dotenv").config();
const mongoose = require("mongoose");
const Article = require("../src/models/Article");

const MONGODB_URI = process.env.MONGODB_URI;

async function check() {
  await mongoose.connect(MONGODB_URI);

  const availableCount = await Article.countDocuments({ status: "available" });
  console.log(`Artículos con status 'available' (ERRÓNEO): ${availableCount}`);

  const depotCount = await Article.countDocuments({ status: "depot" });
  console.log(`Artículos con status 'depot' (CORRECTO): ${depotCount}`);

  const sample = await Article.findOne({ status: "available" });
  if (sample) {
    console.log(
      "Ejemplo de artículo erróneo:",
      JSON.stringify(sample, null, 2),
    );
  }

  await mongoose.disconnect();
}

check();
