# LOGH Implementation Roadmap & Verification Plan

This document outlines the step-by-step plan to transform the current frontend into the "Gin7" specification.

## Phase 1: Foundation & Routing
- [x] **Route Setup**: Create `src/app/game/strategy`, `src/app/game/tactics`, `src/app/game/office`.
- [x] **Layout Implementation**: Update `GameAppShell.tsx` to include the "Job Authority Card" dock and System Icons (Mail, Info, Settings).
- [x] **State Store**: Create `src/stores/gameStore.ts` (Zustand) for global CP, turn data, and user role.

## Phase 2: Strategy Map (The Grid)
- [x] **Component**: Create `src/components/logh/StarGrid.tsx` using Canvas or SVG for 100ly grid.
- [x] **Data Fetching**: Implement `useSWR` hook (Mocked/Adapted to `/api/logh/galaxy/systems`).
- [x] **Interaction**: Implement Drag-to-scroll and Wheel-to-zoom.

## Phase 3: Command System (Job Cards)
- [x] **UI**: Create `JobCardDeck.tsx` and `JobCard.tsx`.
- [x] **Logic**: Implement `useCommandExecution` hook that checks CP (PCP/MCP).
- [x] **Flow**: Select Card -> Select Command -> Confirm.

## Phase 4: Tactical Battle (RTS)
- [x] **Engine**: Initialize PixiJS or Three.js context in `src/app/game/tactics/[id]/page.tsx`.
- [x] **Controls**: Implement `SteeringPanel.tsx` (5 sliders).
- [x] **Selection**: Implement Box Selection logic.
- [ ] **Socket**: Connect `useBattleSocket.ts` to handle `TICK` events.
- [x] **HUD**: Implement Radar and Shortcuts.

## Phase 5: Communication & Office
- [x] **Chat**: Refactor `ChatWindow` to support "Spot" vs "Global" scope.
- [x] **Messenger**: Create `MessengerModal.tsx` for P2P requests.
- [x] **Office**: Implemented Personnel/Logistics Tabs.
- [x] **Economy**: Implemented Finance Ledger UI & API adapter.

## Phase 6: Final Integration (Ragnarok)
- [x] **Dev Relay**: Configured `.env.local` with Dev Relay URL & Token.
- [x] **API Layer**: Updated `loghApi` with Auth headers and new endpoints.
- [x] **Validation**: Playwright tests configured for live integration (pending environment capacity).

---

## Next Steps
1.  **Socket Integration**: Connect `TacticalMap` to real-time `battle-tick` events.
2.  **Live Deployment**: Deploy to a robust staging environment to pass E2E gates.
3.  **Visual Polish**: Add animations to Warp/Battle resolution.
