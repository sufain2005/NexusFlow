import { memo } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';

/**
 * Custom React Flow node representing a math operation or threshold filter (e.g., Temp > 80°C).
 * Features an interactive dropdown ('>' or '<') and a number input for the threshold value
 * which dynamically updates the node's data in the React Flow store.
 */
function MathNode({ id, data, isConnectable }) {
  const { updateNodeData } = useReactFlow();

  const threshold = data?.threshold ?? 80;
  const operator = data?.operator ?? '>';

  const targetPosition = data?.targetPosition === 'top' ? Position.Top : Position.Left;
  const sourcePosition = data?.sourcePosition === 'bottom' ? Position.Bottom : Position.Right;

  const handleThresholdChange = (e) => {
    const rawVal = e.target.value;
    const numVal = rawVal === '' ? '' : Number(rawVal);
    const newLabel = `Temp ${operator} ${numVal !== '' ? numVal : 0}°C`;

    updateNodeData(id, {
      threshold: numVal,
      operator,
      label: newLabel,
    });
  };

  const handleOperatorChange = (e) => {
    const newOp = e.target.value;
    const newLabel = `Temp ${newOp} ${threshold}°C`;

    updateNodeData(id, {
      threshold,
      operator: newOp,
      label: newLabel,
    });
  };

  return (
    <div
      className="math-node"
      style={{
        background: '#fff7ed', // Orange-50 tint
        border: '1px solid #fdba74', // Orange-300 border
        borderRadius: '8px',
        padding: '10px 14px',
        minWidth: '160px',
        boxShadow: '0 4px 6px -1px rgba(234, 88, 12, 0.1), 0 2px 4px -2px rgba(234, 88, 12, 0.05)',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        color: '#7c2d12',
      }}
    >
      {/* Target handle on the left to receive incoming sensor telemetry */}
      <Handle
        type="target"
        position={targetPosition}
        isConnectable={isConnectable}
        style={{
          background: '#ea580c', // Orange-600
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          border: '2px solid #ffffff',
        }}
      />

      {/* Card Header / Title */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#ea580c',
            display: 'inline-block',
          }}
        />
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#c2410c',
          }}
        >
          Math Filter
        </span>
      </div>

      {/* Interactive Controls (nodrag class prevents canvas dragging while typing/selecting) */}
      <div
        className="nodrag"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginTop: '2px',
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#9a3412' }}>Temp</span>

        <select
          value={operator}
          onChange={handleOperatorChange}
          className="nodrag"
          style={{
            padding: '2px 4px',
            fontSize: '12px',
            fontWeight: 600,
            borderRadius: '4px',
            border: '1px solid #fdba74',
            backgroundColor: '#ffffff',
            color: '#7c2d12',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value=">">&gt;</option>
          <option value="<">&lt;</option>
        </select>

        <input
          type="number"
          value={threshold}
          onChange={handleThresholdChange}
          className="nodrag"
          style={{
            width: '54px',
            padding: '2px 6px',
            fontSize: '12px',
            fontWeight: 600,
            borderRadius: '4px',
            border: '1px solid #fdba74',
            backgroundColor: '#ffffff',
            color: '#7c2d12',
            outline: 'none',
          }}
        />

        <span style={{ fontSize: '12px', color: '#9a3412', fontWeight: 600 }}>°C</span>
      </div>

      {/* Source handle on the right to pass filtered output to an action */}
      <Handle
        type="source"
        position={sourcePosition}
        isConnectable={isConnectable}
        style={{
          background: '#ea580c',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          border: '2px solid #ffffff',
        }}
      />
    </div>
  );
}

export default memo(MathNode);
