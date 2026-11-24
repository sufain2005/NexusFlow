import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Navbar Component
 * Displays application branding, real-time RxJS engine health indicator,
 * and canvas control actions.
 *
 * @param {Object} props
 * @param {Function} props.onClearCanvas - Callback invoked to clear all nodes and edges from the canvas
 * @param {import('react').ReactNode} [props.children] - Optional action buttons rendered on the right side
 */
export default function Navbar({ onClearCanvas, children }) {
  const [health, setHealth] = useState({
    isOnline: false,
    activeRulesCount: 0,
    timestamp: null,
  });

  const isMountedRef = useRef(true);

  // Poll backend health endpoint
  const checkHealth = useCallback(async () => {
    try {
      let response;
      try {
        response = await fetch('http://localhost:5000/api/health', {
          signal: AbortSignal.timeout(2500),
        });
      } catch {
        response = await fetch('http://127.0.0.1:5000/api/health', {
          signal: AbortSignal.timeout(2500),
        });
      }

      if (!isMountedRef.current) return;

      if (response.ok) {
        const data = await response.json();
        setHealth({
          isOnline: data.status === 'online',
          activeRulesCount: typeof data.activeRulesCount === 'number' ? data.activeRulesCount : 0,
          timestamp: data.timestamp || new Date().toISOString(),
        });
      } else {
        setHealth((prev) => ({ ...prev, isOnline: false }));
      }
    } catch {
      if (isMountedRef.current) {
        setHealth((prev) => ({ ...prev, isOnline: false }));
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkHealth();

    // Poll every 4 seconds
    const intervalId = setInterval(checkHealth, 4000);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [checkHealth]);

  const handleClearClick = () => {
    if (window.confirm('Are you sure you want to clear all nodes and connections from the canvas?')) {
      if (typeof onClearCanvas === 'function') {
        onClearCanvas();
      }
    }
  };

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '56px',
        padding: '0 20px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        boxSizing: 'border-box',
        zIndex: 30,
        flexShrink: 0,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
      }}
    >
      {/* Brand & System Health Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: 800,
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
            }}
          >
            ⚡
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span
              style={{
                fontSize: '17px',
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '-0.02em',
              }}
            >
              NexusFlow
            </span>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: '#64748b',
              }}
            >
              IoT Rule Engine
            </span>
          </div>
        </div>

        {/* Vertical divider */}
        <div style={{ width: '1px', height: '20px', backgroundColor: '#e2e8f0' }} />

        {/* Live Engine Health Status Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 10px',
            borderRadius: '9999px',
            backgroundColor: health.isOnline ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${health.isOnline ? '#bbf7d0' : '#fecaca'}`,
            fontSize: '12px',
            fontWeight: 600,
            color: health.isOnline ? '#15803d' : '#b91c1c',
            transition: 'all 0.2s ease',
          }}
          title={
            health.isOnline
              ? `Backend RxJS engine active. ${health.activeRulesCount} active pipeline(s).`
              : 'Backend server is offline. Please start it with `npm start` in backend/'
          }
        >
          {/* Pulsing indicator dot */}
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: health.isOnline ? '#22c55e' : '#ef4444',
              display: 'inline-block',
              boxShadow: health.isOnline
                ? '0 0 0 2px rgba(34, 197, 94, 0.25)'
                : '0 0 0 2px rgba(239, 68, 68, 0.25)',
            }}
          />
          <span>{health.isOnline ? 'Engine Online' : 'Engine Offline'}</span>
          {health.isOnline && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                backgroundColor: '#dcfce7',
                color: '#166534',
                padding: '1px 6px',
                borderRadius: '9999px',
              }}
            >
              {health.activeRulesCount} active
            </span>
          )}
        </div>
      </div>

      {/* Right Controls: Clear Canvas & Action Slot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Clear Canvas Button */}
        <button
          onClick={handleClearClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#475569',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f8fafc';
            e.currentTarget.style.color = '#dc2626';
            e.currentTarget.style.borderColor = '#fca5a5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.color = '#475569';
            e.currentTarget.style.borderColor = '#cbd5e1';
          }}
          title="Remove all nodes and wires from canvas"
        >
          <span>🗑</span>
          <span>Clear Canvas</span>
        </button>

        {/* Extra header buttons (e.g. Deploy, Drawer toggles) */}
        {children}
      </div>
    </header>
  );
}
