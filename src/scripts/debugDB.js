require("dotenv").config();
const mongoose = require("mongoose");
const Article = require("../models/Article");
const connectDB = require("../config/db");

const debugDB = async () => {
  try {
    await connectDB();
    const samples = await Article.find({ category: "remate" }).select("lotNumber title status category");
    console.log("Articles still in REMATE:");
    console.log(JSON.stringify(samples, null, 2));
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

debugDB();
