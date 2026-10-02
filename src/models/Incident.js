const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true
        },

        severity: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            default: "MEDIUM"
        },

        sourceIP: {
            type: String,
            required: true
        },

        startTime: {
            type: Date,
            required: true
        },

        endTime: {
            type: Date,
            default: null
        },

        status: {
            type: String,
            enum: ["OPEN", "INVESTIGATING", "RESOLVED"],
            default: "OPEN"
        },

        description: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

const Incident = mongoose.model("Incident", incidentSchema);

module.exports = Incident;