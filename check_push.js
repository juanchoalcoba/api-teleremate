require("dotenv").config();
const mongoose = require("mongoose");
const PushSubscription = require("./src/models/PushSubscription");

const MONGODB_URI = process.env.MONGODB_URI;

async function check() {
  await mongoose.connect(MONGODB_URI);
  
  const count = await PushSubscription.countDocuments();
  console.log(`Total suscripciones: ${count}`);

  const adminSubs = await PushSubscription.find({ isAdmin: true });
  console.log(`Suscripciones Admin: ${adminSubs.length}`);
  
  adminSubs.forEach(sub => {
      console.log(`- ${sub.userEmail || 'Sin email'}: ${sub.endpoint.substring(0, 50)}...`);
  });

  await mongoose.disconnect();
}

check();
