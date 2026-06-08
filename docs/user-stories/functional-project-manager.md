# Functional Manager / Project Manager — User Stories

> The Functional Manager / Project Manager is a matrix (dotted-line) manager who oversees employees in one or more assigned functional or project groups rather than a direct reporting line. They care about getting timely visibility of their matrixed reports and acting only on the approvals routed to them within their assigned scope, without owning company-wide configuration. (BRD §5.6, §6.9.5)

## Scope & access

- **Authority level:** Functional / project group scope only — narrower than the line Department Head / People Manager. Their reach is defined by the functional/project groups (BRD §6.6) they are assigned to as a dotted-line / matrix manager (BRD §6.9.5 "Dotted-Line Manager").
- **Single-company context:** All access is bound to the company context they are operating in (FS §7.2 tenant isolation). They are not a multi-company role; if they happen to hold roles in more than one company, those are separate, independently scoped assignments and never merge.
- **What they CAN do:**
  - View employees who belong to their assigned functional/project group(s) — profile, position, department, group membership, and dotted-line relationship to them (BRD §6.9, §6.21).
  - Act as an assigned approver in workflows routed to them for in-scope reports: approve/reject leave requests (BRD §6.17), attendance exceptions / corrections (BRD §6.18), and timesheet/attendance entries where they are the configured matrix approver (BRD §6.18, §6.25).
  - Participate in workflow steps where they are explicitly named as an approver (BRD §6.25), and clear those items from a unified inbox of in-scope approvals (Roadmap §5.3c).
  - View team/group leave calendars and coverage for their functional group to plan project work (BRD §6.17).
  - Delegate their own in-scope approval authority to another user within the same company when unavailable (BRD §6.12.3), with full audit trail.
  - View operational reports filtered to their functional group only (BRD §6.23, row-level security).
- **Explicit BOUNDARIES — what they CANNOT do:**
  - **No access outside their functional/project group.** They cannot see, search, or report on employees who are not members of their assigned group(s) (BRD §6.6, §6.21 privacy controls).
  - **No company-wide administration.** No company setup, master-data ownership, policy creation/configuration, role/permission assignment, or user provisioning — those belong to the Company Super Administrator / HR Administrator (BRD §5.5, FS §7.1).
  - **Approvals are strictly scope-limited.** They can only act on items the workflow engine has routed to them as the assigned matrix approver; they cannot approve for employees outside their functional group or override the line manager's chain (BRD §6.9.5, §6.25).
  - **No administrative overrides.** They cannot override leave balances, leave rules, or attendance records — that is reserved for HR Administrators (BRD §6.17.4, §6.18.7).
  - **Not a People Manager.** They do not initiate or own lifecycle actions (onboarding ownership, probation confirmation decisions, transfers, exits) unless explicitly named as an approver in a configured step; the primary line manager and HR own those (BRD §5.6, §6.15).
  - **No cross-company / portfolio / group reach.** No context switching to companies they are not authorized for; no portfolio or group-company consolidated reporting (FS §7.1, §7.2).

## User stories

### Matrix team visibility (Employee Directory & records)

- **US-FPM-01** — As a functional/project manager, I want to view the list of employees in my assigned functional/project group, so that I know exactly who I am responsible for in matrix mode. (BRD §6.6, §6.21)
  - **Acceptance criteria:**
    - **Given** I am a matrix manager assigned to functional group "Data Platform" in Company A, **when** I open my team view, **then** I see only employees who are members of that group (or who report to me on a dotted line) and no other employees.
    - **Given** an employee is not a member of any of my assigned groups, **when** I search the directory, **then** that employee is not returned in my results.
- **US-FPM-02** — As a functional/project manager, I want to view the in-scope profile of an employee in my group (name, position, department, group membership, dotted-line relationship), so that I can understand their role on my project. (BRD §6.9, §6.21)
  - **Acceptance criteria:**
    - **Given** I open the profile of an in-scope employee, **when** the page loads, **then** I see role-appropriate fields only and sensitive information excluded by privacy controls is not shown.
    - **Given** I attempt to open the profile of an out-of-scope employee via a direct link, **then** access is denied and the attempt is logged.
- **US-FPM-03** — As a functional/project manager, I want to see the dotted-line/matrix reporting relationship between me and each in-scope employee, so that I can confirm I am their assigned functional manager and not their primary line manager. (BRD §6.9.5)
- **US-FPM-04** — As a functional/project manager, I want to view the org-chart / group structure for my functional group, so that I can see how my matrixed reports relate to one another. (BRD §6.21)
- **US-FPM-05** — As a functional/project manager, I want to use advanced search filtered to my group (by name, position, location, status), so that I can quickly locate a specific project member. (BRD §6.21)

