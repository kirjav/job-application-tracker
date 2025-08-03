const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const { deleteUser, updateEmail, updatePassword, updateName } = require("../controllers/userController");
const validate = require("../middleware/schemaValidation");
const { updateEmailSchema, updateNameSchema, updatePasswordSchema, deleteUserSchema } = require("../validation/userSchemas");

router.delete("/delete-account", authenticateToken, validate(deleteUserSchema), deleteUser);
router.put("/update-email", authenticateToken, validate(updateEmailSchema), updateEmail);
router.patch("/name", authenticateToken, validate(updateNameSchema), updateName);
router.put("/update-password", authenticateToken, validate(updatePasswordSchema), updatePassword);

module.exports = router;