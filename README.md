# 🚚 TransitOps — Full Stack Fleet Management Platform

> A production-grade, full-stack fleet management and dispatching platform built with React, Node.js, Express, PostgreSQL, Prisma, and React Leaflet.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-blue)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.x-blueviolet)](https://www.prisma.io/)

---

## The Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Database Design](#-database-design)
- [Folder Structure](#-folder-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Overview](#-api-overview)
- [Authentication & Authorization](#-authentication--authorization)
- [Interactive Map Flow](#-interactive-map-flow)
- [Role Guide](#-role-guide)
- [Known Limitations](#-known-limitations)
- [Future Improvements](#-future-improvements)
- [Contributing](#-contributing)

---

## 🌐 Overview

**TransitOps** is a feature-rich, production-ready fleet management and intelligence platform that controls the complete lifecycle of corporate logistics, dispatching operations, and resource planning:

- Fleet Managers oversee vehicles, logs, expenses, and driver stats.
- Dispatchers coordinate routes, geocode stops, and track real-time trip states.
- Safety Officers verify safety scores, review audit logs, and monitor driver alerts.
- Financial Analysts compute operational metrics, fuel efficiency, and maintenance expenditure.
- Drivers complete trips, log actual odometers, and view routes.
- Built-in multi-lingual Google Translate switcher headlessly matches locales (English, Gujarati, Hindi).
- A 3D Hyperspeed space background wraps the landing page entry flow.

---

## ✨ Features

### 🏢 Fleet Manager
- Dynamic welcome dashboard detailing overall fleet utilization percentages.
- Track active, available, and in-shop vehicles in real-time.
- Promote, suspend, or update driver registry status.
- Generate and download PDF organization and fleet status reports.

### 🗺️ Dispatcher
- Draft, dispatch, and cancel trips in a single workflow.
- Interactive Route Map using **React Leaflet** with geocoding via OpenStreetMap's Nominatim and OSRM-based routing paths.
- Status-based map styling (green for Completed, blue for Dispatched, dashed-purple for Drafts).

### 🛡️ Safety Officer & Driver
- Monitor driver safety scores and log driver detail states.
- Automated email reminders for expiring licenses using nodemailer.
- Immutable write-ahead audit logging mapping every single state transition in a transactional unit.

### 📊 Financial Analyst
- Interactive animated SVG donut charts mapping fleet status allocations.
- Fuel cost analytics charting liters and spending trends.
- Log maintenance logs, toll costs, and misc expenses per vehicle.

---

## 🛠️ Tech Stack

### Frontend (`frontend`)

| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| Vite | Build tool & dev server |
| React Router | Client-side routing |
| React Leaflet | Interactive Leaflet maps |
| Three.js | 3D space rendering for Hyperspeed |
| postprocessing | Advanced post-processing shaders |
| Tailwind CSS | Utility styling framework |

### Backend (`backend`)

| Technology | Purpose |
|---|---|
| Node.js + Express | Web framework & API |
| Prisma ORM | Type-safe database mapping |
| PostgreSQL | Relational database |
| Zod | Route input validator schema |
| JWT | Stateless authentication |
| bcrypt | Secure password hashing |
| Nodemailer | Transactional email notifications |

---

## 🏗️ System Architecture

### High-Level Overview

```
┌─────────────────────────────┐
│    Frontend (React/Vite)    │
│  Leaflet │ Tailwind │ Three │
└────────────┬────────────────┘
             │ HTTP/REST
┌────────────▼────────────────┐
│   Backend API (Express/JS)  │
│  Routes │ Middleware │ Controllers │
└────────────┬────────────────┘
             │ Prisma ORM
┌────────────▼────────────────┐
│      PostgreSQL Database    │
└─────────────────────────────┘
             │
┌────────────▼────────────────┐
│   External Services         │
│   Nominatim   │   OSRM      │
└─────────────────────────────┘
```

### Request Lifecycle

```
Client Request
   ↓
Route Layer          ← Express Router
   ↓
Middleware           ← authenticate → authorize (RBAC) → validate (Zod)
   ↓
Controller           ← Handles HTTP request/response
   ↓
Prisma ORM           ← Transactional database queries
   ↓
PostgreSQL           ← Relational store
   ↓
HTTP Response
```

### Architecture Philosophy

- **Transactional Consistency** — Write-ahead state transitions and Audit Logs execute in a single database transaction.
- **Client Separation** — Client handles visualization (Leaflet / charts); backend verifies all business validation.
- **Role-based routing** — Client permissions dynamically disable elements based on user role assignments.

---

## 🗄️ Database Design

### Core Entities

| Entity | Description |
|---|---|
| `User` | User credential profile linked to a single role |
| `Role` | RBAC Role mapping (e.g. FLEET_MANAGER) |
| `Permission` | Actions permitted on specific resources |
| `Vehicle` | Fleet vehicles and odometer tracking |
| `Driver` | Driver licensing and safety score logs |
| `Trip` | Source, destination, and status-based dispatch logs |
| `MaintenanceLog` | Record of vehicle maintenance costs and intervals |
| `FuelLog` | Fuel consumption liters and logs |
| `Expense` | General tolls and trip expenses |
| `AuditLog` | State logs tracking action transitions |
| `Organization` | Enterprise workspace accounts |

### Key Relationships

```
User ──────────────► Role ◄─── RolePermission ───► Permission
Trip ──────────────► Vehicle
Trip ──────────────► Driver
Vehicle ───────────► MaintenanceLog / FuelLog / Expense
AuditLog ──────────► Tracks entity states per User
```

---

## 📁 Folder Structure

### Frontend (`frontend`)

```
frontend/
├── public/                   # Static assets (logo, favicon)
└── src/
    ├── api/                  # Axios clients and headless connectors
    ├── components/           # Reusable components
    │   ├── Hyperspeed/       # 3D Landing Page component
    │   ├── TripRouteMap/     # Interactive routing map components
    │   └── LanguageSwitcher/ # Headless Google Translate toggles
    ├── config/               # RBAC Permissions mappings
    ├── context/              # Auth / Theme state providers
    ├── pages/                # Route pages (Dashboard, Trips, Drivers, etc.)
    ├── App.jsx               # Application router mapping
    └── index.css             # Tailwind imports & override sheets
```

### Backend (`backend`)

```
backend/
├── prisma/
│   └── schema.prisma         # Prisma schema definitions
└── src/
    ├── controllers/          # Route controller handlers
    ├── middleware/           # Auth, RBAC, and Zod validator middlewares
    ├── routes/               # API Router configurations
    ├── services/             # Emailing and cron schedules
    └── utils/                # Helper utilities
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **Docker & Docker Compose** (for running PostgreSQL)
- **npm** or **yarn**

---

### 1. Clone the Repository

```bash
git clone <repo-url>
cd Transitops
```

---

### 2. Run Database Services

```bash
cd backend
# Starts PostgreSQL database container
docker compose up -d
```

---

### 3. Install Dependencies

```bash
# Backend
npm install

# Frontend
cd ../frontend
npm install
```

---

### 4. Setup Prisma Database Schema

```bash
cd ../backend
npx prisma db push
npx prisma db seed
```

---

### 5. Start the Development Servers

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd ../frontend
npm run dev
```

The app will be accessible at the Local URL printed by Vite (typically `http://localhost:5173`).

---

## 🔧 Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/transitops?schema=public"
JWT_SECRET="transitops-jwt-secret-key-12345"
JWT_EXPIRES_IN="8h"
PORT=3000
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3000
```

---

## 📡 API Overview

All API routes are prefixed with `/api`.

| Module | Base Path | Description |
|---|---|---|
| Auth | `/api/auth` | Login and signup controllers |
| Dashboard | `/api/dashboard` | Fleet KPIs and allocation stats |
| Driver | `/api/driver` | Driver operations and licensing |
| Trip | `/api/trip` | Dispatch, routing, and completions |
| Vehicle | `/api/vehicle` | Vehicle registry management |
| Maintenance | `/api/maintenance` | Maintenance schedules and logs |
| Fuel | `/api/fuel` | Fuel transactions and history |

---

## 🔐 Authentication & Authorization

### Authentication

- Stateless authentication using **JSON Web Tokens (JWT)**.
- Passwords encrypted using **bcrypt**.
- Authentication headers attached as `Authorization: Bearer <token>`.

### Roles & RBAC

The system enforces strict Role-Based Access Control:
- **`FLEET_MANAGER`** — Unrestricted system read/write access.
- **`DISPATCHER`** — Coordinate and dispatch routes.
- **`SAFETY_OFFICER`** — Review audit logs and verify compliance.
- **`FINANCIAL_ANALYST`** — Access financial, fuel, and expense reports.
- **`DRIVER`** — Complete assigned trips.

---

## 🗺️ Interactive Map Flow

TransitOps visualizes logistics routing live using Leaflet:

```
1. Dispatcher selects a Trip card in Details
                        ↓
2. Geocoding request translates Source/Destination strings to coordinates
                        ↓
3. OSRM Routing service computes optimal driving polyline
                        ↓
4. Map overlays Start/End custom markers with tooltips
                        ↓
5. Polyline color adapts based on Trip status
   (Green = Completed, Blue = Dispatched, Dashed Purple = Draft)
```

---

## 🎓 Role Guide

### As a Fleet Manager
1. Access the dashboard to view the welcome summary and fleet KPIs.
2. Navigate to `/fleet` or `/drivers` to add or suspend records.
3. Export PDF summaries from the Reports section.

### As a Dispatcher
1. Select a trip from `/trips` list.
2. View geocoded routes and status updates directly in the slide-out Trip Route panel.
3. Click "Dispatch" to transition trip states.

### As a Safety Officer
1. Access `/drivers` to check Safety Score indexes.
2. Review automated warnings for upcoming driver license expiries.

---

## ⚠️ Known Limitations

- **No refresh token cycle** — Session tokens expire after 8 hours requiring re-authentication.
- **No vector tiling** — Large maps render using standard Leaflet raster image layers.
- **Auditing performance** — Audit logs write synchronously within transactions.

---

## 🔮 Future Improvements

- [ ] **Real-time GPS tracking** — WebSocket connection for live telemetry updates.
- [ ] **Offline Maps** — Vector map caching for offline terminal operations.
- [ ] **License Scanning** — OCR processing for automatic license registry entry.
- [ ] **Fuel Card API** — direct sync with gas station providers.

---

## 🤝 Contributing

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature-name`
3. Commit your changes following modular layout structures
4. Push your branch and open a Pull Request

---

> Built as an enterprise full-stack fleet logistics management application.
