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

// Higher-limit rate limiter for PATCH (drag-and-drop status updates fire frequently)
const patchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

// Custom limiter for /applications route
const applicationsLimiter = (req, res, next) => {
  if (req.method === "PATCH") return patchLimiter(req, res, next);
  return generalLimiter(req, res, next);
};

module.exports = {
  generalLimiter,
  authLimiter,
  applicationsLimiter,
};