# SatelliteHR Workflows — What They Are and What You Can Do With Them

> **Live app:** https://satellitehr-poc-production.polished-mud-fefe.workers.dev
> Everything configurable in SatelliteHR — approver chains, rules, forms, checklists, templates, alerts, settings, category lists, calendars, and process flows — is a **workflow**. One catalog, one editing surface (the visual canvas), one governance model.

---

## 1. The core idea

Traditional HRMS products (the Kensium system this POC generalizes) scatter configuration across ~190 bespoke admin screens. SatelliteHR replaces all of them with a single **workflow catalog**: every piece of business logic is authored once as a workflow, attached to whichever module(s) consume it, versioned on every edit, and switched on/off independently at each level of the tenant hierarchy.

A workflow is defined by:

| Property | Meaning |
|---|---|
| **Name & description** | Human-readable identity shown everywhere the workflow is consumed. |
| **Kind** (one of 10 types) | Determines its payload shape and how it renders on the canvas — see §3. |
| **Home module** | The module it primarily belongs to (e.g. Leave Management). |
| **Attachments** | Additional module/submodule surfaces that consume it. One workflow can drive many screens. |
| **Version** | Bumps on every save; prior versions stay in the history trail. |
| **Scopes** | Independent enable/disable toggles at Platform → Portfolio → Group company → Company. A workflow is *effectively active* at a level only when that level **and every ancestor** is enabled — each admin governs their own switch, activation cascades down. |
| **History** | Full audit trail: created, edited, enabled/disabled at scope X, attached/detached, moved to folder. |
| **Folder** | Optional grouping for catalog management (see §2, "Organize"). |

---

## 2. What you can do with workflows

### Author & edit — everything on the visual canvas
- **Open any workflow on the canvas.** Clicking a workflow anywhere in the app (catalog row, module panel, flow chip) opens a wide right-hand slider hosting the visual builder. Every one of the 10 kinds gets a canvas representation — approver chains become chains of Approval task nodes, decision rules become Rule condition + Rule outcome nodes, configuration payloads become an inspectable Configuration node.
- **Edit in the inspector.** Select a node and edit its fields in the right panel (SLA hours, rule operators, form fields, template body, calendar entries, …).
- **Save bumps the version.** Saving converts the canvas back to the workflow's native definition and writes `v(n+1)` with a history entry. Lossy edits are **refused, not silently dropped** — e.g. deleting the Rule outcome node from a decision rule and saving shows an error toast and leaves the stored version untouched.
- **Undo/redo and dirty-close protection** inside the editor; closing with unsaved changes asks for confirmation.
- **Quick-create** new workflows of any kind from the Configure tab's form-based builder ("New workflow"); refine them later on the canvas.

### Reach — the flow chip
Wherever a workflow is connected, a small **flow icon chip** appears: catalog rows, all 21 module engine panels, the Configure table, detail sheets, the Apply-Leave and Asset-Requisition overlays (linked flows hint), and flow-run rows. Clicking the chip opens that exact workflow in the visual builder. Non-admin roles can open and inspect the canvas; the Save button is admin-only.

### Govern — scopes, versions, attachments
- **Enable/disable per tenant level** (Platform / Portfolio / Group company / Company) — each toggle is owned by the admin of that level, with hierarchical effective-state.
- **Attach/detach** a workflow to any module or submodule tab; one approver chain can serve Leave *and* Asset requests. A workflow must always keep at least one attachment.
- **Version history** records every edit, toggle, attach, and move.
- **Test-run** process flows (`flow` kind) directly from the Build tab with mock inputs; run instances appear in the Instances tab.

### Organize — folders like a file manager
- The Engines Hub has a **Folders** browse mode: derived per-module folders (auto-computed — the ~200 imported Kensium workflows self-organize by module), an Ungrouped bucket, and **user folders** you create yourself.
- **Create / rename / delete** folders inline; **drag a workflow** onto a folder in the rail to move it (a "Move to…" select is the keyboard/a11y fallback). Deleting a folder returns its members to Ungrouped.

