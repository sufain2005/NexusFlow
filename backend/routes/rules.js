const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Rule = require('../models/Rule');
const { compileGraph } = require('../services/compiler');

// Store the currently active compiled engine instance
let activeEngine = null;

/**
 * POST /api/rules/deploy
 * Accepts the serialized React Flow JSON graph (nodes and edges) from the frontend,
 * persists the rule to MongoDB, and compiles it into active RxJS pipelines.
 */
const handleDeploy = async (req, res) => {
  try {
    const { name, nodes, edges } = req.body;

    if (!nodes || !Array.isArray(nodes)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payload: "nodes" must be an array.',
      });
    }

    // 1. Persist rule to MongoDB before compiling
    let savedRule = null;
    try {
      if (mongoose.connection.readyState === 1) {
        // Mark existing rules as inactive so this newly deployed rule is the active one
        await Rule.updateMany({ isActive: true }, { isActive: false });

        savedRule = await Rule.create({
          name: name || `Rule Engine - ${new Date().toLocaleString()}`,
          nodes,
          edges: Array.isArray(edges) ? edges : [],
          isActive: true,
        });
        console.log(`[Rules Router] Rule persisted to MongoDB with ID: ${savedRule._id}`);
      } else {
        console.warn('[Rules Router] MongoDB not connected; skipping database persistence.');
      }
    } catch (dbError) {
      console.warn('[Rules Router] Could not save rule to database:', dbError.message);
    }

    // 2. Teardown previously active engine subscriptions to prevent duplicate alerts
    if (activeEngine && typeof activeEngine.teardown === 'function') {
      console.log('[Rules Router] Tearing down previous rule engine instance...');
      activeEngine.teardown();
    }

    // 3. Compile new graph into RxJS pipelines
    activeEngine = compileGraph({ nodes, edges: Array.isArray(edges) ? edges : [] });

    return res.status(200).json({
      success: true,
      message: 'Rule engine compiled and deployed successfully.',
      ruleId: savedRule?._id || null,
      activePipelines: activeEngine.activeCount,
      nodesCount: nodes.length,
      edgesCount: Array.isArray(edges) ? edges.length : 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Rules Router] Error deploying rule engine:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to compile and deploy rule engine.',
      details: error.message,
    });
  }
};

/**
 * GET /api/rules
 * Retrieve saved rules from MongoDB
 */
const handleGetRules = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'MongoDB is not connected.',
      });
    }

    const rules = await Rule.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: rules.length,
      data: rules,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch rules.',
      details: error.message,
    });
  }
};

// Route definitions (supporting both mount at /api/rules and mount at root)
router.post('/deploy', handleDeploy);
router.post('/api/rules/deploy', handleDeploy);

router.get('/', handleGetRules);
router.get('/api/rules', handleGetRules);

module.exports = router;
