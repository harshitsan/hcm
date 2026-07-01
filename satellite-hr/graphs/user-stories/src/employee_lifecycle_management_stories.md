# Employee Lifecycle Management — User Stories

## ELM-01: Task-driven onboarding workflow
- Role: Company Admin
- Story: As a Company Admin, I want to run new hires through a task-driven onboarding workflow with mandatory stages, so that every joiner completes a consistent, complete onboarding process.
- Priority: High
- Source: FR 6.15.1 (Onboarding)

## ELM-02: Offer acceptance and document submission stages
- Role: Employee (User)
- Story: As an Employee (User), I want to accept my offer and submit my documents through the onboarding workflow, so that my joining formalities are captured digitally.
- Priority: High
- Source: FR 6.15.1 (Onboarding — Offer Acceptance, Document Submission)

## ELM-03: Document verification and asset assignment
- Role: Company Admin
- Story: As a Company Admin, I want to verify submitted documents and assign assets during onboarding, so that the new hire is compliant and equipped before induction.
- Priority: High
- Source: FR 6.15.1 (Onboarding — Document Verification, Asset Assignment)

## ELM-04: Induction completion
- Role: Company Admin
- Story: As a Company Admin, I want to track induction completion as the final onboarding stage, so that a new hire is formally considered fully onboarded.
- Priority: Medium
- Source: FR 6.15.1 (Onboarding — Induction Completion)

## ELM-05: Probation confirmation decision workflow
- Role: Company Admin
- Story: As a Company Admin, I want to evaluate an employee against probation criteria and record a confirmation decision, so that probation outcomes are handled consistently.
- Priority: High
- Source: FR 6.15.2 (Probation Confirmation)

## ELM-06: Probation approval hierarchy
- Role: Company Admin
- Story: As a Company Admin, I want probation confirmation decisions to route through the approval hierarchy of Manager, Department Head, and HR, so that outcomes are properly authorized.
- Priority: High
- Source: FR 6.15.2 (Probation Confirmation — approval hierarchy)

## ELM-07: Employee transfers across department, location, and company
- Role: Company Admin
- Story: As a Company Admin, I want to initiate inter-department, inter-location, and inter-company transfers with approval workflows, so that employee moves are governed and authorized.
- Priority: High
- Source: FR 6.15.3 (Transfers)

## ELM-08: Transfer effective dating
- Role: Company Admin
- Story: As a Company Admin, I want to set an effective date for a transfer, so that the change applies at the correct point in time.
- Priority: Medium
- Source: FR 6.15.3 (Transfers — effective dating)

## ELM-09: Transfer downstream impact assessment
- Role: Company Admin
- Story: As a Company Admin, I want a downstream impact assessment when transferring an employee, so that assets, leave balances, and policies are correctly adjusted.
- Priority: Medium
- Source: FR 6.15.3 (Transfers — downstream impact assessment)

## ELM-10: Exit request, approval, and notice period handling
- Role: Employee (User)
- Story: As an Employee (User), I want to raise an exit request that follows an approval workflow with notice period handling, so that my separation is processed correctly.
- Priority: High
- Source: FR 6.15.4 (Exit Management — request/approval, notice period)

## ELM-11: Parallel clearance and exit completion tracking
- Role: Company Admin
- Story: As a Company Admin, I want a parallel-by-function clearance workflow with exit completion tracking, so that all departments sign off and the exit is fully closed.
- Priority: High
- Source: FR 6.15.4 (Exit Management — clearance workflow, exit completion tracking)

## ELM-12: Configurable, auditable, and reportable lifecycle workflows
- Role: Company Admin
- Story: As a Company Admin, I want all lifecycle workflows to be configurable, auditable, and reportable, so that I can tailor processes, evidence compliance, and analyze outcomes.
- Priority: Medium
- Source: FR 6.15.5 (Configurable, auditable, and reportable workflows)

## ELM-13: Onboarding for non-user new hires
- Role: Company Admin
- Story: As a Company Admin, I want to run the onboarding workflow on behalf of new hires who are not portal users (Employee (Non-User)), so that their joining is completed even without self-service access.
- Priority: Medium
- Source: FR 6.15.1 (Onboarding — non-user new hires)

## ELM-14: Probation extension and separation follow-through
- Role: Company Admin
- Story: As a Company Admin, I want the Extend and Initiate Separation probation outcomes to trigger the correct follow-up, so that each decision leads to the right next lifecycle action.
- Priority: Medium
- Source: FR 6.15.2 (Probation Confirmation — outcomes Confirm/Extend/Initiate Separation)

## ELM-15: Cross-company transfer authorization
- Role: Group Company Admin
- Story: As a Group Company Admin, I want to authorize inter-company transfers that move an employee between companies in my group, so that cross-entity moves are governed at the group level.
- Priority: Medium
- Source: FR 6.15.3 (Transfers — inter-company), FR 6.15.5

## ELM-16: Functional clearance sign-off
- Role: Company Admin
- Story: As a Company Admin, I want each function to complete its clearance task independently during exit, so that departmental sign-offs (IT, Finance, HR, Admin) are captured before exit finalization.
- Priority: Medium
- Source: FR 6.15.4 (Exit Management — clearance workflow, parallel by function)

