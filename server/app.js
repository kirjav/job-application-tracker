// server/app.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const { generalLimiter, authLimiter, applicationsLimiter } = require("./middleware/rateLimiter");

// Load env FIRST
dotenv.config();

const isProd = process.env.NODE_ENV === "production";
// Parse allowed origins from env
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map(s => s.trim()) || [];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

const app = express();
app.set("trust proxy", 1);

// Middleware setup
app.use(helmet({
  // Typical API tweaks:
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  // HSTS only in prod + over HTTPS
  hsts: isProd ? undefined : false,
}));

app.use(cors(corsOptions));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

// Routes and rate limiting
const healthRoutes = require("./routes/health");
app.use("/health", healthRoutes);

const authRoutes = require("./routes/auth");
app.use("/auth", authLimiter, authRoutes);

const applicationRoutes = require("./routes/application");
app.use("/applications", applicationsLimiter, applicationRoutes);

app.use(generalLimiter);

const tagRoutes = require("./routes/tag");
app.use("/tags", tagRoutes);

const userRoutes = require("./routes/user");
app.use("/user", userRoutes);

app.use((err, req, res, next) => {
  // Treat CORS errors & other thrown errors uniformly
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({ error: message });
});

module.exports = app;