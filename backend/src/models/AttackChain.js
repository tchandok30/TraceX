
const mongoose = require("mongoose");

const attackChainSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    sourceIP: {
      type: String,
      required: true,
    },

    incidentIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Incident",
    }],

    confidence: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "LOW",
    },

    reasoning: [{
      type: String,
    }],

    status: {
      type: String,
      enum: ["OPEN", "INVESTIGATING", "RESOLVED"],
      default: "OPEN",
    },

    firstSeen: {
      type: Date,
      required: true,
    },

    lastSeen: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

attackChainSchema.index({ sourceIP: 1, status: 1 });

module.exports = mongoose.model("AttackChain", attackChainSchema);

