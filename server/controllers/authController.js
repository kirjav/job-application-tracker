const { isPasswordComplex, hashPassword, verifyPasswordMatch} = require("../utils/passwordUtils");
const { handleError } = require("../utils/handleError");

const prisma = require("../utils/prisma");
const jwt = require("jsonwebtoken");


async function registerUser(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
    }

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ error: "User already exists" });
        }

        if (!isPasswordComplex(password)) {
            return res.status(400).json({ error: "Password does not meet complexity requirements" });
        }

        const hashedPassword = await hashPassword(password)

        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
            },
        });

        return res.status(201).json({ message: "User created successfully!" });
    } catch (err) {
        return handleError(res, err, "Internal server error");
    }
}

async function loginUser(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
    }
    try {
        const user = await prisma.user.findUnique({
            where: {
                email: email,
            },
        });

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        await verifyPasswordMatch(password, user.password);

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        return res.status(200).json({ token });

    } catch (err) {
        return handleError(res, err, "Internal server error");
    }
}

module.exports = {
    registerUser,
    loginUser,
};
