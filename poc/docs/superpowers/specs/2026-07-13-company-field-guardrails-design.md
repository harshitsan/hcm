# Company field guardrails — confirm-before-save, role access, and admin approval

**Date:** 2026-07-13
**Status:** Approved (design)
**Scope:** Company **Profile edit** tab only. The create wizard is out of scope.

---

## 1. Context

The Company Profile edit tab (`src/features/companies/components/detail/profile-tab.tsx`) saves straight through. Any field a role can touch, it changes silently and instantly — including legal identity, statutory tax IDs, base currency, and subscription tier.

The guardrails that exist today are coarse:

| Existing control | Where | Limitation |
|---|---|---|
| `editLevel: 'full' \| 'limited' \| 'none'` | `use-companies.ts:459-470` | `limited` can edit only the 4 `CONTACT_FIELDS`; everything else is all-or-nothing |
| `frozen` (status lock) | `profile-tab.tsx:99-102` | Disables *every* field at once; `draft` and `cancelled` are not covered |
| `baseCurrencyLocked` | `profile-tab.tsx:107` | A flag that no code path ever sets |
| `code` read-only badge | `profile-tab.tsx:194-199` | The only per-field immutability |

There is **no confirmation step and no approval routing at all** on the edit path. (The create wizard already ends in a "Review & Confirm" step, which is why create is excluded.)

### Why this matters now

Exploration surfaced three live defects that a guardrail layer both exposes and fixes:

1. **`subscriptionTier` / `packageId` divergence — a real bug.** The profile save patches `subscriptionTier` but never `packageId` (`profile-tab.tsx:135-155`). `TIER_TO_PACKAGE` is applied only at creation (`directory-tab.tsx:165`), while *every* entitlement decision reads `packageId` (`use-subscriptions.ts:69`; limits `:85-115`; modules `:125-132`). Upgrading Basic → Enterprise in the profile changes the badge and grants nothing — the UI and the rules engine disagree.
2. **`employeeLimit` has no floor at `employeeCount`.** Validated only as `> 0` (`profile-tab.tsx:50-55`). Lowering it below headcount immediately flips usage bars red (`subscriptions-tab.tsx:33-38`) and restates the future archival fee, computed as `max(100, employeeLimit × 0.5)` (`use-companies.ts:188-192`).
3. **`baseCurrencyLocked` is never set `true` by any code path** — only by seed literals. "Locked once the first transaction has occurred" (`companies.ts:176-177`) is currently fiction.

### Intended outcome

A single declarative field-policy registry driving three composable guardrails — **role access**, **confirm-with-impact**, and **maker-checker approval** — replacing the coarse `editLevel` switch.

---

## 2. Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Surface | Profile edit tab only | Create already has Review & Confirm; the blast radius is on edits to a *live* company |
| Approver | **One tier up**, resolved from the company's real hierarchy; Platform Admin auto-applies | Mirrors existing tenancy; structurally prevents self-approval |
| Pending semantics | **Old value stays live**; change held as a record, field badged and locked | Standard maker-checker; an unapproved tax ID must never be briefly authoritative |
| Commercial (`subscriptionTier`, `employeeLimit`) | **View-only below Portfolio** — Company Admin and Group Company Admin can see but not edit; only Portfolio/Platform edit | Self-upgrading your own billing tier is a permission problem, not an approval problem |
| Security (`authMethods`, `mfaRequired`, `passwordPolicy`) | **Asymmetric** — approval only when *weakening* | Friction belongs in the dangerous direction only; never discourage a security improvement |

---

## 3. Architecture

### 3.1 The field-policy registry — single source of truth

New: `src/features/companies/data/field-policy.ts`. Replaces the scattered `CONTACT_FIELDS` / `canEdit` / `baseCurrencyLocked` logic at `profile-tab.tsx:82-109`.

