# Employee – Standard — User Stories
> The Employee (role: **Employee – Standard**) is a regular staff member of one company who uses SatelliteHR's web self-service to manage their **own** record — profile, leave, attendance, documents, letters, policies, and announcements. They care most about getting everyday HR tasks done quickly without going through the HR inbox, and about always seeing accurate information about themselves.

## Scope & access
- **Authority level: self only.** An Employee acts on their **own** employee record within a **single company** (the company tied to their current authenticated context). They have no platform, portfolio, group, company-admin, or team authority. (BRD §5.7, FS §7.1)
- **Identity boundary (User != Employee != Contractor).** The Employee role is granted to a *User* login that is linked to one *Employee* record in a company. The same person may separately be an employee or contractor in another company; each is a distinct record, and this role never crosses that boundary. (BRD §1, §6.1, cross-module rules 1–7)
- **What they CAN do:**
  - View and update authorized fields of their own profile; raise change requests for sensitive fields. (BRD §6.16)
  - Submit leave requests, view their own balances and personal leave calendar. (BRD §6.17)
  - View their own attendance and raise correction requests for exceptions. (BRD §6.18)
  - Acknowledge policies in their policy inbox and re-acknowledge on change. (BRD §6.11)
  - Read announcements targeted to them. (BRD §6.14)
  - Access their own documents and download their own HR letters/certificates. (BRD §6.22, §6.28)
  - Submit and track feedback/grievance entries. (BRD §6.19)
  - Search the directory and view the org chart (privacy-controlled). (BRD §6.21)
  - Acknowledge assets issued to or recovered from them. (BRD §6.20)
  - Set their own notification preferences. (BRD §6.27)
- **What they CANNOT do (explicit boundaries):**
  - No approvals of any kind (leave, attendance, onboarding) — those belong to managers/HR. (BRD §5.6, §6.17)
  - No admin/config: cannot create or edit companies, departments, positions, groups, policies, workflows, roles, or other employees' records. The Admin navigation does not render for this role. (FS §7.1, Roadmap §5.2)
  - No cross-company access and no company-context switching — Employee is single-company; all data is tenant-isolated. (FS §7.1 "Switch to Authorized Companies = ❌", FS §7.2, cross-module rule 15)
  - No administrative overrides of leave/attendance, and no access to other employees' sensitive data. (BRD §6.17.4, §6.18.7, §6.19.2)
  - Cannot view audit trails or grievance information belonging to others. (BRD §6.19.2, §6.29.5)
- **Employee – Limited Access variant.** Some workers are assigned **Employee – Limited Access**: read-only access with only limited transactions permitted based on policy. Where a story below describes a transactional action (submit, request, acknowledge), a Limited-Access user sees it as read-only or restricted unless the company's policy explicitly enables it. (BRD §5.7)

## User stories

### Profile & self-service (Employee Self-Service — BRD §6.16)
- **US-EMP-01** — As an employee, I want to view my own personal and employment information in one place, so that I can confirm my details are correct. (BRD §6.16)
  - **Acceptance criteria:**
    - **Given** I am an authenticated employee linked to one company, **when** I open My Profile, **then** I see only my own record (name, department, position, location, manager, joining details) and no other employee's data.
    - **Given** tenant isolation is enforced, **when** my profile loads, **then** all data shown belongs to my current company context only.
- **US-EMP-02** — As an employee, I want to update the non-sensitive fields of my profile myself, so that my contact details stay current without emailing HR. (BRD §6.16, NFR §8.7.3 Right to Rectification)
  - **Acceptance criteria:**
    - **Given** a field is configured as employee-editable (e.g., personal phone, emergency contact), **when** I save a change, **then** the new value is stored and an audit entry is written (entity, field, previous value, new value, actor, timestamp).
    - **Given** a field is editable, **when** I attempt to edit a field outside my permission, **then** the field is read-only and the change is rejected.
- **US-EMP-03** — As an employee, I want to raise a change request for sensitive fields that I cannot edit directly, so that HR can review and apply the change through a workflow. (BRD §6.16, NFR §8.7.3)
- **US-EMP-04** — As an employee, I want my self-service screens limited to what my role and policy allow, so that I am never shown admin or other people's controls. (BRD §6.16, Roadmap §5.3d)
- **US-EMP-05** — As an employee, I want standard interactions (profile load, forms, searches) to respond in under 2 seconds, so that self-service feels fast. (BRD NFR §8.1)

