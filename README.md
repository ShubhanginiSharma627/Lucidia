# Lucidia — Intelligent Spaced Revision Calendar & 3D Cognitive Vault

> **Empowering lifelong learners with mathematical spacing curves, AI-guided memory audits, and interactive 3D WebGL achievements.**

---

## 🌟 Overview

**Lucidia** is a full-stack, spaced repetition learning platform built around Hermann Ebbinghaus’s forgetting curve formula ($R = e^{-t/S}$). It balances academic scheduling, active recall tracking, and gamified cognitive rewards.

Whether studying complex algorithms, neuroanatomy, or historical chronologies, Lucidia calculates the exact optimal review window before memory decay accelerates, while celebrating your consolidation milestones with interactive 3D trophies in a real-time Three.js vault.

---

## ✨ Key Features

### 📅 1. Spaced Revision Calendar & Agenda
- **Algorithmic Review Scheduling**: Computes next-due dates using four recall ratings:
  - `Again` (1): Immediate reset to Stage 1 for concepts requiring re-learning.
  - `Hard` (2): Slower interval expansion with increased difficulty weighting.
  - `Good` (3): Standard spacing expansion based on subject stability.
  - `Easy` (4): Accelerated consolidation bonus for rapid recall.
- **Dual-Pane Tablet & Mobile Layout**:
  - Tablet (768px–1024px): Side-by-side split featuring the interactive monthly calendar on the left and selected date agenda with quick-log actions on the right.
  - Mobile (<768px): Responsive calendar grid with expandable day agenda drawer, slide-out navigation menu, and touch-optimized buttons.
  - Desktop: Expanded view with category filters, overdue badges, and instant revision booking.

### 🏆 2. 3D Trophy Vault (Three.js WebGL)
- **7 Procedural Composite Artifacts**:
  - *The Synaptic Spark*: Concentric counter-rotating gimbals embracing an ionized core.
  - *The Memory Prism*: Octahedral crystal suspended within stabilization brackets.
  - *The Chrono Compass*: Dual astrolabe chapter rings with a magnetic directional needle.
  - *The Neuro-Lattice*: 12-node icosahedral polyhedral matrix with strut cylinders.
  - *The Feynman Monolith*: Tapered obelisk with gold inlay runic channels and quantum halo.
  - *The Polymath Sphere*: Tri-orbital armillary rings with cardinal node spheres.
  - *The Celestial Synapse*: Multi-tier floating magnetic discs crowned by an apex spire.
- **PBR Materials & Studio Lighting**:
  - 5 Unlockable Finishes: *Obsidian Titanium*, *Celestial Aurum (Gold)*, *Iridescent Chromium*, *Emerald Neuro-Crystal*, and *Starlight Platinum*.
  - 4 Custom 3D Pedestals: *Minimal Deep Slate*, *Levitating Obsidian*, *Cybernetic Lattice*, and *Golden Solarium*.
  - Soft procedural radial contact shadows and real-time reflections via `PMREMGenerator` and `RoomEnvironment`.
  - Orbit controls with momentum damping, zoom bounds, reset camera, and auto-rotation toggle.
  - Software WebGL detection guard (`detectSoftwareGl`) for low-power or virtualized devices.

### ⚡ 3. Synaptic Token Economy & Milestones
- **Earn Tokens on Every Revision**:
  - Base completion rewards (`+15 ⚡`).
  - Recall quality bonuses (`+10` for Good, `+15` for Easy).
  - Consecutive streak multipliers (`3+ days`).
  - Mastery leap bonuses (`+100 ⚡` when reaching $\ge 30$-day intervals).
- **Gamification Progression**:
  - Tier titles: *Synaptic Initiate* $\rightarrow$ *Memory Apprentice* $\rightarrow$ *Consolidation Adept* $\rightarrow$ *Ebbinghaus Scholar* $\rightarrow$ *Neuro-Architect* $\rightarrow$ *Cognitive Ascendant*.
  - Trophy Vault Shop: Spend earned tokens to unlock metallic finishes and pedestal styles.
  - Real-time achievement unlock celebratory banner with 1-click inspection in the 3D Vault.

