const express = require('express');
const router = express.Router();
const { compileGraph } = require('../services/compiler');

// Store the currently active compiled engine instance
let activeEngine = null;

/**
 * POST /api/rules/deploy
 * Accepts the serialized React Flow JSON graph (nodes and edges) from the frontend
 * and compiles it into active RxJS pipelines.
 */
const handleDeploy = (req, res) => {
  try {
    const { nodes, edges } = req.body;

    if (!nodes || !Array.isArray(nodes)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payload: "nodes" must be an array.',
      });
    }

    // Teardown previously active engine subscriptions to prevent memory leaks / duplicate alerts
    if (activeEngine && typeof activeEngine.teardown === 'function') {
      console.log('[Rules Router] Tearing down previous rule engine instance...');
      activeEngine.teardown();
    }

    // Compile new graph
    activeEngine = compileGraph({ nodes, edges: Array.isArray(edges) ? edges : [] });

    return res.status(200).json({
      success: true,
      message: 'Rule engine compiled and deployed successfully.',
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

// Route definitions (supporting both mount at /api/rules and mount at root)
router.post('/deploy', handleDeploy);
router.post('/api/rules/deploy', handleDeploy);

module.exports = router;
