# Global Live DDoS Attack Map 🌐⚡

<div align="center">

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-000000?style=flat-square&logo=threedotjs&logoColor=white)](https://threejs.org)
[![React 19](https://img.shields.io/badge/React-19.3-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

*An interactive, low-latency, 3D WebGL global threat surveillance station built with **Three.js / ThreeGlobe**, a **FastAPI WebSocket Streaming Gateway**, and a **Stochastic Real-Time Emulation Engine** calibrated against aggregated **Cloudflare Radar** and **AbuseIPDB** threat telemetry.*

</div>

---

## 📸 System Preview & Architectural Layout

```text
+---------------------------------------------------------------------------------------------------+
| VECTOR // 01 / GLOBAL THREAT TELEMETRY    PEAK: 342.1 GBPS   RATE: 8.4 EVT/S   REF: 37°46'N/122°25'W|
+---+-------------------------------------------------------------------------------------------+---+
|   | 01 // EVENT_STREAM                                    02 // TARGET_CONCENTRATION          |   |
|   |                                                                                           |   |
|   | 23:58:12  SYN  CN -> US  [TCP/L4]  142.8G             US  ━━━━━━━━━━━━━━━━━━━━ 42%        |   |
|   | 23:58:12  UDP  DE -> US  [UDP/L4]   68.2G             DE  ━━━━━━━━━ 19%                   |   |
|   | 23:58:13  HTTP BR -> FR  [HTTP/L7]  24.5G             JP  ━━━━━━ 14%                      |   |
|   | 23:58:13  DNS  RU -> JP  [DNS/L4]   18.1G             GB  ━━━━ 9%                         |   |
|   |                                                                                           |   |
|   | BUFF: 35/35 // LATENCY: ~18MS                         SIGNAL SPECTRUM:                    |   |
|   | Filter: [ALL] [L4] [L7] [CRITICAL > 85G]              TCP/L4:  ━━━━━━━━━━━━ 46% (#00F0FF) |   |
|   |                                                       HTTP/L7: ━━━━ 16% (#FFFFFF)         |   |
|   |                                                       PEAK:    ━━━━ 12% (#FF3B30)         |   |
|   |                               [ PURE VOID 3D GLOBE ]                                      |   |
|   |                            (VECTOR OUTLINES + GRATICULE)                                  |   |
+---+-------------------------------------------------------------------------------------------+---+
| SCALE: 1:100M  |  PROJECTION: ORTHOGRAPHIC_VECTOR  |  ORIENTATION: [GLOBAL] [NA] [EMEA] [APAC]    |
+---------------------------------------------------------------------------------------------------+
```

---

## 🏛️ Deep-Dive Architecture Explanation

### 1. The Telemetry Challenge
Public DDoS intelligence providers (**Cloudflare Radar**, **NETSCOUT ATLAS**, **Shadowserver**) do not expose raw, sub-second packet-level streams because streaming millions of unmetered packet records would flood downstream consumers, compromise enterprise privacy, and leak defense capabilities. They instead publish **macro-level statistical aggregations** (e.g., Layer 3/4 vector breakdowns, Layer 7 HTTP DDoS distributions, top origin and target countries).

### 2. The Solution: Macro-to-Micro Stochastic Synthesis
This system bridges the telemetry gap by running a **continuous stochastic arrival engine**:
1. Background workers periodically poll live volumetric distributions and probabilities from **Cloudflare Radar** and verified botnet IPs from **AbuseIPDB**.
2. An asynchronous arrival worker synthesizes micro-events based on a **Non-Homogeneous Poisson Arrival Process** ($\lambda \in [2.5, 10.0]\text{ /sec}$) and a **Shifted Exponential Bandwidth Model** ($V \sim \text{Exp}(1/\mu) + V_{\text{floor}}$).
3. Country centroids are dynamically jittered ($\Delta_{\text{lat,lng}} \sim \mathcal{U}(-2.5^\circ, +2.5^\circ)$) to prevent trajectory collapse on large landmasses.
4. Live vector payloads are continuously pushed over WebSockets (`ws://host:8000/ws/threat-stream`) to an in-browser WebGL vector globe with zero-fill aerospace avionics telemetry overlays.

```
 +─────────────────────────────────────────────────────────────────────────+
 │                       External Telemetry Sources                        │
 +─────────────────────────────────────────────────────────────────────────+
       │ Cloudflare Radar REST API                  │ AbuseIPDB API
       │ (Origins, Targets, Vectors, Ratios)        │ (Blacklisted IPs, ASNs)
       ▼                                            ▼
 +─────────────────────────────────────────────────────────────────────────+
 │                FastAPI Threat Ingestion & Synthesizer Hub               │
 │                                                                         │
 │  ┌──────────────────────────────────────────────────────────────────┐  │
 │  │ 1. Radar Aggregation Cache Worker (Async Cron - Every 10m)      │  │
 │  └──────────────────────────────────┬───────────────────────────────┘  │
 │                                     ▼                                   │
 │  ┌──────────────────────────────────────────────────────────────────┐  │
 │  │ 2. Micro-Event Stochastic Synthesizer Engine                     │  │
 │  │    - Poisson Arrival Rate: λ ∈ [2.5, 10.0] /sec                  │  │
 │  │    - Volume (Gbps): Exponential distribution (μ=25, floor=1.5)   │  │
 │  │    - Source/Target Jitter: Δlat,lng ~ U(-2.5, 2.5)               │  │
 │  │    - AbuseIPDB Botnet Metadata Enrichment (IP, ASN, Botnet)      │  │
 │  └──────────────────────────────────┬───────────────────────────────┘  │
 │                                     ▼                                   │
 │  ┌──────────────────────────────────────────────────────────────────┐  │
 │  │ 3. WebSocket Connection Manager (Zero-Lag Broadcast Hub)         │  │
 │  └──────────────────────────────────┬───────────────────────────────┘  │
 +─────────────────────────────────────┼───────────────────────────────────+
                                       │ WebSocket (/ws/threat-stream)
                                       ▼
 +─────────────────────────────────────────────────────────────────────────+
 │                     Client Presentation Tier (React)                    │
 │                                                                         │
 │  ┌──────────────────────────────────────────────────────────────────┐  │
 │  │ WebSocket Ingestion Hook (Rolling Window Buffer: Max 35 Arcs)   │  │
 │  └──────────────┬───────────────────────────────────┬───────────────┘  │
 │                 ▼                                   ▼                  │
 │  ┌─────────────────────────────┐     ┌─────────────────────────────┐   │
 │  │ 3D Vector Wireframe Globe   │     │ Aerospace Avionics HUD      │   │
 │  │ - Three.js & ThreeGlobe     │     │ - Zero-fill hairline panels │   │
 │  │ - Hollow Continent Polylines│     │ - Live Event Stream & Logs  │   │
 │  │ - Celestial Graticule Mesh  │     │ - Target Concentration Flow │   │
 │  │ - Laser Trajectory Arcs     │     │ - Keybinds: G, R, H, SPACE  │   │
 │  │ - Large Seismic Shockwaves  │     │ - Sub-ms Tactile Audio Tick │   │
 │  └─────────────────────────────┘     └─────────────────────────────┘   │
 +─────────────────────────────────────────────────────────────────────────+
```

<div align="center">

Detailed architectural blueprint: [`assets/architecture.svg`](assets/architecture.svg)

</div>

---

## 🧮 Mathematical Formulations

### 1. Temporal Model: Poisson Arrival Process
DDoS packet bursts naturally follow a Poisson process. The inter-arrival interval $\Delta t$ between consecutive attack vectors follows an exponential distribution:

$$\Delta t \sim \text{Exponential}(\lambda) \implies \Delta t = -\frac{\ln(U)}{\lambda}, \quad U \sim \mathcal{U}(0, 1)$$

Where $\lambda \in [2.5, 10.0]\text{ /sec}$ fluctuates organically with a random-walk perturbation ($\delta_\lambda \sim \mathcal{U}(-0.4, 0.4)$) to emulate natural diurnal traffic waves.

### 2. Volumetric Model: Shifted Exponential Distribution
Network attack bandwidth exhibits heavy-tailed characteristics. While the bulk of attacks are small probe floods ($5\text{--}30\text{ Gbps}$), massive volumetric spikes occasionally surge beyond $100\text{--}300+\text{ Gbps}$:

$$V = V_{\text{floor}} + X, \quad X \sim \text{Exponential}\left(\frac{1}{\mu}\right)$$

* $V_{\text{floor}} = 1.5\text{ Gbps}$ (base volumetric baseline).
* $\mu = 25.0\text{ Gbps}$ (mean scale parameter).

### 3. Spatial Jitter & Geodesic Interpolation
To eliminate unnatural clustering at country centroid coordinates:

$$\text{lat}_{\text{actual}} = \text{lat}_{\text{centroid}} + \delta_{\text{lat}}, \quad \delta_{\text{lat}} \sim \mathcal{U}(-2.5^\circ, +2.5^\circ)$$
$$\text{lng}_{\text{actual}} = \text{lng}_{\text{centroid}} + \delta_{\text{lng}}, \quad \delta_{\text{lng}} \sim \mathcal{U}(-2.5^\circ, +2.5^\circ)$$

The 3D arc altitude $h$ is dynamically computed from the Great-Circle angular distance $\theta$ on the sphere:

$$\theta = 2 \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)} \right)$$
$$h = 0.10 + 0.36 \times \left(\frac{\theta}{\pi}\right)$$

