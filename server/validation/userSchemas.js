const { z } = require("zod");

const emailSchema = z.string().trim().email({ message: "Invalid email format" });

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/\d/, "Password must include a digit")
  .regex(/[@$!%*?&]/, "Password must include a special character");

const nameSchema = z.string().trim().min(1, "Name is required").max(100);

const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
}).strict();

const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
}).strict();

const updateEmailSchema = z.object({
  password: passwordSchema,
  newEmail: z.string().email("Invalid email"),
}).strict();

const updateNameSchema = z.object({
  newName: z.string().trim().min(1, "Name must be a non-empty string"),
}).strict();

const updatePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Old password is required"),
  newPassword: passwordSchema,
});

const deleteUserSchema = z.object({
  password: passwordSchema,
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: passwordSchema, // Or use your existing complexity validator
});


module.exports = {
  registerSchema,
  loginSchema,
  updateEmailSchema,
  updateNameSchema,
  updatePasswordSchema,
  deleteUserSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};