const { handleError } = require("../utils/handleError");
const prisma = require("../utils/prisma");

async function getUserTags(req, res) {
    try {
        const userTags = await prisma.tag.findMany({
            where: { userId: req.user.userId },
        });

        res.status(200).json(userTags);
    } catch (err) {
        return handleError(res, err, "Failed to fetch tags");
    }
}

// creates a Tag or returns an already existing Tag.
async function createTag(req, res) {

    const name = req.validated.body.name?.trim();
    if (!name) return res.status(400).json({ error: "Tag name is required" });

    try {
        const existingTag = await prisma.tag.findUnique({
            where: {
                userId_name: {
                    userId: req.user.userId,
                    name: name,
                },
            }
        })

        if (existingTag) {
            return res.status(200).json(existingTag);
        }


        const newTag = await prisma.tag.create({
            data: {
                name: name,
                userId: req.user.userId,
            },
        });

        return res.status(201).json(newTag);

    } catch (err) {
        return handleError(res, err, "Failed to create tag");
    }
}

async function deleteTag(req, res) {
    const { id } = req.params;

    try {
        const existingTag = await prisma.tag.findUnique({
            where: { id: Number(id) },
        });

        if (!existingTag) {
            return res.status(404).json({ error: "Tag not found" });
        }

        if (existingTag.userId !== req.user.userId) {
            return res.status(403).json({ error: "Forbidden" });
        }

        await prisma.tag.delete({
            where: { id: Number(id) },
        });

        res.status(204).send();
    } catch (err) {
        return handleError(res, err, "Failed to delete tag");
    }
}

module.exports = { getUserTags, createTag, deleteTag }