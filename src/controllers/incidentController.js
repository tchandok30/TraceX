const Incident = require("../models/Incident");
const Event = require("../models/Event");
// Get all incidents
const getIncidents = async (req, res) => {
    try {
        const incidents = await Incident.find()
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: incidents.length,
            incidents
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch incidents",
            error: error.message
        });
    }
};


// Get single incident
const getIncidentById = async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id);

        if (!incident) {
            return res.status(404).json({
                message: "Incident not found"
            });
        }

        res.status(200).json({
            incident
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch incident",
            error: error.message
        });
    }
};


// Update incident status
const updateIncidentStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const incident = await Incident.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!incident) {
            return res.status(404).json({
                message: "Incident not found"
            });
        }

        res.status(200).json({
            message: "Incident status updated",
            incident
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to update incident",
            error: error.message
        });
    }
};

const getIncidentTimeline = async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id);

        if (!incident) {
            return res.status(404).json({
                message: "Incident not found"
            });
        }

        const events = await Event.find({
            incidentId: incident._id
        }).sort({
            timestamp: 1
        });

        res.status(200).json({
            incident,
            eventCount: events.length,
            timeline: events
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch incident timeline",
            error: error.message
        });
    }
};
const getIncidentGraph = async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id);

        if (!incident) {
            return res.status(404).json({
                message: "Incident not found"
            });
        }

        const events = await Event.find({
            incidentId: incident._id
        }).sort({
            timestamp: 1
        });

        const nodes = [];
        const edges = [];

        // Incident node
        nodes.push({
            id: `incident-${incident._id}`,
            type: "INCIDENT",
            label: incident.type
        });

        // IP node
        const ipNodeId = `ip-${incident.sourceIP}`;

        nodes.push({
            id: ipNodeId,
            type: "IP",
            label: incident.sourceIP
        });

        edges.push({
            source: ipNodeId,
            target: `incident-${incident._id}`,
            relationship: "TRIGGERED"
        });

        // Event + Endpoint nodes
        events.forEach((event) => {

            const eventNodeId = `event-${event._id}`;

            nodes.push({
                id: eventNodeId,
                type: "EVENT",
                label: `${event.method} ${event.endpoint}`
            });

            edges.push({
                source: ipNodeId,
                target: eventNodeId,
                relationship: "GENERATED"
            });

            const endpointNodeId = `endpoint-${event.method}-${event.endpoint}`;

            const endpointExists = nodes.some(
                (node) => node.id === endpointNodeId
            );

            if (!endpointExists) {
                nodes.push({
                    id: endpointNodeId,
                    type: "API",
                    label: `${event.method} ${event.endpoint}`
                });
            }

            edges.push({
                source: eventNodeId,
                target: endpointNodeId,
                relationship: "CALLED"
            });
        });

        res.status(200).json({
            incident,
            nodes,
            edges
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to generate incident graph",
            error: error.message
        });
    }
};
module.exports = {
    getIncidents,
    getIncidentById,
    getIncidentGraph,
    updateIncidentStatus,
    getIncidentTimeline
};
