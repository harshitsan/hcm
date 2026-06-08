# Department Head / People Manager — User Stories

> A Department Head / People Manager is a line manager of an assigned team — their primary reports (matrix/functional approvals are the separate [Functional / Project Manager](functional-project-manager.md) role). Their authority is limited to their assigned team. They live in the unified approval inbox: clearing leave, attendance, and lifecycle requests for their people on time, while keeping visibility of who's in, who's out, and where their team sits in the org.

## Scope & access

- **Authority level: team only.** The People Manager operates within a single company context and only over employees who report to them — their primary reports and, where applicable, dotted-line/matrix reports. A Functional/Project Manager variant sees only employees in their assigned functional group, with approval rights limited to that scope (BRD §5.6).
- **Manager hierarchy basis.** Visibility and approval routing derive from the employee Manager Hierarchy: Primary Manager (exactly one per employee), optional Dotted-Line/Matrix Managers, and Temporary/Acting Manager assignments with automatic delegation. All assignment changes are effective-dated with audit trail (BRD §6.9.5).
- **Can do (within team scope):**
  - Approve, reject, or request changes on leave requests routed to them (BRD §6.17).
  - Approve attendance correction/exception requests, overtime, and shift-swap requests for their team (BRD §6.18).
  - Approve assigned onboarding steps, participate in probation confirmation (Manager → Department Head → HR), participate in performance workflows, and complete exit-clearance tasks for their function (BRD §6.15).
  - Initiate lifecycle actions for their reports — e.g., raise a transfer request — subject to downstream HR/approval workflow (BRD §6.15).
  - Delegate their own approval authority to another user in the same company for a period (BRD §6.12).
  - View their team directory, the org chart, and the team leave calendar (BRD §6.21, §6.17).
  - View role- and policy-permitted information for their team members (directory, leave balances, attendance, lifecycle status) (BRD §6.21).
- **Cannot do (explicit boundaries):**
  - No company-wide configuration: cannot create/edit policies, leave types, workflows, roles, departments, positions, holiday calendars, or company settings (FS §7.1 — these are Company Admin / Platform roles).
  - No role or permission assignment, no user provisioning (BRD §5.5, FS §7.1).
  - No administrative overrides of leave balances or attendance records — those are HR Administrator powers with mandatory reason (BRD §6.17.4, §6.18.7).
  - No access to other teams' or other employees' sensitive data; row-level/tenant boundaries always apply (BRD §7.15, FS §7.2).
  - No company context switching to other companies and no cross-company directory/reporting (those are Portfolio/Group roles) (FS §7.1).
  - Approvals are always limited to their scope — a Functional/Project Manager cannot approve for employees outside their functional group (BRD §5.6).

## User stories

### Unified approval inbox (Workflow Engine, Notifications)

- **US-MGR-01** — As a People Manager, I want a single unified inbox on my home screen that lists every pending approval and request assigned to me (leave, attendance, onboarding, transfers, exit clearance, letters, policy sign-offs), so that I can clear my plate from one place instead of hunting through seven screens. (BRD §6.25; FS §3 unified-inbox pattern)
  - **Acceptance criteria:**
    - **Given** I have pending items across multiple modules, **When** I open my inbox, **Then** each item shows its type tag, requester, submitted date, and SLA/deadline timer.
    - **Given** items are routed to me by the workflow engine, **When** an item is for an employee outside my team scope, **Then** it does not appear in my inbox.
    - **Given** I select multiple same-type items, **When** I choose bulk Approve/Reject, **Then** each decision is applied and individually audit-logged.
- **US-MGR-02** — As a People Manager, I want each inbox item to show its SLA deadline and how close it is to breaching, so that I act on the most urgent requests first. (BRD §6.25.4)
- **US-MGR-03** — As a People Manager, I want to receive an email (and optional in-app) notification when a new request is routed to me and again as reminders before an SLA breach, so that nothing falls through the cracks while I'm away from the inbox. (BRD §6.27.2, §6.25.4)
- **US-MGR-04** — As a People Manager, I want to add a comment/reason when I reject or request changes on any request, so that the requester understands the decision and the action is traceable. (BRD §6.25.5)

### Leave approvals (Leave Management)

- **US-MGR-05** — As a People Manager, I want to approve or reject leave requests submitted by my team members, so that time off is authorized fairly and recorded against the right balance. (BRD §6.17.3)
  - **Acceptance criteria:**
    - **Given** a team member submits a leave request, **When** the workflow routes it to me, **Then** I see the leave type, dates, duration, current balance, and any overlap with teammates.
    - **Given** I approve the request, **When** the decision is saved, **Then** the employee's balance is reduced, the leave appears on the team calendar, and the employee is notified.
    - **Given** I reject the request, **When** I submit, **Then** I must provide a reason and the employee is notified with that reason.
