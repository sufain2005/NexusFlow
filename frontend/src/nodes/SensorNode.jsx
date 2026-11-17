import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

/**
 * Custom React Flow node representing an IoT sensor.
 * Rendered as a small UI card with a 'Sensor' title, dynamic data label,
 * and a single 'source' handle on the right (or bottom).
 */
function SensorNode({ data, isConnectable }) {
  const handlePosition = data?.handlePosition === 'bottom' ? Position.Bottom : Position.Right;

  return (
    <div
      className="sensor-node"
      style={{
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        padding: '10px 14px',
        minWidth: '150px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        color: '#0f172a',
      }}
    >
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
            backgroundColor: '#10b981',
            display: 'inline-block',
          }}
        />
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#64748b',
          }}
        >
          Sensor
        </span>
      </div>

      {/* Dynamic Data Label */}
      <div
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#1e293b',
          marginTop: '2px',
        }}
      >
        {data?.label || 'Sensor Node'}
      </div>

      {/* Single source handle for outgoing connections */}
      <Handle
        type="source"
        position={handlePosition}
        isConnectable={isConnectable}
        style={{
          background: '#3b82f6',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          border: '2px solid #ffffff',
        }}
      />
    </div>
  );
}

export default memo(SensorNode);
