# Leave Management — User Stories

## LVE-01: Configure differentiated leave policies
- Role: Company Admin
- Story: As a Company Admin, I want to create configurable leave policies that vary by employee type, group, jurisdiction, company, department, or location, so that leave entitlements reflect the correct rules for each population of employees.
- Priority: High
- Source: FR 6.17.1 (configurable leave policies with differentiation)

## LVE-02: Define standard leave types
- Role: Company Admin
- Story: As a Company Admin, I want to configure the supported leave types (Privileged/Annual, Casual, Sick/Medical, Maternity, Paternity, Bereavement, Comp-off), so that employees can request leave under the correct category with the correct rules.
- Priority: High
- Source: FR 6.17.2 (Leave Types)

## LVE-03: Apply for leave against a balance
- Role: Employee (User)
- Story: As an Employee (User), I want to submit a leave request of a given type for specific dates, so that my time off is recorded, validated against my balance, and routed for approval.
- Priority: High
- Source: FR 6.17.2, FR 6.17.3 (leave requests and workflows)

## LVE-04: Sequential and parallel approval workflows
- Role: Company Admin
- Story: As a Company Admin, I want to configure approval workflows with sequential and parallel approval levels, so that leave requests are approved by the right people in the right order.
- Priority: High
- Source: FR 6.17.3 (Approval Workflows — sequential and parallel, configurable levels)

## LVE-05: Delegate leave approvals
- Role: Company Admin
- Story: As a Company Admin, I want to configure delegation of leave approval authority to another approver, so that requests continue to be processed when the primary approver is unavailable.
- Priority: Medium
- Source: FR 6.17.3 (delegation)

## LVE-06: SLA-based escalation of approvals
- Role: Company Admin
- Story: As a Company Admin, I want leave approvals to escalate when a configured SLA is breached, so that pending requests are not stalled indefinitely.
- Priority: Medium
- Source: FR 6.17.3 (escalation based on SLA)

## LVE-07: Administrative override of leave rules and balances
- Role: Company Admin
- Story: As a Company Admin (HR Administrator), I want to override any leave rule or balance with a mandatory reason, so that I can handle exceptions while keeping the system consistent.
- Priority: High
- Source: FR 6.17.4 (Administrative Override with mandatory reason)

## LVE-08: Full audit trail for overrides
- Role: Company Admin
- Story: As a Company Admin, I want every leave override to be captured in a full, immutable audit trail, so that exceptional actions are traceable and accountable.
- Priority: High
- Source: FR 6.17.4 (full audit trail)

## LVE-09: Personal leave calendar for employees
- Role: Employee (User)
- Story: As an Employee (User), I want a personal leave calendar, so that I can see my booked, pending, and available leave at a glance.
- Priority: Medium
- Source: FR 6.17.5 (Leave Calendar Views — personal calendar)

## LVE-10: Company-wide calendar with coverage metrics
- Role: Company Admin
- Story: As a Company Admin (HR), I want a company-wide leave calendar with coverage metrics, so that we can manage organization-wide staffing and availability.
- Priority: Medium
- Source: FR 6.17.5 (company-wide calendar with coverage metrics)

## LVE-11: Report on leave balances, rules, and entitlements
- Role: Company Admin
- Story: As a Company Admin, I want to report on leave balances, rules, and entitlements, so that I can analyze leave data and support decision-making and compliance.
- Priority: Medium
- Source: FR 6.17.6 (leave balances, rules, and entitlements shall be reportable)

## LVE-12: Approve or reject leave as an approver/manager
- Role: Employee (User)
- Story: As an Employee (User) acting as an approver/manager, I want to approve or reject leave requests assigned to me, so that my team members' time off is decided promptly and correctly.
- Priority: High
- Source: FR 6.17.3 (Approval Workflows, delegation, escalation)

## LVE-13: Team leave calendar for managers
- Role: Employee (User)
- Story: As an Employee (User) acting as a manager, I want a team leave calendar, so that I can see my team's leave and manage coverage before approving requests.
- Priority: Medium
- Source: FR 6.17.5 (team calendar for managers)

## LVE-14: View leave balance and entitlements
- Role: Employee (User)
- Story: As an Employee (User), I want to view my current leave balances and entitlements per leave type, so that I know how much time off I have before requesting.
- Priority: Medium
- Source: FR 6.17.2, FR 6.17.6 (leave types, reportable balances and entitlements)

## LVE-15: Cancel or withdraw a leave request
- Role: Employee (User)
- Story: As an Employee (User), I want to cancel or withdraw a leave request, so that my balance is restored when plans change.
- Priority: Medium
- Source: FR 6.17.3 (leave requests and workflows)

## LVE-16: Earn and request Compensatory-off (Comp-off)
- Role: Employee (User)
- Story: As an Employee (User), I want to earn Comp-off for eligible extra work and request it as leave, so that I am compensated with time off per policy.
- Priority: Medium
- Source: FR 6.17.2 (Compensatory-off leave type)

