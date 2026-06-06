require("dotenv").config({ path: "../../.env" });
const mongoose = require("mongoose");
const Article = require("../models/Article");
const connectDB = require("../config/db");

const dumpTitles = async () => {
  try {
    await connectDB();
    const articles = await Article.find({ category: "deposito" }, { title: 1, isNewCondition: 1, _id: 0 });
    console.log(JSON.stringify(articles.map(a => ({ title: a.title, new: a.isNewCondition }))));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

dumpTitles();