```ts
export type FieldAccess = 'editable' | 'view-only' | 'hidden'
export type FieldGuard  = 'none' | 'confirm' | 'approval'

export interface CompanyFieldPolicy {
  id: keyof ProfileValues
  label: string
  section: 'Identity' | 'Legal' | 'Contact' | 'Operational' | 'Commercial' | 'Security'
  /** Role-based access — evaluated first. */
  access: (role: Role, company: Company) => FieldAccess
  /** Save guard. Function form supports the asymmetric security rule. */
  guard: FieldGuard | ((prev: string, next: string) => FieldGuard)
  /** Concrete downstream impact for the confirm dialog. Never "are you sure". */
  impact?: (company: Company, prev: string, next: string) => string
  /** Hard data-driven lock — returns a human-readable reason, or null. */
  lockedWhen?: (company: Company) => string | null
}
```

**The guardrails compose.** `access` decides whether you can touch the field at all; `guard` decides what ceremony the save requires. `approval` implies the confirm diff — you see what you are submitting before it queues.

Boundary: the registry is pure data + predicates. It has no React dependency and no store dependency, so it is unit-testable in isolation and consumable by both the form and the store-level guard.

### 3.2 Field tiers

| Tier | Fields | Guard |
|---|---|---|
| **0 — Immutable** | `code`, `id`, `createdAt`, `employeeCount`, `config.version`, `retentionEndsOn`, `archivalFeeMonthly` | never editable; render read-only |
| **1 — Free edit** | `tradeName`, `website`, `logoUrl`, `primaryColor`, `language` | `none` |
| **2 — Confirm** | `primaryEmail`, `primaryPhone`, `primaryAddress`, `billingAddress`, `timeZone`, operational `config.*` (`sessionTimeoutMins`, `dateFormat`, `numberFormat`, `currencyDisplay`, `senderEmail`, `slaHours`, `approvalHierarchy`) | `confirm` |
| **3 — Approval** | `legalName`, `registrationType`, `registrationNumber`, `baseCurrency`, `operatingModel`, jurisdictions (add / remove / set-primary) | `approval` |
| **3c — Commercial** | `subscriptionTier`, `employeeLimit` | `view-only` for Company Admin **and** Group Company Admin; `approval` for Portfolio Admin; Platform Admin auto-applies (see below) |
| **3s — Security** | `authMethods`, `mfaRequired`, `passwordPolicy` | `approval` when weakening; `confirm` when strengthening |

**How `approval` behaves for the top tier.** `guard` does not need a role parameter. A field declares `guard: 'approval'` once; approver resolution (§3.4) then decides what that means in practice — for Platform Admin there is no tier above, so the change auto-applies and the guard degrades to a plain confirm-with-impact. This keeps the registry declarative and puts all hierarchy logic in one place.

Every Tier-3 pick has verified downstream reach:

- **`legalName`** — legal identity; COMP_001 uniqueness (`profile-tab.tsx:112-121`); appears on issued documents.
- **`registrationType` / `registrationNumber`** — statutory tax ID. Uniqueness is scoped **by primary jurisdiction** (`companies.ts:721-735`), making it order-dependent with any jurisdiction change. Cross-validation exists only for GST (15 chars, `profile-tab.tsx:60-71`); switching type away from GST leaves a GSTN in place unvalidated.
- **`baseCurrency`** — re-denominates money. **No restatement or conversion path exists anywhere in the codebase.** `archivalFeeMonthly` is stored as a bare number with no currency of its own (`lifecycle-tab.tsx:100-103`).
- **`jurisdictions`** — owns workforce records (removal already blocked when `employeeCount > 0`, `use-companies.ts:287-291`). Re-pointing `isPrimary` changes the registration-number uniqueness namespace and today performs **no validation and returns no error** (`use-companies.ts:261-278`).
- **`operatingModel`** — can be flipped to `Standalone` while the company still carries a `groupId`, leaving RBAC scope incoherent (`use-companies.ts:448-452`).

### 3.3 Confirm dialog — impact, not "Are you sure?"

