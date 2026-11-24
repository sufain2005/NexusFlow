const mongoose = require('mongoose');

const alertLogSchema = new mongoose.Schema(
  {
    ruleName: {
      type: String,
      default: 'Default Rule Engine',
      trim: true,
    },
    sensorId: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: Number,
      required: true,
    },
    threshold: {
      type: Number,
      required: true,
    },
    triggeredAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

// Index triggeredAt descending for fast retrieval of latest 20 alerts
alertLogSchema.index({ triggeredAt: -1 });

const AlertLog = mongoose.model('AlertLog', alertLogSchema);

module.exports = AlertLog;
