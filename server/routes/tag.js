// server/routes/tag.js
const express = require("express");
const router = express.Router();
const { getUserTags, createTag, deleteTag } = require("../controllers/tagController");
const authenticateToken = require("../middleware/authMiddleware");

router.get("/", authenticateToken, getUserTags);     // Get all tags for this user
router.post("/", authenticateToken, createTag);      // Create or return existing tag
router.delete("/:id", authenticateToken, deleteTag); // Delete a tag

module.exports = router;