## ELM-17: Group-level lifecycle reporting and audit oversight
- Role: Group Company Admin
- Story: As a Group Company Admin, I want to configure lifecycle workflows and review audit trails and reports across the companies in my group, so that I have consistent governance and oversight over lifecycle events.
- Priority: Low
- Source: FR 6.15.5 (Configurable, auditable, reportable — group oversight)

## ELM-18: Effective-dated bitemporal assignment history
- Role: Platform Admin
- Story: As a Platform Admin, I want the data model to store employee assignments as effective-dated, bitemporal records, so that transfers and lifecycle changes preserve full history without overwriting prior state.
- Priority: High
- Source: FR 6.15.3 (Transfers — effective dating) (L1 domain/data)

## ELM-19: Immutable tenant-scoped lifecycle audit trail
- Role: Platform Admin
- Story: As a Platform Admin, I want lifecycle actions persisted to an immutable, tenant-scoped audit store with row-level security, so that every event is tamper-evident and isolated per tenant.
- Priority: High
- Source: FR 6.15.5 (auditable) (L1 domain/data, RLS)

## ELM-20: Lifecycle status records and integrity constraints
- Role: Platform Admin
- Story: As a Platform Admin, I want employee lifecycle state and event records to enforce integrity constraints, so that status transitions and assignments stay consistent.
- Priority: Medium
- Source: FR 6.15.5 (L1 domain/data — integrity constraints)

## ELM-21: Configure onboarding checklist and stage templates as governed metadata
- Role: Company Admin
- Story: As a Company Admin, I want to configure onboarding stage and task-checklist templates as versioned, effective-dated metadata, so that the onboarding engine executes my process without code changes.
- Priority: High
- Source: FR 6.15.1, FR 6.15.5 (configurable) (L2 config/metadata)

## ELM-22: Configure probation evaluation criteria as a decision table
- Role: Company Admin
- Story: As a Company Admin, I want to configure probation evaluation criteria and outcome rules as a versioned decision table, so that the rules engine derives consistent probation outcomes.
- Priority: Medium
- Source: FR 6.15.2 (evaluation criteria) (L2 config/metadata)

## ELM-23: Configure approver graphs for lifecycle workflows
- Role: Company Admin
- Story: As a Company Admin, I want to configure the approval hierarchies (approver graphs) for onboarding, probation, transfer, and exit as governed config, so that routing changes without code.
- Priority: High
- Source: FR 6.15.2, FR 6.15.3, FR 6.15.4 (approval workflows) (L2 config/metadata)

## ELM-24: Configure notice-period rule-packs and clearance functions
- Role: Company Admin
- Story: As a Company Admin, I want to configure notice-period rules and the set of clearance functions as governed, jurisdiction-aware metadata, so that exit processing adapts per policy without code.
- Priority: Medium
- Source: FR 6.15.4 (notice period, clearance workflow) (L2 config/metadata)

## ELM-25: Workflow engine executes configured lifecycle workflows
- Role: Company Admin
- Story: As a Company Admin, I want the shared workflow engine to interpret lifecycle config and drive each instance, so that onboarding, probation, transfer, and exit run consistently from metadata.
- Priority: High
- Source: FR 6.15.1, FR 6.15.2, FR 6.15.3, FR 6.15.4, FR 6.15.5 (L3 workflow engine)

## ELM-26: Rules engine evaluates probation and transfer-impact decision tables
- Role: Company Admin
- Story: As a Company Admin, I want the rules engine to evaluate the configured decision tables for probation and transfer impact, so that outcomes and impacts are derived deterministically.
- Priority: Medium
- Source: FR 6.15.2, FR 6.15.3 (L3 rules engine)

## ELM-27: Templated lifecycle notifications from the notification engine
- Role: Employee (User)
- Story: As an Employee (User), I want the notification engine to send templated notifications for my lifecycle tasks and approvals, so that I and other participants are informed at each step.
- Priority: Medium
- Source: FR 6.15.1, FR 6.15.4, FR 6.15.5 (L3 notification/template engine)

## ELM-28: Balance engine reconciles leave balances on transfer
- Role: Company Admin
- Story: As a Company Admin, I want the accrual/balance engine to reconcile leave balances when an employee transfers, so that entitlements move correctly to the new assignment.
- Priority: Medium
- Source: FR 6.15.3 (downstream impact — leave balances) (L3 accrual/balance engine)

## ELM-29: Metadata-driven self-service lifecycle portal
- Role: Employee (User)
- Story: As an Employee (User), I want a metadata-driven self-service portal to complete my onboarding tasks, raise an exit request, and track my lifecycle status, so that I interact with configured forms without needing admin help.
- Priority: High
- Source: FR 6.15.1, FR 6.15.4 (self-service) (L4 presentation)

## ELM-30: Lifecycle admin dashboard with search and filters
- Role: Company Admin
- Story: As a Company Admin, I want a metadata-driven lifecycle dashboard with searchable, filterable grids, so that I can monitor and act on onboarding, probation, transfer, and exit cases.
- Priority: Medium
- Source: FR 6.15.5 (reportable) (L4 presentation)

## ELM-31: Forms/dynamic-fields engine renders and validates lifecycle forms
- Role: Company Admin
- Story: As a Company Admin, I want the forms/dynamic-fields engine to resolve and validate the configured forms used across lifecycle steps, so that onboarding, probation, and exit data is captured consistently from metadata without code.
- Priority: Medium
- Source: FR 6.15.1, FR 6.15.2, FR 6.15.4 (L3 forms/dynamic-fields engine)
