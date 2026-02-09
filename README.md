# Life-Safety-Laboratories

Virtual Safety Lab — BJD theory, practice and interactive labs on the subject "Safety of Life Activity".

## Getting Started

### Prerequisites
- Node.js 16+ and npm

### Installation

```bash
npm install
```

### Running

```bash
npm start
```

Opens [http://localhost:3000](http://localhost:3000) in the browser.

### Building for Production

```bash
npm run build
```

## Features

- **Main Menu** — Landing page with navigation
- **Theme Selection** — Choose from multiple safety topics (Light on a Sphere, Falling Object, Electrical Safety)
- **Theme Content** — Step-through theory text and interactive 3D demonstrations with a progress stepper
- **Test Page** — Multiple-choice quiz; requires ≥70% to unlock the lab
- **Interactive Lab** — 3D physics simulation with adjustable parameters (height, mass), real-time energy calculations, and hazard level display

## Tech Stack

- React 18 with React Router v6
- Three.js via React Three Fiber & Drei
- Material-UI (MUI) for UI components
- React Context for state management
