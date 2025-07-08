// server/app.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
const healthRoutes = require("./routes/health");
app.use("/", healthRoutes);

const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);

const applicationRoutes = require("./routes/application");
app.use("/applications", applicationRoutes);

const tagRoutes = require("./routes/tag");
app.use("/tags", tagRoutes);

const userRoutes = require("./routes/user");
app.use("/user", userRoutes);

module.exports = app;