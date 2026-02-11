const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const { deleteUser, getMe, updateEmail, updatePassword, updateMe } = require("../controllers/userController");
const validate = require("../middleware/schemaValidation");
const { updateEmailSchema, updateMeSchema, updatePasswordSchema, deleteUserSchema } = require("../validation/userSchemas");

router.use(authenticateToken);

router.get("/me", getMe);
router.delete("/delete-account", validate(deleteUserSchema), deleteUser);
router.put("/update-email", validate(updateEmailSchema), updateEmail);

router.patch("/me", validate(updateMeSchema), updateMe);

router.put("/update-password", validate(updatePasswordSchema), updatePassword);

module.exports = router;