- **US-MGR-06** — As a People Manager, I want to see each requester's remaining leave balance and entitlement context at the point of decision, so that I approve with full information rather than guessing. (BRD §6.17.5, §6.17.6)
- **US-MGR-07** — As a People Manager, I want to view a team leave calendar showing who is off and when, including overlaps and coverage gaps, so that I can protect team coverage before approving more leave. (BRD §6.17.5)
  - **Acceptance criteria:**
    - **Given** I open the team calendar, **When** it loads, **Then** it shows only my team's approved and pending leave with coverage indicators.
    - **Given** two reports request overlapping dates, **When** I review the second request, **Then** the calendar flags the overlap so I can decide on coverage.
- **US-MGR-08** — As a People Manager, I want leave requests to follow the configured sequential or parallel approval steps (e.g., Manager then HR), so that my approval is one defined step and escalations happen automatically if I'm unavailable. (BRD §6.17.3, §6.25.3)
- **US-MGR-09** — As a People Manager, I want to understand that I cannot override leave rules or balances (only HR can, with a mandatory reason and audit trail), so that exceptions go through the correct authority. (BRD §6.17.4)

### Attendance approvals (Time and Attendance)

- **US-MGR-10** — As a People Manager, I want to approve or reject attendance correction requests from my team (missed punch, late arrival, early exit), so that their attendance record reflects what actually happened. (BRD §6.18.5)
  - **Acceptance criteria:**
    - **Given** a report raises a correction request, **When** it routes to me, **Then** I see the original record, the requested change, and the stated reason.
    - **Given** I approve a correction, **When** saved, **Then** the corrected record and my approval are written to the audit trail.
    - **Given** I take no action before the SLA, **When** the deadline passes, **Then** the request escalates per the configured escalation rule.
- **US-MGR-11** — As a People Manager, I want to review and approve overtime claimed by eligible team members, so that extra hours are validated against actual work before they feed downstream processes. (BRD §6.18.4)
- **US-MGR-12** — As a People Manager, I want to approve shift-swap requests between my team members, so that roster changes are authorized and the roster stays accurate. (BRD §6.18.2)
- **US-MGR-13** — As a People Manager, I want to see exceptions and anomalies in my team's attendance surfaced for review, so that I can catch and act on issues without combing raw logs. (BRD §6.18.5)

### Onboarding, probation, performance & exit (Employee Lifecycle Management)

- **US-MGR-14** — As a People Manager, I want to approve the onboarding steps assigned to me for a new hire on my team, so that the checklist progresses and the person is ready for day one. (BRD §6.15.1)
  - **Acceptance criteria:**
    - **Given** a new hire's onboarding checklist has a step assigned to me, **When** I open it, **Then** I see the step, its prerequisites, and any attached documents.
    - **Given** I complete/approve my step, **When** saved, **Then** the checklist advances to the next stage and the completion is audit-logged.
- **US-MGR-15** — As a People Manager, I want to participate in the probation-confirmation workflow for my reports (Manager → Department Head → HR) with an evaluation and a recommendation, so that confirmation decisions are informed by the person's actual manager. (BRD §6.15.2)
  - **Acceptance criteria:**
    - **Given** a report nears probation end, **When** the confirmation workflow starts, **Then** I can record evaluation criteria and a recommended outcome (Confirm, Extend, or Initiate Separation).
    - **Given** I submit my recommendation, **When** saved, **Then** it routes to the Department Head/HR per the configured hierarchy and is audit-logged.
- **US-MGR-16** — As a People Manager, I want to participate in performance workflows for my team, so that performance milestones are captured against the right manager and feed lifecycle decisions. (BRD §6.15.5)
- **US-MGR-17** — As a People Manager, I want to complete my function's clearance tasks during a team member's exit (parallel clearance by function), so that the exit can complete cleanly without my step blocking it. (BRD §6.15.4)
  - **Acceptance criteria:**
    - **Given** a report initiates exit, **When** the clearance workflow runs, **Then** my functional clearance task appears in my inbox alongside other parallel clearances.
    - **Given** I complete my clearance, **When** saved, **Then** my task is marked done and the overall exit status reflects remaining parallel clearances.
