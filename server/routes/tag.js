const express = require("express");
const router = express.Router();
const { getUserTags, createTag, deleteTag } = require("../controllers/tagController");
const authenticateToken = require("../middleware/authMiddleware");
const validate = require("../middleware/schemaValidation");
const { tagSchema } = require("../validation/tagSchemas");

router.get("/", authenticateToken, getUserTags);                  // Get all tags for this user
router.post("/", authenticateToken, validate(tagSchema), createTag); // Create or return existing tag
router.delete("/:id", authenticateToken, deleteTag);              // Delete a tag

module.exports = router;