// server/routes/health.js
const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "API is working ✅" });
});

module.exports = router;
