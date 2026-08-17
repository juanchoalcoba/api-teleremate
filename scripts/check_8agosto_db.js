const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Article = require("../src/models/Article");
const fs = require("fs");

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Conectado a MongoDB");

  const data = JSON.parse(fs.readFileSync(path.join(__dirname, "../8agosto.json"), "utf8"));
  const ids = data.map(i => String(i.id));
  
  const inDb = await Article.find({ lotNumber: { $in: ids } }).lean();
  console.log("Items from 8agosto.json found in MongoDB:", inDb.length);
  
  const byCategory = {};
  const byStatus = {};
  inDb.forEach(a => {
    byCategory[a.category] = (byCategory[a.category] || 0) + 1;
    byStatus[a.status] = (byStatus[a.status] || 0) + 1;
  });
  console.log("By category in DB:", byCategory);
  console.log("By status in DB:", byStatus);

  const totalArticles = await Article.countDocuments();
  console.log("Total articles in DB:", totalArticles);

  const allRemate = await Article.countDocuments({ category: "remate" });
  console.log("Total articles with category 'remate' in DB:", allRemate);

  await mongoose.disconnect();
}
check().catch(console.error);
