const { z } = require("zod");

const tagSchema = z.object({
  name: z
    .string()
    .min(1, "Tag name is required")
    .max(30, "Tag name must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Tag name must not contain spaces or special characters"),
});

const tagSearchSchema = z.object({
  q: z.string().trim().min(1).max(50)
});

module.exports = {
  tagSchema,
  tagSearchSchema,
};