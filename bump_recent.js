require('dotenv').config();
const mongoose = require('mongoose');
const Article = require('./src/models/Article');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Conectado a MongoDB.");

    // Find articles in 'deposito' updated in the last 15 minutes
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    const result = await Article.updateMany(
      { 
        category: 'deposito', 
        updatedAt: { $gte: fifteenMinsAgo } 
      },
      { 
        $set: { createdAt: new Date() } 
      }
    );

    console.log(`🚀 Se actualizaron ${result.modifiedCount} artículos para que aparezcan primeros (createdAt = now).`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
