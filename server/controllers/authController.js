const { isPasswordComplex, hashPassword, verifyPasswordMatch } = require("../utils/passwordUtils");
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

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Store refresh token in HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(201).json({ token: accessToken });
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
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    await verifyPasswordMatch(password, user.password);

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // only over HTTPS in prod
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({ token: accessToken });

  } catch (err) {
    return handleError(res, err, "Internal server error");
  }
}

async function refreshToken(req, res) {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ error: "Refresh token not found" });
  }

  try {
    const payload = jwt.verify(token, process.env.REFRESH_SECRET);

    // Optional: you can also verify if the user still exists
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return res.status(401).json({ error: "User no longer exists" });
    }

    const newAccessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({ token: newAccessToken });
  } catch (err) {
    console.error("Refresh token error:", err);
    return res.status(403).json({ error: "Invalid or expired refresh token" });
  }
}


module.exports = {
    registerUser,
    loginUser,
    refreshToken,
};
