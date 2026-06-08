# Employee – Limited Access — User Stories

> An Employee – Limited Access is a workforce member of a single company whose system access is deliberately restricted to a subset of standard employee self-service (BRD §5.7). They are primarily a READ-ONLY consumer of their own information and permitted communications; any self-service transaction (such as submitting a leave request or an attendance correction) is available only when the company has explicitly enabled it by policy. They care about seeing their own profile, balances, announcements, documents, and required policy acknowledgments — not about performing HR operations.

## Scope & access

- **Authority level:** Self only. This role operates strictly within a single company's tenant boundary and sees only their own employee record (User != Employee — they hold a User login linked to one Employee record in this company).
- **What they CAN do (read-only by default):**
  - View their own basic profile and authorized employment information (BRD §6.16).
  - View announcements targeted to them by company/location/department/group/workforce type (BRD §6.14).
  - View documents made available to them under role- and policy-based access (BRD §6.22).
  - View their own leave balances and entitlements where the company permits balance visibility (BRD §6.17).
  - View their own attendance and holiday calendar where permitted (BRD §6.18).
  - Read and acknowledge policies routed to them when acknowledgment is required (BRD §6.11).
  - Set personal notification channel/preference where allowed (BRD §6.27).
- **Policy-gated transactions (ONLY where the company explicitly enables them):** submitting a leave request, requesting an attendance correction, updating non-sensitive profile fields, or submitting feedback/grievance. Each of these is OFF by default for this role and appears only when company policy switches it on. When disabled, the corresponding control is hidden or read-only.
- **BOUNDARIES — what they CANNOT do:**
  - No approvals of any kind (no leave, attendance, onboarding, or workflow approvals) — approvals belong to managers and HR (BRD §6.17, §6.25).
  - No administration: no role/permission assignment, no policy authoring or distribution, no company/master-data configuration, no user provisioning (BRD §5.5–§5.7, FS §7.1).
  - No access to other employees' records, no directory browse of peers beyond what privacy controls expose, and no cross-company access — they belong to exactly one company and cannot switch company context (FS §7.1 Context Switching = restricted; BRD Cross-Module Rule 15).
  - No HR overrides, no editing of sensitive/statutory fields, no reporting/analytics beyond their own data (BRD §6.17 override is HR-only; §6.23 reports are role-filtered).
  - No self-service transaction unless and until company policy enables it for this role (BRD §6.16 — self-service is role and policy controlled).
- **Contrast with Employee – Standard:** Employee – Standard has full default self-service — update profile, submit leave, view attendance, participate in feedback (BRD §5.7). Employee – Limited Access starts from read-only and gains a transaction only when a company policy turns it on. Where Standard can act, Limited Access can usually only view.

## User stories

### Profile & personal information

- **US-EMPL-01** — As an Employee – Limited Access, I want to view my own basic profile and employment details, so that I can confirm my information is correct. (BRD §6.16)
  - **Acceptance criteria:**
    - **Given** I am logged in and linked to one employee record in this company, **When** I open my profile, **Then** I see only my own profile (name, department, position, location, manager) and no other employee's data.
    - **Given** profile-edit is not enabled for my role, **When** I view a profile field, **Then** it is displayed read-only with no edit control.
- **US-EMPL-02** — As an Employee – Limited Access, I want to see which of my profile fields (if any) I am permitted to update, so that I do not attempt edits the company has disabled for my role. (BRD §6.16)
- **US-EMPL-03** — As an Employee – Limited Access, I want to update a non-sensitive personal field (e.g., emergency contact) ONLY when company policy enables it for my role, so that I stay within permitted self-service. (BRD §6.16)
  - **Acceptance criteria:**
    - **Given** non-sensitive profile edit is enabled by policy for my role, **When** I edit an allowed field and save, **Then** the change is recorded with an audit entry showing me as the actor.
    - **Given** non-sensitive profile edit is NOT enabled for my role, **When** I view the field, **Then** no edit action is available and any direct attempt is rejected.
    - **Given** a field is classified as sensitive/statutory, **When** I view it, **Then** it is always read-only for my role regardless of policy.
- **US-EMPL-04** — As an Employee – Limited Access, I want to view documents shared with me under role- and policy-based access, so that I can read my authorized paperwork. (BRD §6.22)
  - **Acceptance criteria:**
    - **Given** a document is granted to me by role/policy, **When** I open the Documents area, **Then** I can view/download only documents I am authorized to see, within tenant isolation.
    - **Given** I have no permission to a document, **When** it is not granted to me, **Then** it does not appear in my list.

### Announcements & communications

- **US-EMPL-05** — As an Employee – Limited Access, I want to view announcements targeted to me, so that I stay informed about organizational messages. (BRD §6.14)
  - **Acceptance criteria:**
    - **Given** an announcement targets my company/location/department/group/workforce type, **When** I open announcements, **Then** I see it while it is within its scheduled active window.
    - **Given** an announcement has expired, **When** I view the list, **Then** the expired announcement is no longer shown.
