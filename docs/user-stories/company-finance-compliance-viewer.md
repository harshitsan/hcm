# Company Finance / Compliance Viewer — User Stories

> The Company Finance / Compliance Viewer is a read-only company-level persona responsible for audit, compliance, and statutory reporting within a single tenant company. They view employee, attendance, and leave data and run compliance and export reports to support finance reconciliation, audit readiness, and statutory data verification — without performing any HR operations, edits, approvals, or configuration (BRD §5.5).

## Scope & access

- **Authority level:** Company / self only — scoped to exactly ONE tenant company that this user is assigned to. No platform, portfolio, or group-company reach; no cross-company visibility.
- **Read-only by definition:** This role performs NO transactional actions, NO approvals, NO configuration, and NO master-data changes. Per the FS §7 RBAC matrix it is not granted Create, Edit, Suspend, or Delete on any entity; its only capabilities are View and Export.
- **What they CAN do:**
  - View employee master records and their statutory data fields (UAN, ESIC number, PF/ESI eligibility status, PT/LWF applicability, gratuity/maternity eligibility) for their company (BRD §6.9.7).
  - View attendance, overtime, shift/roster, and holiday-calendar data (BRD §6.18).
  - View leave balances, leave entitlements, and leave registers (BRD §6.17).
  - Run and view compliance reports: PF/ESIC eligibility, attendance registers, leave registers, wage register **templates**, and statutory data completeness reports (BRD §6.23.5).
  - Export employee, attendance, and leave data for audit and finance purposes (BRD §6.24, §6.23.6).
  - View the audit trail / record-level change history for entities they are authorized to see (BRD §6.29.4).
- **Explicit BOUNDARIES — what they CANNOT do:**
  - Cannot create, edit, suspend, or delete any employee, attendance, leave, policy, or company record.
  - Cannot approve, reject, override, or initiate any workflow (leave, attendance correction, onboarding, transfer, exit, etc.).
  - Cannot configure policies, workflows, roles, permissions, users, or company settings.
  - Cannot perform leave/attendance administrative overrides (those belong to the HR Administrator — BRD §6.17.4 / §6.18.7).
  - Cannot access another company's data, switch company context to an unauthorized company, or run cross-company / portfolio / group reports.
  - Cannot perform statutory filing, payroll computation, remittance, or legal interpretation (out of Phase 1 scope; full statutory compliance enablement and payroll are Phase 2 — BRD §3.2, Phase II BRD §2, §3, §9).

## User stories

### Employee & statutory data (view) — BRD §6.9

- **US-CFV-01** — As a Company Finance / Compliance Viewer, I want to view the employee master records for my company, so that I can verify workforce data against finance and audit records. (BRD §6.9)
  - **Acceptance criteria:**
    - **Given** I am assigned the Company Finance / Compliance Viewer role for Company A, **when** I open the employee directory/records, **then** I see only Company A employees and no Edit, Delete, or status-change controls are presented.
    - **Given** I attempt to access an employee record in a company I am not assigned to, **when** the request is evaluated, **then** access is denied (AUTH_001) and the attempt is written to the audit log.
- **US-CFV-02** — As a Company Finance / Compliance Viewer, I want to view employee statutory data fields (UAN, ESIC number, PF/ESI eligibility, PT/LWF applicability, gratuity and maternity eligibility), so that I can check statutory readiness for the workforce. (BRD §6.9.7)
- **US-CFV-03** — As a Company Finance / Compliance Viewer, I want to view each employee's department, position, location, and primary manager, so that I can confirm organizational placement for audit and cost-center mapping. (BRD §6.7, §6.8)
  - **Acceptance criteria:**
    - **Given** I am viewing an employee record, **when** the page renders, **then** department, position, location, jurisdiction, and primary manager are shown as read-only fields with no inline edit affordance.
- **US-CFV-04** — As a Company Finance / Compliance Viewer, I want to view employee lifecycle status (active, on probation, on notice, exited) and effective-dated manager-change history, so that I can establish tenure and continuity for gratuity and statutory eligibility checks. (BRD §6.9.4, §6.9.5)

### Attendance & overtime (view) — BRD §6.18

- **US-CFV-05** — As a Company Finance / Compliance Viewer, I want to view attendance records for my company, so that I can reconcile hours worked for audit and downstream payroll verification. (BRD §6.18.1)
- **US-CFV-06** — As a Company Finance / Compliance Viewer, I want to view overtime records with their categorization (normal, holiday, night shift), so that I can verify overtime against statutory working-hours rules. (BRD §6.18.4, §6.18.6)
- **US-CFV-07** — As a Company Finance / Compliance Viewer, I want to view shift, roster, and holiday-calendar configuration, so that I can interpret attendance and weekly-rest-day data correctly during a review. (BRD §6.18.2, §6.18.3)
- **US-CFV-08** — As a Company Finance / Compliance Viewer, I want to view attendance exception and correction records (without acting on them), so that I can see where data was adjusted and by whom for audit traceability. (BRD §6.18.5)
  - **Acceptance criteria:**
    - **Given** an attendance correction exists, **when** I open it, **then** I see the original value, the corrected value, the actor, and the timestamp, but I am presented no approve/reject/override controls.

