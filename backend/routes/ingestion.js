const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Telemetry = require('../models/Telemetry');
const { evaluateTelemetry } = require('../services/compiler');

/**
 * Handler for ingesting telemetry data.
 * Accepts either a single object or an array of objects for batching.
 * Evaluates live telemetry against RxJS rule pipelines, and persists to MongoDB if connected.
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

    // 1. Always evaluate live telemetry against active rules immediately
    evaluateTelemetry(telemetryData);

    // 2. Persist to MongoDB Time-Series collection if connected
    let insertedDocs = [];
    if (mongoose.connection.readyState === 1) {
      insertedDocs = await Telemetry.insertMany(telemetryData, { ordered: false });
    } else {
      console.warn('[Ingestion Router] Notice: MongoDB is not connected; telemetry evaluated in-memory only.');
    }

    return res.status(201).json({
      message: 'Telemetry data ingested successfully',
      count: telemetryData.length,
      dbSaved: mongoose.connection.readyState === 1,
      data: insertedDocs.length > 0 ? insertedDocs : telemetryData,
    });
  } catch (error) {
    console.error('Database ingestion error:', error.message);
    return res.status(500).json({
      error: 'Failed to ingest telemetry data',
      details: error.message,
    });
  }
};

/**
 * GET endpoint to retrieve recent telemetry for monitoring/verification
 */
const handleGetTelemetry = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        count: 0,
        data: [],
        notice: 'MongoDB is currently disconnected. Start MongoDB to view historical records.',
      });
    }

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

router.post('/', handleIngestion);
router.post('/api/ingestion', handleIngestion);

router.get('/api/ingestion', handleGetTelemetry);

module.exports = router;
