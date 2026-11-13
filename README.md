# Lucidia — Spaced Repetition, Custom Revision Schedules & 3D Trophy Vault

> **A neuroscience-backed spaced repetition platform combining Ebbinghaus forgetting-curve modeling, multi-category subject planning, custom step-interval curves, Gemini AI cognitive audits, and an interactive Three.js 3D Trophy Vault.**

---

## Overview

**Lucidia** helps learners schedule, track, and optimize long-term knowledge retention around Hermann Ebbinghaus’s forgetting curve formula ($R = e^{-t/S}$). It pairs an interactive spaced revision calendar and custom interval engine with real-time Firebase cloud synchronization, AI-driven retention diagnostics, and a gamified WebGL trophy vault.

---

## Key Features

### 1. Spaced Revision Calendar & Agenda
- **Four-Tier Recall Rating Engine**:
  - **Again (`1`)**: Resets stage and contracts the interval based on the schedule's lapse retention percentage.
  - **Hard (`2`)**: Modest spacing growth with increased difficulty weighting.
  - **Good (`3`)**: Standard interval expansion along your active curve or custom step sequence.
  - **Easy (`4`)**: Accelerated interval jump with an ease bonus.
- **Responsive Multi-Viewport Layout**:
  - **Desktop & Tablet (`768px+`)**: Side-by-side split with the interactive monthly calendar on the left and selected date agenda & session logger on the right, plus a compact top navigation bar.
  - **Mobile (`<768px`)**: Touch-optimized calendar dots, expandable day inspector, and slide-out navigation drawer with quick actions.
- **Multi-Category Filtering**: Filter scheduled subjects across Calendar, Subjects, and AI Analytics simultaneously using multi-select category checkboxes.

### 2. Multi-Category Subjects & 12-Color System
- **Multi-Category Assignment**: Assign one or multiple academic categories to any subject, with primary category designation and inline quick-add category creation inside the subject modal.
- **12-Color Accent Palette**: Curated 12-color swatch picker (*Indigo, Emerald, Amber, Violet, Rose, Sky, Cyan, Teal, Orange, Fuchsia, Lime, Pink*) available for both **Categories** (create & edit) and **Subjects** (custom override or **Auto** inheritance from the primary category).
- **Safe Category Deletion**: Removing one category from a multi-category subject preserves the subject under its remaining categories rather than deleting it.

### 3. Custom Revision Schedules & Interval Sequences
- **4 Built-In Presets**:
  - *Lucidia Adaptive (SM-2+)*
  - *Exam Sprint (Aggressive Focus)*
  - *Long-Term Mastery (Gradual Curve)*
  - *FSRS Cognitive Decay Model*
- **Custom Step Interval Sequence (Days)**: Define explicit day ladders (e.g., `1, 3, 7, 14, 30, 60, 120`) with a dedicated **Custom Steps Active** toggle, live parsed stage tags, and an 8-stage progression bar simulator.
- **Automatic Subject Synchronization**: Editing a schedule or reassigning a subject/category automatically recalculates assigned subjects' active stage intervals and next revision dates anchored to their latest review, and syncs updates to Firestore.

### 4. AI Cognitive Learning Intelligence
- **7-Day & 14-Day Longitudinal Charts**: Tracks daily revision volume (bars) and recall accuracy percentage (glowing trend line) filtered by one or more categories.
- **Ebbinghaus Decay Simulator**: Visualizes memory decay curves across consolidation stages ($R = e^{-t/S}$).
- **Gemini Cognitive Audit (`/api/ai/analyze-progress`)**: Server-side Gemini analysis evaluates subject progress and revision logs to surface cognitive load risk, subject-specific recommendations, and tunable schedule multiplier suggestions.

### 5. Gamified 3D Trophy Vault (Three.js WebGL)
- **7 Procedural 3D Artifacts**: *The Synaptic Spark*, *The Memory Prism*, *The Chrono Compass*, *The Neuro-Lattice*, *The Feynman Monolith*, *The Polymath Sphere*, and *The Celestial Synapse*.
- **Synaptic Token Economy**: Earn tokens from logged revisions, streak multipliers, and 30+ day mastery leaps to unlock **5 metallic/crystal finishes** and **4 pedestal styles**.
- **Interactive Studio Renderer**: Real-time PBR reflections (`RoomEnvironment` + `PMREMGenerator`), `OrbitControls` with camera reset and auto-rotate, and automatic software-GL fallback guarding.

