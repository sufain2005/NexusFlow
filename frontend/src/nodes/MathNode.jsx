import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

/**
 * Custom React Flow node representing a math operation or threshold filter (e.g., Temp > 80°C).
 * Styled with an orange/yellow palette, an input 'target' handle on the left to receive
 * sensor data, and an output 'source' handle on the right to forward triggered data to an action.
 */
function MathNode({ data, isConnectable }) {
  const targetPosition = data?.targetPosition === 'top' ? Position.Top : Position.Left;
  const sourcePosition = data?.sourcePosition === 'bottom' ? Position.Bottom : Position.Right;

  return (
    <div
      className="math-node"
      style={{
        background: '#fff7ed', // Orange-50 tint, distinct from Sensor (white) and Action (amber)
        border: '1px solid #fdba74', // Orange-300 border
        borderRadius: '8px',
        padding: '10px 14px',
        minWidth: '150px',
        boxShadow: '0 4px 6px -1px rgba(234, 88, 12, 0.1), 0 2px 4px -2px rgba(234, 88, 12, 0.05)',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
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

      {/* Dynamic Data Label / Condition Expression */}
      <div
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#9a3412',
          marginTop: '2px',
        }}
      >
        {data?.label || 'Temp > 80°C'}
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
