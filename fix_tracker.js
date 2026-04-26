require('dotenv').config();
const mongoose = require('mongoose');
const Article = require('./src/models/Article');

async function fixTracker() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const res = await Article.updateOne(
      { title: /Tracker/i },
      { $set: { category: 'vehiculo' } }
    );
    console.log("Tracker category updated:", res);
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixTracker();
