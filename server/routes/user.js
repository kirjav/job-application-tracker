const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const { deleteUser, updateEmail, updatePassword } = require("../controllers/userController");
const validate = require("../middleware/schemaValidation");
const { updateEmailSchema, updatePasswordSchema, deleteUserSchema } = require("../validation/userSchemas");

router.delete("/delete-account", authenticateToken, validate(deleteUserSchema), deleteUser);
router.put("/update-email", authenticateToken, validate(updateEmailSchema), updateEmail);
router.put("/update-password", authenticateToken, validate(updatePasswordSchema), updatePassword);

module.exports = router;