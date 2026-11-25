/**
 * Automated Unit & Route Integration Tests for NexusFlow Rule Management
 * Tests GET /api/rules, DELETE /api/rules/:id, POST /api/rules/deploy,
 * and RxJS pipeline reload logic.
 *
 * Run with: node test-rules.js
 */

const { compileGraph, evaluateTelemetry, initializeSavedRules } = require('./services/compiler');
const rulesRouter = require('./routes/rules');
const app = require('./server');

// Helper to create mock Express request and response objects
function createMockReqRes(options = {}) {
  const headers = {};
  const req = {
    method: options.method || 'GET',
    url: options.url || '/',
    params: options.params || {},
    body: options.body || {},
    headers: options.headers || {},
  };

  let statusCode = 200;
  let responseData = null;

  const res = {
    setHeader(key, val) {
      headers[key] = val;
      return res;
    },
    getHeader(key) {
      return headers[key];
    },
    status(code) {
      statusCode = code;
      return res;
    },
    json(data) {
      responseData = data;
      return res;
    },
    send(data) {
      responseData = data;
      return res;
    },
    end(data) {
      if (data) responseData = data;
      return res;
    },
    getStatusCode() {
      return statusCode;
    },
    getData() {
      return responseData;
    },
  };

  return { req, res };
}

// Helper to invoke an Express router layer for a given method and path
async function dispatchRoute(router, method, url, params = {}, body = {}) {
  const { req, res } = createMockReqRes({ method, url, params, body });

  // Find matching route handler
  for (const layer of router.stack) {
    if (layer.route) {
      const matchMethod = layer.route.methods[method.toLowerCase()];
      const routePath = layer.route.path;

      // Check simple or parameterized match
      const isMatch =
        routePath === url ||
        (routePath.includes(':id') && url.startsWith('/') && url.split('/').length > 1);

      if (matchMethod && isMatch) {
        for (const handler of layer.route.stack) {
          req.params = params;
          await handler.handle(req, res);
          return { status: res.getStatusCode(), data: res.getData() };
        }
      }
    }
  }

  throw new Error(`Route not found for ${method} ${url}`);
}

async function runTests() {
  console.log('🚀 Running NexusFlow Rule Management Test Suite\n');
  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      process.exitCode = 1;
    }
  }

  try {
    // 1. Test GET /api/rules route handler
    console.log('1️⃣ Testing GET / (handleGetRules)...');
    const getResult = await dispatchRoute(rulesRouter, 'GET', '/');
    assert(getResult.status === 200, 'GET / returns HTTP 200');
    assert(getResult.data.success === true, 'GET / returns success: true');
    assert(Array.isArray(getResult.data.data), 'GET / returns an array in data field');

    // 2. Test POST /deploy (handleDeploy)
    console.log('\n2️⃣ Testing POST /deploy (handleDeploy)...');
    const testNodes = [
      { id: 'sensor-1', type: 'sensor', data: { label: 'Turbine Sensor' } },
      { id: 'math-1', type: 'math', data: { label: 'Temp > 80°C', threshold: 80, operator: '>' } },
      { id: 'action-1', type: 'action', data: { label: 'SMS Alert' } },
    ];
    const testEdges = [
      { id: 'e1', source: 'sensor-1', target: 'math-1' },
      { id: 'e2', source: 'math-1', target: 'action-1' },
    ];

    const deployResult = await dispatchRoute(rulesRouter, 'POST', '/deploy', {}, {
      name: 'Turbine Overheat Protection',
      nodes: testNodes,
      edges: testEdges,
    });

    assert(deployResult.status === 200, 'POST /deploy returns HTTP 200');
    assert(deployResult.data.success === true, 'POST /deploy returns success: true');
    assert(deployResult.data.activePipelines === 1, 'Compiled graph has 1 active RxJS pipeline');

    // 3. Test RxJS Pipeline Evaluation
    console.log('\n3️⃣ Testing Live RxJS Pipeline Alert Triggering...');
    let alertLogged = false;
    const originalLog = console.log;
    console.log = (...args) => {
      const msg = args.join(' ');
      if (msg.includes('[ALERT TRIGGERED]')) {
        alertLogged = true;
      }
      originalLog(...args);
    };

    // Sub-threshold reading (75°C) -> should not alert
    evaluateTelemetry({ sensorId: 'turbine-01', temperature: 75 });
    assert(!alertLogged, 'No alert triggered for temperature below threshold (75°C <= 80°C)');

    // Breach reading (88°C) -> should alert
    evaluateTelemetry({ sensorId: 'turbine-01', temperature: 88 });
    assert(alertLogged, 'Alert triggered for temperature exceeding threshold (88°C > 80°C)');
    console.log = originalLog;

    // 4. Test DELETE /:id with invalid ID format
    console.log('\n4️⃣ Testing DELETE /:id validation...');
    const invalidDel = await dispatchRoute(
      rulesRouter,
      'DELETE',
      '/:id',
      { id: 'invalid-id' },
      {}
    );
    assert(invalidDel.status === 400, 'DELETE /:id with non-ObjectId returns HTTP 400');
    assert(invalidDel.data.success === false, 'DELETE /:id returns success: false for invalid ID');

    // 5. Test initializeSavedRules() gracefully handles disconnected DB
    console.log('\n5️⃣ Testing initializeSavedRules() compiler reload...');
    const reloaded = await initializeSavedRules();
    assert(Array.isArray(reloaded), 'initializeSavedRules returns array of compiled engines');

    // 6. Test GET /alerts (Alert History Log)
    console.log('\n6️⃣ Testing GET /alerts (Alert History Log)...');
    const alertsResult = await dispatchRoute(rulesRouter, 'GET', '/alerts');
    assert(alertsResult.status === 200, 'GET /alerts returns HTTP 200');
    assert(alertsResult.data.success === true, 'GET /alerts returns success: true');
    assert(Array.isArray(alertsResult.data.data), 'GET /alerts returns data array');
    assert(alertsResult.data.data.length >= 1, 'GET /alerts contains logged alert from test 3');
    const firstAlert = alertsResult.data.data[0];
    assert(firstAlert.sensorId === 'turbine-01', 'Alert sensorId matches "turbine-01"');
    assert(firstAlert.value === 88, 'Alert value matches triggered value 88');
    assert(firstAlert.threshold === 80, 'Alert threshold matches 80');

    // 7. Test GET /api/health (System Health Check)
    console.log('\n7️⃣ Testing GET /api/health (System Health Check)...');
    const healthResult = await new Promise((resolve) => {
      const { req, res } = createMockReqRes({ method: 'GET', url: '/api/health' });
      const origJson = res.json.bind(res);
      res.json = (data) => {
        origJson(data);
        resolve({ status: res.getStatusCode(), data: res.getData() });
      };
      app.handle(req, res);
    });
    assert(healthResult.status === 200, 'GET /api/health returns HTTP 200');
    assert(healthResult.data.status === 'online', 'GET /api/health returns status: "online"');
    assert(typeof healthResult.data.activeRulesCount === 'number', 'GET /api/health returns numeric activeRulesCount');
    assert(Boolean(healthResult.data.timestamp), 'GET /api/health returns server timestamp');

    console.log(`\n===========================================`);
    console.log(`📊 Test Results: ${passed}/${total} checks passed!`);
    console.log(`===========================================\n`);
  } catch (err) {
    console.error('❌ Test execution error:', err);
    process.exitCode = 1;
  }
}

runTests();
