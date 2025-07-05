const express = require("express");
const router = express.Router();
const { createApplication, getUserApplications } = require("../controllers/applicationController");
const authenticateToken = require("../middleware/authMiddleware");

router.post("/", authenticateToken, createApplication);
router.get("/", authenticateToken, getUserApplications);

module.exports = router;
