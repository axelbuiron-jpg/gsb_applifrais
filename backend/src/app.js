const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const connectDB = require("./config/db");
const asyncHandler = require("./utils/asyncHandler");
const app = express();
app.disable("x-powered-by");
app.use(helmet());
const originsAutorisees = [
    process.env.CLIENT_URL,
    "https://gsb-applifrais.vercel.app",
].filter(Boolean);
app.use(cors({ origin: originsAutorisees }));
app.use(express.json());
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/v1", asyncHandler(async (req, res, next) => {
    await connectDB();
    next();
}));
app.use("/api/v1", require("./routes"));
app.use(require("./middlewares/errorHandler"));
module.exports = app;
