require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Article = require("../models/Article");
const connectDB = require("../config/db");

/**
 * Catalog Synchronization Script
 * 
 * Rules:
 * - Matching by JSON "id" -> Article "lotNumber"
 * - vendido: true -> DELETE article
 * - vendido: false -> Update status to "depot" (En Depósito)
 */

const syncCatalog = async () => {
  const isDryRun = process.argv.includes("--dry-run");
  const jsonPath = path.join(__dirname, "../../catalogoupdate.json");

  console.log("--------------------------------------------------");
  console.log(`🚀 Iniciando Sincronización de Catálogo ${isDryRun ? "[MODO SIMULACIÓN]" : "[EJECUCIÓN REAL]"}`);
  console.log("--------------------------------------------------");

  // 1. Validate JSON file
  if (!fs.existsSync(jsonPath)) {
    console.error("❌ Error: No se encontró el archivo catalogoupdate.json en la raíz del backend.");
    process.exit(1);
  }

  let data;
  try {
    const rawData = fs.readFileSync(jsonPath, "utf-8");
    data = JSON.parse(rawData);
  } catch (error) {
    console.error("❌ Error: El archivo JSON está corrupto o tiene un formato inválido.");
    process.exit(1);
  }

  if (!Array.isArray(data) || data.length === 0) {
    console.error("❌ Error: El archivo JSON está vacío o no es una lista.");
    process.exit(1);
  }

  console.log(`✅ Archivo JSON cargado: ${data.length} registros detectados.`);

  if (isDryRun) {
    // DRY RUN LOGIC
    const toDelete = data.filter(item => item.vendido === true).map(item => item.id);
    const toUpdate = data.filter(item => item.vendido === false).map(item => item.id);

    console.log(`\n[DRY RUN SUMMARY]`);
    console.log(`- Lotes para ELIMINAR (vendidos): ${toDelete.length}`);
    console.log(`- Lotes para ACTUALIZAR (no vendidos): ${toUpdate.length}`);
    console.log("\nNo se realizaron cambios en la base de datos.");
    process.exit(0);
  }

  // 2. Database Connection
  try {
    await connectDB();
  } catch (error) {
    console.error("❌ Error de conexión a MongoDB:", error.message);
    process.exit(1);
  }

  // 3. Prepare Bulk Operations
  const operations = data.map(item => {
    if (item.vendido === true) {
      return {
        deleteOne: {
          filter: { lotNumber: item.id }
        }
      };
    } else {
      return {
        updateOne: {
          filter: { lotNumber: item.id },
          update: { $set: { status: "depot" } }
        }
      };
    }
  });

  // 4. Execute Bulk Write
  try {
    console.log("\nProcessing database updates...");
    const result = await Article.bulkWrite(operations, { ordered: false });

    // 5. Logging results
    const totalVendidos = data.filter(item => item.vendido === true).length;
    const totalNoVendidos = data.filter(item => item.vendido === false).length;

    const deletedCount = result.deletedCount || 0;
    const updatedCount = result.modifiedCount || 0;
    const matchedCount = result.matchedCount || 0; // Total that matched filter (including already "depot")

    // IDs not found: 
    // For deletes: totalVendidos - deletedCount
    // For updates: totalNoVendidos - matchedCount
    const notFoundDeletes = totalVendidos - deletedCount;
    const notFoundUpdates = totalNoVendidos - matchedCount;
    const totalNotFound = notFoundDeletes + notFoundUpdates;

    const summary = `
--------------------------------------------------
📊 RESUMEN DE OPERACIÓN:
- ✅ Registros ELIMINADOS (Vendidos): ${deletedCount}
- 🔄 Registros ACTUALIZADOS a 'En Depósito': ${updatedCount}
- ⚠️ Registros NO ENCONTRADOS en BD: ${totalNotFound}
--------------------------------------------------
`;
    console.log(summary);
    fs.writeFileSync("sync_results.tmp", summary);

    mongoose.connection.close();
    console.log("🚀 Sincronización completada con éxito.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error durante la operación masiva:", error.message);
    mongoose.connection.close();
    process.exit(1);
  }
};

syncCatalog();
