
const AttackChain = require("../models/AttackChain");

const getAttackChains = async (req, res) => {
    try {
        const chains = await AttackChain.find()
            .populate("incidentIds")
            .sort({ lastSeen: -1 });

        res.status(200).json({
            success: true,
            count: chains.length,
            chains
        });
    } catch (error) {
        console.error("Fetch attack chains failed:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch attack chains"
        });
    }
};

const getAttackChainById = async (req, res) => {
    try {
        const chain = await AttackChain.findById(req.params.id)
            .populate("incidentIds");

        if (!chain) {
            return res.status(404).json({
                success: false,
                message: "Attack chain not found"
            });
        }

        res.status(200).json({
            success: true,
            chain
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch attack chain"
        });
    }
};

module.exports = {
    getAttackChains,
    getAttackChainById
};