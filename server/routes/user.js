const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const { deleteUser, updateEmail, updatePassword } = require("../controllers/userController");

router.delete("/delete-account", authenticateToken, deleteUser);
router.put("/update-email", authenticateToken, updateEmail);
router.put("/update-password", authenticateToken, updatePassword);

module.exports = router;