require('dotenv').config();
const mongoose = require('mongoose');
const Article = require('./src/models/Article');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    // Buscamos los que NO están vendidos en la categoría remate
    const unsoldQuery = { category: 'remate', status: { $ne: 'sold' } };
    const soldQuery = { category: 'remate', status: 'sold' };

    const unsoldStats = await Article.countDocuments(unsoldQuery);
    const soldStats = await Article.countDocuments(soldQuery);

    console.log(`Articles to migrate (not sold): ${unsoldStats}`);
    console.log(`Articles already sold in remate: ${soldStats}`);

    // La instrucción es pasar TODO a venta directa.
    // Al pasar a venta directa (deposito), quitamos el número de lote de subasta (auctionLot)
    // porque ya no están en una subasta activa.
    
    const result = await Article.updateMany(
      { category: 'remate' }, // Target all in remate
      { 
        $set: { 
          category: 'deposito',
          auctionLot: '', // Clear the auction lot number (1, 2, 3...)
          auctionDate: null
        },
        // Si el status era 'upcoming' (remate), lo pasamos a 'depot' (venta directa)
        // Pero si ya estaba 'sold', lo dejamos como 'sold'.
      }
    );

    console.log(`Updated ${result.modifiedCount} articles to category 'deposito'.`);

    // Fix status for those that were 'upcoming'
    const statusResult = await Article.updateMany(
      { category: 'deposito', status: 'upcoming' },
      { $set: { status: 'depot' } }
    );
    console.log(`Updated ${statusResult.modifiedCount} articles status from 'upcoming' to 'depot'.`);

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
