// server/app.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const { generalLimiter, authLimiter } = require("./middleware/rateLimiter");

// Load env FIRST
dotenv.config();

// Parse allowed origins from env
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map(s => s.trim()) || [];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

const app = express();

// Middleware setup
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Routes and rate limiting
const healthRoutes = require("./routes/health");
app.use("/health", healthRoutes);

app.use(generalLimiter);

const authRoutes = require("./routes/auth");
app.use("/auth", authLimiter, authRoutes);

const applicationRoutes = require("./routes/application");
app.use("/applications", applicationRoutes);

const tagRoutes = require("./routes/tag");
app.use("/tags", tagRoutes);

const userRoutes = require("./routes/user");
app.use("/user", userRoutes);

module.exports = app;