# GYM APP — Personal Fitness Operating System

An offline-first, 100% local personal fitness management web application built with React, TypeScript, Tailwind CSS, Dexie.js (IndexedDB), Recharts, and Vite PWA.

## Key Features
- **100% Local & Private**: All data is stored in your browser's IndexedDB. No cloud database, no accounts, no telemetry.
- **PWA & Offline-First**: Installable on desktop and mobile with full offline workout and food logging.
- **Workout System**: Predefined splits (PPL, Upper/Lower, Full Body, Bro Split), searchable 12-muscle-group Exercise Library, Live Workout Logger with rest timer, auto-save, previous-performance comparison, and automatic PR detection.
- **Nutrition System**: 6-meal daily tracker, verified/estimated food database (including Indian foods), custom food creation, and 11 fitness calculators (Mifflin-St Jeor BMR, TDEE, macros, BMI, hydration, weight progression).
- **Progress & Analytics**: Interactive Recharts visualizations for body weight, training volume, and nutrition trends.
- **AI Fitness Assistant**: Local deterministic offline engine with meal parsing and explicit confirmation before saving, plus optional configurable external/local LLM endpoints with explicit user consent.
- **Backup & Restore**: Full JSON export, schema validation, and restore.

## Run Locally
```bash
npm install
npm run dev
```

## Run Tests
```bash
npx vitest run
```

## Production Build
```bash
npm run build
```
Deploy the `dist/` directory to any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages).
