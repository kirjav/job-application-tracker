const { ZodError } = require("zod");

function validate(schema, source = "body") {
  return (req, res, next) => {
    try {
      const data = req[source];
      const parsed = schema.parse(data);

      // If only one schema is being validated, store as req.validated
      if (!req._validatedSources) {
        req.validated = parsed;
        req._validatedSources = [source];
      } else {
        // Multiple schemas detected — use dictionary form
        if (!req.validated || typeof req.validated !== "object") {
          req.validated = {};
        }
        req.validated[source] = parsed;

        // Prevent overwrite on subsequent calls
        if (!req._validatedSources.includes(source)) {
          req._validatedSources.push(source);
        }
      }

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({ errors: err.errors });
      }
      return res.status(500).json({ error: "Unexpected validation error" });
    }
  };
}

module.exports = validate;
