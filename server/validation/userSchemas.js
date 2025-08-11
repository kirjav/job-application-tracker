const { z } = require("zod");

const coerceIntOptional = (min, max) =>
  z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z.coerce.number().int().min(min).max(max)
  ).optional();


// -- primitives ----------------------------------------------------
const emailSchema = z.string().trim().email({ message: "Invalid email format" });

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/\d/, "Password must include a digit")
  .regex(/[@$!%*?&]/, "Password must include a special character");

const nameSchema = z.string().trim().min(1, "Name is required").max(80); // pick 80 or 100 and use it consistently

// -- auth/account flows --------------------------------------------
const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
}).strict();

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1), // usually don't enforce complexity on login; it's already set
}).strict();

const updateEmailSchema = z.object({
  password: passwordSchema,
  newEmail: emailSchema,
}).strict();

const updatePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: passwordSchema,
}).strict();

const deleteUserSchema = z.object({
  password: z.string().min(1),
}).strict();

const forgotPasswordSchema = z.object({
  email: emailSchema,
}).strict();

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: passwordSchema,
}).strict();

// -- profile/preferences (PATCH /me) --------------------------------
// Use coerce so "5" (string) becomes 5 (number)
const updatableUserFields = z.object({
  name: nameSchema.optional(),
  dailyApplicationGoal: coerceIntOptional(0, 1000),
  inactivityGraceDays: coerceIntOptional(0, 365),
}).strict();

// Drop empty strings, keep nulls (if you later want to allow explicit clearing)
const cleanEmptyStrings = (o) => {
  const cleaned = {};
  for (const [k, v] of Object.entries(o)) {
    if (v !== "") cleaned[k] = v;
  }
  return cleaned;
};

const updateMeSchema = updatableUserFields
  .transform(cleanEmptyStrings)
  .superRefine((o, ctx) => {
    if (Object.keys(o).length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Provide at least one field to update" });
    }
  });


module.exports = {
  registerSchema,
  loginSchema,
  updateEmailSchema,
  updatePasswordSchema,
  deleteUserSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateMeSchema,
};
