const prisma = require("../utils/prisma");
const { handleError } = require("../utils/handleError");

/**
 * Compute effectiveSalary for sorting: exact if set, else average of min/max when both set.
 */
function computeEffectiveSalary(salaryExact, salaryMin, salaryMax) {
  if (salaryExact != null && typeof salaryExact === "number" && !Number.isNaN(salaryExact)) {
    return salaryExact;
  }
  const min = salaryMin != null && typeof salaryMin === "number" && !Number.isNaN(salaryMin) ? salaryMin : null;
  const max = salaryMax != null && typeof salaryMax === "number" && !Number.isNaN(salaryMax) ? salaryMax : null;
  if (min != null && max != null) {
    return Math.round((min + max) / 2);
  }
  if (min != null) return min;
  if (max != null) return max;
  return null;
}

async function createApplication(req, res) {
  const {
    company, position, status, mode, source, notes,
    tailoredCoverLetter, tailoredResume,
    dateApplied, salaryExact, salaryMin, salaryMax, resumeUrl, tagIds
  } = req.validated.body;

  try {
    const safeTagIds = (tagIds ?? []).filter((id) => typeof id === "number");

    // ensure tags belong to this user
    const userTags = await prisma.tag.findMany({
      where: { id: { in: safeTagIds }, userId: req.user.userId },
      select: { id: true },
    });
    const validatedTagIds = userTags.map(t => t.id);

    const effectiveSalary = computeEffectiveSalary(salaryExact, salaryMin, salaryMax);

    const newApp = await prisma.application.create({
      data: {
        company,
        position,
        status,
        mode,
        source,
        notes,
        tailoredResume: !!tailoredResume,
        tailoredCoverLetter: !!tailoredCoverLetter,
        resumeUrl,
        dateApplied: new Date(dateApplied),
        salaryExact,
        salaryMin,
        salaryMax,
        effectiveSalary,
        userId: req.user.userId,
        // implicit M:N: connect tags directly by id
        ...(validatedTagIds.length
          ? { tags: { connect: validatedTagIds.map(id => ({ id })) } }
          : {}),
      },
      include: { tags: true },
    });

    res.status(201).json(newApp);
  } catch (err) {
    console.error("Create application error:", err.code, err.message, err.meta);
    return res.status(500).json({ error: err.message, code: err.code, meta: err.meta });
  }
}


const STATUS_ORDER = [
  "Wishlist",
  "Interviewing",
  "Offer",
  "Applied",
  "Rejected",
  "Withdrawn",
  "Ghosted",
];
const statusRank = Object.fromEntries(STATUS_ORDER.map((s, i) => [s, i]));

/**
 * Build Prisma where from validated filters
 */
function buildWhere(userId, f) {
  const AND = [{ userId }];

  if (f.statuses?.length) AND.push({ status: { in: f.statuses } });
  if (f.modes?.length) AND.push({ mode: { in: f.modes } });

  if (f.dateFrom || f.dateTo) {
    AND.push({
      dateApplied: {
        gte: f.dateFrom ?? undefined,
        lte: f.dateTo ?? undefined,
      },
    });
  }

  if (f.tagNames?.length) {
    // App has at least one Tag whose name is in the set
    AND.push({ tags: { some: { name: { in: f.tagNames } } } });
  }

  if (f.q) {
    AND.push({
      OR: [
        { company: { contains: f.q, mode: "insensitive" } },
        { position: { contains: f.q, mode: "insensitive" } },
      ],
    });
  }

  if (f.salaryMin != null || f.salaryMax != null) {
    const exactInside = {
      AND: [
        f.salaryMin != null ? { salaryExact: { gte: f.salaryMin } } : {},
        f.salaryMax != null ? { salaryExact: { lte: f.salaryMax } } : {},
      ],
    };

    const rangeContained = {
      AND: [
        { salaryMin: { not: null } },
        { salaryMax: { not: null } },
        f.salaryMin != null ? { salaryMin: { gte: f.salaryMin } } : {},
        f.salaryMax != null ? { salaryMax: { lte: f.salaryMax } } : {},
      ],
    };

    AND.push({
      OR: [exactInside, rangeContained],
    });
  }

  return { AND };
}
/**
 * Only these can be ordered directly in SQL without custom logic
 */
function buildOrderBy(f) {

  if (f.sortBy === "salary" || f.sortBy === "effectiveSalary") {
    return [{ effectiveSalary: { sort: f.sortDir, nulls: "last" } }];
  }
  // These can be SQL-ordered directly
  if (["company", "position", "mode", "dateApplied"].includes(f.sortBy)) {
    return [{ [f.sortBy]: f.sortDir }];
  }
  // status uses custom rank → JS post-sort
  return undefined;
}