### Leave approvals (within scope)

- **US-FPM-06** — As a functional/project manager, I want to receive leave requests routed to me as the assigned matrix approver, so that I can decide on time off that affects my project. (BRD §6.17, §6.25)
  - **Acceptance criteria:**
    - **Given** a leave workflow is configured to route to the functional manager for an in-scope employee, **when** the employee submits a request, **then** the item appears in my inbox with employee, dates, leave type, and SLA timer.
    - **Given** I approve or reject the request, **then** the decision, my identity, and a timestamp are written to the workflow audit trail and the employee is notified.
    - **Given** a leave request belongs to an employee outside my functional group, **then** it never appears in my inbox.
- **US-FPM-07** — As a functional/project manager, I want to add a reason/comment when I reject a leave request, so that the employee and HR understand the project-coverage rationale. (BRD §6.17, §6.27)
- **US-FPM-08** — As a functional/project manager, I want to view the leave calendar for my functional group, so that I can assess project coverage before approving overlapping time off. (BRD §6.17)
  - **Acceptance criteria:**
    - **Given** I open the group leave calendar, **when** it renders, **then** it shows only members of my assigned functional group and respects tenant and group boundaries.
- **US-FPM-09** — As a functional/project manager, I want to see the current leave balance context on a request routed to me, so that I can make an informed approval decision without editing the balance. (BRD §6.17)
  - **Acceptance criteria:**
    - **Given** I view a routed leave request, **then** I can see the relevant balance as read-only and I have no control to override or adjust it.

### Attendance & timesheet approvals (within scope)

- **US-FPM-10** — As a functional/project manager, I want attendance correction / exception requests for my in-scope reports routed to me where I am the assigned approver, so that I can confirm project hours are accurate. (BRD §6.18, §6.25)
  - **Acceptance criteria:**
    - **Given** an attendance exception (missed punch, late arrival, early exit) is configured to route to me for an in-scope employee, **when** it is raised, **then** it appears in my inbox and I can approve or reject it with audit capture.
- **US-FPM-11** — As a functional/project manager, I want to review and approve timesheet/attendance entries for project members where I am the configured matrix approver, so that effort against my project is validated before it flows downstream. (BRD §6.18, §6.25)
- **US-FPM-12** — As a functional/project manager, I want to view (read-only) attendance summaries for my functional group, so that I can spot coverage gaps on the project. (BRD §6.18, §6.23)
  - **Acceptance criteria:**
    - **Given** I open an attendance summary, **then** records are filtered to my functional group only and I have no ability to override or edit any attendance record.
- **US-FPM-13** — As a functional/project manager, I want overtime requests for in-scope reports routed to me when I am the assigned approver, so that extra project hours are authorized through the correct matrix path. (BRD §6.18)

### Workflow participation & unified inbox

- **US-FPM-14** — As a functional/project manager, I want a single unified inbox listing every approval routed to me across leave, attendance, and timesheets, so that I can clear my in-scope items in one place. (BRD §6.25, Roadmap §5.3c)
  - **Acceptance criteria:**
    - **Given** I have pending items of different types, **when** I open my inbox, **then** each item shows a type tag, the in-scope employee, and an SLA/deadline indicator.
    - **Given** I bulk-approve selected items, **then** each decision is recorded individually in the audit trail.
    - **Given** an item is not routed to me as an assigned approver, **then** it never appears in my inbox.
- **US-FPM-15** — As a functional/project manager, I want to participate in any workflow step where I am explicitly named as an approver, so that I can act on configured matrix-approval paths beyond leave and attendance. (BRD §6.25)
- **US-FPM-16** — As a functional/project manager, I want to see SLA timers and receive reminders on items pending with me, so that I do not block my project team by missing a deadline. (BRD §6.25, §6.27)
  - **Acceptance criteria:**
    - **Given** an item assigned to me approaches its SLA, **when** the 50% and 75% thresholds are reached, **then** I receive reminder notifications, and at 100% the item escalates per the configured rule.
- **US-FPM-17** — As a functional/project manager, I want to view the full routing and decision history of an approval that came to me, so that I can see who acted before me in the chain. (BRD §6.25)
- **US-FPM-18** — As a functional/project manager, I want my approval action to be captured immutably in the audit trail, so that there is a defensible record of every matrix decision I made. (BRD §6.25, §6.29)

### Delegation

