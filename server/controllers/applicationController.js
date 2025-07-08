const prisma = require("../utils/prisma");
const { handleError } = require("../utils/handleError");
const { getPaginatedApplications } = require("../services/applicationService");

async function createApplication(req, res) {
    const { company, position, status, source, notes, dateApplied, resumeUrl, tagIds } = req.body;

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
                source,
                notes,
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
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;
    const tagFilter = Array.isArray(req.query.tags)
        ? req.query.tags
        : req.query.tags
            ? [req.query.tags]
            : [];

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

async function updateApplication(req, res) {
    const { id } = req.params;
    const { company, position, status, source, notes, dateApplied, resumeUrl, tagIds } = req.body;


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
                source,
                notes,
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

async function deleteApplication(req, res) {
    const { id } = req.params;

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

module.exports = {
    createApplication,
    getUserApplications,
    updateApplication,
    deleteApplication,
};
