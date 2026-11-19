import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import SensorNode from './nodes/SensorNode';
import ActionNode from './nodes/ActionNode';
import MathNode from './nodes/MathNode';
import Sidebar from './Sidebar';

const initialNodes = [
  {
    id: '1',
    type: 'sensor',
    position: { x: 100, y: 150 },
    data: { label: 'Turbine Sensor' },
  },
  {
    id: '2',
    type: 'action',
    position: { x: 450, y: 150 },
    data: { label: 'SMS Alert' },
  },
];

const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];

function FlowCanvas() {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition, toObject } = useReactFlow();
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedNotice, setDeployedNotice] = useState(false);

  // Register all custom nodes (Sensor, Action, and Math Filter)
  const nodeTypes = useMemo(
    () => ({
      sensor: SensorNode,
      action: ActionNode,
      math: MathNode,
      mathFilter: MathNode,
    }),
    []
  );

  // Allow connecting nodes
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Enable drop by preventing default drag over behavior
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop from sidebar
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      // Project screen coordinates to React Flow canvas coordinates
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      let defaultLabel = 'New Node';
      if (type === 'sensor') {
        defaultLabel = 'New Sensor';
      } else if (type === 'action') {
        defaultLabel = 'New Action';
      } else if (type === 'math' || type === 'mathFilter') {
        defaultLabel = 'Temp > 80°C';
      }

      const newNode = {
        id: `${type}_${Date.now()}`,
        type,
        position,
        data: {
          label: defaultLabel,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes]
  );

  // Serialize current graph state and deploy to the backend compiler
  const handleDeploy = useCallback(async () => {
    const flowData = toObject ? toObject() : { nodes, edges };
    const payload = {
      nodes: flowData.nodes,
      edges: flowData.edges,
    };

    console.log('🚀 [NexusFlow] Deploying Engine - Serialized Graph:');
    console.log(JSON.stringify(payload, null, 2));

    try {
      setIsDeploying(true);
      const API_URL = 'http://localhost:5000/api/rules/deploy';

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || `Server responded with ${response.status}`);
      }

      console.log('✅ [NexusFlow] Deployed successfully:', data);
      setDeployedNotice(true);
      setTimeout(() => setDeployedNotice(false), 3000);

      window.alert(
        `🎉 NexusFlow Engine Compiled & Deployed!\n\n` +
        `• Active Pipelines: ${data.activePipelines}\n` +
        `• Total Nodes: ${data.nodesCount}\n` +
        `• Total Edges: ${data.edgesCount}`
      );
    } catch (error) {
      console.error('❌ [NexusFlow] Deployment Error:', error);
      window.alert(`❌ Engine Deployment Failed:\n\n${error.message}`);
    } finally {
      setIsDeploying(false);
    }
  }, [toObject, nodes, edges]);

  return (
    <div
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Sidebar with draggable node templates */}
      <Sidebar />

      {/* Main React Flow Canvas */}
      <div ref={reactFlowWrapper} style={{ flexGrow: 1, height: '100%' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onDragOver={onDragOver}
          onDrop={onDrop}
          fitView
        >
          <Background />
          <Controls />
          <Panel position="top-right">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
              <button
                onClick={handleDeploy}
                disabled={isDeploying}
                style={{
                  padding: '10px 18px',
                  backgroundColor: isDeploying ? '#93c5fd' : '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isDeploying ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.25), 0 2px 4px -2px rgba(37, 99, 235, 0.1)',
                  transition: 'background-color 0.2s ease, transform 0.1s ease',
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
                onMouseEnter={(e) => {
                  if (!isDeploying) e.currentTarget.style.backgroundColor = '#1d4ed8';
                }}
                onMouseLeave={(e) => {
                  if (!isDeploying) e.currentTarget.style.backgroundColor = '#2563eb';
                }}
              >
                {isDeploying ? 'Deploying...' : 'Deploy Engine'}
              </button>
              {deployedNotice && (
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#16a34a',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    padding: '4px 8px',
                    borderRadius: '4px',
                  }}
                >
                  ✓ Engine compiled & active!
                </span>
              )}
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
}
