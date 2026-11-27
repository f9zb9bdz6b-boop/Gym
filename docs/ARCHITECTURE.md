# Architecture

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 (dark-first `#09090b` base, `#121215` cards, `#a3e635` lime accent)
- **State**: Zustand (`useAppStore` for navigation/UI/toasts, `useWorkoutStore` for live workout timers) + `dexie-react-hooks` (`useLiveQuery`) for reactive local DB queries
- **Database**: IndexedDB via Dexie.js (`src/db/database.ts`) with a clean repository layer (`src/db/repositories/*`)
- **PWA**: `vite-plugin-pwa` with Workbox precaching and auto-update service worker