---

## 🎯 Signal Spectrum & Color Semantics

| Vector / Signal | Layer | Visual Hex | Operational Meaning |
| :--- | :--- | :--- | :--- |
| **SYN Flood / UDP / DNS** | L3/L4 | `#00F0FF` | Transport layer volumetric exhaustion / reflection flood |
| **HTTP Flood / DDoS** | L7 | `#FFFFFF` | Application layer high-frequency request flood |
| **Critical Peak Surge** | Any | `#FF3B30` | Critical hyper-volumetric burst ($> 85\text{ Gbps}$) |
| **System Heartbeat** | Status | `#00FF66` | Active WebSocket ingest telemetry link |

---

## ⌨️ Interactive Controls & Keybinds

| Keybind | Control | Description |
| :---: | :--- | :--- |
| **`[SPACE]`** | **Rotation Toggle** | Play or pause continuous celestial polar rotation of the globe |
| **`[G]`** | **Graticule Toggle** | Show / hide 3D latitude parallels and longitude meridians cage |
| **`[R]`** | **Polar Reset** | Smoothly return the 3D camera to default orbit `[0, 0, 320]` |
| **`[H]`** | **Clean Wallpaper** | Hide all HUD panels for distraction-free full-canvas vector visualization |
| **`[NA]` `[EMEA]` `[APAC]`** | **Regional Presets** | Instant regional orientation jump buttons on the bottom status bar |
| **Hover Arc** | **Isolation Mode** | Hovering any feed entry dims other arcs to 4% opacity and highlights the target vector |

