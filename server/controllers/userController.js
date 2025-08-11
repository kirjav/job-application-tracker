const bcrypt = require("bcrypt");

// Utils
const { isPasswordComplex, hashPassword, verifyPasswordMatch } = require("../utils/passwordUtils");
const { getAuthenticatedUser } = require("../utils/authHelpers");
const { handleError } = require("../utils/handleError");

const prisma = require("../utils/prisma");

const jwt = require("jsonwebtoken");


async function deleteUser(req, res) {
    const { password } = req.validated.body;

    if (!password) {
        return res.status(400).json({ error: "Password required" });
    }

    try {
        const user = await getAuthenticatedUser(req.user.userId);

        await verifyPasswordMatch(password, user.password);

        await prisma.user.delete({
            where: { id: user.id } // ← ensures only *their* account is deleted
        });

        return res.status(204).send(); // No Content
    } catch (err) {
        return handleError(res, err, "Failed to delete User");
    }
}

async function updateEmail(req, res) {
    const { password, newEmail } = req.validated.body;

    if (!password) {
        return res.status(400).json({ error: "Password required" });
    }

    if (!newEmail) {
        return res.status(400).json({ error: "New email required" });
    }

    try {
        const user = await getAuthenticatedUser(req.user.userId);

        await verifyPasswordMatch(password, user.password);

        const existing = await prisma.user.findUnique({
            where: { email: newEmail }
        });
        if (existing) {
            return res.status(409).json({ error: "Email already in use" });
        }

        await prisma.user.update({
            where: { id: req.user.userId },
            data: { email: newEmail },
        });

        return res.json({ message: "Email updated successfully" });

        /* If I want to return the new email to the front end use this instead:

        const updatedUser = await prisma.user.update({
        where: { id: req.user.userId },
        data: { email: newEmail },
        });

        return res.json({ email: updatedUser.email });
        */

    } catch (err) {
        return handleError(res, err, "Failed to update Email");
    }
}

async function updatePassword(req, res) {
    const { oldPassword, newPassword } = req.validated.body;

    try {

        const user = await getAuthenticatedUser(req.user.userId);

        await verifyPasswordMatch(oldPassword, user.password);

        const hashedPassword = await hashPassword(newPassword);

        const updatedUser = await prisma.user.update({
            where: { id: req.user.userId },
            data: { password: hashedPassword },
        });

        return res.json({ message: "Password updated successfully" });
    } catch (err) {
        return handleError(res, err, "Failed to update Password");
    }
}

function pruneUndefined(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
        if (v !== undefined) out[k] = v; // keep null if you want to explicitly clear
    }
    return out;
}

async function updateMe(req, res) {
    try {
        const allowed = pruneUndefined(req.validated.body);

        // In case transform stripped everything (e.g., only empty strings were sent)
        if (Object.keys(allowed).length === 0) {
            return res.status(400).json({ error: "No valid fields to update" });
        }
        await getAuthenticatedUser(req.user.userId);

        const updated = await prisma.user.update({
            where: { id: req.user.userId },
            data: allowed,
            select: {
                id: true,
                name: true,
                dailyApplicationGoal: true,
                inactivityGraceDays: true,
                // add new fields here
            },
        });

        return res.json({ message: "Updated successfully", user: updated });
    } catch (err) {
        return handleError(res, err, "Failed to update profile");
    }
}

module.exports = {
    deleteUser,
    updateEmail,
    updatePassword,
    updateMe,
};