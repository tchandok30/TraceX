const Event = require("../models/Event");
const Incident = require("../models/Incident");

const detectBruteForce = async (event) => {
    const fiveMinutesAgo = new Date(
        Date.now() - 5 * 60 * 1000
    );

    const failedLogins = await Event.countDocuments({
        ip: event.ip,
        endpoint: "/api/demo/login",
        method: "POST",
        statusCode: 401,
        timestamp: { $gte: fiveMinutesAgo }
    });

    if (failedLogins < 5) {
        return null;
    }

    const existingIncident = await Incident.findOne({
        type: "BRUTE_FORCE",
        sourceIP: event.ip,
        status: {
            $in: ["OPEN", "INVESTIGATING"]
        }
    });

    if (existingIncident) {
        await Event.updateMany(
            {
                ip: event.ip,
                endpoint: "/api/demo/login",
                method: "POST",
                statusCode: 401,
                timestamp: { $gte: fiveMinutesAgo }
            },
            {
                $set: {
                    incidentId: existingIncident._id
                }
            }
        );

        return existingIncident;
    }

    const incident = await Incident.create({
        type: "BRUTE_FORCE",
        severity: "HIGH",
        sourceIP: event.ip,
        startTime: fiveMinutesAgo,
        description:
            `Multiple failed login attempts detected from ${event.ip}`
    });

    await Event.updateMany(
        {
            ip: event.ip,
            endpoint: "/api/demo/login",
            method: "POST",
            statusCode: 401,
            timestamp: { $gte: fiveMinutesAgo }
        },
        {
            $set: {
                incidentId: incident._id
            }
        }
    );

    return incident;
};


const detectEndpointScan = async (event) => {
    const fiveMinutesAgo = new Date(
        Date.now() - 5 * 60 * 1000
    );

    const events = await Event.find({
        ip: event.ip,
        statusCode: 404,
        timestamp: { $gte: fiveMinutesAgo }
    });

    const uniqueEndpoints = [
        ...new Set(events.map((event) => event.endpoint))
    ];

    if (uniqueEndpoints.length < 5) {
        return null;
    }

    const existingIncident = await Incident.findOne({
        type: "ENDPOINT_SCAN",
        sourceIP: event.ip,
        status: {
            $in: ["OPEN", "INVESTIGATING"]
        }
    });

    if (existingIncident) {
        await Event.updateMany(
            {
                ip: event.ip,
                statusCode: 404,
                timestamp: { $gte: fiveMinutesAgo }
            },
            {
                $set: {
                    incidentId: existingIncident._id
                }
            }
        );

        return existingIncident;
    }

    const incident = await Incident.create({
        type: "ENDPOINT_SCAN",
        severity: "MEDIUM",
        sourceIP: event.ip,
        startTime: fiveMinutesAgo,
        description:
            `Multiple unknown endpoints accessed from ${event.ip}`
    });

    await Event.updateMany(
        {
            ip: event.ip,
            statusCode: 404,
            timestamp: { $gte: fiveMinutesAgo }
        },
        {
            $set: {
                incidentId: incident._id
            }
        }
    );

    return incident;
};


const detectThreat = async (event) => {
    try {

        // Brute Force
        if (
            event.endpoint === "/api/demo/login" &&
            event.method === "POST" &&
            event.statusCode === 401
        ) {
            const incident = await detectBruteForce(event);

            if (incident) {
                return {
                    detected: true,
                    incident
                };
            }
        }

        // Endpoint Scan
        if (event.statusCode === 404) {
            const incident = await detectEndpointScan(event);

            if (incident) {
                return {
                    detected: true,
                    incident
                };
            }
        }

        return {
            detected: false
        };

    } catch (error) {
        console.log(
            "Threat detection failed:",
            error.message
        );

        return {
            detected: false
        };
    }
};


module.exports = {
    detectThreat,
    detectBruteForce,
    detectEndpointScan
};