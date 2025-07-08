const express = require("express");
const router = express.Router();
const { createApplication, getUserApplications, updateApplication, deleteApplication } = require("../controllers/applicationController");
const validate = require("../middleware/schemaValidation");
const authenticateToken = require("../middleware/authMiddleware");

const {
    applicationSchema,
    updateApplicationSchema,
    querySchema,
    paramIdSchema,
} = require("../validation/applicationSchemas");

// POST /applications – body validation
router.post("/", authenticateToken, validate(applicationSchema), createApplication);

// GET /applications – query validation
router.get("/", authenticateToken, validate(querySchema, "query"), getUserApplications);

// PUT /applications/:id – body + param validation
router.put(
    "/:id",
    authenticateToken,
    validate(paramIdSchema, "params"),
    validate(updateApplicationSchema),
    updateApplication
);

// DELETE /applications/:id – param validation only
router.delete("/:id", authenticateToken, validate(paramIdSchema, "params"), deleteApplication);

module.exports = router;