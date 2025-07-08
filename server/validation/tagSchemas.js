const { z } = require("zod");

const tagSchema = z.object({
  name: z
    .string()
    .min(1, "Tag name is required")
    .max(30, "Tag name must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Tag name must not contain spaces or special characters"),
});

module.exports = {
  tagSchema,
};