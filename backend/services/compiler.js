const { Subject, filter } = require('rxjs');

/**
 * RxJS Subject representing the continuous incoming IoT telemetry stream.
 * Ingested sensor data is pushed into this Subject via .next()
 */
const telemetryStream$ = new Subject();

/**
 * Compiles a JSON graph payload (nodes and edges) from the React Flow frontend
 * into executable RxJS data pipelines.
 *
 * @param {Object} graphPayload - The serialized graph object
 * @param {Array} graphPayload.nodes - Array of React Flow node definitions
 * @param {Array} graphPayload.edges - Array of React Flow edge connections
 * @returns {Object} Compiled pipeline context with telemetry ingestion and teardown controls
 */
function compileGraph(graphPayload) {
  if (!graphPayload || !Array.isArray(graphPayload.nodes)) {
    throw new Error('Invalid graph payload: "nodes" must be an array.');
  }

  const { nodes = [], edges = [] } = graphPayload;
  console.log(`[Compiler] Compiling graph: ${nodes.length} nodes, ${edges.length} edges.`);

  // 1. Index nodes by ID for fast lookup
  const nodeMap = new Map();
  nodes.forEach((node) => nodeMap.set(node.id, node));

  // 2. Build adjacency list of connections (source -> target nodes)
  const adjacencyList = new Map();
  edges.forEach((edge) => {
    if (!adjacencyList.has(edge.source)) {
      adjacencyList.set(edge.source, []);
    }
    adjacencyList.get(edge.source).push(edge.target);
  });

  const activeSubscriptions = [];

  // 3. Skeleton Parser: Traverse nodes and set up RxJS pipelines
  // Locate root sensor nodes
  const sensorNodes = nodes.filter((node) => node.type === 'sensor');

  sensorNodes.forEach((sensorNode) => {
    const targetNodeIds = adjacencyList.get(sensorNode.id) || [];
    const sensorLabel = sensorNode.data?.label || sensorNode.id;

    console.log(`[Compiler] Setting up stream for Sensor: "${sensorLabel}" -> Targets: [${targetNodeIds.join(', ')}]`);

    targetNodeIds.forEach((targetId) => {
      const targetNode = nodeMap.get(targetId);
      if (!targetNode) {
        console.warn(`[Compiler] Target node "${targetId}" not found in graph.`);
        return;
      }

      // Base stream starts from incoming telemetry
      let pipeline$ = telemetryStream$.asObservable();

      // Filter telemetry to match this sensor node (ignoring case, hyphens, and whitespace)
      pipeline$ = pipeline$.pipe(
        filter((telemetry) => {
          if (!telemetry) return false;
          if (telemetry.sensorId && sensorLabel) {
            const cleanSensor = telemetry.sensorId.toLowerCase().replace(/[-_\s]/g, '');
            const cleanLabel = sensorLabel.toLowerCase().replace(/[-_\s]/g, '');
            return cleanSensor.includes(cleanLabel) || cleanLabel.includes(cleanSensor);
          }
          return true;
        })
      );

      // Skeleton branch: handle Action node triggers (e.g. SMS Alert)
      if (targetNode.type === 'action') {
        const actionLabel = targetNode.data?.label || 'Action';
        console.log(`[Compiler] Registered Action pipeline for: "${actionLabel}"`);

        const subscription = pipeline$.subscribe({
          next: (reading) => {
            console.log(`⚡ [Action: ${actionLabel}] Triggered with sensor data:`, reading);
          },
          error: (err) => {
            console.error(`❌ [Pipeline Error in ${actionLabel}]:`, err);
          },
        });

        activeSubscriptions.push(subscription);
      } else {
        console.log(`[Compiler] Skeleton: Unhandled node type "${targetNode.type}" for node ID ${targetNode.id}`);
      }
    });
  });

  console.log(`[Compiler] Compilation complete: ${activeSubscriptions.length} active RxJS pipeline(s) created.`);

  return {
    telemetryStream$,
    activeCount: activeSubscriptions.length,
    pushTelemetry: (data) => {
      const records = Array.isArray(data) ? data : [data];
      records.forEach((record) => telemetryStream$.next(record));
    },
    teardown: () => {
      activeSubscriptions.forEach((sub) => sub.unsubscribe());
      console.log('[Compiler] All active pipelines unsubscribed.');
    },
  };
}

module.exports = {
  telemetryStream$,
  compileGraph,
};
