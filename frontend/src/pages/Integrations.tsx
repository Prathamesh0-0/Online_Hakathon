import { useState, useEffect } from 'react';

export const Integrations = ({ token }: { token: string }) => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('http://localhost:5000/integrations/status', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setStatus(data);
        }
      } catch (err) {
        console.error('Error fetching integrations', err);
      } finally {
        setLoading(false);
      }
    };
    if (token) {
      fetchStatus();
    }
  }, [token]);

  if (loading) {
    return <p style={{ color: 'var(--text-secondary)' }}>Loading integrations...</p>;
  }

  const integrationItems = [
    { key: 'slack', name: 'Slack', description: 'Send meeting summaries to a Slack channel.' },
    { key: 'clickup', name: 'ClickUp', description: 'Create and sync action items with ClickUp tasks.' },
  ];

  return (
    <div style={{ paddingBottom: '40px' }}>
      <h1 style={{ marginBottom: '8px' }}>Integrations</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        Manage and view your connected third-party tools.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {integrationItems.map(item => {
          const isConnected = status?.[item.key];
          return (
            <div key={item.key} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{item.name}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.description}</p>
              </div>
              <div>
                {isConnected ? (
                  <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }} />
                    Connected
                  </span>
                ) : (
                  <span className="badge badge-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Not Connected
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
