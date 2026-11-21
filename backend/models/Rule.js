const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: 'Default Rule Engine',
      trim: true,
    },
    nodes: {
      type: Array,
      required: true,
    },
    edges: {
      type: Array,
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Rule = mongoose.model('Rule', ruleSchema);

module.exports = Rule;
