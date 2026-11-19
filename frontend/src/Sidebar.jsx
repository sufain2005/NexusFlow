/**
 * Sidebar component containing draggable nodes for the rule engine canvas.
 */
export default function Sidebar() {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside
      style={{
        width: '240px',
        background: '#f8fafc',
        borderRight: '1px solid #e2e8f0',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxSizing: 'border-box',
        userSelect: 'none',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div>
        <h3
          style={{
            margin: '0 0 6px 0',
            fontSize: '15px',
            fontWeight: 700,
            color: '#0f172a',
          }}
        >
          Node Palette
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: '12px',
            color: '#64748b',
            lineHeight: 1.4,
          }}
        >
          Drag components onto the canvas to construct IoT rules.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Sensor Node Draggable */}
        <div
          draggable
          onDragStart={(e) => onDragStart(e, 'sensor')}
          style={{
            padding: '12px 14px',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              flexShrink: 0,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
              Sensor Node
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Input data source
            </span>
          </div>
        </div>

        {/* Math Filter Draggable */}
        <div
          draggable
          onDragStart={(e) => onDragStart(e, 'math')}
          style={{
            padding: '12px 14px',
            background: '#fff7ed',
            border: '1px solid #fdba74',
            borderRadius: '8px',
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 1px 3px rgba(234, 88, 12, 0.08)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#ea580c',
              flexShrink: 0,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#9a3412' }}>
              Math Filter
            </span>
            <span style={{ fontSize: '11px', color: '#c2410c' }}>
              Threshold & conditions
            </span>
          </div>
        </div>

        {/* Action Node Draggable */}
        <div
          draggable
          onDragStart={(e) => onDragStart(e, 'action')}
          style={{
            padding: '12px 14px',
            background: '#fffbeb',
            border: '1px solid #fcd34d',
            borderRadius: '8px',
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 1px 3px rgba(245, 158, 11, 0.08)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#f59e0b',
              flexShrink: 0,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#92400e' }}>
              Action Node
            </span>
            <span style={{ fontSize: '11px', color: '#b45309' }}>
              Alert / Trigger output
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
