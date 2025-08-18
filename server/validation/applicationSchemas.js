const { z } = require("zod");

const STATUS_VALUES = ["Wishlist", "Applied", "Interviewing", "Offer", "Rejected", "Ghosted", "Withdrawn"];
const MODE_VALUES = ["In-Office", "Hybrid", "Remote"];

// Helper: no special chars or spaces in tags
const tagNameRegex = /^[a-zA-Z0-9_-]+$/;

// Common schema for string fields (non-empty, trimmed)
const nonEmptyString = z.string().trim().min(1);

// ─── Application Creation Schema ─────────────────────────────
const applicationSchema = z.object({
  company: nonEmptyString,
  position: nonEmptyString,
  status: z.enum(STATUS_VALUES),
  mode: z.enum(MODE_VALUES).default("In-Office"),
  source: z.string().optional(),
  notes: z.string().optional(),
  dateApplied: z.coerce.date(),
  resumeUrl: z.string().url().optional(),
  tagIds: z.array(z.number().int()).optional(),
  tailoredResume: z.boolean().optional().default(false),
  tailoredCoverLetter: z.boolean().optional().default(false),   
}).strict();

// sorting options you support
const SortBy  = z.enum(["company","position","status","mode","dateApplied","salary"]);
const SortDir = z.enum(["asc","desc"]);

// ─── Filters / Query for GET /applications ───────────────────
const filterSchema = z.object({
  // filters
  statuses: z.preprocess(
    v => (Array.isArray(v) ? v : v ? [v] : []),
    z.array(z.enum(STATUS_VALUES))
  ).optional(),
  modes: z.preprocess(
    v => (Array.isArray(v) ? v : v ? [v] : []),
    z.array(z.enum(MODE_VALUES))
  ).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo:   z.coerce.date().optional(),
  minSalary: z.coerce.number().optional(),
  maxSalary: z.coerce.number().optional(),
  tagIds: z.preprocess(
    v => (Array.isArray(v) ? v : v ? [v] : []),
    z.array(z.coerce.number().int())
  ).optional(),
  q: z.string().trim().optional(),

  // sorting & paging
  sortBy: SortBy.default("dateApplied"),
  sortDir: SortDir.default("desc"),
  itemsPerPage: z.coerce.number().min(5).max(100).default(10),
  page: z.coerce.number().min(1).default(1),
});

// ─── Application Update Schema (can allow partial fields) ────
const updateApplicationSchema = applicationSchema.partial().extend({
  tagIds: z.array(z.number().int()).optional(),
}).strict();

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
  filterSchema,
  updateApplicationSchema,
  querySchema,
  paramIdSchema,
};
