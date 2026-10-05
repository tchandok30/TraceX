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
        }).sort({ timestamp: 1 });

        const nodesMap = new Map();
        const edges = [];

        const addNode = (node) => {
            if (!nodesMap.has(node.id)) {
                nodesMap.set(node.id, node);
            }
        };

        const addEdge = (source, target, relationship) => {
            edges.push({
                source,
                target,
                relationship
            });
        };

        const incidentNodeId = `incident-${incident._id}`;
        const ipNodeId = `ip-${encodeURIComponent(incident.sourceIP)}`;

        addNode({
            id: incidentNodeId,
            type: "INCIDENT",
            label: incident.type,
            details: {
                title: incident.type,
                severity: incident.severity,
                status: incident.status,
                description: incident.description,
                sourceIP: incident.sourceIP,
                createdAt: incident.createdAt
            }
        });

        addNode({
            id: ipNodeId,
            type: "IP",
            label: incident.sourceIP,
            details: {
                title: "Source IP",
                ip: incident.sourceIP
            }
        });

        addEdge(ipNodeId, incidentNodeId, "TRIGGERED");

        for (const event of events) {
            const eventNodeId = `event-${event._id}`;

            addNode({
                id: eventNodeId,
                type: "EVENT",
                label: `${event.method} ${event.endpoint}`,
                details: {
                    title: "API Event",
                    method: event.method,
                    endpoint: event.endpoint,
                    statusCode: event.statusCode,
                    ip: event.ip,
                    timestamp: event.timestamp,
                    userId: event.userId
                        ? event.userId.toString()
                        : null,
                    sessionId: event.sessionId,
                    resourceId: event.resourceId,
                    metadata: event.metadata
                }
            });

            addEdge(ipNodeId, eventNodeId, "GENERATED");

            // Connect event to its API endpoint
            const apiNodeId =
                `api-${encodeURIComponent(event.method)}-${encodeURIComponent(event.endpoint)}`;

            addNode({
                id: apiNodeId,
                type: "API",
                label: `${event.method} ${event.endpoint}`,
                details: {
                    title: "API Endpoint",
                    method: event.method,
                    endpoint: event.endpoint
                }
            });

            addEdge(eventNodeId, apiNodeId, "CALLED");

            // Connect event to user, if available
            if (event.userId) {
                const userId = event.userId.toString();
                const userNodeId = `user-${userId}`;

                addNode({
                    id: userNodeId,
                    type: "USER",
                    label: `User ${userId.slice(-6)}`,
                    details: {
                        title: "User",
                        userId
                    }
                });

                addEdge(eventNodeId, userNodeId, "ASSOCIATED WITH");
            }

            // Connect event to session, if available
            if (event.sessionId) {
                const sessionNodeId =
                    `session-${encodeURIComponent(event.sessionId)}`;

                addNode({
                    id: sessionNodeId,
                    type: "SESSION",
                    label: `Session ${event.sessionId.slice(-6)}`,
                    details: {
                        title: "Session",
                        sessionId: event.sessionId
                    }
                });

                addEdge(eventNodeId, sessionNodeId, "USED");
            }

            // Connect event to resource, if available
            if (event.resourceId) {
                const resourceNodeId =
                    `resource-${encodeURIComponent(event.resourceId)}`;

                addNode({
                    id: resourceNodeId,
                    type: "RESOURCE",
                    label: `Resource ${event.resourceId}`,
                    details: {
                        title: "Accessed Resource",
                        resourceId: event.resourceId
                    }
                });

                addEdge(eventNodeId, resourceNodeId, "ACCESSED");
            }
        }

        res.status(200).json({
            incident,
            eventCount: events.length,
            nodes: Array.from(nodesMap.values()),
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
