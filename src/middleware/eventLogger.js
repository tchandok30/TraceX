const Event = require("../models/Event");

const 
    detectBruteForce
 = require("../services/detectionService");

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

            if (
                event.endpoint === "/api/demo/login" &&
                event.method === "POST" &&
                event.statusCode === 401
            ) {
                const result = await detectBruteForce(event.ip);

                if (result.detected) {
                    console.log("🚨 BRUTE FORCE DETECTED");
                    console.log("Incident ID:", result.incident._id);
                }
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