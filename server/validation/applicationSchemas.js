const { z } = require("zod");

// Helper: no special chars or spaces in tags
const tagNameRegex = /^[a-zA-Z0-9_-]+$/;

// Common schema for string fields (non-empty, trimmed)
const nonEmptyString = z.string().trim().min(1);

// ─── Application Creation Schema ─────────────────────────────
const applicationSchema = z.object({
  company: nonEmptyString,
  position: nonEmptyString,
  status: nonEmptyString,
  source: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  dateApplied: z.coerce.date(),
  resumeUrl: z.string().url().optional().nullable(),
  tagIds: z.array(z.number().int()).optional(),
  tailoredResume: z.boolean().optional(),
  tailoredCoverLetter: z.boolean().optional(),   
});

// ─── Application Update Schema (can allow partial fields) ────
const updateApplicationSchema = applicationSchema.partial().extend({
  tagIds: z.array(z.number().int()).optional(),
});

// ─── GET /applications query schema ──────────────────────────
const querySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  tags: z
    .union([
      z.array(z.string().regex(tagNameRegex, {
        message: "Tags must contain only letters, numbers, underscores, or hyphens.",
      })),
      z.string().regex(tagNameRegex).transform(tag => [tag]),
    ])
    .optional(),
});

// ─── Route Params (e.g., :id) ────────────────────────────────
const paramIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

module.exports = {
  applicationSchema,
  updateApplicationSchema,
  querySchema,
  paramIdSchema,
};
