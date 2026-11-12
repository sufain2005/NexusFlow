/**
 * Test script to simulate IoT sensor data ingestion and verify backend output.
 * Run with: node test-ingest.js
 */

const { spawn } = require('child_process');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

async function isServerRunning() {
  try {
    const res = await fetch(`${BASE_URL}/`, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

async function startServer() {
  console.log('⚙️  Server not detected on port 5000. Starting backend/server.js automatically...');
  const serverProcess = spawn('node', [path.join(__dirname, 'server.js')], {
    stdio: 'inherit',
    detached: false,
  });

  // Wait for server to come up (retry up to 10 times, 300ms each)
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 300));
    if (await isServerRunning()) {
      console.log('✅ Server started successfully!\n');
      return serverProcess;
    }
  }

  throw new Error('Server failed to start within timeout.');
}

async function runTests() {
  let serverProcess = null;

  try {
    const running = await isServerRunning();
    if (!running) {
      serverProcess = await startServer();
    } else {
      console.log(`Connected to running server at ${BASE_URL}\n`);
    }

    console.log(`🚀 Testing NexusFlow Backend at ${BASE_URL}\n`);

    // 1. Health Check
    console.log('1️⃣ Checking server health (GET /)...');
    const healthRes = await fetch(`${BASE_URL}/`);
    const healthJson = await healthRes.json();
    console.log(`   HTTP Status: ${healthRes.status}`);
    console.log('   Response Body:', JSON.stringify(healthJson, null, 2));

    // 2. Single Sensor Telemetry Ingestion
    console.log('\n2️⃣ Ingesting single telemetry reading (POST /api/ingestion)...');
    const singleData = {
      sensorId: 'turbine-sensor-01',
      temperature: 74.8,
      status: 'normal',
    };

    const singleRes = await fetch(`${BASE_URL}/api/ingestion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(singleData),
    });
    const singleJson = await singleRes.json();
    console.log(`   HTTP Status: ${singleRes.status}`);
    console.log('   Response Body:', JSON.stringify(singleJson, null, 2));

    // 3. Batch Telemetry Ingestion
    console.log('\n3️⃣ Ingesting batch telemetry readings (POST /api/ingestion)...');
    const batchData = [
      { sensorId: 'turbine-sensor-01', temperature: 81.2, status: 'warning' },
      { sensorId: 'turbine-sensor-02', temperature: 68.0, status: 'normal' },
      { sensorId: 'turbine-sensor-03', temperature: 93.5, status: 'critical' },
    ];

    const batchRes = await fetch(`${BASE_URL}/api/ingestion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batchData),
    });
    const batchJson = await batchRes.json();
    console.log(`   HTTP Status: ${batchRes.status}`);
    console.log('   Response Body:', JSON.stringify(batchJson, null, 2));

    // 4. Retrieve Recent Ingested Telemetry
    console.log('\n4️⃣ Retrieving recent ingested telemetry (GET /api/ingestion)...');
    const getRes = await fetch(`${BASE_URL}/api/ingestion?limit=5`);
    const getJson = await getRes.json();
    console.log(`   HTTP Status: ${getRes.status}`);
    console.log('   Response Body:', JSON.stringify(getJson, null, 2));

    console.log('\n🎉 Test execution completed!\n');
  } catch (err) {
    console.error('\n❌ Test error:', err.message);
  } finally {
    if (serverProcess) {
      console.log('🛑 Shutting down auto-started server process...');
      serverProcess.kill();
    }
  }
}

runTests();
