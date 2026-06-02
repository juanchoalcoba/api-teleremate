require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Article = require('./src/models/Article');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Conectado a MongoDB.");

    // 1. Leer los JSONs
    const file1 = path.join(__dirname, 'vendidos30mayo.json');
    const file2 = path.join(__dirname, 'vendidos31mayo.json');

    let soldIds = [];
    if (fs.existsSync(file1)) {
        const data = JSON.parse(fs.readFileSync(file1, 'utf8'));
        soldIds.push(...data);
    } else {
        console.warn(`⚠️ No se encontró ${file1}`);
    }

    if (fs.existsSync(file2)) {
        const data = JSON.parse(fs.readFileSync(file2, 'utf8'));
        soldIds.push(...data);
    } else {
        console.warn(`⚠️ No se encontró ${file2}`);
    }

    // Quitar duplicados
    soldIds = [...new Set(soldIds)];
    console.log(`📦 Total de IDs a borrar: ${soldIds.length}`);

    // 2. BORRAR los vendidos
    if (soldIds.length > 0) {
        const deleteResult = await Article.deleteMany({ lotNumber: { $in: soldIds } });
        console.log(`🗑️ Se borraron ${deleteResult.deletedCount} artículos vendidos en base a los JSON.`);
    }

    // 3. Pasar lo que queda (no vendido, en remate) a venta directa
    const unsoldStats = await Article.countDocuments({ category: 'remate' });
    console.log(`\n🔄 Artículos en remate restantes para pasar a venta directa: ${unsoldStats}`);

    if (unsoldStats > 0) {
        // Pasar categoría a 'deposito' (Venta Directa) y limpiar datos de subasta
        // Usamos Article.collection.updateMany para poder sobrescribir createdAt (que por defecto es inmutable en Mongoose)
        const resultCategory = await Article.collection.updateMany(
            { category: 'remate' },
            { 
                $set: { 
                category: 'deposito',
                auctionLot: '', 
                auctionDate: null,
                createdAt: new Date() // Hace que aparezcan primeros en el catálogo
                }
            }
        );
        console.log(`🏷️ Se actualizaron ${resultCategory.modifiedCount} artículos a categoría 'deposito'.`);

        // Corregir status de 'upcoming' a 'depot'
        const statusResult = await Article.updateMany(
            { category: 'deposito', status: 'upcoming' },
            { $set: { status: 'depot' } }
        );
        console.log(`✅ Se actualizó el status de ${statusResult.modifiedCount} artículos de 'upcoming' a 'depot' (Venta Directa).`);
    } else {
        console.log("No hay artículos en remate para migrar a venta directa.");
    }

    // 4. Borrar los archivos JSON (opcional pero limpio, los renombramos para no perderlos por si acaso)
    if (fs.existsSync(file1)) fs.renameSync(file1, file1 + '.procesado');
    if (fs.existsSync(file2)) fs.renameSync(file2, file2 + '.procesado');

    await mongoose.disconnect();
    console.log("\n🎉 Proceso completado exitosamente y con cuidado.");
    process.exit(0);

  } catch (error) {
    console.error("❌ Error en el proceso:", error);
    process.exit(1);
  }
}

run();
