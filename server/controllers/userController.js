const bcrypt = require("bcrypt");
const { isPasswordComplex } = require("../utils/passwordUtils");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");


async function deleteUser(req, res) {
    const { password } = req.body;
    if (!password) {
        return res.status(400).json({ error: "Password required" });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        await prisma.user.delete({
            where: { id: user.id } // ← ensures only *their* account is deleted
        });

        return res.status(204).send(); // No Content
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to delete user" });
    }
}

async function updateEmail(req, res) {
    const { password, new_email } = req.body;

    if (!password) {
        return res.status(400).json({ error: "Password required" });
    }

    if (!new_email) {
        return res.status(400).json({ error: "New email required" });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const existing = await prisma.user.findUnique({
            where: { email: new_email }
        });
        if (existing) {
            return res.status(409).json({ error: "Email already in use" });
        }


        const updatedUser = await prisma.user.update({
            where: { id: req.user.userId },
            data: { email: new_email },
        });

        return res.json(updatedUser);


    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to update Email" });
    }
}

async function updatePassword(req, res) {
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
        return res.status(400).json({ error: "Incomplete information" });

    }

    try {
        if (!isPasswordComplex(new_password)) {
            return res.status(400).json({ error: "Password does not meet complexity requirements" });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const isValidPassword = await bcrypt.compare(old_password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);

        const updatedUser = await prisma.user.update({
            where: { id: req.user.userId },
            data: { password: hashedPassword },
        });

        return res.json({ message: "Password updated successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to update Password" });
    }
}

module.exports = {
    deleteUser,
    updateEmail,
    updatePassword,
};