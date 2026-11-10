import { ReactFlow, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes = [
  { id: '1', position: { x: 100, y: 100 }, data: { label: 'Turbine Sensor' } },
  { id: '2', position: { x: 400, y: 100 }, data: { label: 'SMS Alert' } }
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' }
];

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow nodes={initialNodes} edges={initialEdges}>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}