### Leave (Leave Management — BRD §6.17)
- **US-EMP-06** — As an employee, I want to view my current leave balances by leave type, so that I know how much time off I have before requesting. (BRD §6.17)
  - **Acceptance criteria:**
    - **Given** I have entitlements for configured leave types (e.g., Privileged, Casual, Sick), **when** I open Leave, **then** I see my live remaining balance per type for my company's policy.
    - **Given** a leave request of mine is later approved, **when** I re-check my balance, **then** the balance reflects the deduction.
- **US-EMP-07** — As an employee, I want to submit a leave request by selecting type, dates, and reason, so that my time off is recorded and routed for approval. (BRD §6.17)
  - **Acceptance criteria:**
    - **Given** I have sufficient balance for the chosen leave type, **when** I submit a request, **then** it is created with status Pending and routed to my approver(s) via the configured workflow.
    - **Given** my balance is insufficient or the dates conflict with policy rules, **when** I submit, **then** I receive a clear validation message and no request is created.
    - **Given** my request is submitted, **then** a notification is sent to the approver and I can see the request's status.
- **US-EMP-08** — As an employee, I want to view the status of my leave requests (Pending, Approved, Rejected) and the reason on rejection, so that I always know where my request stands. (BRD §6.17, §6.27)
- **US-EMP-09** — As an employee, I want to cancel or withdraw a pending leave request, so that I can correct a mistake before it is approved. (BRD §6.17)
  - **Acceptance criteria:**
    - **Given** a leave request of mine is in "Pending" status, **when** I cancel it, **then** it is withdrawn, my approver is notified, and any provisionally-held balance is released. (BRD §6.17, §6.27.2)
    - **Given** a leave request has already been approved or rejected, **when** I view it, **then** the cancel/withdraw action is unavailable (a decided request can only be changed via HR override). (BRD §6.17.4)
- **US-EMP-10** — As an employee, I want to see my personal leave calendar, so that I can plan around my already-booked time off. (BRD §6.17 "Personal calendar for employees")
- **US-EMP-11** — As an employee, I want to be notified by email when my leave request is approved, rejected, or escalated, so that I do not have to keep checking the portal. (BRD §6.17, §6.27)

### Time & attendance (Time and Attendance — BRD §6.18)
- **US-EMP-12** — As an employee, I want to view my own attendance records, so that I can verify my recorded presence and hours. (BRD §6.18)
  - **Acceptance criteria:**
    - **Given** attendance has been captured for me (manual, biometric, import, or API), **when** I open My Attendance, **then** I see only my own daily records and any flagged exceptions.
- **US-EMP-13** — As an employee, I want to raise an attendance correction request for a missed punch, late arrival, or early exit, so that exceptions in my record can be fixed through the proper workflow. (BRD §6.18 "Attendance Exception Workflows")
  - **Acceptance criteria:**
    - **Given** an attendance exception on my record, **when** I submit a correction request with a reason, **then** it is routed to my approver and tracked with a status; I cannot edit the attendance record directly.
    - **Given** I submit a correction request, **then** the request and its outcome are auditable, and I am notified of the decision.
- **US-EMP-14** — As an employee, I want to view my applicable holiday calendar, so that I know which days are company/location holidays. (BRD §6.18 "Holiday Calendars")
- **US-EMP-15** — As an employee, I want to view the status of my submitted correction requests, so that I know whether the fix was approved. (BRD §6.18, §6.27)

### Policies (Policy Distribution & Acknowledgment — BRD §6.11)
- **US-EMP-16** — As an employee, I want a policy inbox showing the policies I must acknowledge, so that I can see what is pending and by when. (BRD §6.11 "Employee Self-Service: Policy inbox")
  - **Acceptance criteria:**
    - **Given** policies are distributed to me by company/department/group/individual targeting, **when** I open my policy inbox, **then** I see each pending policy with its acknowledgment type (Required/Optional/Read-Only) and due date.
- **US-EMP-17** — As an employee, I want to read a policy and confirm acknowledgment, so that there is a recorded receipt that I have read and accepted it. (BRD §6.11)
  - **Acceptance criteria:**
    - **Given** a Required policy in my inbox, **when** I confirm acknowledgment, **then** an acknowledgment record with timestamp and receipt is stored and the item leaves my pending list.
    - **Given** an acknowledgment is recorded, **then** it is retained in the compliance audit trail.
- **US-EMP-18** — As an employee, I want to be prompted to re-acknowledge a policy when its content changes, when periodic renewal is due, or after I transfer/change role, so that my acknowledgment always reflects the current version. (BRD §6.11 "Re-Acknowledgment")
- **US-EMP-19** — As an employee, I want automated reminders for policies approaching their acknowledgment due date, so that I do not miss a mandatory sign-off. (BRD §6.11 "Reminders and Escalations")

