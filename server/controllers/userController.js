const bcrypt = require("bcrypt");

// Utils
const { isPasswordComplex, hashPassword, verifyPasswordMatch} = require("../utils/passwordUtils");
const { getAuthenticatedUser } = require("../utils/authHelpers");
const { handleError } = require("../utils/handleError");

const prisma = require("../utils/prisma");

const jwt = require("jsonwebtoken");


async function deleteUser(req, res) {
    const { password } = req.body;
    
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
    const { password, newEmail } = req.body;

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
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
        return res.status(400).json({ error: "Incomplete information" });
    }

    try {
        if (!isPasswordComplex(new_password)) {
            return res.status(400).json({ error: "Password does not meet complexity requirements" });
        }

        const user = await getAuthenticatedUser(req.user.userId);

        await verifyPasswordMatch(old_password, user.password);

        const hashedPassword = await hashPassword(new_password);

        const updatedUser = await prisma.user.update({
            where: { id: req.user.userId },
            data: { password: hashedPassword },
        });

        return res.json({ message: "Password updated successfully" });
    } catch (err) {
        return handleError(res, err, "Failed to update Password");
    }
}

module.exports = {
    deleteUser,
    updateEmail,
    updatePassword,
};