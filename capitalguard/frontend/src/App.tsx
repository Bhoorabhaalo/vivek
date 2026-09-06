import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Shell } from './components/Shell';
import { Login } from './components/Login';
import { Overview } from './pages/Overview';
import { RiskCockpit } from './pages/RiskCockpit';
import { AlertFeed } from './pages/AlertFeed';
import { ScenarioLab } from './pages/ScenarioLab';
import { AuditLog } from './pages/AuditLog';
import { useCapitalGuardStream } from './hooks/useCapitalGuardStream';

function App() {
  const [token, setToken] = React.useState<string | null>(localStorage.getItem('token'));
  const [role, setRole] = React.useState<string | null>(localStorage.getItem('role'));

  const handleLogin = (newToken: string, newRole: string) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('role', newRole);
    setToken(newToken);
    setRole(newRole);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken(null);
    setRole(null);
  };

  const { state, connected, sendCommand, sendPayload } = useCapitalGuardStream(token);

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  useEffect(() => {
    const handleReset = () => sendCommand('calm');
    window.addEventListener('reset-demo', handleReset);
    return () => window.removeEventListener('reset-demo', handleReset);
  }, [sendCommand]);

  if (!state) {
    return <div className="dark min-h-screen bg-surface-obsidian text-on-surface flex items-center justify-center font-mono">Connecting to Engine...</div>;
  }

  return (
    <div className="dark">
      <Shell connected={connected} onLogout={handleLogout} role={role}>
        <Routes>
          <Route path="/" element={<Overview state={state} />} />
          <Route path="/risk" element={<RiskCockpit state={state} />} />
          <Route path="/alerts" element={<AlertFeed state={state} />} />
          <Route path="/scenarios" element={<ScenarioLab state={state} sendPayload={sendPayload} />} />
          <Route path="/audit" element={<AuditLog state={state} />} />
        </Routes>
      </Shell>
    </div>
  );
}

export default App;

