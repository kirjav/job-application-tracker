// server/app.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { generalLimiter, authLimiter } = require("./middleware/rateLimiter");

// helmet for additional HTTP header security
const helmet = require("helmet");


dotenv.config();

const app = express();
const cookieParser = require("cookie-parser");
app.use(cookieParser());

app.use(helmet());
app.use(cors());
app.use(express.json());

// Positioned health routes above general Limiter to allow monitoring later without having to worry about rate limits.
const healthRoutes = require("./routes/health");
app.use("/health", healthRoutes);

// Apply general limiter to all other requests
app.use(generalLimiter);

// Routes

const authRoutes = require("./routes/auth");
app.use("/auth", authLimiter, authRoutes);

const applicationRoutes = require("./routes/application");
app.use("/applications", applicationRoutes);

const tagRoutes = require("./routes/tag");
app.use("/tags", tagRoutes);

const userRoutes = require("./routes/user");
app.use("/user", userRoutes);

module.exports = app;