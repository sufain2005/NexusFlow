const { Subject, filter, map } = require('rxjs');

/**
 * RxJS Subject representing the continuous incoming IoT telemetry stream.
 * Live sensor data is pushed into this stream for real-time rule evaluation.
 */
const telemetryStream$ = new Subject();

/**
 * Pushes new incoming sensor readings into the RxJS telemetry Subject.
 * Supports a single telemetry object or an array of objects.
 *
 * @param {Object|Array} data - Telemetry reading(s) to evaluate
 */
function evaluateTelemetry(data) {
  if (!data) return;
  const records = Array.isArray(data) ? data : [data];
  records.forEach((reading) => {
    telemetryStream$.next(reading);
  });
}

/**
 * Compiles a JSON graph payload (nodes and edges) from the React Flow frontend
 * into executable RxJS data pipelines.
 *
 * @param {Object} graphPayload - The serialized graph object
 * @param {Array} graphPayload.nodes - Array of React Flow node definitions
 * @param {Array} graphPayload.edges - Array of React Flow edge connections
 * @returns {Object} Compiled pipeline context with teardown controls
 */
function compileGraph(graphPayload) {
  if (!graphPayload || !Array.isArray(graphPayload.nodes)) {
    throw new Error('Invalid graph payload: "nodes" must be an array.');
  }

  const { nodes = [], edges = [] } = graphPayload;
  console.log(`[Compiler] Compiling rule graph: ${nodes.length} nodes, ${edges.length} edges.`);

  // 1. Index nodes by ID for fast lookup
  const nodeMap = new Map();
  nodes.forEach((node) => nodeMap.set(node.id, node));

  // 2. Build adjacency list of connections (source node ID -> array of target node IDs)
  const adjacencyList = new Map();
  edges.forEach((edge) => {
    if (!adjacencyList.has(edge.source)) {
      adjacencyList.set(edge.source, []);
    }
    adjacencyList.get(edge.source).push(edge.target);
  });

  const activeSubscriptions = [];

  // Helper to check if telemetry matches a sensor node
  const matchesSensor = (telemetry, sensorLabel) => {
    if (!telemetry) return false;
    if (telemetry.sensorId && sensorLabel) {
      const cleanSensor = telemetry.sensorId.toLowerCase().replace(/[-_\s]/g, '');
      const cleanLabel = sensorLabel.toLowerCase().replace(/[-_\s]/g, '');
      return cleanSensor.includes(cleanLabel) || cleanLabel.includes(cleanSensor);
    }
    return true;
  };

  // 3. Traverse and compile pipelines starting from root 'sensor' nodes
  const sensorNodes = nodes.filter((node) => node.type === 'sensor');

  sensorNodes.forEach((sensorNode) => {
    const sensorLabel = sensorNode.data?.label || sensorNode.id;
    const targetNodeIds = adjacencyList.get(sensorNode.id) || [];

    console.log(`[Compiler] Setting up stream for Sensor: "${sensorLabel}" -> Targets: [${targetNodeIds.join(', ')}]`);

    targetNodeIds.forEach((targetId) => {
      const targetNode = nodeMap.get(targetId);
      if (!targetNode) {
        console.warn(`[Compiler] Target node "${targetId}" not found in graph.`);
        return;
      }

      // Case 1: Sensor -> Math Filter -> Action
      if (targetNode.type === 'math' || targetNode.type === 'mathFilter') {
        const mathLabel = targetNode.data?.label || 'Math Filter';
        console.log(`[Compiler] Configuring Math Filter pipeline: "${mathLabel}"`);

        // Parse numerical threshold from Math node label (e.g., "Temp > 80°C", "> 80", etc.)
        let threshold = 80;
        const match = String(mathLabel).match(/(\d+(?:\.\d+)?)/);
        if (match) {
          threshold = parseFloat(match[1]);
        }
        const isLessThan = mathLabel.includes('<');

        // Locate downstream action nodes connected to this Math Filter node
        const downstreamIds = adjacencyList.get(targetNode.id) || [];
        downstreamIds.forEach((downstreamId) => {
          const actionNode = nodeMap.get(downstreamId);
          if (actionNode && actionNode.type === 'action') {
            const actionLabel = actionNode.data?.label || 'Alert Action';
            console.log(`[Compiler] Registered Pipeline: [${sensorLabel}] -> [${mathLabel}] -> [${actionLabel}]`);

            // Use RxJS operators (filter, map) to detect threshold breach and construct alert
            const pipeline$ = telemetryStream$.asObservable().pipe(
              // Filter 1: Check if telemetry belongs to this sensor
              filter((telemetry) => matchesSensor(telemetry, sensorLabel)),

              // Filter 2: Check if incoming sensor value breaches threshold
              filter((telemetry) => {
                const temp = telemetry.temperature;
                if (typeof temp !== 'number') return false;
                return isLessThan ? temp < threshold : temp > threshold;
              }),

              // Map: Transform breached reading into an alert event object
              map((telemetry) => ({
                sensorId: telemetry.sensorId || 'Unknown Sensor',
                value: telemetry.temperature,
                threshold,
                operator: isLessThan ? '<' : '>',
                action: actionLabel,
                timestamp: telemetry.timestamp || new Date().toISOString(),
              }))
            );

            // Subscribe: Execute action and log [ALERT TRIGGERED] with sensor ID and value
            const subscription = pipeline$.subscribe({
              next: (alert) => {
                console.log(
                  `[ALERT TRIGGERED] Sensor ID: ${alert.sensorId}, Value: ${alert.value} ` +
                  `(Threshold ${alert.operator} ${alert.threshold} breached) -> Action: ${alert.action}`
                );
              },
              error: (err) => {
                console.error(`❌ [Pipeline Error in Action "${actionLabel}"]:`, err.message);
              },
            });

            activeSubscriptions.push(subscription);
          }
        });
      }

      // Case 2: Direct Sensor -> Action
      else if (targetNode.type === 'action') {
        const actionLabel = targetNode.data?.label || 'Action';
        console.log(`[Compiler] Registered Direct Pipeline: [${sensorLabel}] -> [${actionLabel}]`);

        const pipeline$ = telemetryStream$.asObservable().pipe(
          filter((telemetry) => matchesSensor(telemetry, sensorLabel)),
          map((telemetry) => ({
            sensorId: telemetry.sensorId || 'Unknown Sensor',
            value: telemetry.temperature,
            action: actionLabel,
            timestamp: telemetry.timestamp || new Date().toISOString(),
          }))
        );

        const subscription = pipeline$.subscribe({
          next: (alert) => {
            console.log(`[ALERT TRIGGERED] Sensor ID: ${alert.sensorId}, Value: ${alert.value} -> Action: ${alert.action}`);
          },
          error: (err) => {
            console.error(`❌ [Pipeline Error in Action "${actionLabel}"]:`, err.message);
          },
        });

        activeSubscriptions.push(subscription);
      }
    });
  });

  console.log(`[Compiler] Compilation complete: ${activeSubscriptions.length} active RxJS pipeline(s) listening.`);

  return {
    telemetryStream$,
    activeCount: activeSubscriptions.length,
    pushTelemetry: evaluateTelemetry,
    teardown: () => {
      activeSubscriptions.forEach((sub) => sub.unsubscribe());
      console.log('[Compiler] All active pipelines unsubscribed.');
    },
  };
}

module.exports = {
  telemetryStream$,
  compileGraph,
  evaluateTelemetry,
};
