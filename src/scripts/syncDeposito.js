require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Article = require("../models/Article");
const connectDB = require("../config/db");

/**
 * syncDeposito.js
 * 
 * Purpose: Load articles from catalogoupdate.json into the 'deposito' category.
 * Rules:
 * - Insert ONLY sold === false
 * - Assign status: "depot" and category: "deposito"
 * - Avoid duplicates (don't insert if lotNumber/id already exists)
 */

const syncDeposito = async () => {
    const isDryRun = process.argv.includes("--dry-run");
    const jsonPath = path.join(__dirname, "../../catalogoupdate.json");

    console.log("--------------------------------------------------");
    console.log(`🚀 Iniciando Sincronización a Depósito ${isDryRun ? "[MODO SIMULACIÓN]" : "[EJECUCIÓN REAL]"}`);
    console.log("--------------------------------------------------");

    // 1. Validation
    if (!fs.existsSync(jsonPath)) {
        console.error("❌ Error: No se encontró catalogoupdate.json");
        process.exit(1);
    }

    let data;
    try {
        data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    } catch (e) {
        console.error("❌ Error al parsear JSON:", e.message);
        process.exit(1);
    }

    const noVendidos = data.filter(item => item.vendido === false);
    
    console.log(`✔ Total JSON: ${data.length}`);
    console.log(`✔ No vendidos detectados: ${noVendidos.length}`);

    if (isDryRun) {
        console.log("\n[DRY RUN SUMMARY]");
        console.log(`Se intentarían procesar ${noVendidos.length} registros.`);
        console.log("No se realizarán cambios en la base de datos.");
        process.exit(0);
    }

    // 2. Database Connection
    try {
        await connectDB();
    } catch (e) {
        console.error("❌ Error de conexión:", e.message);
        process.exit(1);
    }

    // 3. Duplicate Prevention & Mapping
    try {
        // Get existing lotNumbers to avoid duplicates
        const existingArticles = await Article.find({}, { lotNumber: 1 }).lean();
        const existingSet = new Set(existingArticles.map(a => String(a.lotNumber)));

        const toInsert = noVendidos.filter(item => !existingSet.has(String(item.id)));
        const duplicateCount = noVendidos.length - toInsert.length;

        if (toInsert.length === 0) {
            console.log("--------------------------------------------------");
            console.log("ℹ️ No hay nuevos registros para insertar.");
            console.log(`✔ Insertados: 0`);
            console.log(`✔ Duplicados ignorados: ${duplicateCount}`);
            console.log("--------------------------------------------------");
            mongoose.connection.close();
            process.exit(0);
        }

        // Map to Article Schema
        const articlesToInsert = toInsert.map(item => {
            const description = (item.descripcion || "").trim();
            const title = description.length > 80 
                ? description.substring(0, 80).trimEnd() + "…" 
                : description;

            const images = (item.imagenes || [])
                .filter(url => typeof url === "string" && !url.includes("VENDIDO.JPG"))
                .map(url => ({ url }));

            return {
                lotNumber: String(item.id),
                title,
                description,
                category: "deposito",
                status: "depot",
                estimatedPrice: Number(item.precio) || 0,
                images,
                featured: false
            };
        });

        // 4. Bulk Insertion
        const result = await Article.insertMany(articlesToInsert, { ordered: false });
        
        console.log("--------------------------------------------------");
        console.log("📊 RESUMEN DE OPERACIÓN:");
        console.log(`✔ Insertados: ${result.length}`);
        console.log(`✔ Duplicados ignorados: ${duplicateCount}`);
        console.log("--------------------------------------------------");

    } catch (error) {
        console.error("❌ Error durante la inserción:", error.message);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
};

syncDeposito();