- **US-EMPL-06** — As an Employee – Limited Access, I want to set my notification channel preference where the company allows it, so that I receive messages the way I prefer. (BRD §6.27)
- **US-EMPL-07** — As an Employee – Limited Access, I want to receive email notifications for items that require my attention (e.g., a policy I must acknowledge), so that I do not miss required actions. (BRD §6.27)

### Policy acknowledgment

- **US-EMPL-08** — As an Employee – Limited Access, I want a policy inbox showing policies I must read, so that I can see what is pending for me. (BRD §6.11)
  - **Acceptance criteria:**
    - **Given** policies have been distributed to me, **When** I open my policy inbox, **Then** I see pending, optional, and read-only items distinct from one another.
- **US-EMPL-09** — As an Employee – Limited Access, I want to read the full content of a policy assigned to me, so that I understand it before acknowledging. (BRD §6.11)
- **US-EMPL-10** — As an Employee – Limited Access, I want to acknowledge a required policy and receive a confirmation receipt, so that there is proof I accepted it. (BRD §6.11)
  - **Acceptance criteria:**
    - **Given** a policy with Required acknowledgment is assigned to me, **When** I confirm acknowledgment, **Then** my acknowledgment is recorded with timestamp and a receipt is shown.
    - **Given** the policy content later changes or a renewal period expires, **When** re-acknowledgment is triggered, **Then** the item reappears in my inbox for me to acknowledge again.
- **US-EMPL-11** — As an Employee – Limited Access, I want to see the due date and any reminders for a pending acknowledgment, so that I can complete it on time. (BRD §6.11)
- **US-EMPL-12** — As an Employee – Limited Access, I want to view, but not edit, read-only/informational policies addressed to me, so that I stay informed without being asked to sign. (BRD §6.11)

### Leave (view-first, submission policy-gated)

- **US-EMPL-13** — As an Employee – Limited Access, I want to view my own leave balances and entitlements where the company permits, so that I know how much leave I have. (BRD §6.17)
  - **Acceptance criteria:**
    - **Given** balance visibility is enabled for my role, **When** I open Leave, **Then** I see only my own balances by leave type.
    - **Given** balance visibility is disabled, **When** I open Leave, **Then** balances are hidden for my role.
- **US-EMPL-14** — As an Employee – Limited Access, I want to view my own personal leave calendar where permitted, so that I can see my recorded time off. (BRD §6.17)
- **US-EMPL-15** — As an Employee – Limited Access, I want to submit a leave request ONLY when the company has enabled leave submission for my role, so that I act strictly within permitted self-service. (BRD §6.17)
  - **Acceptance criteria:**
    - **Given** leave submission is enabled for my role by policy, **When** I submit a request, **Then** it routes to the configured approver via the workflow engine and I cannot approve it myself.
    - **Given** leave submission is NOT enabled for my role, **When** I open Leave, **Then** no "Request Leave" control is available and any direct submission is rejected.
- **US-EMPL-16** — As an Employee – Limited Access, I want to view the status of a leave request I was permitted to submit, so that I know whether it was approved or rejected. (BRD §6.17)

### Attendance (view-first, corrections policy-gated)

- **US-EMPL-17** — As an Employee – Limited Access, I want to view my own attendance records where permitted, so that I can confirm my recorded presence. (BRD §6.18)
- **US-EMPL-18** — As an Employee – Limited Access, I want to view the applicable holiday calendar for my company/location, so that I know non-working days. (BRD §6.18)
- **US-EMPL-19** — As an Employee – Limited Access, I want to raise an attendance correction request (e.g., missed punch) ONLY when the company has enabled corrections for my role, so that I stay within permitted self-service. (BRD §6.18)
  - **Acceptance criteria:**
    - **Given** correction requests are enabled for my role, **When** I submit a correction, **Then** it routes through the configured approval/exception workflow and I have no override or approval rights.
    - **Given** correction requests are NOT enabled, **When** I view my attendance, **Then** no correction action is offered.
- **US-EMPL-20** — As an Employee – Limited Access, I want to view the status of any attendance correction I was permitted to raise, so that I know if it was accepted. (BRD §6.18)

### Feedback & grievance (policy-gated)

- **US-EMPL-21** — As an Employee – Limited Access, I want to submit a feedback or grievance entry ONLY when the company has enabled this for my role, so that I have a traceable channel where permitted. (BRD §6.19)
  - **Acceptance criteria:**
    - **Given** feedback/grievance submission is enabled for my role, **When** I submit an entry, **Then** it is recorded with status tracking and restricted to authorized reviewers.
    - **Given** it is not enabled, **When** I look for the option, **Then** it is not available to me.
- **US-EMPL-22** — As an Employee – Limited Access, I want to view the status of a feedback/grievance entry I submitted, so that I know it is being handled. (BRD §6.19)