### Share — export / import bundles
- Export any selection of workflows as a JSON bundle (`satellitehr.artifacts` format, version 1); bundles **carry folder assignments** so an imported set lands pre-organized.
- Import validates every workflow, de-duplicates colliding ids (imported copies get " (imported)" suffixed and reset to v1), and accepts older bundles that predate folders.

---

## 3. The 10 workflow kinds in detail

Every workflow's `definition` is a typed payload whose `kind` matches its type. Below: what each kind is for, its exact shape, how it appears on the canvas, and a concrete example.

---

### 3.1 Process flow (`flow`)

**What it does:** A full multi-step automation authored freely on the designer canvas — triggers, approval tasks, notifications, condition branches, transforms, delays. This is the most general kind; the other nine are structured specializations. Flows are the only kind that can be **test-run** (with mock inputs) and **activated** to produce run instances.

**Shape:** `{ kind: 'flow', doc: WorkflowDoc }` — the payload *is* a canvas document (trigger + node tree).

**On the canvas:** exactly what you drew — the full palette of step kinds is available.

**Example — Employee Exit flow:**
> Trigger: *Employee Lifecycle / Exit initiated* → Approval task (Reporting Manager, 48h SLA) → parallel branch: Notify IT (revoke access) + Notify Finance (final settlement) → Checklist gate (asset return) → Notify employee (exit letter).
> Linked from the Employee Lifecycle module; each real run shows up in the Instances tab with per-step status.

---

### 3.2 Approver chain (`approver-chain`)

**What it does:** An ordered sequence of approval steps, each resolved to a named role with an SLA. Modules use it wherever a request needs sign-off (leave, WFH, assets, recruitment offers).

**Shape:**
```jsonc
{ "kind": "approver-chain",
  "steps": [ { "order": 1, "approverRole": "Reporting Manager", "slaHours": 24 },
             { "order": 2, "approverRole": "HR Director",       "slaHours": 48 } ] }
```
Approver roles come from a fixed set (Reporting Manager, Department Head, HR Director, Finance Controller, Operations Head, Compliance Officer, Recruitment Lead, Hiring Manager, Group HR Head, CEO).

**On the canvas:** one **Approval task** node per step, in order — edit a step's role or SLA in the inspector, add/remove/reorder steps as nodes. Only Approval task nodes are allowed; saving anything else is refused with an explanatory toast.

**Example — Time Off Approvers (Leave Management):**
> Step 1: Reporting Manager, 24h SLA → Step 2: HR Director, 48h SLA. Attached to Leave Management, so every leave application routes through these two approvals. Raising the HR Director SLA to 72h and saving creates v2 — the chip beside "Time Off Approvers" in the Leave admin panel opens this exact chain.

---

### 3.3 Decision rule (`decision-rule`)

**What it does:** An if-this-then-that gate: a list of conditions evaluated against a request's attributes, and one outcome applied when they match. Outcomes are one of: **Approve route**, **Flag for review**, **Block**, **Notify**.

**Shape:**
```jsonc
{ "kind": "decision-rule",
  "conditions": [ { "attribute": "leaveDays", "operator": ">", "value": "5" },
                  { "attribute": "leaveType", "operator": "=", "value": "Sick" } ],
  "outcome": "Flag for review" }
```
Operators: `=  !=  >  >=  <  <=  contains`.

**On the canvas:** one **Rule condition** node per condition (labelled e.g. `leaveDays > 5`) followed by exactly one **Rule outcome** node. The canvas enforces the invariant: a decision rule must save with exactly one outcome node — delete it and Save refuses ("A decision-rule workflow must have exactly one Rule outcome step — found 0").

**Example — Long Sick-Leave Review (Leave Management):**
> Conditions: `leaveDays > 5` AND `leaveType = Sick` → Outcome: **Flag for review**. Any sick-leave request longer than 5 days is routed to HR for manual review instead of auto-approval.

---

### 3.4 Custom form (`custom-form`)

