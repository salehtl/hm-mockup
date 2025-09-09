# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Happiness Meter Scoring Dashboard POC** - a React-based web application that demonstrates scoring logic and analyst UX using mock data. The project implements an EntityScore calculation system with Channel Score → Service Scores → Entity aggregation, including DCX (Digital Customer Experience) cascading and Type-2 service splits.

**Target audience:** CX Design & Analytics (analysts, designers, FE developers)

## Development Commands

The project uses a Makefile for common operations, with conditional Node.js support:

```bash
make setup    # Install dependencies (npm ci if package.json exists)
make start    # Start dev server (npm run dev if available)  
make test     # Run tests (npm test if available)
make fmt      # Format code (npm run fmt if available)
make lint     # Lint code (npm run lint if available)
make clean    # Remove build artifacts (node_modules, .cache, dist)
```

## Tech Stack

- **Frontend:** React + Vite, TailwindCSS, shadcn/ui, Apache ECharts + echarts-for-react, TanStack Table, Zod
- **Mock API:** json-server serving db.json from /data directory
- **Development:** Node.js 20 (configured in devcontainer)

## Architecture & Key Components

### Data Model Structure
The application works with these main entities via json-server:
- **entities** - Top-level business units
- **services** - Type-1 (single score) or Type-2 (Process + Deliverable phases)  
- **channels** - Apps, web portals, service centers
- **booths** - Individual booths within service centers
- **dcx** - Digital Customer Experience journeys linking services
- **serviceReviews** - Review data with channel-of-review attribution
- **channelRatings** - Channel performance ratings
- **dcxReviews** - End-to-end journey scores

### Core Calculation Logic
Implement as pure functions in `/src/calculations/`:

1. **EntityScore = 0.70 × EntityServiceScore + 0.30 × EntityChannelScore**
2. **Channel scoring:** App (50%), Web (20%), Service Center (30%) with weight redistribution
3. **Service scoring:** Type-1 uses channel-of-review weights; Type-2 uses 80% Process + 20% Deliverable  
4. **DCX cascade:** DCX scores distributed evenly across member services, then blended 70% Standalone + 30% DCX

### UI Views
- **Overview:** Executive KPI cards, trend lines, worst performers, channel mix
- **Services:** Service comparison table with drill-down panels for Type-2 breakdown and DCX influence
- **Channels:** Channel performance grids, asset inventories, booth-level details

### Golden Numbers Validation
With the seed data, the calculations should produce:
- EntityChannelScore = 59.50
- EntityServiceScore = 78.45  
- EntityScore = 72.77

## Directory Structure (Planned)
```
/data/db.json           # json-server mock data
/src/calculations/      # Pure scoring functions
/src/components/        # shadcn/ui wrappers, Chart components
/src/pages/            # Overview, Services, Channels views
/src/store/            # Query hooks, selectors
```

## Development Notes

- All calculations maintain full precision internally, display rounded to 2 decimals
- Charts use ECharts with interactions (zoom, brush, drill-down hints)
- Basic i18n scaffolding included (en→ar strings, RTL toggle)
- Accessibility target: WCAG 2.2 AA (contrast ≥4.5, focus rings, keyboard operability)
- Performance target: <2s initial load, <100ms chart updates