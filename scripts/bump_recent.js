require("dotenv").config();
const mongoose = require("mongoose");
const Article = require("../src/models/Article");

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Conectado a MongoDB.");

    // Find articles in 'deposito' updated in the last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // We use Article.collection.updateMany to bypass Mongoose's immutable createdAt
    const result = await Article.collection.updateMany(
      {
        category: "deposito",
        updatedAt: { $gte: yesterday },
      },
      {
        $set: { createdAt: new Date() },
      },
    );

    console.log(
      `🚀 Se actualizaron ${result.modifiedCount} artículos para que aparezcan primeros usando driver nativo (createdAt = now).`,
    );

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