**What it does:** Defines the extra fields a module's form collects — the extension mechanism that lets each organization capture its own data on top of the fixed base forms.

**Shape:**
```jsonc
{ "kind": "custom-form",
  "fields": [ { "label": "Project code",      "fieldType": "text",   "required": true },
              { "label": "Client billable?",  "fieldType": "yesno",  "required": true },
              { "label": "Laptop model",      "fieldType": "select", "required": false,
                "options": ["MacBook Pro", "ThinkPad X1", "Dell XPS"] } ] }
```
Field types: **Text, Number, Date, Select, Yes/No**; select fields carry an options list; each field can be required.

**On the canvas:** a single **Configuration** node; selecting it opens a field-list editor in the inspector — add/remove rows, change labels/types/required, edit select options as comma-separated text.

**Example — Asset Requisition Extra Fields (Asset Management):**
> Adds "Project code" (text, required), "Client billable?" (yes/no, required) and "Laptop model" (select) to the asset requisition form, so requests capture chargeback data the base form doesn't have.

---

### 3.5 Checklist (`checklist`)

**What it does:** An ordered list of to-do items, each optionally mandatory — used for onboarding, exit clearance, audit prep, and any tracked multi-item procedure.

**Shape:**
```jsonc
{ "kind": "checklist",
  "items": [ { "label": "Collect ID badge",            "mandatory": true },
             { "label": "Revoke system access",        "mandatory": true },
             { "label": "Exit interview scheduled",    "mandatory": false } ] }
```

**On the canvas:** a single **Configuration** node with a row editor — add/remove items, toggle mandatory per row.

**Example — Exit Clearance Checklist (Employee Lifecycle):**
> "Collect ID badge" (mandatory), "Revoke system access" (mandatory), "Return laptop & peripherals" (mandatory), "Exit interview scheduled" (optional). Attached to the Employee Lifecycle exit process so HR can track clearance per leaver.

---

### 3.6 Template (`template`)

**What it does:** Reusable message or document content — HR letters, certificates, and notification bodies — with a delivery channel and an optional triggering event.

**Shape:**
```jsonc
{ "kind": "template",
  "body": "Dear {{employee.name}},\n\nThis is to certify that you are employed with {{company.name}} as {{employee.position}} since {{employee.joinDate}}.",
  "channel": "Email",                 // Email | In-app | SMS
  "event": "Employment letter requested",
  "templateKind": "letter" }          // letter | notification
```

**On the canvas:** a single **Configuration** node; the inspector gives a body textarea plus channel / event / template-kind controls.

**Example — Employment Certificate Letter (HR Letters & Certificates):**
> A `letter` template with placeholder tokens for name, position and join date, delivered by Email when an employee requests an employment certificate from Self Service. Editing the body and saving creates a new version; older letter text stays in history.

---

### 3.7 Alert (`alert`)

**What it does:** A trigger-plus-channels notification rule: *when X happens, notify via these channels*. Lighter than a full flow — no steps, just the event and delivery.

**Shape:**
```jsonc
{ "kind": "alert",
  "trigger": "Probation ending in 7 days",
  "channels": ["Email", "In-app"] }   // any of Email | In-app | SMS
```

**On the canvas:** a single **Configuration** node; inspector shows a trigger text field and channel checkboxes.

**Example — Probation Ending Alert (Employees):**
> Trigger "Probation ending in 7 days", channels Email + In-app. Managers and HR get advance notice to complete the confirmation review; ticking SMS in the inspector and saving adds a third channel as v2.

---

### 3.8 Setting (`setting`)

**What it does:** A single key/value configuration knob. The atoms of module behaviour — limits, counts, feature switches — each individually versioned, scoped, and auditable (unlike a monolithic settings page).

**Shape:**
```jsonc
{ "kind": "setting", "key": "wfh.maxDaysPerMonth", "value": "8" }
```

**On the canvas:** a single **Configuration** node; inspector shows key + value inputs.

