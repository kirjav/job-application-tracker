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

module.exports = { createApplication, getUserApplications };
