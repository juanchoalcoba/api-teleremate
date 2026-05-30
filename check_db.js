require("dotenv").config();
const mongoose = require("mongoose");
const Article = require("./src/models/Article");

const MONGODB_URI = process.env.MONGODB_URI;

async function check() {
  await mongoose.connect(MONGODB_URI);
  
  const depositoCount = await Article.countDocuments({ category: "deposito" });
  console.log(`Total artículos en deposito: ${depositoCount}`);

  const recentMigrated = await Article.find({ category: "deposito", status: "available", lotNumber: "52893" }); // we know 52893 was one of them
  console.log("Ejemplo de migrado:", recentMigrated);

  await mongoose.disconnect();
}

check();
