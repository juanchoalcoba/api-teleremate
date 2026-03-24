require("dotenv").config();
const mongoose = require("mongoose");
const Article = require("../models/Article");
const connectDB = require("../config/db");

const debugDB = async () => {
  try {
    await connectDB();
    const samples = await Article.find({ lotNumber: "55411" }).select("lotNumber title status");
    console.log("Search for sold ID 55411:");
    console.log(JSON.stringify(samples, null, 2));
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

debugDB();
