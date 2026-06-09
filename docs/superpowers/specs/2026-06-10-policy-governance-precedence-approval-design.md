# Policy Governance — Level Precedence & Approval Gate — Design

**Date:** 2026-06-10
**Status:** Approved (scoping questions answered)
**Touches:** `app/src/app/policies.tsx` (store) + `app/src/pages/SharedPolicies.tsx` (UI)

## Goal

Give the platform admin three governance capabilities on top of the existing shared-policy
engine:

1. **Roles per level** — *already exists* (`/admin/roles` "New role" modal already picks a Level:
   Platform / Portfolio / Group / Company / Manager / Employee, cloning a base role). No new work;
   we just surface it in the response. The two below are the new build.
2. **Level precedence** — when policies of the same topic apply at multiple levels, an
   admin-ordered priority decides which one is *effective* and which is *shadowed*.
3. **Approval gate** — a policy cannot be *enforced* until it clears an approval workflow.

## Decisions (from clarifying questions)

- **Placement:** extend the existing `/admin/shared-policies` console (the platform policy
  surface) rather than a new screen.
- **Default precedence:** **Higher governance wins** — `Platform > Portfolio > Group > Company`.
  The platform admin can reorder. Index 0 = highest priority; a same-topic policy at a
  higher-priority level shadows lower ones.

## Model changes — `app/src/app/policies.tsx`

```ts
export const POLICY_LEVELS = ['Platform', 'Portfolio', 'Group', 'Company'] as const
export type PolicyLevel = typeof POLICY_LEVELS[number]
export type PolicyStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Enforced' | 'Rejected'
export type ApprovalStep = {
  id: string; role: string                 // approver role label
  state: 'pending' | 'approved' | 'rejected'
  actor?: string; at?: string; note?: string
}
```

`SharedPolicy` gains:
- `ownerScope` union widened to include `'Company'` (this field IS the policy's level).
- `status: PolicyStatus`
- `approval: ApprovalStep[]` (ordered chain; empty = auto-approve on submit)
- `enforced: boolean` is kept but **derived** = `status === 'Enforced'`, so the child
  `Policies.tsx` screen keeps working unchanged.

New store state + actions:
- `levelPriority: PolicyLevel[]` + `setLevelPriority(next)` — the precedence order
  (default `['Platform','Portfolio','Group','Company']`).
- `submitForApproval(id)` — `Draft → Pending Approval` (or straight to `Approved` if the chain is
  empty); resets steps to pending.
- `decideApproval(id, stepId, 'approved'|'rejected', actor, note?)` — records the decision; any
  reject ⇒ `Rejected`; all approved ⇒ `Approved`.
- `enforcePolicy(id)` — **only allowed when `status === 'Approved'`** ⇒ `Enforced`.
- `unenforce(id)` — `Enforced → Approved` (admin can pull a policy back).
- `effectiveFor(policy)` — returns `{ effective: boolean; shadowedBy?: SharedPolicy }`: a policy is
  *shadowed* if another **enforced** policy of the same `category`, with overlapping `appliesTo`,
  sits at a higher-priority level.

`policiesForCompany` now returns **enforced-only** (a Draft/Pending policy must not reach
employees). Existing seeds are all enforced, so no visible regression.

Seeds extended to demonstrate both features:
- Code of Conduct (Group / Enforced), Leave Policy (Group / Enforced).
- Information Security (Group / Security / Enforced) — **shadowed** by…
- Global Data Protection (Platform / Security / Enforced) — higher level, same category ⇒ wins.
- Remote Work (Portfolio / HR / **Pending Approval**) — mid-chain, shows the approval timeline.
- Expense Policy (Company / Finance / **Draft**) — shows the submit-for-approval entry point.

## UI changes — `SharedPolicies.tsx`

- **Enforcement precedence card** (top): ordered list of the 4 levels with up/down controls.
  Editable by `provider_admin`; read-only for others. Caption: "Higher = wins on conflict."
- **Stat cards:** Total · Enforced · Pending approval · Shadowed.
- **Policy rows:** add a **status** badge (Draft/Pending/Approved/Enforced/Rejected) + **level**
  badge, and an **Effective / Shadowed by X** chip. Inline primary action by status:
  Draft → *Submit for approval*; Pending → *Review*; Approved → *Enforce*; Enforced → *Pull back*.
- **Detail drawer** gains two sections:
  - **Approval timeline** — each step with state; the current pending step shows Approve / Reject
    (gated: `provider_admin` may act on any step; `portfolio_manager` on steps addressed to a
    portfolio role). Enforce button appears once `Approved`.
  - **Precedence** — shows whether this policy is effective for its companies or shadowed, and by
    which higher-level policy.
- **Authoring modal:** add a **Level** select (Platform/Portfolio/Group/Company) and an ordered
  **Approval chain** builder (add/remove approver-role steps). Publishing creates the policy as
  **Draft** (the old "Enforce across member companies" switch is replaced by the lifecycle —
  "Allow children to override" switch stays).

## Role gating

- Editing precedence: `provider_admin` only (others read-only).
- Authoring / submitting: `provider_admin` + `portfolio_manager` (the console's existing audience).
- Acting on an approval step: `provider_admin` (any step) or `portfolio_manager` (portfolio-role
  steps) — kept permissive for a demoable prototype.

## Out of scope

Real notifications, per-clause conflict resolution (precedence is at the policy/category grain),
persistence. Consistent with the rest of this mock-backed prototype.