### Leave (view) — BRD §6.17

- **US-CFV-09** — As a Company Finance / Compliance Viewer, I want to view leave balances and statutory leave entitlements per employee, so that I can verify leave provisioning and prepare leave-encashment-related audit inputs. (BRD §6.17.6)
- **US-CFV-10** — As a Company Finance / Compliance Viewer, I want to view leave records and the company-wide leave register, so that I can produce the statutory leave register required for labor inspections. (BRD §6.17.6, §6.23.5)
- **US-CFV-11** — As a Company Finance / Compliance Viewer, I want to view administrative leave overrides applied by HR (reason and audit trail), so that I can confirm exceptions are properly justified during compliance review. (BRD §6.17.4)
  - **Acceptance criteria:**
    - **Given** HR has applied a leave override with a mandatory reason, **when** I view the leave record, **then** the override reason, actor, and timestamp are visible to me as read-only audit information.

### Compliance & statutory reporting — BRD §6.23.5

- **US-CFV-12** — As a Company Finance / Compliance Viewer, I want to run the PF/ESIC eligibility report, so that I can identify which employees meet PF and ESI eligibility thresholds for statutory administration. (BRD §6.23.5)
  - **Acceptance criteria:**
    - **Given** I run the PF/ESIC eligibility report for my company, **when** generation completes, **then** the report lists employees with their UAN/ESIC numbers and eligibility status, scoped to my company only.
    - **Given** the report is generated, **when** I review it, **then** it is clearly labeled as compliance-administration enablement and contains no statutory filing or remittance action.
- **US-CFV-13** — As a Company Finance / Compliance Viewer, I want to run the attendance register report in statutory format, so that I can provide daily attendance and hours-worked records for labor inspections. (BRD §6.23.5)
- **US-CFV-14** — As a Company Finance / Compliance Viewer, I want to run the leave register report in statutory format, so that I can satisfy Shops & Establishments leave-record requirements. (BRD §6.23.5)
- **US-CFV-15** — As a Company Finance / Compliance Viewer, I want to generate the wage register **template**, so that I have a structured starting format for payroll verification by the finance team. (BRD §6.23.5)
  - **Acceptance criteria:**
    - **Given** I generate the wage register, **when** it is produced, **then** it is delivered as a Phase 1 **template** format (structure and fields), and does not perform any wage computation.
- **US-CFV-16** — As a Company Finance / Compliance Viewer, I want to run the statutory data completeness report, so that I can flag employees with missing mandatory statutory fields before an audit. (BRD §6.23.5)
  - **Acceptance criteria:**
    - **Given** some employees are missing required statutory fields (e.g., UAN), **when** I run the completeness report, **then** those employees and the specific missing fields are listed.
    - **Given** I identify a missing field, **when** I want it corrected, **then** I can only flag/report it — I cannot edit the record myself and must route it to the HR Administrator.
- **US-CFV-17** — As a Company Finance / Compliance Viewer, I want to view the standard policy-compliance and acknowledgment status reports, so that I can confirm required policy sign-offs are in place for audit readiness. (BRD §6.11.8, §6.23.1)
- **US-CFV-18** — As a Company Finance / Compliance Viewer, I want to use saved views and filters on compliance reports, so that I can repeatably reproduce the same audit extract across reporting periods. (BRD §6.23.3)
- **US-CFV-19** — As a Company Finance / Compliance Viewer, I want to view role-based compliance dashboards with drill-down, so that I can monitor statutory data health and attendance/leave coverage at a glance. (BRD §6.23.2)

### Data export for audit & finance — BRD §6.24

- **US-CFV-20** — As a Company Finance / Compliance Viewer, I want to export employee master data (including statutory fields) to CSV/XLSX, so that I can hand a verifiable workforce extract to external auditors or the finance team. (BRD §6.24.1, §6.24.2)
  - **Acceptance criteria:**
    - **Given** I export employee data, **when** the file is produced, **then** it contains only my company's records and the export event is recorded in the audit trail with my identity and timestamp.
- **US-CFV-21** — As a Company Finance / Compliance Viewer, I want to export attendance and leave transactional data, so that finance can reconcile presence/hours and leave balances offline. (BRD §6.24.1)
- **US-CFV-22** — As a Company Finance / Compliance Viewer, I want to export compliance and statutory reports to Excel/PDF, so that I can archive period-end audit packages outside the system. (BRD §6.23.5, §6.23.6)
- **US-CFV-23** — As a Company Finance / Compliance Viewer, I want to receive scheduled compliance/export reports by email, so that period-end audit data reaches me automatically without manual generation. (BRD §6.23.4)

### Audit trail & record history (view) — BRD §6.29

