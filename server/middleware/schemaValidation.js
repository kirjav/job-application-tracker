const { ZodError } = require("zod");

function validate(schema, source = "body") {
  return async (req, res, next) => {
    try {
      const data = req[source] ?? {};
      const result = await schema.safeParseAsync(data);

      if (!result.success) {
        const { fieldErrors, formErrors } = result.error.flatten();
        return res.status(422).json({ errors: fieldErrors, formErrors });
      }

      req.validated = req.validated || {};
      req.validated[source] = result.data;
      next();
    } catch (err) {
      // If something truly unexpected happens
      if (err instanceof ZodError) {
        return res.status(422).json({ errors: err.flatten().fieldErrors, formErrors: err.flatten().formErrors });
      }
      return res.status(500).json({ error: "Unexpected validation error" });
    }
  };
}

module.exports = validate;
// optionally also export validateAll from above
