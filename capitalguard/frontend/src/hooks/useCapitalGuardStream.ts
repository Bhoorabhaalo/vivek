import { useState, useEffect, useRef } from 'react';

export interface LiveState {
  aum: number;
  var_99: number;
  sharpe: number;
  utilization: number;
  beta: number;
  drawdown: number;
  drift: {
    [key: string]: { target: number; actual: number; status: string };
  };
  leverage: { gross: number; lcr: number };
  frontier: { expected_return: number; volatility: number };
  logs: Array<{
    time: string;
    inst: string;
    side: string;
    notional: string;
    algo: string;
    price: string;
    latency: string;
    status: string;
    isHedge: boolean;
  }>;
  automated_action: {
    rationale: string;
    metricsSnapshot: Record<string, string>;
  } | null;
  demo_state: string;
  scenario_result: {
    id: string;
    impactVaR: string;
    impactDrawdown: string;
  } | null;
  component_var: Record<string, number>;
  var_backtest?: {
    exceedances: number;
    expected: number;
    pass: boolean;
  };
}

const getInitialState = (): LiveState => ({
  aum: 62500000.0,
  var_99: -12100000.0,
  sharpe: 1.84,
  utilization: 82.4,
  beta: 0.85,
  drawdown: -0.5,
  drift: {
    'US Equities': { target: 40, actual: 40.5, status: 'Near' },
    'Treasuries': { target: 30, actual: 29.5, status: 'Near' },
    'Corp Bonds': { target: 20, actual: 20.0, status: 'Near' },
    'Cash/Alts': { target: 10, actual: 10.0, status: 'Near' },
  },
  leverage: { gross: 1.2, lcr: 118 },
  frontier: { expected_return: 8.5, volatility: 12.0 },
  var_backtest: {
    exceedances: 2,
    expected: 2.5,
    pass: true
  },
  logs: [
    {
      time: new Date().toISOString().substring(11, 23),
      inst: 'CORP-B',
      side: 'BUY',
      notional: '$1.8M',
      algo: 'TWAP',
      price: '102.40',
      latency: '24ms',
      status: 'FILLED',
      isHedge: false
    },
    {
      time: new Date(Date.now() - 4000).toISOString().substring(11, 23),
      inst: 'MSFT',
      side: 'BUY',
      notional: '$3.2M',
      algo: 'VWAP',
      price: '349.80',
      latency: '31ms',
      status: 'FILLED',
      isHedge: false
    },
    {
      time: new Date(Date.now() - 8000).toISOString().substring(11, 23),
      inst: 'AAPL',
      side: 'SELL',
      notional: '$2.5M',
      algo: 'SMART',
      price: '150.25',
      latency: '19ms',
      status: 'FILLED',
      isHedge: false
    }
  ],
  automated_action: null,
  demo_state: 'calm',
  scenario_result: null,
  component_var: {
    Equity: -8200000,
    'Fixed Income': -3100000,
    Corporate_Bond: -4500000
  }
});

const getWsBase = () => {
  if (import.meta.env.VITE_WS_BASE_URL) {
    return import.meta.env.VITE_WS_BASE_URL;
  }
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/^http/, 'ws');
  }
  return 'ws://localhost:8000';
};

export const useCapitalGuardStream = (token: string | null) => {
  const [state, setState] = useState<LiveState>(getInitialState);
  const [connected, setConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!token) return;
    const wsBase = getWsBase();
    try {
      const socket = new WebSocket(`${wsBase}/ws/stream?token=${token}`);
      ws.current = socket;

      socket.onopen = () => setConnected(true);
      socket.onclose = () => setConnected(false);
      socket.onerror = () => setConnected(false);
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setState(data);
        } catch (e) {
          console.error('Failed to parse WS message', e);
        }
      };
    } catch {
      setConnected(false);
    }

    return () => {
      ws.current?.close();
    };
  }, [token]);

  // Offline simulated live tick loop if backend WS is disconnected
  useEffect(() => {
    if (connected) return;

    const interval = setInterval(() => {
      setState((prev) => {
        if (!prev) return getInitialState();
        const tickAum = prev.aum + (Math.random() - 0.49) * 25000;
        const newLog = Math.random() < 0.3 ? {
          time: new Date().toISOString().substring(11, 23),
          inst: ['AAPL', 'MSFT', 'CORP-B', 'US-T 10Y'][Math.floor(Math.random() * 4)],
          side: Math.random() > 0.5 ? 'BUY' : 'SELL',
          notional: `$${(Math.random() * 3 + 0.5).toFixed(1)}M`,
          algo: ['TWAP', 'VWAP', 'SMART'][Math.floor(Math.random() * 3)],
          price: (100 + Math.random() * 250).toFixed(2),
          latency: `${Math.floor(Math.random() * 35 + 15)}ms`,
          status: 'FILLED',
          isHedge: false
        } : null;

        const updatedLogs = newLog ? [newLog, ...prev.logs.slice(0, 9)] : prev.logs;
        return {
          ...prev,
          aum: tickAum,
          logs: updatedLogs
        };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [connected]);

  const sendCommand = (cmd: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ command: cmd }));
      return;
    }
    // Offline simulation handling
    if (cmd === 'shock') {
      setState((prev) => ({
        ...prev,
        demo_state: 'shock',
        drawdown: -2.5,
        var_99: -16800000.0,
        automated_action: {
          rationale: 'Tier 3 trigger: Daily VaR (99%) breached the $15M threshold with a 12% rate of change in 15 minutes. Automatically staged a defensive hedge in 10Y Treasuries.',
          metricsSnapshot: {
            VaR_99: '-$16.8M',
            ROC_15m: '+12.4%',
            Liq_Score: '82',
            Status: 'HEDGED'
          }
        },
        var_backtest: {
          exceedances: 8,
          expected: 2.5,
          pass: false
        },
        logs: [
          {
            time: new Date().toISOString().substring(11, 23),
            inst: 'US-T 10Y',
            side: 'BUY',
            notional: '$15.0M',
            algo: 'VWAP',
            price: '98.50',
            latency: '28ms',
            status: 'FILLED',
            isHedge: true
          },
          ...prev.logs.filter((l) => !l.isHedge)
        ]
      }));
    } else if (cmd === 'calm') {
      setState((prev) => ({
        ...prev,
        demo_state: 'calm',
        drawdown: -0.5,
        var_99: -12100000.0,
        automated_action: null,
        var_backtest: {
          exceedances: 2,
          expected: 2.5,
          pass: true
        },
        logs: prev.logs.filter((l) => !l.isHedge)
      }));
    }
  };

  const sendPayload = (payload: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(payload));
      return;
    }
    // Offline simulation handling for scenarios
    if (payload?.command === 'run_scenario') {
      const id = payload.scenario_id;
      const impacts: Record<string, { impactVaR: string; impactDrawdown: string }> = {
        '2008_crash': { impactVaR: '-$45.2M', impactDrawdown: '-15.4%' },
        'covid_shock': { impactVaR: '-$32.1M', impactDrawdown: '-8.9%' },
        'inflation_spike': { impactVaR: '-$28.5M', impactDrawdown: '-6.2%' }
      };
      const impact = impacts[id] || { impactVaR: '-$30.0M', impactDrawdown: '-7.5%' };
      setState((prev) => ({
        ...prev,
        scenario_result: {
          id,
          ...impact
        }
      }));
    }
  };

  return { state, connected, sendCommand, sendPayload };
};