- **US-MGR-18** — As a People Manager, I want to confirm recovery of assets assigned to a departing report as part of exit clearance, so that company equipment is accounted for before final exit. (BRD §6.20.5, §6.15.4)
- **US-MGR-34** — As a People Manager, I want to assign and track knowledge-transfer tasks for a departing or transferring report, so that critical know-how is handed over to teammates before they leave. (BRD §6.15)
  - **Acceptance criteria:**
    - **Given** a report on my team initiates exit or transfer, **When** the lifecycle workflow runs, **Then** I can create knowledge-transfer tasks, assign each to a recipient teammate, and set a due date before the effective leaving date.
    - **Given** knowledge-transfer tasks are assigned, **When** I view the report's exit/transfer status, **Then** I see each task's owner, due date, and completion status so I can chase outstanding handovers.
    - **Given** all knowledge-transfer tasks are completed, **When** the handover is confirmed, **Then** the completion is audit-logged and reflected in the report's exit/transfer clearance status.

### Lifecycle initiation & transfers (Employee Lifecycle Management)

- **US-MGR-19** — As a People Manager, I want to initiate a transfer request for one of my reports (inter-department, inter-location), so that an org change I'm aware of enters the proper approval workflow. (BRD §6.15.3)
  - **Acceptance criteria:**
    - **Given** I initiate a transfer for a report, **When** I submit, **Then** I provide the target department/location and effective date, and it routes for approval rather than taking effect immediately.
    - **Given** the transfer is approved downstream, **When** it becomes effective, **Then** the change is effective-dated and audit-logged, and I am notified of the outcome.
- **US-MGR-20** — As a People Manager, I want to initiate other in-scope lifecycle actions for my reports (e.g., flagging a separation through probation), so that I can start the right process while HR retains final authority. (BRD §6.15)
- **US-MGR-21** — As a People Manager receiving a transferred employee, I want their lifecycle, leave, and reporting line to reflect the new manager assignment once effective, so that I can manage them from the effective date with accurate context. (BRD §6.9.5, §6.15.3)

### Delegation of approvals (Roles and Security)

- **US-MGR-22** — As a People Manager going on leave, I want to delegate my approval authority to another user in the same company for a defined period, so that my team's requests keep moving while I'm away. (BRD §6.12.3)
  - **Acceptance criteria:**
    - **Given** I set up a delegation with a delegate and date range, **When** the period is active, **Then** requests routed to me also appear in my delegate's inbox.
    - **Given** the delegation period ends, **When** it expires, **Then** approval routing reverts to me and the delegation event is audit-logged.
- **US-MGR-23** — As a People Manager, I want delegated approvals to remain visible to me and the appropriate hierarchy, so that I retain oversight of decisions made on my behalf. (BRD §6.12.3)
- **US-MGR-24** — As a temporary/acting manager assigned to a team, I want automatic delegation of the absent manager's approvals to me, so that the team has continuous coverage without manual setup. (BRD §6.9.5)
- **US-MGR-33** — As a People Manager who delegated my approval authority, I want to revoke an active delegation before its end date, so that I can resume my own approvals immediately when I return early, with the revocation audit-logged. (BRD §6.12.3)
  - **Acceptance criteria:**
    - **Given** I have an active delegation to a delegate, **When** I open the delegation and choose Revoke, **Then** the delegation is ended effective immediately rather than at its scheduled end date.
    - **Given** I revoke the delegation, **When** the revocation is saved, **Then** approval routing reverts to me, the delegate no longer sees my routed items in their inbox, and the revocation event is recorded in the audit trail with actor, timestamp, and the original end date.
    - **Given** items were already routed to the delegate during the active period, **When** I revoke, **Then** any decisions the delegate already made remain valid and visible, and only undecided items revert to me.

### Team directory & org chart (Employee Directory and Org Chart)

- **US-MGR-25** — As a People Manager, I want to browse a directory of my team members with their name, photo, position, department, location, and permitted contact details, so that I have a quick people map of my team. (BRD §6.21.1)
- **US-MGR-26** — As a People Manager, I want to view the org chart for my reporting line, so that I can see my team's structure and reporting relationships at a glance. (BRD §6.21.2)
- **US-MGR-27** — As a People Manager, I want directory/contact visibility to respect privacy controls and exclude sensitive fields, so that I only see what my role and company privacy policy permit. (BRD §6.21.5)
  - **Acceptance criteria:**
    - **Given** I search the directory, **When** results return, **Then** they are scoped to my team and tenant, and sensitive fields are excluded.
    - **Given** I attempt to view an employee outside my scope, **When** the request is evaluated, **Then** access is denied and the attempt respects tenant/row-level security.
- **US-MGR-28** — As a People Manager, I want to filter and search within my team by position, location, group, or status, so that I can quickly find the right person or subset of my team. (BRD §6.21.3)

### Team member info & self-service context (Employee Self-Service, Reporting)

