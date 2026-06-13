# VeloCook — AI Cooking To-Do & Budget Feasibility Calculator

VeloCook is a high-fidelity React-based cooking to-do list generator and budget feasibility tool designed with a sophisticated **Management Consulting** theme. It provides an intuitive, centered split-view dashboard to help busy individuals optimize their daily meal architectures and grocery procurement workflows under strict cost boundaries.

---

## 🏛️ System Architecture

The project splits into a responsive, client-side React dashboard and an intelligent, lightweight Python FastAPI server.

```mermaid
graph TD
    A[React Client - VeloCook] -->|HTTP POST Plan Request| B[FastAPI Server:8000]
    B -->|Analyzes Constraints & Calculates Costs| C[Plan Optimizer Engine]
    C -->|Returns Feasibility, Meals, List & Substitutions| A
    A -->|Offline / Failover Fallback| D[High-Fidelity Client Simulator]
```

### Directory Structure
```text
VeloCook/
├── backend/
│   ├── main.py              # FastAPI server script with CORS & NLP keyword matcher
│   ├── requirements.txt     # Python dependencies (fastapi, uvicorn, pydantic)
│   └── .env                 # Local environment config
│
├── frontend/
│   ├── public/
│   │   └── index.html       # HTML5 entry with Google Fonts & dark theme colors
│   ├── src/
│   │   ├── App.js           # Core UI coordinate, state management & API call
│   │   ├── index.js         # React DOM rendering root
│   │   └── index.css        # Tailwind v4 directives & custom scrollbars
│   ├── package.json         # Node.js project definition
│   └── tailwind.config.js   # Consulting design palette color extensions
│
├── README.md                # Hackathon & execution documentation
└── .gitignore               # Multi-language build-cache and env filters
```

---

## 🎨 Theme & UX Specifications ("Management Consulting")

VeloCook utilizes a premium dark-mode consulting report aesthetic:
- **Primary Canvas:** Deep Charcoal (`#121212` / `bg-charcoal-900`) for low eye-strain.
- **Secondary Cards:** Tactile Elevated Charcoal (`#1C1C1E` / `bg-charcoal-800`) with subtle `border-charcoal-700` boundaries.
- **Typography:** `Inter` (geometric sans-serif readability for data labels) & `Outfit` (clean executive curves for headings).
- **Accent Emerald (`#10b981`):** Applied exclusively for success states, ROI indicators, and budget-feasible reports.
- **Accent Red/Amber:** Warns of budget deficits and constraints mismatch.
- **Interactive Micro-Animations:** Focus-ring highlights on checkboxes, sliding progress tracker bar, and smooth hover elevation cards (`transition-card`).

---

## 🚀 Setup & Execution Guide

### 1. Backend Service Setup (FastAPI)
Navigate to the `backend` folder, set up a Python virtual environment, install requirements, and boot up the server:

```powershell
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows PowerShell:
.venv\Scripts\Activate.ps1
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start local server (Runs on port 8000)
python main.py
```

### 2. Frontend Application Setup (React / Vite)
Open a separate terminal window, navigate to the `frontend` folder, install packages, and boot up the hot-reload developer server:

```powershell
# Navigate to frontend directory
cd frontend

# Install packages
npm install

# Start developer server (Runs on http://localhost:5173 by default)
npm run dev
```

---

## 🛡️ Senior UX Failover Mechanics (Offline Demo Mode)

To guarantee an outstanding evaluation experience even if the Python API backend is offline:
- **Heartbeat Verification:** On page load, VeloCook queries the API server. An status indicator badge in the header shows whether the client is connected to the live API or using local simulations.
- **Auto-Failover:** If a user submits a prompt while the server is offline, the React app automatically falls back to the local NLP-based Simulator, displays a warning banner, and computes the budget feasibility and balance sheet client-side.
- **Quick-Fill Templates:** Preset buttons allow clicking to pre-load specific day descriptions (Keto, Vegan, Busy Workday) and budgets to test feasibility logic instantly.

---

## ♿ Accessibility (A11y) & Semantic Code Quality

- **Semantic HTML Markup:** Avoids generic div soup. Wraps the main layout inside `<main>`, inputs inside `<section aria-labelledby="inputs-heading">`, and output elements in `<section aria-labelledby="results-heading">` using proper headings structure.
- **Polite Announcements:** The results panel is designated with `aria-live="polite"` so screen readers speak updates when meal plans regenerate.
- **Accessible Inputs:** Every input element has an associated descriptive `<label>` pointing directly to the input via matching `id` and `htmlFor` configurations.
- **Keyboard Usability:** Custom styles ensure that checkbox lists are fully traversable and exhibit high-visibility focus borders (`focus-ring`) when navigated via tab keys.
