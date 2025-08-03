const { ZodError } = require("zod");

function validate(schema, source = "body") {
  return (req, res, next) => {
    try {
      const data = req[source];
      const parsed = schema.parse(data);

      // Always use object structure
      if (!req.validated) {
        req.validated = {};
      }

      req.validated[source] = parsed;

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