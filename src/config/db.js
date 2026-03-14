const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Limpiamos la URI de posibles espacios invisibles que causan el error "option not supported"
    const uri = process.env.MONGODB_URI ? process.env.MONGODB_URI.trim() : "";
    
    if (!uri) {
      throw new Error("MONGODB_URI no está definida en las variables de entorno");
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`✅ Conectado a MongoDB Atlas: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error conectando a MongoDB Atlas: ${error.message}`);
    setTimeout(() => process.exit(1), 2000);
  }
};

module.exports = connectDB;
