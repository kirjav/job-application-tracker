// server/index.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv").config();

// Load env variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const healthRoutes = require("./routes/health");
app.use("/", healthRoutes);

const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});



