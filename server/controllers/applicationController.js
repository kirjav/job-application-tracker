const prisma = require("../utils/prisma");
const { handleError } = require("../utils/handleError");
const { getPaginatedApplications } = require("../services/applicationService");

async function createApplication(req, res) {
  const { company, position, status, mode, source, notes, tailoredCoverLetter, tailoredResume, dateApplied, resumeUrl, tagIds } = req.validated.body;

  try {
    const safeTagIds = (tagIds ?? []).filter((id) => typeof id === "number");

    const userTags = await prisma.tag.findMany({
      where: {
        id: { in: safeTagIds },
        userId: req.user.userId,
      },
    });

    const validatedTagIds = userTags.map(tag => tag.id);


    const newApp = await prisma.application.create({
      data: {
        company,
        position,
        status,
        mode,
        source,
        notes,
        tailoredResume,
        tailoredCoverLetter,
        resumeUrl,
        dateApplied: new Date(dateApplied),
        userId: req.user.userId,
        tags: {
          connect: validatedTagIds.map(id => ({ id })),
        }

      },
    });

    res.status(201).json(newApp);
  } catch (err) {

    return handleError(res, err, "Failed to create application");
  }
}

async function getUserApplications(req, res) {
  const userId = req.user.userId;
  const { page = 1, pageSize = 10, tags: tagFilter = [] } = req.validated.query;

  try {
    const result = await getPaginatedApplications({
      userId,
      page,
      pageSize,
      tagFilter,
    });

    res.status(200).json(result);
  } catch (err) {
    return handleError(res, err, "Failed to fetch application");
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
  const { company, position, status, mode, source, notes, tailoredCoverLetter, tailoredResume, dateApplied, resumeUrl, tagIds } = req.validated.body;


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

    const safeTagIds = (tagIds ?? []).filter((id) => typeof id === "number");

    const userTags = await prisma.tag.findMany({
      where: {
        id: { in: safeTagIds },
        userId: req.user.userId,
      },
    });

    const validatedTagIds = userTags.map(tag => tag.id);


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
        dateApplied: new Date(dateApplied),
        tags: {
          set: validatedTagIds.map(id => ({ id })),
        }

      },
    });

    return res.json(updatedApp);
  } catch (err) {
    return handleError(res, err, "Failed to update application");
  }
}

async function updateApplicationPartial(req, res) {
  const { id } = req.validated.params;
  const updates = req.validated.body;

  try {
    const app = await prisma.application.findUnique({
      where: { id: Number(id) },
    });

    if (!app) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Ownership check
    if (app.userId !== req.user.userId) {
      return res.status(403).json({ error: "Forbidden: Not your application" });
    }

    const updated = await prisma.application.update({
      where: { id: Number(id) },
      data: updates,
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
