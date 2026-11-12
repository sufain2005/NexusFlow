const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Telemetry = require('../models/Telemetry');

/**
 * Helper to check MongoDB connection status
 */
function isDbConnected(res) {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      success: false,
      message: 'MongoDB is not connected. Please start your MongoDB service or configure MONGODB_URI in backend/.env',
      dbStatus: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown',
    });
    return false;
  }
  return true;
}

/**
 * POST /api/ingestion
 * High-throughput ingestion endpoint for IoT sensor telemetry.
 * Accepts either a single telemetry object or an array of telemetry objects for batching.
 */
router.post('/', async (req, res) => {
  try {
    const payload = req.body;

    // Validate payload existence and ensure it's not empty
    if (
      !payload ||
      (Array.isArray(payload) && payload.length === 0) ||
      (typeof payload === 'object' && Object.keys(payload).length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Payload is empty. Provide a telemetry object or an array of telemetry objects.',
      });
    }

    // Check if database is ready
    if (!isDbConnected(res)) return;

    // Normalize to an array for efficient batch processing
    const records = Array.isArray(payload) ? payload : [payload];

    // High-throughput insert into MongoDB Time-Series collection
    // ordered: false allows parallel inserts and continues even if one doc fails
    const insertedDocs = await Telemetry.insertMany(records, { ordered: false });

    return res.status(201).json({
      success: true,
      message: `Successfully ingested ${insertedDocs.length} telemetry record(s).`,
      count: insertedDocs.length,
      data: insertedDocs,
    });
  } catch (error) {
    // Schema validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed for one or more telemetry records.',
        error: error.message,
      });
    }

    // Partial write error when ordered: false encounters issues with some documents
    if (error.name === 'MongoBulkWriteError' || error.name === 'BulkWriteError') {
      const insertedCount = error.result?.nInserted || error.insertedDocs?.length || 0;
      return res.status(207).json({
        success: false,
        message: 'Partial bulk write error during ingestion.',
        insertedCount,
        error: error.message,
      });
    }

    console.error('Error during telemetry ingestion:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while ingesting telemetry data.',
      error: error.message,
    });
  }
});

/**
 * GET /api/ingestion
 * Retrieve recent telemetry entries (useful for monitoring and verification).
 */
router.get('/', async (req, res) => {
  try {
    if (!isDbConnected(res)) return;

    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 500);
    const filter = {};
    if (req.query.sensorId) {
      filter.sensorId = req.query.sensorId;
    }

    const records = await Telemetry.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error('Error querying telemetry data:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve telemetry records.',
      error: error.message,
    });
  }
});

module.exports = router;
