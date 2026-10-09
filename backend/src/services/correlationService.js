
const Incident = require("../models/Incident");
const AttackChain = require("../models/AttackChain");

const WINDOW_MINUTES = 30;

const correlateIncident = async (incidentId) => {
    try {
        const incident = await Incident.findById(incidentId);

        if (!incident) {
            console.log("CORRELATION FAILED: Incident not found");
            return { correlated: false };
        }

        // Use the latest activity time, not just the original start time.
        const referenceTime = new Date(
            incident.lastSeen || incident.startTime
        );

        const windowMs = WINDOW_MINUTES * 60 * 1000;
        const windowStart = new Date(referenceTime.getTime() - windowMs);
        const windowEnd = new Date(referenceTime.getTime() + windowMs);

        // Match incidents whose start OR latest activity is in the window.
        const relatedIncidents = await Incident.find({
            sourceIP: incident.sourceIP,
            $or: [
                {
                    startTime: {
                        $gte: windowStart,
                        $lte: windowEnd
                    }
                },
                {
                    lastSeen: {
                        $gte: windowStart,
                        $lte: windowEnd
                    }
                }
            ]
        }).sort({ startTime: 1 });

        // Include the current incident even if it wasn't matched by the query.
        const incidentMap = new Map();

        for (const item of relatedIncidents) {
            incidentMap.set(item._id.toString(), item);
        }

        incidentMap.set(incident._id.toString(), incident);

        const allIncidents = [...incidentMap.values()];
        const uniqueTypes = [
            ...new Set(allIncidents.map(item => item.type))
        ];

        console.log("\n========== CORRELATION DEBUG ==========");
        console.log("CURRENT INCIDENT:", {
            id: incident._id.toString(),
            type: incident.type,
            sourceIP: incident.sourceIP,
            startTime: incident.startTime,
            lastSeen: incident.lastSeen
        });

        console.log("CORRELATION WINDOW:", {
            start: windowStart,
            end: windowEnd
        });

        console.log("RELATED INCIDENTS:", allIncidents.map(item => ({
            id: item._id.toString(),
            type: item.type,
            startTime: item.startTime,
            lastSeen: item.lastSeen
        })));

        console.log("CORRELATION SUMMARY:", {
            relatedCount: allIncidents.length,
            types: uniqueTypes
        });

        if (uniqueTypes.length < 2) {
            console.log("CORRELATION SKIPPED: No second incident type");
            console.log("=======================================\n");

            return {
                correlated: false,
                reason: "No second incident type in correlation window"
            };
        }

        const ids = allIncidents.map(item => item._id);

        const firstSeen = new Date(
            Math.min(
                ...allIncidents.map(
                    item => new Date(item.startTime).getTime()
                )
            )
        );

        const lastSeen = new Date(
            Math.max(
                ...allIncidents.map(
                    item => new Date(item.lastSeen || item.startTime).getTime()
                )
            )
        );

        let chain = await AttackChain.findOne({
            sourceIP: incident.sourceIP,
            status: { $in: ["OPEN", "INVESTIGATING"] }
        });

        if (!chain) {
            chain = await AttackChain.create({
                title: `Related security activity from ${incident.sourceIP}`,
                sourceIP: incident.sourceIP,
                incidentIds: ids,
                confidence: uniqueTypes.length >= 3 ? "HIGH" : "MEDIUM",
                reasoning: [
                    `${uniqueTypes.length} incident types share a source IP within the activity window.`,
                    "Shared IP and timing suggest a possible relationship but do not prove a common attacker."
                ],
                firstSeen,
                lastSeen
            });

            console.log("NEW ATTACK CHAIN CREATED:", chain._id.toString());
        } else {
            const existingIds = new Set(
                chain.incidentIds.map(id => id.toString())
            );

            for (const id of ids) {
                existingIds.add(id.toString());
            }

            chain.incidentIds = [...existingIds];

            chain.firstSeen = new Date(
                Math.min(
                    new Date(chain.firstSeen).getTime(),
                    firstSeen.getTime()
                )
            );

            chain.lastSeen = new Date(
                Math.max(
                    new Date(chain.lastSeen).getTime(),
                    lastSeen.getTime()
                )
            );

            // Confidence reflects the distinct incident types in this chain.
            const chainIncidents = await Incident.find({
                _id: { $in: chain.incidentIds }
            }).select("type");

            const chainTypes = new Set(
                chainIncidents.map(item => item.type)
            );

            chain.confidence =
                chainTypes.size >= 3 ? "HIGH" : "MEDIUM";

            await chain.save();

            console.log("EXISTING ATTACK CHAIN UPDATED:", chain._id.toString());
        }

        console.log("=======================================\n");

        return { correlated: true, chain };
    } catch (error) {
        console.error("Correlation service error:", error.message);
        throw error;
    }
};

module.exports = { correlateIncident };