# Frontend Modernization Todo List

The following pages are still using legacy `page.module.css` and need to be modernized to use Tailwind CSS (Dark Theme).

## Modernization Pattern
- **Container**: `min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans`
- **Card**: `bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 shadow-lg`
- **Grid**: Use `grid grid-cols-X gap-X`
- **Inputs**: `w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-colors`
- **Buttons**: Standardize using Tailwind color utilities (e.g., `bg-blue-600 hover:bg-blue-500`).

## Completed Pages
- Main Game (`src/app/[server]/game/page.tsx`)
- Board (`src/app/[server]/board/**`)
- Nation (`src/app/[server]/nation/**`)
- Troop (`src/app/[server]/troop/page.tsx`)
- Processing (`src/app/[server]/processing/page.tsx`)
- Battle (`src/app/[server]/battle/**`)
- Diplomacy (`src/app/[server]/diplomacy/**`)
- User Info (`src/app/user-info/**`)
- Vote (`src/app/[server]/vote/page.tsx`)
- Auction (`src/app/[server]/auction/page.tsx`)
- Chief (`src/app/[server]/chief/**`)
- Info & Archives (Session B - 2025-11-23):
  - `src/app/[server]/info/page.tsx`
  - `src/app/[server]/archive/page.tsx`
  - `src/app/[server]/history/page.tsx`
  - `src/app/[server]/world/page.tsx`
  - `src/app/[server]/my-gen-info/page.tsx`
  - `src/app/[server]/my-boss-info/page.tsx`
- Session 9 Complete (2025-11-24):
  - `src/app/[server]/join/page.tsx`
  - `src/app/[server]/select-general/page.tsx`
  - `src/app/[server]/select-npc/page.tsx`
  - `src/app/[server]/inherit/page.tsx`
  - `src/app/[server]/map/cached/page.tsx`
  - `src/app/[server]/map/recent/page.tsx`
  - `src/app/[server]/tournament/page.tsx`
  - `src/app/[server]/tournament-center/page.tsx`
  - `src/app/[server]/npc-control/page.tsx`

## Remaining Pages

### Info & Archives
- [x] `src/app/[server]/info/page.tsx` ✅ Session B
- [x] `src/app/[server]/archive/page.tsx` ✅ Session B
- [x] `src/app/[server]/history/page.tsx` ✅ Previous
- [x] `src/app/[server]/world/page.tsx` ✅ Previous
- [x] `src/app/[server]/my-gen-info/page.tsx` ✅ Session B
- [x] `src/app/[server]/my-boss-info/page.tsx` ✅ Session B

### Game Entry & Setup
- [x] `src/app/[server]/join/page.tsx` ✅ Session 9
- [x] `src/app/[server]/select-general/page.tsx` ✅ Session 9
- [x] `src/app/[server]/select-npc/page.tsx` ✅ Session 9
- [x] `src/app/[server]/inherit/page.tsx` ✅ Session 9

### Admin
- [ ] `src/app/[server]/admin/page.tsx` (and sub-pages) - Requires investigation

### Map
- [x] `src/app/[server]/map/cached/page.tsx` ✅ Session 9
- [x] `src/app/[server]/map/recent/page.tsx` ✅ Session 9

### Other
- [x] `src/app/[server]/tournament/page.tsx` ✅ Session 9
- [x] `src/app/[server]/tournament-center/page.tsx` ✅ Session 9
- [x] `src/app/[server]/npc-control/page.tsx` ✅ Session 9

## Summary
- **Total Pages Migrated**: 38+
- **Session 9 Completion**: 9 pages migrated to Tailwind CSS
- **Remaining**: Admin pages (requires investigation)