- **US-FPM-19** — As a functional/project manager, I want to delegate my in-scope approval authority to another authorized user in the same company when I am unavailable, so that my project's approvals are not blocked. (BRD §6.12.3)
  - **Acceptance criteria:**
    - **Given** I set a delegate within the same company, **when** new in-scope items are routed, **then** they also appear for my delegate and the delegation is recorded in the audit trail.
    - **Given** I attempt to delegate to a user outside the company, **then** the action is rejected.
- **US-FPM-20** — As a functional/project manager, I want to set a start and end date on my delegation, so that approval authority returns to me automatically when I am back. (BRD §6.12.3)

### Notifications

- **US-FPM-21** — As a functional/project manager, I want email notifications when a request is routed to me for action, so that I act promptly even when I am not in the app. (BRD §6.27)
- **US-FPM-22** — As a functional/project manager, I want to set my notification channel and frequency preferences, so that matrix-approval alerts reach me the way I prefer without noise. (BRD §6.27)

### Reporting (scoped, read-only)

- **US-FPM-23** — As a functional/project manager, I want to run standard leave and attendance reports filtered to my functional group, so that I can review my project team's time data. (BRD §6.23)
  - **Acceptance criteria:**
    - **Given** I run any report, **when** results are generated, **then** row-level security limits the output to employees in my assigned functional group within the current company only.
- **US-FPM-24** — As a functional/project manager, I want to save and re-run a report view scoped to my group, so that I can repeat the same project review without rebuilding filters. (BRD §6.23)
- **US-FPM-25** — As a functional/project manager, I want to export my in-scope report results, so that I can share project-coverage status in a project review. (BRD §6.23)

## Primary journeys

1. **Approve in-scope leave with coverage check.** A project member submits leave → the workflow engine routes it to the functional manager as the assigned matrix approver → the item lands in the unified inbox with an SLA timer → the manager opens the group leave calendar to confirm coverage → approves (or rejects with a reason) → the employee is notified and the decision is written to the audit trail.

2. **Clear the daily approval queue.** The functional manager opens the unified inbox at the start of the day → sees leave, attendance-correction, and timesheet items, each tagged and showing a deadline → reviews each in-scope item → bulk-approves the routine ones and handles exceptions individually → every decision is logged.

3. **Validate project effort.** A project member submits timesheet/attendance entries → entries route to the functional manager as the configured approver → the manager reviews hours against expected project effort, approving correct entries and rejecting anomalies with comments → approved effort flows downstream.

4. **Cover during absence via delegation.** Before going on leave, the functional manager sets a same-company delegate with a start/end date → in-scope items route to both during the window → approvals continue uninterrupted → authority returns automatically at the end date, all captured in the audit trail.

## Notes & Phase 2

- **Cross-cutting dependencies:**
  - **Workflow engine (BRD §6.25):** This role's authority is realized entirely through being a configured/assigned approver. The data-driven, run-time-configurable engine (Roadmap Gap 3a) must support routing to a dotted-line/functional-group approver and enforce that items reach only the assigned manager.
  - **RBAC & scoping (BRD §6.12, FS §7.1):** "Functional Manager / Project Manager" is a persona; the effective capabilities are the composable permission set bound to the assigned functional/project group(s). The same user may hold an entirely different role in another company.
  - **Tenant isolation & row-level security (FS §7.2, BRD §6.3):** All views, inboxes, calendars, and reports must be filtered to the current company and to the manager's assigned group(s); out-of-group employees must be invisible.
  - **Notifications (BRD §6.27):** Email is the mandatory channel for routed approvals, reminders, and escalations; in-app is optional.
  - **Audit (BRD §6.29):** Every approval, rejection, delegation, and cross-boundary access attempt is recorded immutably.
  - **Effective-dated matrix assignments (BRD §6.9.5, Roadmap Gap 1d/D4):** Dotted-line manager assignments are effective-dated; this role's visible scope must follow the current effective assignment.
- **Phase 2 deferrals (clearly marked):**
  - **Contractors in scope (Phase 2):** If a functional/project manager oversees contractors in their group, contractor visibility and contractor-specific approval workflows are **Phase 2** (Phase II BRD §1, §6). Phase 1 stories cover employees only.
  - **Mobile approvals (Phase 2):** Approving from a native mobile app with push notifications is **Phase 2** (BRD §3.2); Phase 1 is responsive web only.
  - **Payroll-linked timesheet outcomes (Phase 2):** Any flow of approved attendance/overtime into payroll computation is **Phase 2** (Phase II BRD §3, §7); Phase 1 approvals stop at the HR/attendance record.
  - **Advanced analytics / predictive project staffing:** Out of scope for Phase 1 (BRD §3.3); this role gets standard scoped reports only.
