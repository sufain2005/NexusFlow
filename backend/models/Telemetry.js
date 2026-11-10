const mongoose = require('mongoose');

const telemetrySchema = new mongoose.Schema(
  {
    sensorId: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    temperature: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timeseries: {
      timeField: 'timestamp',
      metaField: 'sensorId',
      granularity: 'seconds',
    },
  }
);

const Telemetry = mongoose.model('Telemetry', telemetrySchema);

module.exports = Telemetry;
