import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

/**
 * Custom React Flow node representing an action or alert trigger (e.g., SMS Alert).
 * Styled with a distinct background color and a 'target' handle on the left (or top).
 */
function ActionNode({ data, isConnectable }) {
  const handlePosition = data?.handlePosition === 'top' ? Position.Top : Position.Left;

  return (
    <div
      className="action-node"
      style={{
        background: '#fffbeb', // Amber-50 tint, distinct from the white/neutral SensorNode
        border: '1px solid #fcd34d', // Amber-300 border
        borderRadius: '8px',
        padding: '10px 14px',
        minWidth: '150px',
        boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.1), 0 2px 4px -2px rgba(245, 158, 11, 0.06)',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        color: '#78350f',
      }}
    >
      {/* Target handle on the left for incoming trigger connections */}
      <Handle
        type="target"
        position={handlePosition}
        isConnectable={isConnectable}
        style={{
          background: '#f59e0b', // Amber-500
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
            backgroundColor: '#f59e0b',
            display: 'inline-block',
          }}
        />
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#b45309',
          }}
        >
          Action
        </span>
      </div>

      {/* Dynamic Data Label */}
      <div
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#92400e',
          marginTop: '2px',
        }}
      >
        {data?.label || 'Action Trigger'}
      </div>
    </div>
  );
}

export default memo(ActionNode);