**Example — WFH Monthly Cap (Leave Management):**
> `wfh.maxDaysPerMonth = 8`. The Leave module reads this to cap work-from-home requests. Changing the value to `10` and saving bumps it to v2 with a history line — and because it's a workflow, a Group Company Admin can disable it at their level while other groups keep it active. (Another real seed: `recruitment.interviewRounds = 3`.)

---

### 3.9 Category list (`category-list`)

**What it does:** A managed list of options that other screens consume as their dropdown/classification values — document categories, asset types, grievance categories, and so on. Each item can be deactivated without deleting it (so historical records keep their label).

**Shape:**
```jsonc
{ "kind": "category-list",
  "items": [ { "id": "cat-a1b2c3", "label": "Offer Letter",   "active": true },
             { "id": "cat-d4e5f6", "label": "ID Proof",       "active": true },
             { "id": "cat-g7h8i9", "label": "Legacy Contract","active": false } ] }
```

**On the canvas:** a single **Configuration** node; inspector row editor with per-item active checkbox. Existing item ids are preserved on edit; new rows get fresh ids.

**Example — Document Categories (Documents):**
> The list of categories the document vault offers when uploading: Offer Letter, ID Proof, Certificates, Payslip archive. Deactivating "Legacy Contract" hides it from new uploads while old documents keep their tag.

---

### 3.10 Calendar (`calendar`)

**What it does:** Date/time structures the organization runs on. Three calendar types:
- **Holiday** — named dates (label + date)
- **Shift pattern** — recurring shifts (label + start/end time + weekdays)
- **Business hours** — working windows (label + start/end time + weekdays)

**Shape:**
```jsonc
{ "kind": "calendar",
  "calendarType": "holiday",          // holiday | shift | business-hours
  "entries": [ { "label": "Republic Day",     "date": "2026-01-26" },
               { "label": "Independence Day", "date": "2026-08-15" } ] }
// shift/business-hours entries instead use:
//   { "label": "Morning shift", "startTime": "06:00", "endTime": "14:00", "days": ["Mon","Tue","Wed","Thu","Fri"] }
```

**On the canvas:** a single **Configuration** node; the inspector adapts its entry rows to the calendar type (date picker for holidays; time range + weekday checkboxes for shifts/business hours).

**Example — Company Holiday Calendar (Time & Attendance):**
> A `holiday` calendar listing the year's public holidays. Attendance and leave accrual both consume it — leave applications spanning a holiday don't debit that day. A second workflow, "Morning Shift Pattern" (`shift`, 06:00–14:00 Mon–Fri), drives roster displays.

---

## 4. Quick reference

| Kind | Payload essence | Canvas representation | Typical consumer |
|---|---|---|---|
| Process flow | Full canvas doc (trigger + any steps) | The doc itself, full palette, test-runnable | Any automated process |
| Approver chain | Ordered `{role, slaHours}` steps | One Approval task node per step | Leave, assets, offers |
| Decision rule | Conditions + one outcome | Rule condition nodes + one Rule outcome node | Auto-routing/gating requests |
| Custom form | Field definitions | Configuration node + field editor | Extending base forms |
| Checklist | Items with mandatory flag | Configuration node + row editor | Onboarding/exit/clearance |
| Template | Body + channel + event | Configuration node + body editor | Letters, notifications |
| Alert | Trigger + channels | Configuration node + trigger/channel editor | Reminders, escalations |
| Setting | Key/value | Configuration node + key/value inputs | Module behaviour knobs |
| Category list | Items with active flag | Configuration node + row editor | Dropdown/classification sources |
| Calendar | Typed date/shift entries | Configuration node + type-aware entry editor | Attendance, leave, rosters |

**Invariants worth remembering**
- `definition.kind` always equals the workflow's type — the canvas converters enforce this on save.
- Saves that would lose data are refused with a human-readable error; the stored version never silently degrades.
- Every save = version bump + history entry. Every scope toggle, attachment change, and folder move is also in history.
- Scope activation is hierarchical: enabled at Company means nothing if Platform has it off.
- Bundles are portable JSON (`satellitehr.artifacts` v1) and round-trip folders, attachments, and full history.
