const express = require('express');
const router = express.Router();
const Telemetry = require('../models/Telemetry');
const { evaluateTelemetry } = require('../services/compiler');

/**
 * Handler for ingesting telemetry data.
 * Accepts either a single object or an array of objects for batching.
 * Uses Telemetry.insertMany() to save to the MongoDB Time-Series collection,
 * then instantly calls evaluateTelemetry() to evaluate against active RxJS rule pipelines.
 */
const handleIngestion = async (req, res) => {
  try {
    const payload = req.body;

    if (!payload || (Array.isArray(payload) && payload.length === 0)) {
      return res.status(400).json({
        error: 'Payload cannot be empty. Provide a telemetry object or an array of objects.',
      });
    }

    // Normalize incoming mock telemetry data (single object or array for batching)
    const telemetryData = Array.isArray(payload) ? payload : [payload];

    // 1. Save to MongoDB Time-Series collection using Telemetry.insertMany()
    const result = await Telemetry.insertMany(telemetryData);

    // 2. Real-time evaluation against active compiled rules
    evaluateTelemetry(telemetryData);

    return res.status(201).json({
      message: 'Telemetry data ingested successfully',
      count: result.length,
      data: result,
    });
  } catch (error) {
    console.error('Database ingestion error:', error.message);
    return res.status(500).json({
      error: 'Failed to ingest telemetry data',
      details: error.message,
    });
  }
};

// Route definitions (supporting mount at /api/ingestion or root)
router.post('/', handleIngestion);
router.post('/api/ingestion', handleIngestion);

/**
 * Optional GET endpoint to retrieve recent telemetry for monitoring/verification
 */
const handleGetTelemetry = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 500);
    const filter = {};
    if (req.query.sensorId) {
      filter.sensorId = req.query.sensorId;
    }

    const records = await Telemetry.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit);

    return res.status(200).json({
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error('Error fetching telemetry:', error.message);
    return res.status(500).json({
      error: 'Failed to retrieve telemetry records',
      details: error.message,
    });
  }
};

router.get('/', handleGetTelemetry);
router.get('/api/ingestion', handleGetTelemetry);

module.exports = router;
