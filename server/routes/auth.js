const express = require("express");
const { registerUser, loginUser, refreshToken, forgotPassword, resetPassword } = require("../controllers/authController");
const validate = require("../middleware/schemaValidation");
const { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require("../validation/userSchemas");

const router = express.Router();

router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), loginUser);
router.post("/refresh", refreshToken);
router.post("/forgot-password",validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

module.exports = router;