### 🧠 4. AI Cognitive Learning Intelligence
- **Longitudinal Trend Visualizer**: Responsive 7-day and 14-day study volume and accuracy trend curves without font or axis distortion.
- **Theoretical Ebbinghaus Decay Simulator**: Real-time plots of retention decay curves across stages 1 through 3 ($R = e^{-t/S}$).
- **Gemini-Powered Audits**: Analyzes study logs to identify retention anomalies, detect subjects plateauing, and recommend customized revision schedule multipliers.

### ☁️ 5. Cloud Sync & Authentication
- **Firebase Firestore Live Sync**: Instant multi-device sync for categories, subjects, custom revision schedules, and logs.
- **Google OAuth**: One-click authentication with user profile avatar and sync indicator.
- **Offline Resilience**: LocalStorage fallback mechanism ensures zero disruption when offline.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 18, TypeScript, Vite |
| **Styling & Design** | Tailwind CSS, Lucide React Icons |
| **3D Graphics Engine** | Three.js (`three`), WebGL PBR, OrbitControls |
| **Backend / Proxy** | Node.js, Express (`server.ts`), tsx |
| **AI Integration** | Google Gemini API (`@google/genai`) |
| **Database & Auth** | Firebase Firestore, Firebase Authentication |

---

## 📁 Project Structure

```
├── server.ts                    # Full-stack Express server with Gemini AI API proxy routes
├── vite.config.ts               # Vite configuration with React plugin and server proxy
├── metadata.json                # AI Studio application metadata and capabilities
├── package.json                 # Dependencies and build scripts
├── src/
│   ├── main.tsx                 # React entry point
│   ├── index.css                # Global styles and Tailwind directives
│   ├── types/
│   │   └── index.ts             # TypeScript definitions (Subject, Schedule, Achievement, etc.)
│   ├── services/
│   │   ├── firebase.ts          # Firebase SDK initialization, Auth, and Firestore sync
│   │   ├── spacedRepetition.ts  # Ebbinghaus algorithm, stability calculations, and dates
│   │   ├── gamification.ts      # Token calculations, level tiers, achievements, and shop
│   │   ├── storage.ts           # LocalStorage fallback persistence
│   │   └── gemini.ts            # Client-side AI audit calls to backend proxy
│   └── components/
│       ├── Header.tsx           # Responsive navigation bar with token pill & user profile
│       ├── MobileNavDrawer.tsx  # Opaque slide-out mobile drawer with quick actions
│       ├── RevisionCalendar.tsx # Interactive calendar, tablet side-by-side split, & agenda
│       ├── SubjectCategoryManager.tsx # Subject & category management with interval presets
│       ├── CustomScheduleManager.tsx  # Custom spaced interval curve designer
│       ├── AIStatisticsDashboard.tsx  # Longitudinal 7D/14D charts & Ebbinghaus simulator
│       ├── TrophyVault3D.tsx    # Three.js 3D Trophy Vault with collapsible control dock
│       ├── LogSessionModal.tsx  # Session logging modal with live token reward preview
│       ├── NeuralCanvas.tsx     # Animated particle background effect
│       └── three/
│           └── TrophyArtifactMeshes.ts # 7 procedural composite 3D models & PBR materials
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm installed on your workstation.
- A Google Gemini API key (set in your environment as `GEMINI_API_KEY`).

### Installation

1. **Clone or navigate to the workspace**:
   ```bash
   git clone <repository-url>
   cd lucidia
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API key:
   ```env
   GEMINI_API_KEY="your-gemini-api-key-here"
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   The application will be running at [http://localhost:3000](http://localhost:3000).

5. **Build for production**:
   ```bash
   npm run build
   ```

---

## 🧮 Mathematical Model: Ebbinghaus Spacing

The retention probability $R(t)$ at elapsed time $t$ is calculated via:

$$R(t) = e^{-\frac{t}{S}}$$

Where:
- $t$: Days elapsed since the previous revision.
- $S$: Synaptic Stability factor (measured in days). Stability increases with successful retrieval practice.
- Interval progression dynamically adjusts based on user recall ratings ($q \in \{1, 2, 3, 4\}$):
  $$I_{n} = I_{n-1} \times \text{Factor}(q, D)$$
  Where $D$ is the subjective difficulty rating and Factor ranges between $1.2\times$ and $2.5\times$ for sustained retention.

---

## 📄 License

Distributed under the MIT License. Built with ❤️ for accelerated learning and cognitive mastery.
