require("dotenv").config();
const mongoose = require("mongoose");
const Article = require("./src/models/Article");

async function migrate() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/teleremate";
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");

    const validCategories = ["deposito", "remate", "inmueble", "vehiculo"];

    const articles = await Article.find({});
    let updatedCount = 0;

    for (const article of articles) {
      if (!validCategories.includes(article.category)) {
        article.category = "deposito";
        await article.save();
        updatedCount++;
      }
    }

    console.log(`Migration complete. Updated ${updatedCount} articles.`);
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

migrate();