### Announcements (BRD §6.14)
- **US-EMP-20** — As an employee, I want to read announcements targeted to me, so that I stay informed about organizational messages relevant to my company, location, department, or group. (BRD §6.14)
  - **Acceptance criteria:**
    - **Given** an announcement is targeted to an audience I belong to and is within its active window, **when** I open Announcements, **then** I see it; **and** expired or non-targeted announcements are not shown to me.

### Documents & HR letters (Documents — BRD §6.22; HR Letters — BRD §6.28)
- **US-EMP-21** — As an employee, I want to access the documents stored against my own record, so that I can find my paperwork when I need it. (BRD §6.22)
  - **Acceptance criteria:**
    - **Given** documents are attached to my employee record with role-based access, **when** I open My Documents, **then** I see only documents I am permitted to view, with metadata (name, upload date, expiry).
- **US-EMP-22** — As an employee, I want to download my own HR letters and certificates (e.g., appointment, confirmation, experience), so that I have official copies when required. (BRD §6.28)
  - **Acceptance criteria:**
    - **Given** an HR letter has been generated and distributed to me, **when** I open HR Letters, **then** I can view/download the PDF of letters addressed to me only, and delivery is tracked.
- **US-EMP-23** — As an employee, I want to be notified when a new letter or document is made available to me, so that I can retrieve it promptly. (BRD §6.28 "Distribution", §6.27)

### Feedback & grievance (BRD §6.19)
- **US-EMP-24** — As an employee, I want to submit a feedback or grievance entry, so that I have a structured, traceable channel to be heard. (BRD §6.19)
  - **Acceptance criteria:**
    - **Given** I am an authenticated employee, **when** I submit a grievance, **then** it is recorded with a status and is visible only to me and authorized reviewers (not to other employees).
- **US-EMP-25** — As an employee, I want to track the status of my submitted feedback/grievance, so that I know it is being handled. (BRD §6.19 "status tracking")
- **US-EMP-26** — As an employee, I want my grievance details kept confidential and access-restricted, so that sensitive matters are not exposed to unauthorized people. (BRD §6.19.2)

### Directory & org chart (BRD §6.21)
- **US-EMP-27** — As an employee, I want to search the company directory by name, department, position, or location, so that I can find a colleague's contact details. (BRD §6.21)
  - **Acceptance criteria:**
    - **Given** directory privacy controls, **when** I search, **then** results are limited to my own company and exclude fields hidden by privacy policy.
- **US-EMP-28** — As an employee, I want to view the organizational chart, so that I can understand reporting lines and where I sit. (BRD §6.21 "Organizational Chart")
- **US-EMP-29** — As an employee, I want sensitive contact information to be shown only where privacy policy permits, so that personal data is protected. (BRD §6.21.5)
- **US-EMP-34** — As an employee, I want to switch the directory between list, card, and compact views, so that I can browse colleagues in the layout I prefer. (BRD §6.21.1)
  - **Acceptance criteria:**
    - **Given** I am viewing the company directory, **when** I select a view mode (list, card, or compact), **then** the same privacy-controlled result set re-renders in that layout showing the permitted employee information (name, photo, position, department, location, contact details).
    - **Given** I have chosen a view mode, **when** I return to the directory later, **then** my preferred view is retained, and switching modes never widens what fields I am permitted to see beyond the directory privacy policy.

### Assets (Employee Asset Management — BRD §6.20)
- **US-EMP-30** — As an employee, I want to digitally acknowledge receipt of an asset issued to me, so that there is a record of what I am responsible for. (BRD §6.20 "Asset Acknowledgements")
  - **Acceptance criteria:**
    - **Given** an asset is issued to me (e.g., during onboarding), **when** I confirm receipt, **then** an acknowledgment with timestamp is recorded against that asset.
- **US-EMP-31** — As an employee, I want to acknowledge return of an asset with a condition note, so that hand-back during exit or recovery is properly recorded. (BRD §6.20 "condition assessment", exit workflow integration)
  - **Acceptance criteria:**
    - **Given** an asset assigned to me is being returned, **when** I submit a digital return acknowledgment with a condition note, **then** the asset state moves to "Returned" and my acknowledgment is recorded with a timestamp. (BRD §6.20.2, §6.20.4)
    - **Given** the return is part of my exit clearance, **when** I acknowledge it, **then** the asset-recovery step of the exit workflow reflects the hand-back. (BRD §6.20.5, §6.15.4)
