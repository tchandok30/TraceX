const Event = require("../models/Event");
const { detectThreat } = require("../services/detectionService");

const eventLogger = async (req, res, next) => {
    res.on("finish", async () => {
        try {
            const event = await Event.create({
                type: "API_REQUEST",
                userId: req.user ? req.user.userId : null,
                sessionId: req.headers["x-session-id"] || null,
                ip: req.ip,
                endpoint: req.originalUrl,
                method: req.method,
                statusCode: res.statusCode,
                metadata: {
                    userAgent: req.headers["user-agent"]
                }
            });

            const result = await detectThreat(event);

            if (result.detected) {
                console.log("🚨 THREAT DETECTED");
                console.log("Type:", result.incident.type);
                console.log("Incident ID:", result.incident._id);
            }

        } catch (error) {
            console.log(
                "Event logging failed:",
                error.message
            );
        }
    });

    next();
};

module.exports = eventLogger;