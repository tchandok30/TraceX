const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        incidentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Incident",
            default: null
        },

        sessionId: {
            type: String,
            default: null
        },

        ip: {
            type: String,
            required: true
        },

        endpoint: {
            type: String,
            required: true
        },

        method: {
            type: String,
            required: true
        },

        resourceId: {
            type: String,
            default: null
        },

        statusCode: {
            type: Number,
            required: true
        },

        metadata: {
            type: Object,
            default: {}
        },

        timestamp: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);
const Event = mongoose.model("Event", eventSchema);

module.exports = Event;