### Onboarding tasks (assigned to me, where applicable)

- **US-EMPL-23** — As an Employee – Limited Access, I want to view onboarding tasks or instructions assigned to me, so that I know what is expected of me as a new joiner. (BRD §6.15)
- **US-EMPL-24** — As an Employee – Limited Access, I want to submit my onboarding documents through self-service ONLY when the company enables document submission for my role, so that I can complete required onboarding steps without exceeding my access. (BRD §6.15)
  - **Acceptance criteria:**
    - **Given** onboarding document submission is enabled for my role, **When** I upload a required document, **Then** it is attached to my record for HR verification and I cannot verify or approve it myself.
    - **Given** it is not enabled, **When** I view my onboarding tasks, **Then** they are informational/read-only.
- **US-EMPL-25** — As an Employee – Limited Access, I want to digitally acknowledge receipt of an asset assigned to me when prompted, so that issuance records are accurate. (BRD §6.20)

### Access, security & boundaries

- **US-EMPL-26** — As an Employee – Limited Access, I want to sign in securely with my company's authentication method, so that only I can access my account. (BRD §6.1)
- **US-EMPL-27** — As an Employee – Limited Access, I want to complete a second factor when my company requires MFA, so that my access meets the company's security policy. (BRD §6.12)
- **US-EMPL-28** — As an Employee – Limited Access, I want my session and data confined to my single company, so that I never see another company's data and cannot switch company context. (BRD Cross-Module Rule 15; FS §7.1)
  - **Acceptance criteria:**
    - **Given** my login is linked to one company, **When** I am authenticated, **Then** no company context switcher is presented and all my data is scoped to that one tenant.
    - **Given** any request references a record outside my own scope, **When** it is evaluated, **Then** it is denied (unauthorized access).
- **US-EMPL-29** — As an Employee – Limited Access, I want to clearly see when an action is unavailable because my role is restricted, so that I understand my access without contacting HR. (BRD §6.16)
- **US-EMPL-30** — As an Employee – Limited Access, I want assurance that any change I am permitted to make is recorded in the audit trail, so that there is a record of my own actions. (BRD §6.29)

## Primary journeys

1. **Daily check-in (pure read-only).** I sign in with my company credentials (and MFA if required), land on a stripped-down self-service home, view new announcements targeted to me, glance at my leave balance and attendance where those are visible, and read any documents shared with me — without performing any transaction.
2. **Required policy acknowledgment.** I receive an email that a policy needs my acknowledgment, open my policy inbox, read the full policy, confirm acknowledgment before the due date, and keep the receipt; if the policy later changes, it returns to my inbox for re-acknowledgment.
3. **Policy-enabled leave request (only if my company turned it on).** I open Leave, see my balance, and — because my company enabled leave submission for my role — submit a request that routes to my manager via the workflow engine; I track its status to approval, with no ability to approve it myself.
4. **New-joiner onboarding (where enabled).** I view the onboarding tasks assigned to me, upload my required documents through self-service if document submission is enabled for my role, and acknowledge receipt of my assigned laptop — leaving verification and approval to HR.

## Notes & Phase 2

- **Phase 2 deferral — Mobile.** All capabilities above are delivered through the responsive web self-service interface; a native mobile app with push notifications is Phase 2 (BRD §3.2, §6.16). Marked Phase 2.
- **Phase 2 deferral — Payslips/Payroll.** Viewing payslips is not in Phase 1; payroll computation, payslip generation, and distribution are Phase 2 (Phase I BRD §3.2; Phase II BRD §3). Marked Phase 2.
- **Phase 2 deferral — Contractor self-service.** This role is for employees only; contractor self-service roles (Contractor – Standard / Restricted) and their distinct leave/access rules are Phase 2 (Phase II BRD §6.2). The User != Employee != Contractor separation still applies.
- **Cross-cutting dependency — RBAC & policy gating.** Every transactional story here is governed by composable permissions plus company policy; "Limited Access" is realized by withholding self-service permissions that Employee – Standard holds (BRD §5.7, §6.12, §6.16).
- **Cross-cutting dependency — Tenant isolation.** All access is row-level scoped to one company and one employee record; no cross-company access or context switching applies to this role (BRD Cross-Module Rule 15; FS §7.1, §7.2).
- **Cross-cutting dependency — Workflow engine.** Any policy-enabled request (leave, attendance correction, feedback, onboarding submission) is routed, reminded, and escalated by the workflow engine; this role only originates requests and never approves (BRD §6.25).
- **Cross-cutting dependency — Notifications.** Email is the mandatory channel for reminders and required-action alerts; in-app and other channels are optional (BRD §6.27).
- **Cross-cutting dependency — Audit & logging.** Any permitted change this role makes (e.g., an enabled profile edit, a policy acknowledgment) is captured in the immutable audit trail (BRD §6.29).