## LVE-17: Record leave for Employee (Non-User) on their behalf
- Role: Company Admin
- Story: As a Company Admin/HR, I want to record and manage leave for an Employee (Non-User) who has no self-service access, so that their absences and balances are tracked accurately.
- Priority: Medium
- Source: FR 6.17.2, FR 6.17.3 (leave requests, workflows)

## LVE-18: Define group-level baseline leave policies
- Role: Group Company Admin
- Story: As a Group Company Admin, I want to define baseline leave policies and leave types across the group's companies, so that member companies inherit consistent defaults while retaining local differentiation.
- Priority: Medium
- Source: FR 6.17.1 (differentiation by group, company, jurisdiction)

## LVE-19: Oversee leave configuration and reporting across the portfolio
- Role: Portfolio Admin
- Story: As a Portfolio Admin, I want to oversee leave policies and reporting across all group companies in my portfolio, so that leave management is compliant and consistent portfolio-wide.
- Priority: Medium
- Source: FR 6.17.1, FR 6.17.6 (differentiation, reportability)

## LVE-20: Manage platform-wide leave management capabilities and defaults
- Role: Platform Admin
- Story: As a Platform Admin, I want to manage the platform-wide leave management capabilities, master leave-type catalog, and global defaults, so that all tenants can configure leave consistently and securely.
- Priority: Low
- Source: FR 6.17.1, FR 6.17.2, FR 6.17.4 (platform-wide configuration, leave types, audit)

## LVE-21: Bitemporal storage of leave records, balances, and policy versions
- Role: Platform Admin
- Story: As a Platform Admin, I want leave records, balances, entitlements, and policy configurations persisted bitemporally with effective-dating and full history, so that leave is always evaluated against the values effective on the relevant dates and past states remain reconstructable.
- Priority: High
- Source: FR 6.17.1, FR 6.17.6 (L1 domain/data — effective-dated policy versions and reportable current/effective-dated values)

## LVE-22: Tenant-scoped isolation of leave data (RLS)
- Role: Platform Admin
- Story: As a Platform Admin, I want all leave data isolated per tenant via row-level security, so that no tenant can access another tenant's leave records while remaining fully reportable within its own scope.
- Priority: High
- Source: FR 6.17.1 (L1 tenant-scoped storage / RLS)

## LVE-23: Integrity constraints for leave records and balances
- Role: Platform Admin
- Story: As a Platform Admin, I want referential integrity and uniqueness/overlap constraints enforced on leave records and balances, so that the data model prevents invalid, duplicate, or conflicting leave and balance corruption.
- Priority: High
- Source: FR 6.17.3 (L1 integrity constraints — overlap prevention and referential integrity)

## LVE-24: Workflow engine executes configured leave approval graphs
- Role: Platform Admin
- Story: As a Platform Admin, I want the shared Workflow/Approval engine to interpret each tenant's leave approval configuration at runtime, so that sequential/parallel routing, delegation, and SLA escalation execute correctly without module-specific code.
- Priority: High
- Source: FR 6.17.3 (L3 Workflow/Approval engine — runtime execution)

## LVE-25: Rules engine selects the governing leave policy and evaluates eligibility
- Role: Platform Admin
- Story: As a Platform Admin, I want the shared Rules engine to evaluate leave differentiation and eligibility decision tables at request time, so that the correct most-specific policy is selected deterministically and eligibility is enforced without code changes.
- Priority: High
- Source: FR 6.17.1 (L3 Rules engine — policy selection and eligibility evaluation)

## LVE-26: Accrual/Balance engine computes accruals, deductions, and comp-off
- Role: Platform Admin
- Story: As a Platform Admin, I want the shared Accrual/Balance/Time engine to run leave accruals, deductions, restorations, and comp-off credit/expiry per policy config, so that balances stay correct across the full leave lifecycle without bespoke code.
- Priority: High
- Source: FR 6.17.2, FR 6.17.6 (L3 Accrual/Balance/Time engine — accrual, deduction, comp-off, projected balances)

## LVE-27: Notification engine renders leave event notifications from templates
- Role: Platform Admin
- Story: As a Platform Admin, I want the shared Notification/Template engine to render and deliver leave notifications from configured templates on every state transition, so that applicants, approvers, and delegates are informed consistently without module-specific code.
- Priority: Medium
- Source: FR 6.17.3 (L3 Notification/Template engine — event-driven notifications)

## LVE-28: Dynamic-fields engine renders configurable leave request forms
- Role: Platform Admin
- Story: As a Platform Admin, I want the shared Forms/Dynamic-Fields engine to render configurable leave request forms per leave type, so that type-specific fields are captured and validated without module-specific code.
- Priority: Medium
- Source: FR 6.17.2, FR 6.17.3 (L3 Forms/Dynamic-Fields engine — configurable, type-specific leave request forms)

## LVE-29: Leave and balances maintained accurately on my behalf
- Role: Employee (Non-User)
- Story: As an Employee (Non-User) without self-service access, I want my leave requests, balances, and entitlements maintained on my behalf and reflected accurately, so that my time off and remaining balance are correct despite having no portal login.
- Priority: Medium
- Source: FR 6.17.2, FR 6.17.3, FR 6.17.6 (leave for non-self-service employees; balances and entitlements reflected and reportable)
