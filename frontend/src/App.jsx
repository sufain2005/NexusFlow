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
import ActiveRulesList from './components/ActiveRulesList';
import AlertFeed from './components/AlertFeed';
import Navbar from './components/Navbar';

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
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [drawerTab, setDrawerTab] = useState('rules'); // 'rules' | 'alerts'
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [rulesCount, setRulesCount] = useState(0);
  const [alertsCount, setAlertsCount] = useState(0);

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

  // Clear all nodes and connections from the canvas
  const handleClearCanvas = useCallback(() => {
    setNodes([]);
    setEdges([]);
  }, [setNodes, setEdges]);

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

      // Attempt deployment via localhost with fallback to 127.0.0.1
      let response;
      try {
        response = await fetch('http://localhost:5000/api/rules/deploy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } catch {
        response = await fetch('http://127.0.0.1:5000/api/rules/deploy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || `Server responded with ${response.status}`);
      }

      console.log('✅ [NexusFlow] Deployed successfully:', data);
      setDeployedNotice(true);
      setTimeout(() => setDeployedNotice(false), 3000);

      // Trigger automatic refresh of the deployed rules panel and ensure it is open
      setRefreshTrigger((prev) => prev + 1);
      setDrawerTab('rules');
      setIsDrawerOpen(true);

      window.alert(
        `🎉 NexusFlow Engine Compiled & Deployed!\n\n` +
        `• Active Pipelines: ${data.activePipelines}\n` +
        `• Total Nodes: ${data.nodesCount}\n` +
        `• Total Edges: ${data.edgesCount}`
      );
    } catch (error) {
      console.error('❌ [NexusFlow] Deployment Error:', error);

      const isNetworkError =
        error.message.includes('fetch') ||
        error.message.includes('NetworkError') ||
        error.name === 'TypeError';

      const errorMsg = isNetworkError
        ? 'Cannot connect to backend server at http://localhost:5000.\n\nPlease start the backend in your terminal:\n  cd backend\n  npm start'
        : error.message;

      window.alert(`❌ Engine Deployment Failed:\n\n${errorMsg}`);
    } finally {
      setIsDeploying(false);
    }
  }, [toObject, nodes, edges]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Top Header Bar */}
      <Navbar onClearCanvas={handleClearCanvas}>
        {/* Active Rules Drawer Toggle Button */}
        <button
          onClick={() => {
            if (isDrawerOpen && drawerTab === 'rules') {
              setIsDrawerOpen(false);
            } else {
              setDrawerTab('rules');
              setIsDrawerOpen(true);
            }
          }}
          style={{
            padding: '8px 12px',
            backgroundColor: isDrawerOpen && drawerTab === 'rules' ? '#eff6ff' : '#ffffff',
            color: isDrawerOpen && drawerTab === 'rules' ? '#1d4ed8' : '#334155',
            border: `1px solid ${isDrawerOpen && drawerTab === 'rules' ? '#93c5fd' : '#cbd5e1'}`,
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.15s ease',
          }}
          title="Toggle Deployed Rules Panel"
        >
          <span>📋 Rules</span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              backgroundColor: isDrawerOpen && drawerTab === 'rules' ? '#dbeafe' : '#f1f5f9',
              color: isDrawerOpen && drawerTab === 'rules' ? '#1e40af' : '#475569',
              padding: '1px 6px',
              borderRadius: '9999px',
            }}
          >
            {rulesCount}
          </span>
        </button>

        {/* Alert History Feed Toggle Button */}
        <button
          onClick={() => {
            if (isDrawerOpen && drawerTab === 'alerts') {
              setIsDrawerOpen(false);
            } else {
              setDrawerTab('alerts');
              setIsDrawerOpen(true);
            }
          }}
          style={{
            padding: '8px 12px',
            backgroundColor: isDrawerOpen && drawerTab === 'alerts' ? '#fff7ed' : '#ffffff',
            color: isDrawerOpen && drawerTab === 'alerts' ? '#c2410c' : '#334155',
            border: `1px solid ${isDrawerOpen && drawerTab === 'alerts' ? '#fdba74' : '#cbd5e1'}`,
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.15s ease',
          }}
          title="Toggle Alert History Feed"
        >
          <span>🔥 Alerts</span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              backgroundColor: isDrawerOpen && drawerTab === 'alerts' ? '#fed7aa' : '#f1f5f9',
              color: isDrawerOpen && drawerTab === 'alerts' ? '#9a3412' : '#475569',
              padding: '1px 6px',
              borderRadius: '9999px',
            }}
          >
            {alertsCount}
          </span>
        </button>

        {/* Deploy Engine Button */}
        <button
          onClick={handleDeploy}
          disabled={isDeploying}
          style={{
            padding: '8px 16px',
            backgroundColor: isDeploying ? '#93c5fd' : '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: isDeploying ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
            transition: 'background-color 0.2s ease',
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
      </Navbar>

      {/* Main Workspace Body */}
      <div style={{ display: 'flex', flex: 1, height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
        {/* Sidebar with draggable node templates */}
        <Sidebar />

        {/* Main React Flow Canvas */}
        <div ref={reactFlowWrapper} style={{ flexGrow: 1, height: '100%', position: 'relative' }}>
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
            {deployedNotice && (
              <Panel position="top-right">
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#16a34a',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.06)',
                  }}
                >
                  ✓ Engine compiled & active!
                </span>
              </Panel>
            )}
          </ReactFlow>
        </div>

        {/* Collapsible Active Rules & Alert History Drawer */}
      {isDrawerOpen && (
        <aside
          style={{
            width: '380px',
            height: '100%',
            flexShrink: 0,
            zIndex: 10,
            borderLeft: '1px solid #e2e8f0',
            boxShadow: '-4px 0 16px rgba(0, 0, 0, 0.05)',
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Drawer Top Navigation Tab Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              padding: '6px 12px',
            }}
          >
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setDrawerTab('rules')}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: drawerTab === 'rules' ? '#ffffff' : 'transparent',
                  color: drawerTab === 'rules' ? '#1d4ed8' : '#64748b',
                  boxShadow: drawerTab === 'rules' ? '0 1px 2px rgba(0, 0, 0, 0.06)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>📋 Rules</span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    backgroundColor: drawerTab === 'rules' ? '#dbeafe' : '#e2e8f0',
                    color: drawerTab === 'rules' ? '#1e40af' : '#475569',
                    padding: '1px 6px',
                    borderRadius: '9999px',
                  }}
                >
                  {rulesCount}
                </span>
              </button>

              <button
                onClick={() => setDrawerTab('alerts')}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: drawerTab === 'alerts' ? '#ffffff' : 'transparent',
                  color: drawerTab === 'alerts' ? '#ea580c' : '#64748b',
                  boxShadow: drawerTab === 'alerts' ? '0 1px 2px rgba(0, 0, 0, 0.06)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>🔥 Alerts</span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    backgroundColor: drawerTab === 'alerts' ? '#ffedd5' : '#e2e8f0',
                    color: drawerTab === 'alerts' ? '#c2410c' : '#475569',
                    padding: '1px 6px',
                    borderRadius: '9999px',
                  }}
                >
                  {alertsCount}
                </span>
              </button>
            </div>

            <button
              onClick={() => setIsDrawerOpen(false)}
              title="Close drawer"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '4px 8px',
                borderRadius: '4px',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          {/* Drawer Body: Rules or Alert Feed */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {drawerTab === 'rules' ? (
              <ActiveRulesList
                refreshTrigger={refreshTrigger}
                onClose={() => setIsDrawerOpen(false)}
                onRulesCountChange={setRulesCount}
              />
            ) : (
              <AlertFeed
                onAlertsCountChange={setAlertsCount}
                onClose={() => setIsDrawerOpen(false)}
              />
            )}
          </div>
        </aside>
      )}
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
