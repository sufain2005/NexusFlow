import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * AlertFeed Component
 * Polls GET /api/rules/alerts every 5 seconds to display recent threshold breaches.
 *
 * @param {Object} props
 * @param {Function} [props.onAlertsCountChange] - Optional callback passing the total alerts count
 * @param {Function} [props.onClose] - Optional callback to close the panel
 */
export default function AlertFeed({ onAlertsCountChange, onClose }) {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const isMountedRef = useRef(true);

  // Fetch recent alerts from backend
  const fetchAlerts = useCallback(async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    setError(null);

    try {
      let response;
      try {
        response = await fetch('http://localhost:5000/api/rules/alerts');
      } catch {
        response = await fetch('http://127.0.0.1:5000/api/rules/alerts');
      }

      const result = await response.json();

      if (!isMountedRef.current) return;

      if (!response.ok) {
        throw new Error(result.error || result.message || `HTTP ${response.status}`);
      }

      const fetchedAlerts = Array.isArray(result.data) ? result.data : [];
      setAlerts(fetchedAlerts);
      setNotice(result.notice || null);
      setLastFetched(new Date());

      if (onAlertsCountChange) {
        onAlertsCountChange(fetchedAlerts.length);
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.warn('[AlertFeed] Could not fetch alerts:', err.message);
        setError(err.message);
      }
    } finally {
      if (isMountedRef.current && isInitial) {
        setIsLoading(false);
      }
    }
  }, [onAlertsCountChange]);

  // Set up 5-second polling interval
  useEffect(() => {
    isMountedRef.current = true;

    // Initial fetch
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAlerts(true);

    const intervalId = setInterval(() => {
      fetchAlerts(false);
    }, 5000);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [fetchAlerts]);

  const formatTime = (isoString) => {
    if (!isoString) return 'Just now';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        boxSizing: 'border-box',
        backgroundColor: '#ffffff',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Feed Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#fff7ed',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>🔥</span>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#9a3412' }}>
            Alert History
          </h3>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: '#fed7aa',
              color: '#9a3412',
              padding: '2px 8px',
              borderRadius: '9999px',
            }}
          >
            {alerts.length}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Live pulsing badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#15803d',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              padding: '3px 8px',
              borderRadius: '9999px',
            }}
            title="Polling every 5 seconds"
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#22c55e',
                display: 'inline-block',
                boxShadow: '0 0 0 2px rgba(34, 197, 94, 0.2)',
              }}
            />
            <span>Live (5s)</span>
          </div>

          {/* Manual Refresh */}
          <button
            onClick={() => fetchAlerts(false)}
            title="Refresh now"
            style={{
              background: '#ffffff',
              border: '1px solid #fed7aa',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '12px',
              cursor: 'pointer',
              color: '#9a3412',
            }}
          >
            ⟳
          </button>

          {/* Optional Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              title="Close panel"
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '16px',
                cursor: 'pointer',
                color: '#9a3412',
                padding: '4px',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Disconnected DB notice */}
      {notice && (
        <div
          style={{
            margin: '12px 16px 0 16px',
            padding: '8px 12px',
            fontSize: '11px',
            lineHeight: 1.4,
            color: '#b45309',
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '6px',
          }}
        >
          ℹ️ {notice}
        </div>
      )}

      {/* Offline error */}
      {error && (
        <div
          style={{
            margin: '12px 16px 0 16px',
            padding: '8px 12px',
            fontSize: '11px',
            lineHeight: 1.4,
            color: '#b91c1c',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
          }}
        >
          ⚠️ {error}. Ensure backend is running (`npm start`).
        </div>
      )}

      {/* Alerts list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {isLoading && alerts.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
            Loading alert feed...
          </div>
        ) : alerts.length === 0 ? (
          <div
            style={{
              padding: '36px 16px',
              textAlign: 'center',
              color: '#64748b',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px dashed #cbd5e1',
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🛡️</div>
            <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
              No alerts triggered yet
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
              All telemetry is currently operating within expected thresholds.
            </p>
          </div>
        ) : (
          alerts.map((alert, idx) => (
            <div
              key={alert._id || `${alert.sensorId}-${alert.triggeredAt}-${idx}`}
              style={{
                border: '1px solid #fed7aa',
                borderLeft: '4px solid #ea580c',
                borderRadius: '8px',
                padding: '12px 14px',
                backgroundColor: '#fffaf5',
                boxShadow: '0 1px 3px rgba(234, 88, 12, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              {/* Header: Sensor & Time */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: '#ffedd5',
                      color: '#c2410c',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                    }}
                  >
                    {alert.sensorId}
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#1e293b',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '160px',
                    }}
                    title={alert.ruleName}
                  >
                    {alert.ruleName || 'Rule Engine'}
                  </span>
                </div>

                <div style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                  {formatTime(alert.triggeredAt)}
                </div>
              </div>

              {/* Threshold breach details */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#ffffff',
                  border: '1px solid #ffedd5',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  marginTop: '2px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                    Sensor Reading
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#dc2626' }}>
                    {typeof alert.value === 'number' ? `${alert.value.toFixed(1)}°C` : alert.value}
                  </span>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                    Threshold
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#ea580c' }}>
                    &gt; {alert.threshold}°C
                  </span>
                </div>
              </div>

              {/* Footer date */}
              <div style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'right' }}>
                {formatDate(alert.triggeredAt)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Status */}
      {lastFetched && (
        <div
          style={{
            padding: '8px 16px',
            borderTop: '1px solid #f1f5f9',
            fontSize: '11px',
            color: '#94a3b8',
            textAlign: 'center',
            backgroundColor: '#fafafa',
          }}
        >
          Last updated: {lastFetched.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