- **US-CFV-24** — As a Company Finance / Compliance Viewer, I want to view the chronological change history of an employee or attendance/leave record, so that I can reconstruct exactly what changed, when, and by whom during an audit. (BRD §6.29.4)
  - **Acceptance criteria:**
    - **Given** a record has been modified over time, **when** I open its history, **then** I see field-level previous/new values, actor, action type, and timestamp in chronological order, scoped to my company.
- **US-CFV-25** — As a Company Finance / Compliance Viewer, I want to view the User Access / data-access audit report for my company, so that I can confirm who accessed sensitive HR data and when. (BRD §6.29, FS §8.1)

### Access, scope & security (self) — BRD §6.1, §6.12

- **US-CFV-26** — As a Company Finance / Compliance Viewer, I want to sign in securely (SSO or local credentials, with MFA where the company requires it), so that my access to sensitive compliance data is protected. (BRD §6.1, §6.12.5)
- **US-CFV-27** — As a Company Finance / Compliance Viewer, I want every screen and report I run to be confined to my assigned company, so that tenant isolation is preserved and I never see another tenant's data. (BRD §6.12.2, FS §7.2)
  - **Acceptance criteria:**
    - **Given** I am authorized for exactly one company, **when** I view any data or run any report, **then** all results are filtered to that company via row-level/tenant scoping and no company context switcher to unauthorized companies is offered.
- **US-CFV-28** — As a Company Finance / Compliance Viewer, I want a read-only experience where create/edit/approve/configure actions simply do not appear for my role, so that I cannot accidentally attempt an action outside my authority. (BRD §5.5, FS §7.1)

## Primary journeys

1. **Period-end statutory data verification.** The viewer signs in (US-CFV-26), runs the statutory data completeness report (US-CFV-16), and the PF/ESIC eligibility report (US-CFV-12). They identify employees with missing UAN/ESIC fields, then flag the gaps for the HR Administrator to correct (the viewer cannot edit), and export the eligibility report for the finance team (US-CFV-22).

2. **External audit / labor-inspection package.** The viewer runs the attendance register (US-CFV-13) and leave register (US-CFV-14) in statutory format, generates the wage register template (US-CFV-15), exports each to PDF/Excel (US-CFV-22), and assembles the audit package — every generation and export captured in the audit trail.

3. **Finance reconciliation extract.** The viewer exports employee master data with statutory fields (US-CFV-20) plus attendance and leave transactional data (US-CFV-21) to CSV/XLSX so finance can reconcile hours, overtime, and leave balances offline.

4. **Dispute / change investigation.** Given a questioned attendance or leave value, the viewer opens the record's change history (US-CFV-24) and the user-access audit report (US-CFV-25) to reconstruct who changed what and when, and reports findings — taking no corrective action themselves.

## Notes & Phase 2

- **Phase 2 deferrals (clearly marked):**
  - Full India statutory compliance enablement — eligibility determination engines, statutory registers (EPF/ESI forms), compliance dashboards, due-date and breach alerts, and contribution calculations — are **Phase 2** (Phase II BRD §2, §5, §9). Phase 1 provides only **report templates** (PF/ESIC eligibility, attendance/leave registers, wage register template, statutory data completeness) per BRD §6.23.5.
  - **Payroll** computation, statutory deductions, payslips, and disbursement are **Phase 2** (Phase II BRD §3). This role views attendance/leave/wage-register-template data to *support* finance, but performs no payroll.
  - Statutory **filing** to government authorities, remittance, automated compliance verification, and legal interpretation are out of scope in all phases — the platform is a tracker/reporter, not a filer (Phase II BRD §9 notes; Roadmap §4 "tracker, not filer").
  - Note (data quality): the Phase 2 ESI form list (Phase II BRD §5.3.1) is corrupted placeholder text and must be re-sourced before any compliance build — irrelevant to Phase 1 viewer stories but flagged for traceability (Roadmap Gap 1b/D1).
- **Cross-cutting dependencies:**
  - **RBAC (BRD §6.12 / FS §7):** This role must be defined as a View/Export-only permission set with no Create/Edit/Suspend/Delete and no approval/configuration capabilities.
  - **Tenant isolation (BRD §4.5, §7.15, FS §7.2):** Every query and report must enforce company-scoped row-level security; no cross-company or context-switch access for this single-company role.
  - **Audit & logging (BRD §6.29):** All views, report runs, and exports of sensitive data should be auditable; the role itself is a primary *consumer* of the audit trail.
  - **Reporting & analytics (BRD §6.23, Roadmap Gap 3b):** Heavy compliance/export reports should run against a read replica or analytics store to meet performance NFRs (BRD §8.1) without impacting live transactions.
  - **Notifications (BRD §6.27):** Scheduled report delivery to this role depends on the notification/scheduler subsystem.
  - **Data Management (BRD §6.24):** Export capability (CSV/XLS/XLSX/JSON, size/batch limits) is shared infrastructure this role relies on.
