const Event = require("../models/Event");
const Incident = require("../models/Incident");

const detectBruteForce = async (ip) => {
    try {
        const fiveMinutesAgo = new Date(
            Date.now() - 5 * 60 * 1000
        );

        const failedLogins = await Event.countDocuments({
            ip: ip,
            endpoint: "/api/demo/login",
            method: "POST",
            statusCode: 401,
            timestamp: {
                $gte: fiveMinutesAgo
            }
        });

        if (failedLogins >= 5) {

    let incident = await Incident.findOne({
        type: "BRUTE_FORCE",
        sourceIP: ip,
        status: {
            $in: ["OPEN", "INVESTIGATING"]
        }
    });

    if (!incident) {
        incident = await Incident.create({
            type: "BRUTE_FORCE",
            severity: "HIGH",
            sourceIP: ip,
            startTime: fiveMinutesAgo,
            description: `Multiple failed login attempts detected from ${ip}`
        });
    }

    await Event.updateMany(
        {
            ip: ip,
            endpoint: "/api/demo/login",
            method: "POST",
            statusCode: 401,
            timestamp: {
                $gte: fiveMinutesAgo
            }
        },
        {
            $set: {
                incidentId: incident._id
            }
        }
    );

    return {
        detected: true,
        incident: incident
    };
}
            
        

        return {
            detected: false
        };

    } catch (error) {
        console.log(
            "Brute force detection failed:",
            error.message
        );

        return {
            detected: false
        };
    }
};

module.exports = 
    detectBruteForce
;