### 6. Cloud Sync & Offline Resilience
- **Google Sign-In & Firestore Live Sync**: Real-time synchronization for categories, subjects, custom schedules (merged cleanly with built-in presets), and revision logs, backed by `firestore.rules` and `firebase-blueprint.json`.
- **LocalStorage Fallback**: Seamless offline persistence so schedules and subjects continue working without interruption.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 8 |
| **Styling & UI** | Tailwind CSS v4, Lucide React Icons, Motion |
| **3D Graphics** | Three.js (`three`), OrbitControls, RoomEnvironment PBR |
| **Backend Server** | Node.js, Express 4 (`server.ts`), `tsx` |
| **AI Integration** | Google GenAI SDK (`@google/genai`) |
| **Database & Auth** | Firebase Authentication, Cloud Firestore |

---

## Project Structure

```
├── server.ts                         # Express server + Vite dev middleware + Gemini API proxy
├── vite.config.ts                    # Vite React & Tailwind CSS v4 configuration
├── metadata.json                     # App metadata and capabilities
├── firebase-blueprint.json           # Firestore schema definitions
├── firebase-applet-config.json       # Firebase project & Firestore database config
├── firestore.rules                   # Firestore security rules
├── package.json                      # Dependencies and npm scripts
└── src/
    ├── main.tsx                      # React 19 entry point
    ├── App.tsx                       # Root state, Firestore sync, & schedule reconciliation
    ├── index.css                     # Tailwind CSS v4 entry & theme styles
    ├── types/
    │   └── index.ts                  # TypeScript interfaces (Subject, Category, Schedule, etc.)
    ├── services/
    │   ├── colors.ts                 # 12-color palette & multi-category resolution helpers
    │   ├── firebase.ts               # Firebase Auth & Firestore real-time sync helpers
    │   ├── gamification.ts           # Synaptic tokens, level tiers, achievements, & shop
    │   ├── spacedRepetition.ts       # Spacing engine, simulator, & stage recalculation
    │   └── storage.ts                # LocalStorage persistence with preset merging
    └── components/
        ├── Header.tsx                # Top navigation bar, token counter, & Google Sign-In
        ├── MobileNavDrawer.tsx       # Slide-out mobile navigation drawer & quick actions
        ├── MultiCategorySelect.tsx   # Multi-select category filter popover
        ├── RevisionCalendar.tsx      # Monthly revision calendar & day agenda inspector
        ├── SubjectCategoryManager.tsx# Subject/category CRUD, 12-color pickers, & filtering
        ├── CustomScheduleManager.tsx # Schedule editor, custom step ladder, & progression sim
        ├── AIStatisticsDashboard.tsx # 7D/14D analytics, decay curves, & Gemini cognitive audit
        ├── TrophyVault3D.tsx         # Interactive Three.js 3D trophy viewer & token shop
        ├── LogSessionModal.tsx       # Study session logger with interval & token previews
        ├── NeuralCanvas.tsx          # Subtle animated neural particle backdrop
        └── three/
            └── TrophyArtifactMeshes.ts # Procedural 3D artifacts, pedestals, & PBR materials
```

---

## Getting Started

### Prerequisites
- **Node.js 18+** and **npm**
- A **Google Gemini API key** (for server-side AI cognitive audits)

### Setup & Commands

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Copy `.env.example` to `.env` and set your Gemini API key:
   ```bash
   cp .env.example .env
   ```
   ```env
   GEMINI_API_KEY="your-gemini-api-key-here"
   ```

3. **Run the development server** (Express + Vite on port `3000`):
   ```bash
   npm run dev
   ```

4. **Type-check & lint**:
   ```bash
   npm run lint
   ```

5. **Build & run for production**:
   ```bash
   npm run build
   npm start
   ```

---

## Mathematical Model: Ebbinghaus Retention

Current recall probability $R(t)$ after $t$ elapsed days is modeled as:

$$R(t) = e^{-\frac{t}{S}}$$

Where:
- $t$: Days elapsed since the subject's most recent revision.
- $S$: Synaptic stability (in days), updated on each recall evaluation or custom schedule progression.
- When **Custom Steps** is active, `Good` reviews advance deterministically along your configured `customStepsLadder` ($S_1, S_2, \dots, S_k$) before extrapolating via your interval multiplier up to `maximumInterval`.

---

## License

MIT License
