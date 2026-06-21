const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Article = require('../models/Article');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const clearReservations = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const result = await Article.updateMany(
      { status: { $ne: 'reserved' }, reservedUntil: { $ne: null } },
      { $set: { reservedUntil: null } }
    );

    console.log(`Successfully cleared reservations. Modified ${result.modifiedCount} articles.`);
    process.exit(0);
  } catch (err) {
    console.error('Error clearing reservations:', err);
    process.exit(1);
  }
};

clearReservations();
