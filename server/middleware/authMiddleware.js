const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET,
    // Optional: issuer/audience checks if you set them in your tokens
    // { issuer: "your-app", audience: "your-app-users" },
    (err, payload) => {
      if (err) return res.status(403).json({ error: "Invalid or expired token" });
      // Put only what you need on req.user to avoid confusion
      req.user = { userId: payload.userId, roles: payload.roles, jti: payload.jti };
      next();
    }
  );
}

module.exports = authenticateToken;