---

## 🚀 Quickstart

### Prerequisites
* Python 3.10+ (or Docker)
* Node.js 18+ and npm

---

### Option 1: Local Development

#### 1. Start the FastAPI Backend Gateway
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
* Backend API: `http://localhost:8000`
* WebSocket Stream: `ws://localhost:8000/ws/threat-stream`
* OpenAPI / Swagger Docs: `http://localhost:8000/docs`

#### 2. Start the React + Three.js Frontend
```bash
cd frontend

# Install dependencies
npm install

# Run Vite dev server
npm run dev
```
Open [`http://localhost:3000`](http://localhost:3000) (or `http://localhost:3001`).

---

### Option 2: Docker Compose

Spin up the entire stack with a single command:
```bash
docker compose up --build
```
* **Frontend Web Dashboard**: `http://localhost:3000`
* **FastAPI Backend**: `http://localhost:8000`

---

## ⚙️ Environment Variables (Optional)

Configure `backend/.env` (optional — works completely out of the box with zero external dependencies):

```ini
# External Threat Telemetry API Keys (Optional - fallbacks to empirical baseline if omitted)
CLOUDFLARE_API_TOKEN=your_cloudflare_token_here
ABUSEIPDB_API_KEY=your_abuseipdb_key_here

# Stochastic Engine Parameters
POISSON_MIN_RATE=2.5
POISSON_MAX_RATE=10.0
EXP_VOLUME_MU=25.0
VOLUME_FLOOR=1.5
GEO_JITTER_RANGE=2.5
RADAR_CACHE_TTL_SEC=600
```

---

## 📡 WebSocket Payload Specification

```json
{
  "order": 1081,
  "startLat": 52.0372,
  "startLng": 9.5483,
  "endLat": 38.9306,
  "endLng": -96.0449,
  "arcAlt": 0.262,
  "color": "#00F0FF",
  "meta": {
    "id": "atk_660b1093",
    "timestamp": 1793370097756,
    "vector": "SYN Flood",
    "protocol": "TCP/L4",
    "volumeGbps": 142.8,
    "src": "DE",
    "srcCountryName": "Germany",
    "dst": "US",
    "dstCountryName": "United States",
    "targetIndustry": "Telecommunications",
    "srcIp": "167.86.99.21",
    "asn": "AS51167 CONTABO",
    "botnet": "Mantis-Proxy"
  }
}
```

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.
