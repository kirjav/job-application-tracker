const express = require("express");
const router = express.Router();
const { createApplication, getUserApplications, updateApplication, deleteApplication } = require("../controllers/applicationController");
const authenticateToken = require("../middleware/authMiddleware");

router.post("/", authenticateToken, createApplication);
router.get("/", authenticateToken, getUserApplications);
router.put("/:id", authenticateToken, updateApplication);
router.delete("/:id", authenticateToken, deleteApplication);

module.exports = router;
