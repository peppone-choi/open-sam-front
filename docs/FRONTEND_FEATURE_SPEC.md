# Gin7 Frontend Functional Specification & Implementation Plan

## 1. Overview
This document translates the mechanics from `gin7manual.txt` into a functional specification for the `open-sam-front` (Next.js 16 + React 19) application.

**Core Concept:** Massively Multiplayer Online Strategy with Real-Time Strategy (RTS) tactical battles.
**Role:** Player acts as a specific character (Officer/Politician) within a hierarchy (Empire/Alliance).

---

## 2. Page Structure & Routing (Next.js App Router)

| Route | Component/Feature | Manual Reference | Status |
|-------|-------------------|------------------|--------|
| `/` | Landing/Login | P.7 Login | Existing |
| `/game` | **Game Layout (Shell)** | P.18 System Icons | ✅ Done |
| `/game/strategy` | **Strategy Map (Main View)** | P.18-19 Strategy Game | ✅ Done |
| `/game/tactics/[battleId]`| **Tactics Console (RTS)** | P.21-24 Tactical Game | ✅ Done |
| `/game/office` | Personnel & Domestic Affairs | P.33 Personnel, P.40 Logistics | ✅ Done |
| `/game/comm` | Communication Center | P.15 Mail/Messenger | ✅ Done |

---

## 3. Detailed Feature Specifications

### 3.1. Global Layout (App Shell)
*   **Sidebar:** Messenger, Info, Mail Icons.
*   **Job Card Dock:** Bottom-right collapsible panel.

### 3.2. Strategy Screen (Main Hub)
*   **Grid:** 100ly grid system implemented via Canvas (`StarGrid.tsx`).
*   **API:** Fetches from `/api/logh/galaxy/systems` & `fleets`.

### 3.3. Command Execution Flow
*   **Mechanism:** Job Card -> Command -> `useCommandExecution` hook.
*   **CP Logic:** Checks PCP/MCP. Implements 2x substitute cost (Manual P.26).
*   **API:** POST `/api/logh/command/execute`.

### 3.4. Tactics Screen (RTS Interface)
*   **Render:** PixiJS (`TacticalMap.tsx`).
*   **HUD:** Radar, Shortcuts (F/R/Z/X), Steering Panel (Energy Dist).
*   **Auto-Resolve:** Button available to delegate battle to AI (QA-BTL-001).
*   **Interaction:** Unit selection via click.

### 3.5. Communication Suite
*   **Mail:** Inbox/Outbox UI with Mock data.
*   **Chat:** Spot-based isolation logic ready (Socket pending).

### 3.6. Personnel & Organization
*   **Office:** Tabs for Personnel, Logistics, Finance.
*   **Finance:** Ledger view showing Treasury, Income, Expense, and Log.
*   **API:** `GET /api/logh/galaxy/economy`.

---

## 4. Technical Architecture Strategy

### 4.1. Frontend Stack
*   **Framework:** Next.js 16.
*   **State:** Zustand (`gameStore.ts`).
*   **Testing:** Playwright (E2E), Storybook (Components).

### 4.2. Data Contracts
*   `lib/api/logh.ts` aligns with backend endpoints.
*   `types/logh.ts` defines strict interfaces for Systems, Fleets, and Commands.
