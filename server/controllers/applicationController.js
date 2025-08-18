const prisma = require("../utils/prisma");
const { handleError } = require("../utils/handleError");

async function createApplication(req, res) {
  const {
    company, position, status, mode, source, notes,
    tailoredCoverLetter, tailoredResume,
    dateApplied, resumeUrl, tagIds
  } = req.validated.body;

  try {
    const safeTagIds = (tagIds ?? []).filter((id) => typeof id === "number");

    // ensure tags belong to this user
    const userTags = await prisma.tag.findMany({
      where: { id: { in: safeTagIds }, userId: req.user.userId },
      select: { id: true },
    });
    const validatedTagIds = userTags.map(t => t.id);

    const newApp = await prisma.application.create({
      data: {
        company,
        position,
        status,
        mode, // ✅ make sure mode is saved
        source,
        notes,
        tailoredResume: !!tailoredResume,
        tailoredCoverLetter: !!tailoredCoverLetter,
        resumeUrl,
        dateApplied: new Date(dateApplied),
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

  if (f.tagIds?.length) {
    // implicit M:N → filter directly on Tag.id
    AND.push({ tags: { some: { id: { in: f.tagIds } } } });
  }

  if (f.q) {
    AND.push({
      OR: [
        { company: { contains: f.q, mode: "insensitive" } },
        { position: { contains: f.q, mode: "insensitive" } },
      ],
    });
  }

  return { AND };
}
/**
 * Only these can be ordered directly in SQL without custom logic
 */
function buildOrderBy(f) {
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

async function getAllUserApplications(req, res) {
  const userId = req.user.userId;

  try {
    const allApps = await prisma.application.findMany({
      where: { userId },
      include: {
        tags: true,
      },
      /*orderBy: {
        updatedAt: "desc",
      },*/
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
    dateApplied, resumeUrl, tagIds
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
        set: [], // clear all
        ...(validatedTagIds.length
          ? { connect: validatedTagIds.map(id => ({ id })) }
          : {}),
      };
    }

    const updatedApp = await prisma.application.update({
      where: { id: Number(id) },
      data: {
        company,
        position,
        status,
        mode, // ✅
        source,
        notes,
        tailoredCoverLetter,
        tailoredResume,
        resumeUrl,
        dateApplied: dateApplied ? new Date(dateApplied) : undefined,
        ...(tagOps ? { tags: tagOps } : {}),
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
  const updates = { ...req.validated.body }; // clone so we can prune tagIds

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
        set: [], // replace full set
        ...(validatedTagIds.length ? { connect: validatedTagIds.map(id => ({ id })) } : {}),
      };

      delete updates.tagIds; // important: not a scalar field
    }

    // If dateApplied came via Zod coerce, it’s already a Date
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

  try {
    const app = await prisma.application.findUnique({
      where: { id: Number(id) },
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
  deleteApplication,
  getSingleApplication,
};
