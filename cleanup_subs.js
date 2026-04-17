require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./src/config/db");
const PushSubscription = require("./src/models/PushSubscription");

async function cleanup() {
  try {
    console.log("Iniciando conexión...");
    await connectDB();
    console.log("Conectado.");

    const countBefore = await PushSubscription.countDocuments();
    console.log(`Suscripciones totales: ${countBefore}`);

    const result = await PushSubscription.deleteMany({ isAdmin: false });
    console.log(`Suscripciones públicas eliminadas: ${result.deletedCount}`);

    const countAfter = await PushSubscription.countDocuments();
    console.log(`Suscripciones admin restantes: ${countAfter}`);

    process.exit(0);
  } catch (err) {
    console.error("Error durante la limpieza:", err);
    process.exit(1);
  }
}

cleanup();
