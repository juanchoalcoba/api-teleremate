const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI ? process.env.MONGODB_URI.trim() : "";
    
    if (!uri) {
      throw new Error("MONGODB_URI no está definida");
    }

    // Usamos el nombre de la DB en las opciones para evitar errores de parseo en la URI
    const conn = await mongoose.connect(uri, {
      dbName: "teleremate-db",
      serverSelectionTimeoutMS: 15000,
    });
    console.log(`✅ Conectado a MongoDB Atlas: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error de conexión: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
