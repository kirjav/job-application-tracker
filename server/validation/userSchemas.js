const { z } = require("zod");

const emailSchema = z.string().email({ message: "Invalid email format" });

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/\d/, "Password must include a digit")
  .regex(/[@$!%*?&]/, "Password must include a special character");

const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

const updateEmailSchema = z.object({
  password: z.string().min(1, "Password required"),
  newEmail: z.string().email("Invalid email"),
});

const updatePasswordSchema = z.object({
  old_password: z.string().min(1, "Old password is required"),
  new_password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      "Password must include uppercase, lowercase, number, and special character"),
});

const deleteUserSchema = z.object({
  password: z.string().min(1, "Password is required"),
});


module.exports = {
  registerSchema,
  loginSchema,
  updateEmailSchema,
  updatePasswordSchema,
  deleteUserSchema,
};