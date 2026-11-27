require("dotenv").config();

const app = require("./src/app");
const connectDB = require("./src/config/db");

if (process.env.MONGODB_URI) {
  connectDB().catch((err) => {
    console.error(err);
  });
}

module.exports = app;