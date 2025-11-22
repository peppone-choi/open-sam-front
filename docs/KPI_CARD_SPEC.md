# KPI Card Props Guide

The reusable KPI card is implemented via `InfoSummaryCard` (`src/components/info/InfoSummaryCard.tsx`). It is now the default way to summarize snapshot metrics across the info/history/world dashboards and the entire entry flow.

## Props

| Prop | Type | Description |
| --- | --- | --- |
| `label` | `string` | Small uppercase kicker rendered above the value. |
| `value` | `React.ReactNode` | Main KPI value. Accepts string, number, or custom JSX (e.g. badges, icons). |
| `description` | `string` | Optional supporting copy below the value. |
| `accent` | `'blue' \| 'green' \| 'violet' \| 'amber' \| 'neutral' \| 'rose'` | Controls the gradient halo rendered behind the card. Defaults to `blue`. |
| `icon` | `React.ReactNode` | Optional icon rendered in the top-right corner. |
| `meta` | `Array<{ label: string; value: React.ReactNode; }>` | Key/value pairs shown in two columns (one column when `dense`). |
| `footer` | `React.ReactNode` | Optional footer pill, useful for warnings or additional hints. |
| `trend` | `{ value: string; label?: string; direction?: 'up' \| 'down' \| 'flat'; tone?: 'positive' \| 'negative' \| 'neutral'; }` | Highlights change deltas under the value (arrow glyph is based on `direction`). |
| `badge` | `{ label: string; tone?: 'info' \| 'success' \| 'warning' \| 'danger' \| 'neutral'; }` | Chip rendered next to the icon for stateful annotations (e.g. "LOCKED", "아이콘 준비"). |
| `dense` | `boolean` | Shrinks paddings, value size, and meta grid for compact layouts (entry flow KPI grid). |
| `className` | `string` | Standard Tailwind override hook. |

## Usage Patterns

- **Dashboards (info/history/world):** Use the default spacing. Pair each KPI with two meta facts (e.g. total nations, power sum). Trend blocks are optional but recommended when comparing against baselines.
- **Entry flow (join/select-general/select-npc/inherit):** Render the cards inside a responsive grid with `dense` enabled. Combine badges + trends to communicate eligibility or cooldown status at a glance.
- **Dark theme:** Background tokens (`bg-background-secondary/70`, `text-foreground`) are applied inside the component. Consumers should avoid wrapping cards with additional opaque blocks unless a stronger emphasis is required.

## Storybook

The component is documented under `Info/KpiCard` with the following stories:
- `Default`: simple snapshot without trend.
- `WithIcon`: demonstrates icon + footer usage.
- `WithTrend`: highlights the `trend` prop.
- `EntryFlow`: mirrors the join page KPI block (badge + violet accent).
- `Dense`: compact card used in NPC and select-general screens.

### Running Storybook with Next 16
`@storybook/nextjs@8.x` does not yet ship a `next/config` export compatible with Next 16, so our runs must preload `storybook.next-config-shim.js`. The npm scripts already wire the flag:

```bash
npm run storybook       # NODE_OPTIONS="--require ./storybook.next-config-shim.js" storybook dev -p 6006
npm run build-storybook # NODE_OPTIONS="--require ./storybook.next-config-shim.js" storybook build
```

When running Storybook manually or in CI, always include the same `NODE_OPTIONS` value or invoke the helper scripts; otherwise the build fails with `Cannot find module 'next/config'` before Webpack compiles.

### Mock JSON & Capture Workflow
- All server snapshots referenced by the KPI card live in `docs/mocks/*.json` (join, select-general, select-npc, inherit, front-info, auction). When a backend schema changes, update the JSON first, then mirror the structure in `src/stories/mocks/entrySamples.ts` so Storybook Controls show the same shape QA will receive.
- QA captures go under `open-sam-front/test-results/` using the `<screen>-before.png` / `<screen>-after.png` convention described in `docs/QA_KPI_SNAPSHOTS.md`. Link those files when filing bugs so designers can diff KPI deltas visually.
- Storybook’s `ApiSamples` story exposes a dropdown for each mock set; use it during review to confirm that the card renders identical text / trend metadata before touching live endpoints.

## Implementation Notes

1. **Meta grid** collapses to a single column when `dense` is passed or when fewer than two meta rows exist.
2. **Trend arrow** is purely visual. Provide the formatted delta in `trend.value` and human-friendly copy in `trend.label` (e.g. `+7p`, `기준 합 대비`).
3. **Badges** are tone-aware chips; use them for statuses such as `LOCKED`, `아이콘 준비`, `0P`, etc.
4. **Accessibility:** The gradient halo uses `pointer-events: none` to avoid interfering with hover/focus states. When embedding buttons inside `footer`, wrap them with `role="button"` semantics manually.
5. **Extensibility:** Additional accents can be introduced by extending `InfoSummaryAccent` in `InfoSummaryCard.tsx`. Keep contrasts WCAG-compliant against the dark background tokens.
6. **Theme token checklist:** Cards must only reference Tailwind tokens defined in `tailwind.config.ts` (`bg-background-secondary`, `text-foreground`, `primary`, `secondary`, `accent`). If you introduce a new tone, add it to the config and document it here before shipping.