- **US-EMP-32** — As an employee, I want to view the list of assets currently assigned to me, so that I know what company property I hold. (BRD §6.20)

### Notification preferences (BRD §6.27)
- **US-EMP-33** — As an employee, I want to set my notification channel and event preferences, so that I receive the alerts I care about in the way I prefer. (BRD §6.27 "User Preferences")
  - **Acceptance criteria:**
    - **Given** email is the mandatory channel, **when** I adjust optional channels or event subscriptions, **then** my preferences are saved and applied to future notifications, while mandatory notifications still reach me by email.
- **US-EMP-35** — As an employee, I want an in-app notification center listing my recent alerts with read/unread state, so that I can review notifications I may have missed in email. (BRD §6.27)
  - **Acceptance criteria:**
    - **Given** in-app notifications have been delivered to me, **when** I open the notification center, **then** I see a chronological list of my own alerts (approvals, status changes, reminders, lifecycle events) with an unread indicator and a count of unread items, scoped to my company context only.
    - **Given** I am viewing a notification, **when** I open or mark it, **then** it is set to read and the unread count decrements; **and when** I dismiss a notification, **then** it is removed from my active list without affecting the underlying record or email delivery.
    - **Given** the notification center is a read/consume view, **when** I interact with it, **then** I cannot see other employees' notifications and the feed is distinct from my policy inbox (US-EMP-16).

## Primary journeys
1. **Request leave end-to-end.** Open self-service → check my balance for the leave type (US-EMP-06) → submit a request with type, dates, and reason (US-EMP-07) → request routes to my manager and I get an email → track status, and on approval see my balance drop and the date on my calendar (US-EMP-08, US-EMP-10); if rejected, read the reason.
2. **Fix an attendance exception.** Open My Attendance and spot a missed punch (US-EMP-12) → raise a correction request with a reason (US-EMP-13) → request is routed to my approver and tracked → I am notified of the outcome (US-EMP-15).
3. **Acknowledge a policy.** Get a reminder that a Required policy is pending (US-EMP-19) → open my policy inbox and read it (US-EMP-16) → confirm acknowledgment and receive a receipt (US-EMP-17) → later, when the policy is updated, I am prompted to re-acknowledge (US-EMP-18).
4. **Onboarding self-service touchpoints.** Acknowledge the laptop/asset issued to me (US-EMP-30) → acknowledge mandatory onboarding policies (US-EMP-17) → update my non-sensitive profile details (US-EMP-02) → download my appointment letter when available (US-EMP-22).

## Notes & Phase 2
- **Phase 2 — Mobile app (deferred).** All Employee self-service in Phase 1 is **web only** (responsive). A native mobile app with push notifications — apply for leave, mark attendance, view profile/announcements on a phone — is **Phase 2**. (BRD §6.16.1, §3.2; Phase II BRD §"Mobile App"; Roadmap §4)
- **Phase 2 — Payslips & payroll (deferred).** Employees viewing **payslips** and payroll details is **Phase 2** (payroll computation, payslip generation/distribution are out of Phase 1 scope), even though the persona "cares about payslips-to-come." (Phase II BRD §3; BRD §3.2)
- **Phase 2 — Contractor self-service (not this role).** Contractor self-service (Contractor – Standard / Restricted) and contractor leave rules are Phase 2 and are a separate role catalog; the Employee role never grants contractor capabilities (User != Employee != Contractor). (Phase II BRD §6.2; BRD §5.1.3)
- **Data subject rights.** The Employee's self-service update (US-EMP-02) and sensitive-field change request (US-EMP-03) are the operational expression of DPDP/GDPR Right to Rectification (self-service for non-sensitive fields, workflow-based for sensitive fields). Right-to-access data export is handled as an operational/DPO process, not a standalone Employee feature in Phase 1. (BRD NFR §8.7.3)
- **Cross-cutting dependencies:**
  - **Workflow engine** — routes leave, attendance corrections, and sensitive-field change requests for approval. (BRD §6.25)
  - **Notifications** — email is mandatory; in-app optional; drives status updates and reminders. (BRD §6.27)
  - **Audit & logging** — every employee self-service change (profile edits, acknowledgments, asset confirmations) is recorded. (BRD §6.29)
  - **RBAC & tenant isolation** — the Employee role is strictly self-scoped, single-company, read-only outside their own record; no context switching. (FS §7.1, §7.2; BRD §6.12)
  - **Employee – Limited Access variant** — read-only/restricted users see transactional stories as read-only unless company policy explicitly enables a given transaction. (BRD §5.7)
