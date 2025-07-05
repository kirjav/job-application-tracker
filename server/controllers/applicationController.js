const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createApplication(req, res) {
    const { company, position, status, source, notes, dateApplied, resumeUrl } = req.body;

    try {
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
            },
        });

        res.status(201).json(newApp);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create application" });
    }
}

async function getUserApplications(req, res) {
    try {
        const apps = await prisma.application.findMany({
            where: { userId: req.user.userId },
            orderBy: { dateApplied: "desc" },
        });

        res.status(200).json(apps);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch applications" });
    }
}

async function updateApplication(req, res) {
    const { id } = req.params;
    const { company, position, status, source, notes, dateApplied, resumeUrl } = req.body;

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
            },
        });

        return res.json(updatedApp);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update application" });
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
        console.error(err);
        res.status(500).json({ error: "Failed to delete application" });
    }
}

module.exports = {
    createApplication,
    getUserApplications,
    updateApplication,
    deleteApplication,
};
