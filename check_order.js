require('dotenv').config();
const mongoose = require('mongoose');
const Article = require('./src/models/Article');

async function checkOrder() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const topCreatedAt = await Article.find({ category: 'deposito' })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('lotNumber title createdAt updatedAt');

  console.log("Top 5 by createdAt:");
  topCreatedAt.forEach(a => console.log(`- ${a.lotNumber}: ${a.createdAt} (updated: ${a.updatedAt})`));

  console.log("\nTop 5 by updatedAt:");
  const topUpdatedAt = await Article.find({ category: 'deposito' })
    .sort({ updatedAt: -1 })
    .limit(5)
    .select('lotNumber title createdAt updatedAt');
  topUpdatedAt.forEach(a => console.log(`- ${a.lotNumber}: ${a.createdAt} (updated: ${a.updatedAt})`));

  await mongoose.disconnect();
}

checkOrder();
