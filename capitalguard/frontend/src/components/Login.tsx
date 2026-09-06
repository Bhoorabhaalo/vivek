import React, { useState } from 'react';

interface LoginProps {
  onLogin: (token: string, role: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (username: string) => {
    setError('');
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', 'dummy');

      const res = await fetch('http://localhost:8000/api/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });

      if (!res.ok) {
        throw new Error('Login failed');
      }

      const data = await res.json();
      onLogin(data.access_token, data.role);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-core-dark flex flex-col items-center justify-center font-mono">
      <div className="text-center mb-8">
        <h1 className="font-display text-4xl text-on-surface">Capital<span className="text-primary italic">Guard</span></h1>
        <p className="text-on-surface-variant text-sm tracking-widest uppercase mt-2">Authentication Portal</p>
      </div>

      <div className="w-full max-w-md bg-surface-container border border-outline-variant p-8 rounded-xl shadow-2xl flex flex-col gap-4">
        {error && <div className="text-danger text-sm bg-danger/10 p-3 rounded border border-danger/30">{error}</div>}

        <button 
          onClick={() => handleLogin('viewer@capitalguard.io')}
          disabled={loading}
          className="w-full bg-surface-variant text-on-surface py-3 rounded tracking-widest hover:bg-surface-variant/80 transition-colors"
        >
          LOGIN AS VIEWER
        </button>

        <button 
          onClick={() => handleLogin('admin@capitalguard.io')}
          disabled={loading}
          className="w-full bg-primary text-on-primary font-bold py-3 rounded tracking-widest hover:bg-primary/90 transition-colors"
        >
          LOGIN AS ADMIN
        </button>
      </div>
    </div>
  );
};