**Reuse `ConfirmDialog`** (`src/components/common/confirm-dialog.tsx`). It already accepts JSX for `desc` (render the diff) and exposes a `children` slot (the mandatory change-reason textarea). Do not build a new dialog.

**Reuse the diff markup** from `detail/history-tab.tsx:142-152`:
```tsx
<span className='line-through'>{oldValue}</span> → <span className='font-medium'>{newValue}</span>
```

The `impact()` string is the entire value of this feature. Illustrative outputs:

- `baseCurrency` — *"USD → INR. This company's jurisdictions and its retained archival fee are denominated in USD. There is no restatement path; existing monetary records will not be converted."*
- `employeeLimit` — *"500 → 400. Current headcount is 458, so this puts the company over its limit. The archival fee on inactivation changes from $250/mo to $200/mo."*
- `subscriptionTier` — *"Basic → Enterprise. Entitlements are granted by the package, not the tier — the package moves to pkg-ent."*

### 3.4 Approval (maker-checker)

New type `CompanyChangeRequest` in `src/features/companies/data/records.ts`, mirroring `ChangeRequest` (`self-service/data/profile.ts:136-156`) plus a `companyId`.

The existing `HistoryEntry` (`records.ts:31-42`) already carries `field / oldValue / newValue / changedBy / changedAt / effectiveDate / reason` — precisely the shape an approved change must write. The approved-change write path therefore already exists.

Store triple in `use-companies.ts`, modelled on `use-profile.ts:103-242`: `submitChange` / `approveChange` / `rejectChange`.

**Data flow.** On the approval path, `state.companies` is **not** touched — only the request queue grows. The live company keeps the old value. `approveChange` is the sole writer of the new value, and it writes a `HistoryEntry` in the same transition. `rejectChange` writes nothing.

**Approver resolution — one tier up, from the company's hierarchy, not merely the role:**

```
Company Admin       → Group Company Admin  (if company.groupId)
                    → else Portfolio Admin (if company.portfolioId)
                    → else Platform Admin
Group Company Admin → Portfolio Admin      (if company.portfolioId)
                    → else Platform Admin
Portfolio Admin     → Platform Admin
Platform Admin      → auto-applies (never queues)
```

**Approver UI.** A new "Approvals" tab on the company detail sheet, with a pending-count badge on the tab trigger. Reuse the decision dialog from `self-service/components/change-approvals-tab.tsx:183-233` — it is already a `ConfirmDialog` carrying a before→after diff and a decision-comment textarea.

### 3.5 Error handling

| Case | Behaviour |
|---|---|
| Field is `hidden` for the role | Not rendered at all (follows `profile-card.tsx:31-39`), with an "N fields hidden" note |
| Field is `view-only` | Rendered with a `<Badge variant='badge_inactive'>View only</Badge>`; no edit affordance |
| Field has an open change request | Disabled + `<Badge variant='pending'>Change pending approval</Badge>`; a second edit is refused |
| Field is `lockedWhen(...)` | Disabled, with the returned reason shown inline |
| Company is frozen (suspended/inactive/archived) | Existing COMP_004 / COMP_005 freeze wins over everything |
| Store called with a field the role cannot edit | `submitChange` refuses and toasts an error — enforced in the store, not only at render |
| Approve/reject a non-pending request | Idempotent no-op (retains the `status !== 'Pending approval'` guard at `use-profile.ts:163, 213`) |

---

## 4. Three defects in the self-service pattern — fix, do not copy

The existing maker-checker is the right shape but has real holes. Porting it verbatim would import them.

1. **No pending-lock.** `submitChange` (`use-profile.ts:103`) never checks existing requests, so N concurrent requests can exist for one field, each snapshotting `currentValue` at its own submit time. Approving them out of order applies a stale-based value.
   **Fix:** at most one open request per `(companyId, fieldId)`; the field is disabled while one is open.
