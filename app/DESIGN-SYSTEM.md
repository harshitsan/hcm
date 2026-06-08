# SatelliteHR UI — "Orbit" design system (build contract)

Frontend-only React + TypeScript + Vite + Tailwind v3 prototype. **Mock data only, no backend.**
Build new pages to match the reference dashboard look and this contract exactly.

## Look & feel (match the reference religiously)
- Light, airy canvas with a soft gradient (already on `body`); content in **white, very rounded
  (`rounded-2xl`/`rounded-3xl`), soft-shadow** cards (`shadow-card`).
- **Near-black INK primary** (`primary`) for primary buttons + the active black pill nav.
- **Blue** (`accent`) = info / links / charts / "done". **Coral** (`accent2`) = active / alert / highlight.
- Pill controls (buttons are `rounded-full`), **circular icon buttons** for card actions, **avatar
  stacks** with a `+N` bubble for participant clusters, **status pills** (Badge) everywhere.
- Charts via `recharts` (Area/Donut/Bar) using token colors, e.g. `stroke="rgb(var(--accent))"`.
- Works in light AND dark automatically via tokens — never hardcode hex; use token classes.

## Hard rules
- **Icons:** `lucide-react` only. **No emoji.** Icon-only buttons need `aria-label`.
- **Color:** use token classes only — `bg/surface/surface2/fg/muted/muted-fg/border/primary/
  primary-fg/accent/accent2/success/warning/danger/info/ring`. Alpha ok: `bg-primary/10`,
  `text-accent2`, `border-accent/30`.
- **Components defined at module scope** (never declare a component inside render → remount bug).
- **Hooks:** satisfy `react-hooks/exhaustive-deps` (list deps in useMemo/useEffect). Do NOT call
  `Math.random()`/`Date.now()` at render — use fixed arrays / seeded constants.
- Each page file: a single **default export** component, no props. Wrap content in
  `<div className="animate-fade-in">`. Responsive (grid cols stack on mobile). Tabular numbers via
  `className="tnum"`.

## Import primitives from `../components/ui`
- `Button` — `variant: primary|secondary|ghost|outline|danger|subtle`, `size: sm|md|lg|icon` (pill).
- `IconButton` — circular. `variant: outline|ghost|solid|soft`, `size: sm|md|lg`. (Card-header `+`,
  upload, calendar actions; aria-label required.)
- `Card`, `CardHeader`, `CardTitle`, `CardBody`.
- `Badge` — `tone: neutral|primary|success|warning|danger|info|accent|accent2`, optional `dot`.
- `Avatar` — `name`, `size: xs|sm|md|lg`. `AvatarStack` — `names: string[]`, `max`, `size`.
- `Field` (label/hint/error/required), `Input`, `Textarea`, `Select`, `Switch`.
- `Segmented<T>` (`options`, `value`, `onChange`), `Tabs` (`tabs`, `value`, `onChange`).
- `Table`, `Th`, `Td`, `Tr`.
- `Tooltip` (`label`), `Modal` (`open/onClose/title/footer/size`), `Drawer` (`open/onClose/title`).
- `PageHeader` (`title`, `subtitle`, `actions`, `icon`), `StatCard` (`label/value/delta/deltaTone/icon`),
  `EmptyState`, `Stepper` (`steps`, `current`), `ProgressBar` (`value`, `tone`), `useToast().push({title,tone})`.

## Page skeleton (follow this shape)
```tsx
import { useMemo, useState } from 'react'
import { SomeIcon, Plus } from 'lucide-react'
import { useApp } from '../app/store'
import { useCompanyData } from '../data/companyData'
import { Card, CardBody, PageHeader, Badge, IconButton, /* … */ } from '../components/ui'

export default function MyPage() {
  const { role, company } = useApp()
  const { employees } = useCompanyData()       // shared people; remounts on company switch
  // self-contained deterministic mock data for THIS module:
  const rows = useMemo(() => [/* fixed objects */], [])
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="My Page"
        subtitle={`… ${company.name}.`}
        icon={<SomeIcon className="h-5 w-5" />}
        actions={<IconButton variant="outline" aria-label="New"><Plus className="h-[18px] w-[18px]" /></IconButton>}
      />
      {/* cards, tables, charts … */}
    </div>
  )
}
```

## Data
- People: `useCompanyData()` → `employees, departments, getEmployee, getDepartment, reportsOf, inbox,
  leaveBalances, leaveRequests, policies, documents, candidates, requisitions, onboardingTasks,
  auditLog, attendanceWeek/Mix, headcountTrend/byDept, leaveByMonth`.
- `useApp()` → `role, persona, company, companyId, authorizedCompanies, theme`.
- Anything not above: define **self-contained, deterministic** mock data in the page (module-scope
  arrays or a `useMemo(() => …, [])`). Reference real people from `employees` where natural.
- Roles (5 runtime personas): `provider_admin, portfolio_manager, company_hr_admin, people_manager,
  employee`. Gate admin-only sections behind `role` checks; employees see a self-service view.

## Reference patterns to reuse
- **PageHeader actions** = a small cluster of circular `IconButton`s (Plus / Upload / Calendar).
- **Card header actions** = circular `IconButton`s on the right of `CardHeader`.
- **Journey / kanban**: a horizontal row of columns (`grid grid-flow-col` or `flex gap-4 overflow-x-auto`),
  each a soft card holding stacked item cards with avatars + status pills + connector dots.
- **Donut stats** (recharts `PieChart`/`RadialBar`) and **area trend** like the reference's bottom row.
- **Status pills**: done/info = `accent`/`info`, active/overdue = `accent2`/`danger`, positive = `success`,
  pending = `warning`/`neutral`.
