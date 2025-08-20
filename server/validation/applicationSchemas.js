const { z } = require("zod");

const STATUS_VALUES = ["Wishlist", "Applied", "Interviewing", "Offer", "Rejected", "Ghosted", "Withdrawn"];
const MODE_VALUES = ["In-Office", "Hybrid", "Remote"];

// Helper: no special chars or spaces in tags
const tagNameRegex = /^[a-zA-Z0-9_-]+$/;

// Common schema for string fields (non-empty, trimmed)
const nonEmptyString = z.string().trim().min(1);

const positiveIntOpt = z.preprocess(
  v => (v === "" || v == null ? undefined : v), // "" → undefined
  z.coerce.number().int().positive().optional()
);

const withSalaryRules = (schema) =>
  schema.superRefine((data, ctx) => {
    // Rule 1: salaryExact XOR salaryMin/Max
    if (data.salaryExact != null && (data.salaryMin != null || data.salaryMax != null)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Use either salaryExact OR salaryMin/salaryMax, not both.",
        path: ["salaryExact"],
      });
    }

    // Rule 2: min ≤ max
    if (data.salaryMin != null && data.salaryMax != null && data.salaryMin > data.salaryMax) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "salaryMin must be ≤ salaryMax.",
        path: ["salaryMin"],
      });
    }
  });

const applicationBase = z.object({
  company: nonEmptyString,
  position: nonEmptyString,
  status: z.enum(STATUS_VALUES),
  mode: z.enum(MODE_VALUES).default("In-Office"),
  source: z.string().optional(),
  notes: z.string().optional(),
  dateApplied: z.coerce.date(),
  salaryExact: positiveIntOpt.nullable(),
  salaryMin: positiveIntOpt.nullable(),
  salaryMax: positiveIntOpt.nullable(),
  resumeUrl: z.string().url().optional(),
  tagIds: z.array(z.number().int()).optional(),
  tailoredResume: z.boolean().optional().default(false),
  tailoredCoverLetter: z.boolean().optional().default(false),
}).strict();

// ─── Application Creation Schema ─────────────────────────────
const applicationSchema = withSalaryRules(applicationBase);

// sorting options you support
const SortBy = z.enum(["company", "position", "status", "mode", "dateApplied", "salary"]);
const SortDir = z.enum(["asc", "desc"]);

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
  dateTo: z.coerce.date().optional(),
  salaryExact: z.coerce.number().optional(),
  salaryMax: z.coerce.number().optional(),
  salaryMin: z.coerce.number().optional(),
  tagNames: z.preprocess(
    v => (Array.isArray(v) ? v : v ? [v] : []),
    z.array(z.string().trim().min(1))
  ).optional(),
  q: z.string().trim().optional(),

  // sorting & paging
  sortBy: SortBy.default("dateApplied"),
  sortDir: SortDir.default("desc"),
  itemsPerPage: z.coerce.number().min(5).max(100).default(10),
  page: z.coerce.number().min(1).default(1),
});

// ─── Application Update Schema (can allow partial fields) ────
const updateApplicationSchema = withSalaryRules(
  applicationBase
    .partial()
    .extend({
      tagIds: z.array(z.number().int()).optional(),
    })
    .strict()
);

// ─── Route Params (e.g., :id) ────────────────────────────────
const paramIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// ─── Group Update: batch status change ───────────────────────
const updateGroupApplicationsSchema = z.object({
  applicationIds: z
    .array(z.coerce.number().int().positive())
    .min(1, "Provide at least one application id")
    .transform(ids => Array.from(new Set(ids))), 
  update: z
    .object({
      status: z.enum(STATUS_VALUES, {
        required_error: "status is required for a group update",
      }),
    })
    .strict(),
}).strict();

module.exports = {
  applicationSchema,
  filterSchema,
  updateApplicationSchema,
  paramIdSchema,
  updateGroupApplicationsSchema,
};
