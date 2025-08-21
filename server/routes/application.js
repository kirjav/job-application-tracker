const express = require("express");
const router = express.Router();
const { createApplication, getUserApplications, updateApplication, updateApplicationPartial, updateApplicationsStatus, deleteApplication, getSingleApplication, getAllUserApplications } = require("../controllers/applicationController");
const validate = require("../middleware/schemaValidation");
const authenticateToken = require("../middleware/authMiddleware");

const {
  applicationSchema,
  updateApplicationSchema,
  filterSchema,
  paramIdSchema,
  updateGroupApplicationsSchema,
} = require("../validation/applicationSchemas");

//router.use(authenticateToken);

// POST /applications – body validation
router.post("/", authenticateToken, validate(applicationSchema), createApplication);

// GET /applications – query validation for filter stuff
router.get("/", authenticateToken, validate(filterSchema, "query"), getUserApplications);

router.get("/all", authenticateToken, getAllUserApplications);

router.patch(
  "/statusUpdate",
  authenticateToken,
  validate(updateGroupApplicationsSchema, "body"),
  updateApplicationsStatus
);

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