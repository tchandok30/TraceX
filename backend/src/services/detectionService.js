
const Event = require("../models/Event");
const Incident = require("../models/Incident");
const User = require("../models/User");

// 1. BRUTE FORCE DETECTION
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

    if (failedLogins < 5) return null;

    const existingIncident = await Incident.findOne({
        type: "BRUTE_FORCE",
        sourceIP: event.ip,
        status: { $in: ["OPEN", "INVESTIGATING"] }
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
            { $set: { incidentId: existingIncident._id } }
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
        { $set: { incidentId: incident._id } }
    );

    return incident;
};

// 2. ENDPOINT SCAN DETECTION
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
        ...new Set(events.map((item) => item.endpoint))
    ];

    if (uniqueEndpoints.length < 5) return null;

    const existingIncident = await Incident.findOne({
        type: "ENDPOINT_SCAN",
        sourceIP: event.ip,
        status: { $in: ["OPEN", "INVESTIGATING"] }
    });

    if (existingIncident) {
        await Event.updateMany(
            {
                ip: event.ip,
                statusCode: 404,
                timestamp: { $gte: fiveMinutesAgo }
            },
            { $set: { incidentId: existingIncident._id } }
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

    const existingIncident = await Incident.findOne({
        type: "ABNORMAL_ACCESS",
        sourceIP: event.ip,
        status: { $in: ["OPEN", "INVESTIGATING"] }
    });

    if (existingIncident) {
        await Event.updateOne(
            { _id: event._id },
            { $set: { incidentId: existingIncident._id } }
        );

        return existingIncident;
    }

    const incident = await Incident.create({
        type: "ABNORMAL_ACCESS",
        severity: "HIGH",
        sourceIP: event.ip,
        startTime: event.timestamp,
        description:
            `Non-admin user ${user.email} was blocked from accessing the admin endpoint`
    });

    await Event.updateOne(
        { _id: event._id },
        { $set: { incidentId: incident._id } }
    );

    return incident;
};



const detectRequestFrequency = async (event) => {
    const oneMinuteAgo = new Date(
        Date.now() - 60 * 1000
    );

    const requestCount = await Event.countDocuments({
        ip: event.ip,
        endpoint: { $regex: "^/api/demo/" },
        timestamp: { $gte: oneMinuteAgo }
    });

    console.log("REQUEST FREQUENCY CHECK:", {
        ip: event.ip,
        count: requestCount
    });

    if (requestCount <= 20) {
        return null;
    }

    const existingIncident = await Incident.findOne({
        type: "REQUEST_FREQUENCY",
        sourceIP: event.ip,
        status: { $in: ["OPEN", "INVESTIGATING"] }
    });

    if (existingIncident) {
        await Event.updateMany(
            {
                ip: event.ip,
                endpoint: { $regex: "^/api/demo/" },
                timestamp: { $gte: oneMinuteAgo }
            },
            { $set: { incidentId: existingIncident._id } }
        );

        return existingIncident;
    }

    const incident = await Incident.create({
        type: "REQUEST_FREQUENCY",
        severity: "MEDIUM",
        sourceIP: event.ip,
        startTime: event.timestamp,
        description:
            `High request frequency detected: ${requestCount} demo API requests within one minute from ${event.ip}`
    });

    await Event.updateMany(
        {
            ip: event.ip,
            endpoint: { $regex: "^/api/demo/" },
            timestamp: { $gte: oneMinuteAgo }
        },
        { $set: { incidentId: incident._id } }
    );

    return incident;
};
// 4. CENTRAL DETECTION FUNCTION
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
                return { detected: true, incident };
            }
        }

        // Endpoint Scan
        if (event.statusCode === 404) {
            const incident = await detectEndpointScan(event);

            if (incident) {
                return { detected: true, incident };
            }
        }

        // Abnormal Access
        if (
            event.endpoint === "/api/demo/admin/users" &&
            event.method === "GET" &&
            event.statusCode === 403
        ) {
            const incident = await detectAbnormalAccess(event);

            if (incident) {
                return { detected: true, incident };
            }
        }
        const incident = await detectRequestFrequency(event);

        if (incident) {
            return {
                detected: true,
                incident
            };
        }
        return { detected: false };

    } catch (error) {
        console.log(
            "Threat detection failed:",
            error.message
        );

        // Request Frequency Anomaly
        
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