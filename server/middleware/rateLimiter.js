const rateLimit = require("express-rate-limit");

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login/register attempts. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Custom limiter for /applications route
const applicationsLimiter = (req, res, next) => {
  if (req.method === "PATCH") return next(); // skip limiter for PATCH
  return generalLimiter(req, res, next);     // apply limiter otherwise
};

module.exports = {
  generalLimiter,
  authLimiter,
  applicationsLimiter,
};