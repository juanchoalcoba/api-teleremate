const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI ? process.env.MONGODB_URI.trim() : "";
    
    if (!uri) {
      throw new Error("MONGODB_URI no está definida");
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log(`✅ Conectado a MongoDB Atlas: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error de conexión: ${error.message}`);
    throw error; // Re-lanzar para que server.js lo capture
  }
};

module.exports = connectDB;
