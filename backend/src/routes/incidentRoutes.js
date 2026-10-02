const express = require("express");

const {
    getIncidents,
    getIncidentById,
    updateIncidentStatus,
    getIncidentTimeline,
    getIncidentGraph
} = require("../controllers/incidentController");

const router = express.Router();

router.get("/", getIncidents);
router.get("/:id/timeline", getIncidentTimeline);
router.get("/:id/graph", getIncidentGraph);
router.get("/:id", getIncidentById);

router.patch("/:id/status", updateIncidentStatus);

module.exports = router;