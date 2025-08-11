const express = require("express");
const router = express.Router();
const { createApplication, getUserApplications, updateApplication, updateApplicationPartial, deleteApplication, getSingleApplication, getAllUserApplications } = require("../controllers/applicationController");
const validate = require("../middleware/schemaValidation");
const authenticateToken = require("../middleware/authMiddleware");

const {
  applicationSchema,
  updateApplicationSchema,
  querySchema,
  paramIdSchema,
} = require("../validation/applicationSchemas");

//router.use(authenticateToken);

// POST /applications – body validation
router.post("/", authenticateToken, validate(applicationSchema), createApplication);

// GET /applications – query validation
router.get("/", authenticateToken, validate(querySchema, "query"), getUserApplications);

router.get("/all", authenticateToken, getAllUserApplications);

router.get("/:id", authenticateToken, getSingleApplication);

// PUT /applications/:id – body + param validation
router.put(
  "/:id",
  authenticateToken,
  validate(paramIdSchema, "params"),
  validate(updateApplicationSchema, "body"),
  updateApplication
);

router.patch(
  "/:id",
  authenticateToken,
  validate(paramIdSchema, "params"),
  validate(updateApplicationSchema, "body"),
  updateApplicationPartial
);


// DELETE /applications/:id – param validation only
router.delete("/:id", authenticateToken, validate(paramIdSchema, "params"), deleteApplication);

module.exports = router;