const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 segundos de espera antes de fallar
    });
    console.log(`✅ Conectado a MongoDB Atlas: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error conectando a MongoDB Atlas: ${error.message}`);
    // No salimos del proceso inmediatamente para dejar que Railway vea los logs
    setTimeout(() => process.exit(1), 2000);
  }
};

module.exports = connectDB;
