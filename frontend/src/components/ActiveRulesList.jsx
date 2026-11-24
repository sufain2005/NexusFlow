import { useState, useEffect, useCallback } from 'react';

/**
 * ActiveRulesList Component
 * Displays deployed IoT rules retrieved from MongoDB with controls to delete and refresh.
 *
 * @param {Object} props
 * @param {any} props.refreshTrigger - Trigger value that causes a re-fetch when updated
 * @param {Function} [props.onClose] - Optional callback to close the drawer/panel
 * @param {Function} [props.onRulesCountChange] - Optional callback passing the current active count
 */
export default function ActiveRulesList({ refreshTrigger, onClose, onRulesCountChange }) {
  const [rules, setRules] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch all saved rules from backend
  const fetchRules = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let response;
      try {
        response = await fetch('http://localhost:5000/api/rules');
      } catch {
        response = await fetch('http://127.0.0.1:5000/api/rules');
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || `HTTP ${response.status}`);
      }

      const fetchedRules = Array.isArray(result.data) ? result.data : [];
      setRules(fetchedRules);
      setNotice(result.notice || null);

      if (onRulesCountChange) {
        onRulesCountChange(fetchedRules.length);
      }
    } catch (err) {
      console.warn('[ActiveRulesList] Could not fetch rules:', err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [onRulesCountChange]);

  // Fetch on mount or when refreshTrigger updates (e.g., after Deploy Engine is clicked)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRules();
  }, [fetchRules, refreshTrigger]);

  // Handle deleting a single rule
  const handleDelete = async (ruleId, ruleName) => {
    const displayName = ruleName || 'this rule';
    if (!window.confirm(`Are you sure you want to delete "${displayName}"?`)) {
      return;
    }

    setDeletingId(ruleId);

    try {
      let response;
      try {
        response = await fetch(`http://localhost:5000/api/rules/${ruleId}`, {
          method: 'DELETE',
        });
      } catch {
        response = await fetch(`http://127.0.0.1:5000/api/rules/${ruleId}`, {
          method: 'DELETE',
        });
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.details || 'Failed to delete rule');
      }

      // Immediately re-fetch to update UI and active pipeline status
      await fetchRules();
    } catch (err) {
      console.error('[ActiveRulesList] Delete error:', err.message);
      alert(`❌ Failed to delete rule: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Helper to extract threshold details from nodes
  const getRuleDetails = (ruleNodes) => {
    if (!Array.isArray(ruleNodes)) return null;

    const mathNode = ruleNodes.find((n) => n.type === 'math' || n.type === 'mathFilter');
    if (mathNode) {
      const op = mathNode.data?.operator || '>';
      const thresh = mathNode.data?.threshold !== undefined ? mathNode.data.threshold : '80';
      return `Threshold: ${op} ${thresh}°C`;
    }

    const sensorNode = ruleNodes.find((n) => n.type === 'sensor');
    if (sensorNode) {
      return `Sensor: ${sensorNode.data?.label || 'Default'}`;
    }

    return null;
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
      {/* Panel Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>📋</span>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
            Deployed Rules
          </h3>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: '#e2e8f0',
              color: '#334155',
              padding: '2px 8px',
              borderRadius: '9999px',
            }}
          >
            {rules.length}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Refresh button */}
          <button
            onClick={fetchRules}
            disabled={isLoading}
            title="Refresh rules list"
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '12px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                transform: isLoading ? 'rotate(360deg)' : 'none',
                transition: 'transform 0.6s linear',
              }}
            >
              ⟳
            </span>
            <span>Refresh</span>
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
                color: '#64748b',
                padding: '4px 8px',
                borderRadius: '6px',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Database offline notice */}
      {notice && (
        <div
          style={{
            margin: '12px 16px 0 16px',
            padding: '10px 12px',
            fontSize: '12px',
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

      {/* Network or server error */}
      {error && (
        <div
          style={{
            margin: '12px 16px 0 16px',
            padding: '10px 12px',
            fontSize: '12px',
            lineHeight: 1.4,
            color: '#b91c1c',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
          }}
        >
          ⚠️ {error}. Ensure backend is running (`npm start` on port 5000).
        </div>
      )}

      {/* Rules list scrollable body */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {isLoading && rules.length === 0 ? (
          <div
            style={{
              padding: '32px 16px',
              textAlign: 'center',
              color: '#94a3b8',
              fontSize: '13px',
            }}
          >
            Fetching deployed rules...
          </div>
        ) : rules.length === 0 ? (
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
            <p style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
              No deployed rules found
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
              Connect nodes on the canvas and click &quot;Deploy Engine&quot; to save and compile a rule.
            </p>
          </div>
        ) : (
          rules.map((rule) => {
            const isDeleting = deletingId === rule._id;
            const detailText = getRuleDetails(rule.nodes);
            const createdDate = rule.createdAt ? new Date(rule.createdAt).toLocaleString() : 'Recent';

            return (
              <div
                key={rule._id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  transition: 'border-color 0.15s ease',
                }}
              >
                {/* Rule Title and Status Badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#0f172a',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={rule.name}
                    >
                      {rule.name || 'IoT Rule Engine'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      {createdDate}
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '9999px',
                      backgroundColor: rule.isActive ? '#dcfce7' : '#f1f5f9',
                      color: rule.isActive ? '#15803d' : '#64748b',
                      border: `1px solid ${rule.isActive ? '#86efac' : '#cbd5e1'}`,
                      textTransform: 'uppercase',
                      letterSpacing: '0.025em',
                      flexShrink: 0,
                    }}
                  >
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Graph Summary */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '12px',
                    color: '#64748b',
                    backgroundColor: '#f8fafc',
                    padding: '6px 10px',
                    borderRadius: '6px',
                  }}
                >
                  <span>
                    <strong>{rule.nodes?.length || 0}</strong> nodes
                  </span>
                  <span>•</span>
                  <span>
                    <strong>{rule.edges?.length || 0}</strong> edges
                  </span>
                  {detailText && (
                    <>
                      <span>•</span>
                      <span style={{ color: '#ea580c', fontWeight: 500 }}>
                        {detailText}
                      </span>
                    </>
                  )}
                </div>

                {/* Action Controls */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <button
                    onClick={() => handleDelete(rule._id, rule.name)}
                    disabled={isDeleting}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: isDeleting ? '#94a3b8' : '#dc2626',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '6px',
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isDeleting) {
                        e.currentTarget.style.backgroundColor = '#fee2e2';
                        e.currentTarget.style.borderColor = '#fca5a5';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isDeleting) {
                        e.currentTarget.style.backgroundColor = '#fef2f2';
                        e.currentTarget.style.borderColor = '#fecaca';
                      }
                    }}
                  >
                    <span>🗑</span>
                    <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
