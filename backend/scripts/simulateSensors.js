/**
 * Hardware Telemetry Simulator for NexusFlow
 *
 * Sends mock sensor readings (sensorId: "turbine-01", random temperature between 65 and 95)
 * every 2 seconds to POST http://localhost:5000/api/ingestion to verify real-time RxJS
 * threshold alerts end-to-end.
 *
 * Run with:
 *   node scripts/simulateSensors.js
 *   or: npm run simulate
 */

const INGESTION_URL = process.env.INGESTION_URL || 'http://localhost:5000/api/ingestion';
const INTERVAL_MS = 2000;

let count = 0;

console.log('====================================================');
console.log('📡 NexusFlow Hardware Telemetry Simulator');
console.log(`🎯 Target Endpoint: ${INGESTION_URL}`);
console.log(`⏱️  Frequency: Every ${INTERVAL_MS / 1000} seconds`);
console.log('Press Ctrl+C to stop simulation.');
console.log('====================================================\n');

async function sendTelemetry() {
  count++;

  // Generate random temperature between 65°C and 95°C
  const temperature = parseFloat((Math.random() * (95 - 65) + 65).toFixed(1));
  const status = temperature > 80 ? 'warning' : 'normal';

  const payload = {
    sensorId: 'turbine-01',
    temperature,
    status,
    timestamp: new Date().toISOString(),
  };

  const alertBadge = temperature > 80 ? '🔥 [POTENTIAL THRESHOLD BREACH]' : '   [NORMAL RANGE]';

  try {
    const response = await fetch(INGESTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    console.log(
      `[#${count}] ${new Date().toLocaleTimeString()} ` +
      `Sensor: "${payload.sensorId}" | Temp: ${temperature.toFixed(1)}°C | ` +
      `HTTP ${response.status} ${alertBadge}`
    );
  } catch (err) {
    console.error(
      `[#${count}] ❌ Transmission failed to ${INGESTION_URL}: ${err.message}. ` +
      `Ensure backend server is running on port 5000 (npm start).`
    );
  }
}

// Send initial reading immediately, then every 2 seconds
sendTelemetry();
const intervalId = setInterval(sendTelemetry, INTERVAL_MS);

// Handle graceful shutdown
process.on('SIGINT', () => {
  clearInterval(intervalId);
  console.log(`\n🛑 Simulator stopped. Total readings transmitted: ${count}.\n`);
  process.exit(0);
});

process.on('SIGTERM', () => {
  clearInterval(intervalId);
  process.exit(0);
});