2. **`approverGraph` is decorative.** Hard-coded `['Vikram Mehta', 'HR Partner']` (`use-profile.ts:116`) and `decidedBy` is the literal string `'Company Admin'` (`:180`), yet a single decision closes the request.
   **Fix:** resolve the approver from the hierarchy (§3.4) and stamp the real deciding role.
3. **`mode` is enforced only in the view layer.** `profile-card.tsx` hides the pencil, but the store has no guard — any caller can write a `view-only` or `hidden` field.
   **Fix:** enforce `access` inside `submitChange`.

---

## 5. Bugs fixed as part of this work

- **`subscriptionTier` must move `packageId` together.** Apply `TIER_TO_PACKAGE` (`directory-tab.tsx:45-49`) on the save/approval path. Without this, the guardrail dutifully routes and approves a change that still grants nothing.
- **`employeeLimit` floor at `employeeCount`.** Reject, or hard-warn via `impact()`, when the new limit falls below current headcount.
- **`baseCurrencyLocked`.** Drive the lock from `lockedWhen` in the registry so that the "locked after first transaction" label reflects an actual rule rather than a static seed flag.

---

## 6. Components and files

| File | Change |
|---|---|
| `src/features/companies/data/field-policy.ts` | **new** — registry, tier table, approver resolution |
| `src/features/companies/data/records.ts` | **new type** `CompanyChangeRequest` |
| `src/features/companies/hooks/use-companies.ts` | `submitChange` / `approveChange` / `rejectChange`; store-level access guard; `editLevel` (`:459-470`) retired in favour of the registry |
| `src/features/companies/components/detail/profile-tab.tsx` | `canEdit` / `CONTACT_FIELDS` (`:82-109`) replaced by registry lookup; confirm dialog on save; pending + view-only badges |
| `src/features/companies/components/detail/company-change-approvals-tab.tsx` | **new** — approver queue |
| `src/features/companies/components/detail/company-detail-sheet.tsx` | mount the Approvals tab + pending-count badge |

Reused unchanged: `ConfirmDialog`, `Badge` (`pending` / `badge_inactive`), the `history-tab` diff markup, `HistoryEntry`, `publishAuditEvent`.

---

## 7. Testing

Unit (registry is pure, so this is cheap):
- `access()` returns `view-only` for `subscriptionTier` when role is Company Admin, `editable` for Platform Admin.
- `guard()` for `mfaRequired` returns `approval` on `true → false` and `confirm` on `false → true`.
- Approver resolution walks group → portfolio → platform correctly, including a company with neither.
- A field with an open request reports as locked.

End-to-end (see Verification below).

---

## 8. Verification

1. `npx vite`, open a company detail sheet. The role switcher persists to `localStorage['satellitehr-poc-role']`.
2. **Confirm path** — as Platform Admin, change `timeZone`. Expect a ConfirmDialog with `old → new` plus the impact line; cancel leaves the value untouched.
3. **Approval path** — as Company Admin, change `legalName`. Expect "Submit for approval"; the profile still shows the **old** name with a "Change pending approval" badge; the field is locked against a second edit.
4. **Approver** — switch to the tier above. The Approvals tab shows a pending count. Approve → the new value goes live and a `HistoryEntry` is written. Reject → the value is unchanged.
5. **Role access** — as Company Admin, `subscriptionTier` and `employeeLimit` render view-only with no edit affordance.
6. **Security asymmetry** — turning MFA **on** confirms and saves directly; turning it **off** queues for approval.
7. **Regression** — a suspended/archived company remains fully frozen; `npx tsc -b` is clean.

---

## 9. Known gaps (explicitly out of scope)

- `draft` and `cancelled` companies are **not** frozen today (`profile-tab.tsx:99-102`) — a cancelled company remains fully editable. Flagged, not fixed here.
- `incorporationDate`, `packageId`, `adminEmail`, `groupId`, `portfolioId` are set at create and have no post-create edit surface. They stay that way.
- The create wizard is untouched.