- **US-MGR-29** — As a People Manager, I want to view a team member's relevant employment information (position, department, leave balance, attendance summary, lifecycle status) within what my role permits, so that I can manage and approve with proper context. (BRD §6.16.4, §6.21)
- **US-MGR-30** — As a People Manager, I want to read announcements targeted to my department/team, so that I stay informed of organizational messages relevant to my people. (BRD §6.14.3)
- **US-MGR-31** — As a People Manager, I want to view operational reports scoped to my team (e.g., team leave usage, attendance/coverage), so that I can manage capacity — with all reports filtered to my access only. (BRD §6.23.2, §6.23.6)
  - **Acceptance criteria:**
    - **Given** I open a team report, **When** it renders, **Then** it includes only employees within my scope and current company context.
    - **Given** I am not a Portfolio/Group user, **When** I view reports, **Then** no cross-company or other-team data is available to me.
- **US-MGR-32** — As a Functional/Project Manager in a matrix setup, I want my visibility and approval rights limited to employees in my assigned functional group, so that I act only on the people I actually oversee. (BRD §5.6)
  - **Acceptance criteria:**
    - **Given** I hold a Functional/Project Manager role, **When** requests are routed, **Then** I only receive approvals for employees in my functional group.
    - **Given** an employee is outside my functional group, **When** I attempt any approval or view, **Then** the action is denied.

## Primary journeys

1. **Approve a leave request**
   1. Employee submits a leave request from self-service.
   2. Workflow engine routes it to my unified inbox with an SLA timer and an email notification.
   3. I review the leave type, dates, the requester's balance, and the team calendar for coverage/overlaps.
   4. I approve (balance reduces, leave shows on team calendar, employee notified) or reject with a reason; the decision is audit-logged. If I don't act in time, it escalates automatically.

2. **Approve an attendance correction**
   1. Team member raises a missed-punch/late-arrival correction.
   2. Item lands in my inbox with the original record, requested change, and stated reason.
   3. I approve or reject; on approval the corrected record and my decision are written to the audit trail. (Balance/record overrides beyond correction remain an HR-only power.)

3. **Onboard and confirm a new hire**
   1. New hire's onboarding checklist runs; steps assigned to me appear in my inbox.
   2. I complete my onboarding step(s); the checklist advances.
   3. At probation end, I record an evaluation and recommend Confirm / Extend / Initiate Separation.
   4. My recommendation routes to Department Head → HR per the configured hierarchy; outcome is audit-logged.

4. **Delegate approvals before leave**
   1. Before going away, I set a delegation to a colleague for a date range.
   2. During that period, requests routed to me also appear in my delegate's inbox, with decisions visible to me and the hierarchy.
   3. The delegation expires automatically; routing reverts to me and the event is audit-logged.

## Notes & Phase 2

- **Phase 2 — not available to this role in Phase 1:**
  - **Contractor management/approvals.** Approving leave/attendance/onboarding for contractors and contractor-specific workflow variations are Phase 2 (Phase II BRD §1, §6) — in Phase 1 the People Manager manages employees only.
  - **Mobile approvals.** Approving from a native mobile app with push notifications is Phase 2; Phase 1 approvals are via responsive web (BRD §6.16.1; Phase II BRD Mobile App). Email notifications are available in Phase 1.
  - **Payroll-linked actions.** Anything that feeds payroll computation/disbursement (e.g., final settlement amounts) is Phase 2; the People Manager's role stays at approving the HR events (leave, overtime, exit clearance) that later feed payroll (Phase II BRD §3, §7).
  - **Compliance/statutory tasks.** India statutory compliance enablement is Phase 2 and not a People Manager responsibility (Phase II BRD §2, §5).
- **Cross-cutting dependencies:**
  - **Workflow engine (BRD §6.25):** routes every approval to the right manager, enforces sequential/parallel patterns, SLAs, escalation, and delegation — the backbone of the People Manager experience.
  - **Notifications (BRD §6.27):** email (mandatory) and optional in-app alerts for new approvals, reminders, escalations, and outcomes.
  - **Audit & logging (BRD §6.29):** every approval, rejection, correction, recommendation, transfer initiation, and delegation must be recorded with actor, before/after values, and timestamp.
  - **RBAC (BRD §6.12, FS §7.1):** scopes the People Manager to their team/functional group and explicitly excludes config, role assignment, and admin overrides.
  - **Tenant isolation & row-level security (BRD §7.15, FS §7.2):** all directory, reporting, and team-info access is confined to the current company context and the manager's scope; no cross-team or cross-company leakage.
  - **Manager hierarchy & effective dating (BRD §6.9.5):** primary, dotted-line, and temporary/acting manager assignments — all effective-dated — determine what the People Manager can see and approve at any point in time.