function computeWindow({ itemsPerPage, page }) {
  const windowSize = 5 * itemsPerPage;
  const windowIndex = Math.floor((page - 1) / 5);
  return { skip: windowIndex * windowSize, take: windowSize };
}

async function getUserApplications(req, res) {
  const userId = req.user.userId;
  const f = req.validated.query;

  try {
    const where = buildWhere(userId, f);
    const orderBy = buildOrderBy(f);
    const { skip, take } = computeWindow(f);

    const [itemsRaw, total] = await Promise.all([
      prisma.application.findMany({
        where,
        orderBy: orderBy ?? undefined,
        skip,
        take,
        include: {
          tags: true, // or { select: { id: true, name: true } } if you prefer
        },
      }),
      prisma.application.count({ where }),
    ]);

    let items = itemsRaw;
    if (!orderBy && f.sortBy === "status") {
      items = itemsRaw.sort((a, b) => {
        const d = (statusRank[a.status] ?? 999) - (statusRank[b.status] ?? 999);
        return f.sortDir === "asc" ? d : -d;
      });
    }

    return res.json({ total, window: { skip, take }, items });
  } catch (err) {
    return handleError(res, err, "Failed to fetch application list");
  }
}

// Short-lived cache for user's inactivity threshold to avoid repeated user lookups when toggling activity filter.
const USER_THRESHOLD_CACHE_TTL_MS = 60_000; // 1 minute
const userThresholdCache = new Map(); // userId -> { value: number, ts: number }

function getInactivityThresholdDays(userId) {
  const cached = userThresholdCache.get(userId);
  if (cached && Date.now() - cached.ts < USER_THRESHOLD_CACHE_TTL_MS) {
    return cached.value;
  }
  return null;
}

function setInactivityThresholdCache(userId, value) {
  userThresholdCache.set(userId, { value, ts: Date.now() });
}

async function getAllUserApplications(req, res) {
  const userId = req.user.userId;
  const activity = req.validated?.query?.activity ?? "all";

  try {
    const where = { userId };

    if (activity !== "all") {
      let thresholdDays = getInactivityThresholdDays(userId);
      if (thresholdDays === null) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { inactivityThresholdDays: true },
        });
        thresholdDays = user?.inactivityThresholdDays ?? 30;
        setInactivityThresholdCache(userId, thresholdDays);
      }
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - thresholdDays);
      cutoff.setHours(0, 0, 0, 0);

      if (activity === "active") {
        where.dateUpdated = { gte: cutoff };
      } else {
        where.dateUpdated = { lt: cutoff };
      }
    }

    const allApps = await prisma.application.findMany({
      where,
      include: {
        tags: true,
      },
    });

    res.json(allApps);
  } catch (err) {
    return handleError(res, err, "Failed to fetch all applications");
  }
}

async function updateApplication(req, res) {
  const { id } = req.validated.params;
  const {
    company, position, status, mode, source, notes,
    tailoredCoverLetter, tailoredResume,
    dateApplied, salaryExact, salaryMin, salaryMax, resumeUrl, tagIds
  } = req.validated.body;

  try {
    const existingApp = await prisma.application.findUnique({ where: { id: Number(id) } });
    if (!existingApp) return res.status(404).json({ error: "Application not found" });
    if (existingApp.userId !== req.user.userId) return res.status(403).json({ error: "Forbidden" });

    let tagOps = undefined;
    if (Array.isArray(tagIds)) {
      const safeTagIds = tagIds.filter((n) => typeof n === "number");
      const userTags = await prisma.tag.findMany({
        where: { id: { in: safeTagIds }, userId: req.user.userId },
        select: { id: true },
      });
      const validatedTagIds = userTags.map(t => t.id);
      // replace full set
      tagOps = {
        set: [],
        ...(validatedTagIds.length
          ? { connect: validatedTagIds.map(id => ({ id })) }
          : {}),
      };
    }

    const effectiveSalary = computeEffectiveSalary(salaryExact, salaryMin, salaryMax);

    const updatedApp = await prisma.application.update({
      where: { id: Number(id) },
      data: {
        company,
        position,
        status,
        mode,
        source,
        notes,
        tailoredCoverLetter,
        tailoredResume,
        resumeUrl,
        dateApplied: dateApplied ? new Date(dateApplied) : undefined,
        ...(tagOps ? { tags: tagOps } : {}),
        salaryExact,
        salaryMin,
        salaryMax,
        effectiveSalary,
      },
      include: { tags: true },
    });

    return res.json(updatedApp);
  } catch (err) {
    return handleError(res, err, "Failed to update application");
  }
}

