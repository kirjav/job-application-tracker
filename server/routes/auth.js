const express = require("express");
const { registerUser, loginUser, refreshToken } = require("../controllers/authController");
const validate = require("../middleware/schemaValidation");
const { registerSchema, loginSchema } = require("../validation/userSchemas");

const router = express.Router();

router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), loginUser);
router.post("/refresh", refreshToken);

module.exports = router;

