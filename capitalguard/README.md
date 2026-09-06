# CapitalGuard 🛡️

> **Autonomous Institutional Quantitative Risk Management, Liquidity Optimization & Algorithmic Capital Defense Platform**

[![Python Version](https://img.shields.io/badge/Python-3.11%2B-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6%2B-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📌 Executive Overview

**CapitalGuard** is an institutional-grade, real-time risk intelligence and autonomous portfolio defense platform. Designed for treasury desks, asset managers, and quantitative funds, CapitalGuard bridges heavy quantitative risk modeling (Historical/Parametric VaR, CVaR, Factor Betas), convex portfolio optimization (Markowitz Mean-Variance with Ledoit-Wolf shrinkage via `cvxpy`), deterministic policy enforcement (4-tier circuit breakers), and AI-driven decision explainability (powered by Anthropic Claude).

CapitalGuard continuously evaluates portfolio drift, computes tail risk under sub-second market latency, streams telemetry to an institutional terminal UI over WebSockets, and autonomously stages defensive hedges when market conditions breach risk thresholds.

---

## 🚀 Key Features & Capabilities

### 1. ⚡ Live Market Simulation & Asynchronous Streaming
- **Sub-Second Tick Processing**: Replays synthetic and historical market ticks across multi-asset portfolios (Equities, Treasuries, Corporate Bonds, Cash).
- **ProcessPoolExecutor Offloading**: Computationally intensive risk evaluations and quadratic optimization problems are offloaded to background worker processes to guarantee non-blocking WebSocket I/O.
- **Bi-Directional WebSocket Protocol**: Streams portfolio state, expected frontier changes, execution logs, and automated actions in real-time (`/ws/live`).

### 2. 📊 Quantitative Risk Engine
- **Value at Risk (VaR)**: Computes 95% and 99% VaR using both Historical Simulation and Parametric Variance-Covariance methods.
- **Conditional VaR (CVaR / Expected Shortfall)**: Quantifies severe tail risk beyond the VaR threshold.
- **Component VaR Breakdown**: Decomposes total portfolio risk across individual asset classes (Equities, Fixed Income, Corporate Bonds, Alternatives).
- **Factor Sensitivity & Beta**: Continuous tracking of Market Beta, Interest Rate Beta, Credit Spread Beta, and Liquidity Beta.
- **Liquidity Scoring**: Multi-tier weighted scoring measuring liquidation feasibility across 5 asset tiers.
- **Peak-to-Trough Drawdown & Rolling Volatility**: Annualized standard deviation and historical drawdown metrics.
- **Kupiec POF VaR Backtesting**: Continuous statistical validation comparing 99% VaR exceedances over the trailing 250 ticks against the 1.0% expected failure rate using the Kupiec Proportion-of-Failures likelihood ratio test (`var_backtest: {exceedances, expected, pass}`).

### 3. 🎯 Convex Portfolio Optimization
- **Markowitz Mean-Variance Formulation**: Real-time optimal allocation maximizing the Sharpe ratio.
- **Ledoit-Wolf Covariance Shrinkage**: Robust sample covariance estimation against small-sample noise.
- **Realistic Execution Constraints**:
  - Long-only allocation ($w_i \ge 0$)
  - Maximum single-asset weight cap (e.g., $\le 15\%$)
  - Minimum liquid asset buffer
  - Gross leverage and liquidity coverage constraints
  - Turnover caps and L1 penalty ($\kappa \sum |w_i - w_{i, \text{old}}|$) to minimize slippage and trading costs.

### 4. 🛑 Deterministic Control Engine & Circuit Breakers
Multi-tier risk governance rules trigger automated interventions:
- **Tier 1 (Watch)**: Metric drift alert and telemetry monitoring.
- **Tier 2 (Warn)**: Pre-breach alert with parameter re-balancing warnings.
- **Tier 3 (Auto-Act)**: Autonomous defensive hedging execution (e.g., algorithmic buy order in 10Y US Treasuries via VWAP/TWAP).
- **Tier 4 (Halt)**: Automated portfolio-wide circuit breaker halting automated actions during multi-metric systemic crises.

### 5. 🧠 AI Decision Explainability (Claude 3.5 Sonnet)
- Natural language audit narratives translating quantitative metrics and algorithmic interventions into clear executive briefings for CFOs and Risk Committees.
- Explains the *why*, the *threat context*, and *next steps* for every automated decision.
- Built-in fallback to deterministic simulated narratives when offline or without an API key.

### 6. 🧪 Scenario Lab (Stress-Testing)
Simulate catastrophic macro conditions against the active portfolio with instant re-calculation:
- **2008 Financial Crisis Replay**: Systemic equity collapse and cross-asset correlation breakdown ($-\$45.2\text{M}$ VaR shock).
- **COVID-19 March 2020 Liquidity Shock**: Rapid liquidity vacuum and flight to cash ($-\$32.1\text{M}$ VaR shock).
- **Unanchored Inflation Spike**: Sudden +300bps yield curve shock and stagflationary pressures ($-\$28.5\text{M}$ VaR shock).

### 7. 📜 Cryptographic Audit Ledger & RBAC
- **Audit Log Persistence**: Complete record of all algorithmic trades, order latencies, execution prices, and policy events stored in SQLite/PostgreSQL.
- **Role-Based Access Control (RBAC)**: JWT authentication distinguishing `APPROVER` (Admin with scenario execution and policy control) and `VIEWER` (Read-only access).

---

## 🏛️ System Architecture

```mermaid
flowchart TB
    subgraph Frontend ["Frontend Terminal (React 19 + Vite + TypeScript)"]
        UI["Modern Financial Dashboard"]
        Overview["Overview & KPIs"]
        RiskCockpit["Risk Cockpit"]
        ScenarioLabUI["Scenario Lab"]
        AlertFeed["Alert Feed"]
        AuditLogUI["Audit Ledger"]
        WSHook["useCapitalGuardStream Hook"]
    end

    subgraph Backend ["Backend Engine (FastAPI + Python 3.11+)"]
        API["FastAPI App (main.py)"]
        AuthRouter["Auth API (JWT / OAuth2)"]
        AuditRouter["Audit API"]
        LiveWS["WebSocket Stream Handler (/ws/live)"]

        Coordinator["Engine Coordinator (engine_coordinator.py)"]
        Feeder["Market Data Feeder (feeder.py)"]
        
        subgraph Workers ["ProcessPoolExecutor Workers"]
            RiskEngine["Risk Calculator (VaR, CVaR, Liquidity)"]
            Optimizer["Portfolio Optimizer (cvxpy / Markowitz)"]
        end

        ControlEngine["Deterministic Control Engine (4-Tier Rules)"]
        ScenarioLab["Scenario Lab (Stress Testing)"]
        Narrative["AI Narrative Service (Anthropic Claude)"]
        DB[(SQLite / PostgreSQL Database)]
    end

    UI --> WSHook
    WSHook <-->|WebSocket Stream (JSON)| LiveWS
    LiveWS <--> Coordinator
    Coordinator --> Feeder
    Coordinator --> Workers
    Coordinator --> ControlEngine
    Coordinator --> ScenarioLab
    Coordinator --> Narrative
    Coordinator --> DB
    AuditLogUI -->|REST GET /api/audit| AuditRouter
    UI -->|REST POST /api/auth/token| AuthRouter
    AuditRouter --> DB
    AuthRouter --> DB
```

---

## 📁 Project Structure

```
capitalguard/
├── backend/
│   ├── app/
│   │   ├── api/                     # REST & WebSocket API endpoints
│   │   │   ├── audit.py             # Audit log retrieval endpoint
│   │   │   ├── auth.py              # JWT authentication & user roles
│   │   │   ├── live.py              # WebSocket connection & command handlers
│   │   │   └── portfolio.py         # Portfolio positions & metadata
│   │   ├── core/                    # Configuration & settings
│   │   │   └── config.py            # Pydantic BaseSettings (.env loading)
│   │   ├── db/                      # Database models & SQLAlchemy sessions
│   │   │   ├── database.py          # Engine and session initialization
│   │   │   └── models.py            # AuditLogEvent database schema
│   │   ├── schemas/                 # Pydantic schemas (Portfolio, Risk, etc.)
│   │   ├── services/                # Core domain and quantitative engines
│   │   │   ├── control_engine/      # 4-Tier policy engine & circuit breakers
│   │   │   ├── market_data/         # Synthetic tick generator & market replay
│   │   │   ├── narrative/           # LLM decision explainer (Claude integration)
│   │   │   ├── optimizer/           # Convex Markowitz optimizer via CVXPY
│   │   │   ├── risk_engine/         # VaR, CVaR, factor beta & drawdown math
│   │   │   ├── scenario_lab/        # Stress-testing & macroeconomic crisis shocks
│   │   │   └── engine_coordinator.py# Main orchestrator & async broadcasting loop
│   │   └── main.py                  # FastAPI application entrypoint
│   ├── tests/                       # Unit and integration test suites
│   │   ├── test_control_engine.py
│   │   ├── test_optimizer.py
│   │   ├── test_performance.py
│   │   ├── test_risk_engine.py
│   │   └── test_scenario_lab.py
│   └── requirements.txt             # Python backend dependencies
│
└── frontend/
    ├── src/
    │   ├── components/              # Institutional UI components
    │   │   ├── ExecutionLog.tsx     # Sub-second order execution feed
    │   │   ├── ExplainabilityPanel.tsx # AI decision narratives
    │   │   ├── FrontierChart.tsx    # Markowitz efficient frontier visualizer
    │   │   ├── Header.tsx           # Terminal top bar & status indicators
    │   │   ├── KPICard.tsx          # Institutional metric cards (AUM, VaR, Sharpe)
    │   │   ├── Login.tsx            # Portal authentication component
    │   │   ├── PolicyPanel.tsx      # Risk limits and policy monitors
    │   │   ├── Shell.tsx            # Main layout and navigation container
    │   │   └── Sidebar.tsx          # Side navigation bar
    │   ├── hooks/
    │   │   └── useCapitalGuardStream.ts # WebSocket streaming hook
    │   ├── pages/                   # Application views
    │   │   ├── AlertFeed.tsx        # Real-time policy alerts & hedge triggers
    │   │   ├── AuditLog.tsx         # Immutable execution ledger & CSV export
    │   │   ├── Overview.tsx         # Main cockpit overview dashboard
    │   │   ├── RiskCockpit.tsx      # Component VaR & factor sensitivity
    │   │   └── ScenarioLab.tsx      # Interactive macroeconomic stress-testing
    │   ├── App.tsx                  # Root routing & authentication handler
    │   └── main.tsx                 # Vite React DOM entrypoint
    ├── package.json                 # Frontend dependencies & scripts
    ├── tailwind.config.js           # Custom dark theme color tokens
    └── vite.config.ts               # Vite bundler configuration
```

---

## 🛠️ Getting Started

### Prerequisites
- **Python 3.10+** (Python 3.11 or 3.12 recommended)
- **Node.js 18+** & **npm**
- (Optional) Anthropic API key for live Claude decision explanations

---

### 1. Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment**:
   - On Windows (PowerShell):
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - On macOS/Linux:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Configuration (Optional)**:
   Create a `.env` file in `backend/.env`:
   ```env
   PROJECT_NAME="CapitalGuard API"
   DATABASE_URL="sqlite:///./capitalguard_dev.db"
   ANTHROPIC_API_KEY="your-anthropic-api-key-here"  # Optional: falls back to simulated narrative
   ```

5. **Start the FastAPI Server**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The backend API will be available at `http://localhost:8000` with interactive Swagger docs at `http://localhost:8000/docs`.

---

### 2. Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd ../frontend
   ```

2. **Install Node dependencies**:
   ```bash
   npm install
   ```

3. **Start the Vite development server**:
   ```bash
   npm run dev
   ```
   The frontend terminal will launch at `http://localhost:5173` (or the port indicated in the terminal).

---

## 🚀 Deploying to Vercel

The project is pre-configured for one-click deployment to **Vercel**:

### Option A: Deploy from Repository Root (Recommended)
1. Push changes to GitHub:
   ```bash
   git add .
   git commit -m "Configure Vercel deployment and build fixes"
   git push origin master
   ```
2. In [Vercel Dashboard](https://vercel.com/new), import your GitHub repository.
3. Keep **Root Directory** as `./`.
4. Vercel automatically runs the root `vercel.json` and builds the frontend.

### Option B: Deploy with Subdirectory Root
1. Set **Root Directory** in Vercel to `capitalguard/frontend`.
2. Framework Preset: **Vite**.
3. Build Command: `npm run build`.
4. Output Directory: `dist`.
5. `capitalguard/frontend/vercel.json` provides SPA routing rewrites for all routes (`/risk`, `/alerts`, `/scenarios`, `/audit`).

### Environment Variables (Optional)
If connecting to a hosted FastAPI backend:
- `VITE_API_BASE_URL`: e.g. `https://your-api.com`
- `VITE_WS_BASE_URL`: e.g. `wss://your-api.com`

*If omitted, the app runs in interactive demo mode on Vercel with instant login and full live simulations.*

---

## 🔐 Authentication & Demo Credentials

CapitalGuard includes pre-configured demo users for quick evaluation:

| Role | Username | Permissions |
| :--- | :--- | :--- |
| **Approver / Admin** | `admin@capitalguard.io` | Full Control: Execute stress tests, trigger manual shock/calm commands, view audit trails. |
| **Viewer** | `viewer@capitalguard.io` | Read-only: View real-time metrics, risk analytics, and telemetry. |

> *Note: In the authentication portal, click **"LOGIN AS ADMIN"** or **"LOGIN AS VIEWER"** to log in instantly.*

---

## 📡 API & WebSocket Specification

### REST Endpoints
- `GET /health` — Health check endpoint reporting engine status.
- `POST /api/auth/token` — OAuth2 compatible JWT token issuance endpoint.
- `GET /api/audit/` — Fetches the cryptographic historical execution log.
- `GET /api/portfolio/` — Returns the list of current portfolio asset positions.

### WebSocket Stream (`ws://localhost:8000/ws/live?token={jwt_token}`)
Streams continuous state updates every 2 seconds:
- **Downlink Payload**:
  ```json
  {
    "aum": 62500000.0,
    "var_99": -12100000.0,
    "sharpe": 1.84,
    "beta": 0.85,
    "drawdown": -0.5,
    "drift": {
      "US Equities": { "target": 40, "actual": 40.5, "status": "Near" },
      "Treasuries": { "target": 30, "actual": 29.5, "status": "Near" }
    },
    "frontier": { "expected_return": 8.5, "volatility": 12.0 },
    "logs": [...],
    "automated_action": null,
    "demo_state": "calm"
  }
  ```
- **Uplink Commands**:
  - `{"command": "shock"}` — Simulates a market shock and triggers automated hedging.
  - `{"command": "calm"}` — Resets the market state to calm baseline.
  - `{"command": "run_scenario", "scenario_id": "2008_crash"}` — Executes macroeconomic shock replay.

---

## 🧪 Running Tests

To run the backend test suite:
```bash
cd backend
python -m pytest
```

The test suite covers:
- **`test_risk_engine.py`**: Validates Historical VaR, Parametric VaR, CVaR calculations, and multi-tier liquidity scoring.
- **`test_optimizer.py`**: Tests convex Markowitz portfolio optimization with CVXPY and turnover constraints.
- **`test_control_engine.py`**: Tests tier-based policy evaluations and circuit breaker triggers.
- **`test_scenario_lab.py`**: Validates historical scenario replays and impact percentage math.
- **`test_performance.py`**: Evaluates execution latency under stress conditions.

---

## 🧰 Tech Stack Summary

- **Backend**: Python 3, FastAPI, Uvicorn, SQLAlchemy, Alembic, SQLite / PostgreSQL.
- **Quantitative & Math**: NumPy, SciPy, Pandas, CVXPY, Statsmodels.
- **AI & Explainability**: Anthropic Claude API (`claude-3-5-sonnet-20241022`).
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts.
- **Protocol**: WebSockets (bi-directional sub-second telemetry) & RESTful JSON API.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