async function updateApplicationPartial(req, res) {
  const { id } = req.validated.params;
  const updates = { ...req.validated.body };

  try {
    const app = await prisma.application.findUnique({ where: { id: Number(id) } });
    if (!app) return res.status(404).json({ error: "Application not found" });
    if (app.userId !== req.user.userId) return res.status(403).json({ error: "Forbidden: Not your application" });

    // Handle tags if provided
    let tagOps;
    if (Array.isArray(updates.tagIds)) {
      const safeTagIds = updates.tagIds.filter((n) => typeof n === "number");
      const userTags = await prisma.tag.findMany({
        where: { id: { in: safeTagIds }, userId: req.user.userId },
        select: { id: true },
      });
      const validatedTagIds = userTags.map(t => t.id);

      tagOps = {
        set: [],
        ...(validatedTagIds.length ? { connect: validatedTagIds.map(id => ({ id })) } : {}),
      };

      delete updates.tagIds;
    }

    if ("salaryExact" in updates || "salaryMin" in updates || "salaryMax" in updates) {
      const salaryExact = updates.salaryExact !== undefined ? updates.salaryExact : app.salaryExact;
      const salaryMin = updates.salaryMin !== undefined ? updates.salaryMin : app.salaryMin;
      const salaryMax = updates.salaryMax !== undefined ? updates.salaryMax : app.salaryMax;
      updates.effectiveSalary = computeEffectiveSalary(salaryExact, salaryMin, salaryMax);
    }

    const updated = await prisma.application.update({
      where: { id: Number(id) },
      data: {
        ...updates,
        ...(tagOps ? { tags: tagOps } : {}),
      },
      include: { tags: true },
    });

    return res.json(updated);
  } catch (err) {
    return handleError(res, err, "Failed to update application");
  }
}

async function updateApplicationsStatus(req, res) {
  try {
    const userId = req.user.userId; // from your auth middleware
    const { applicationIds, update } = req.validated.body;
    const { status } = update;

    // Get only IDs this user actually owns
    const owned = await prisma.application.findMany({
      where: { userId, id: { in: applicationIds } },
      select: { id: true },
    });
    const ownedIds = owned.map(a => a.id);

    if (ownedIds.length === 0) {
      return res.status(200).json({
        attempted: applicationIds.length,
        eligible: 0,
        updated: 0,
        skipped: applicationIds,
        status,
      });
    }

    const result = await prisma.application.updateMany({
      where: { userId, id: { in: ownedIds } },
      data: {
        status,
        dateUpdated: new Date(), // optional: touch updated timestamp
      },
    });

    return res.status(200).json({
      attempted: applicationIds.length,
      eligible: ownedIds.length,
      updated: result.count,
      skipped: applicationIds.filter(id => !ownedIds.includes(id)),
      status,
    });
  } catch (err) {
    return handleError(res, err, "Failed to update list of applications.");
  }
}




async function deleteApplication(req, res) {
  const { id } = req.validated.params;

  try {
    const existingApp = await prisma.application.findUnique({
      where: { id: Number(id) },
    });

    if (!existingApp) {
      return res.status(404).json({ error: "Application not found" });
    }

    if (existingApp.userId !== req.user.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await prisma.application.delete({
      where: { id: Number(id) },
    });

    res.status(204).send();
  } catch (err) {
    return handleError(res, err, "Failed to delete application");
  }
}

async function getSingleApplication(req, res) {
  const { id } = req.params;
  const numId = Number(id);
  if (Number.isNaN(numId) || numId < 1 || !Number.isInteger(numId)) {
    return res.status(404).json({ error: "Application not found" });
  }

  try {
    const app = await prisma.application.findUnique({
      where: { id: numId },
      include: {
        tags: true,
      },
    });

    if (!app || app.userId !== req.user.userId) {
      return res.status(404).json({ error: "Application not found" });
    }

    res.json(app);
  } catch (err) {
    return handleError(res, err, "Failed to fetch application");
  }
}

module.exports = {
  createApplication,
  getUserApplications,
  getAllUserApplications,
  updateApplication,
  updateApplicationPartial,
  updateApplicationsStatus,
  deleteApplication,
  getSingleApplication,
};
