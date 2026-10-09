const Event = require("../models/Event");
const Incident = require("../models/Incident");
const User = require("../models/User");
const { correlateIncident } = require("./correlationService");

// Safely run the correlation engine without breaking threat detection
const safelyCorrelate = async (incident) => {
    try {
        await correlateIncident(incident._id);
    } catch (error) {
        console.error("Correlation failed:", error.message);
    }
};

// 1. BRUTE FORCE DETECTION
const detectBruteForce = async (event) => {
    const fiveMinutesAgo = new Date(
        Date.now() - 5 * 60 * 1000
    );

    const filter = {
        ip: event.ip,
        endpoint: "/api/demo/login",
        method: "POST",
        statusCode: 401,
        timestamp: { $gte: fiveMinutesAgo }
    };

    const failedLogins = await Event.countDocuments(filter);

    if (failedLogins < 5) return null;

    let incident = await Incident.findOne({
        type: "BRUTE_FORCE",
        sourceIP: event.ip,
        status: { $in: ["OPEN", "INVESTIGATING"] }
    });

    if (!incident) {
        incident = await Incident.create({
            type: "BRUTE_FORCE",
            severity: "HIGH",
            sourceIP: event.ip,
            startTime: event.timestamp,
            description:
                `Multiple failed login attempts detected from ${event.ip}`
        });
    }

    await Event.updateMany(
        filter,
        { $set: { incidentId: incident._id } }
    );

    return incident;
};

// 2. ENDPOINT SCAN DETECTION
const detectEndpointScan = async (event) => {
    const fiveMinutesAgo = new Date(
        Date.now() - 5 * 60 * 1000
    );

    const filter = {
        ip: event.ip,
        statusCode: 404,
        timestamp: { $gte: fiveMinutesAgo }
    };

    const events = await Event.find(filter).select("endpoint");

    const uniqueEndpoints = [
        ...new Set(events.map((item) => item.endpoint))
    ];

    if (uniqueEndpoints.length < 5) return null;

    let incident = await Incident.findOne({
        type: "ENDPOINT_SCAN",
        sourceIP: event.ip,
        status: { $in: ["OPEN", "INVESTIGATING"] }
    });

    if (!incident) {
        incident = await Incident.create({
            type: "ENDPOINT_SCAN",
            severity: "MEDIUM",
            sourceIP: event.ip,
            startTime: event.timestamp,
            description:
                `Multiple unknown endpoints accessed from ${event.ip}`
        });
    }

    await Event.updateMany(
        filter,
        { $set: { incidentId: incident._id } }
    );

    return incident;
};

// 3. ABNORMAL ACCESS DETECTION
const detectAbnormalAccess = async (event) => {
    if (
        event.endpoint !== "/api/demo/admin/users" ||
        event.method !== "GET" ||
        event.statusCode !== 403 ||
        !event.userId
    ) {
        return null;
    }

    const user = await User.findById(event.userId);

    if (!user || user.role === "ADMIN") {
        return null;
    }

    let incident = await Incident.findOne({
        type: "ABNORMAL_ACCESS",
        sourceIP: event.ip,
        status: { $in: ["OPEN", "INVESTIGATING"] }
    });

    if (!incident) {
        incident = await Incident.create({
            type: "ABNORMAL_ACCESS",
            severity: "HIGH",
            sourceIP: event.ip,
            startTime: event.timestamp,
            description:
                `Non-admin user ${user.email} was blocked from accessing the admin endpoint`
        });
    }

    await Event.updateOne(
        { _id: event._id },
        { $set: { incidentId: incident._id } }
    );

    return incident;
};

// 4. REQUEST FREQUENCY DETECTION
const detectRequestFrequency = async (event) => {
    const oneMinuteAgo = new Date(
        Date.now() - 60 * 1000
    );

    const filter = {
        ip: event.ip,
        endpoint: { $regex: "^/api/demo/" },
        timestamp: { $gte: oneMinuteAgo }
    };

    const requestCount = await Event.countDocuments(filter);

    console.log("REQUEST FREQUENCY CHECK:", {
        ip: event.ip,
        count: requestCount
    });

    if (requestCount <= 20) {
        return null;
    }

    let incident = await Incident.findOne({
        type: "REQUEST_FREQUENCY",
        sourceIP: event.ip,
        status: { $in: ["OPEN", "INVESTIGATING"] }
    });

    if (!incident) {
        incident = await Incident.create({
            type: "REQUEST_FREQUENCY",
            severity: "MEDIUM",
            sourceIP: event.ip,
            startTime: event.timestamp,
            description:
                `High request frequency detected: ${requestCount} demo API requests within one minute from ${event.ip}`
        });
    }

    await Event.updateMany(
        filter,
        { $set: { incidentId: incident._id } }
    );

    return incident;
};

// 5. CENTRAL DETECTION FUNCTION
const detectThreat = async (event) => {
    try {
        let incident = null;

        // Brute force
        if (
            event.endpoint === "/api/demo/login" &&
            event.method === "POST" &&
            event.statusCode === 401
        ) {
            incident = await detectBruteForce(event);
        }

        // Endpoint scan
        if (!incident && event.statusCode === 404) {
            incident = await detectEndpointScan(event);
        }

        // Abnormal access
        if (
            !incident &&
            event.endpoint === "/api/demo/admin/users" &&
            event.method === "GET" &&
            event.statusCode === 403
        ) {
            incident = await detectAbnormalAccess(event);
        }

        // Request frequency
        if (!incident) {
            incident = await detectRequestFrequency(event);
        }

        if (incident) {
            await safelyCorrelate(incident);

            return {
                detected: true,
                incident
            };
        }

        return { detected: false };

    } catch (error) {
        console.error(
            "Threat detection failed:",
            error.message
        );

        return { detected: false };
    }
};

module.exports = {
    detectThreat,
    detectBruteForce,
    detectEndpointScan,
    detectAbnormalAccess,
    detectRequestFrequency
};