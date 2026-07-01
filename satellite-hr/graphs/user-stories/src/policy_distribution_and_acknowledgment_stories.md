# Policy Distribution and Acknowledgment — User Stories

## PDA-01: Target policy distribution by audience criteria
- Role: Company Admin
- Story: As a Company Admin, I want to distribute policies based on company, location, department, group, employment type, or individual employees using AND/OR logic, so that the right policies reach exactly the right audience.
- Priority: High
- Source: FR 6.11.1 (Distribution Scope)

## PDA-02: Multiple distribution methods
- Role: Company Admin
- Story: As a Company Admin, I want to distribute policies manually, on a schedule, or automatically on events, so that I can match the distribution method to each situation.
- Priority: High
- Source: FR 6.11.2 (Distribution Methods)

## PDA-03: Bulk policy distribution
- Role: Company Admin
- Story: As a Company Admin, I want to distribute policies in bulk, so that I can efficiently reach large groups of employees at once.
- Priority: Medium
- Source: FR 6.11.2 (Distribution Methods — bulk)

## PDA-04: Configure acknowledgment types
- Role: Company Admin
- Story: As a Company Admin, I want to set an acknowledgment type of Required, Optional, or Read-Only for each policy, so that I can control the level of compliance enforcement.
- Priority: High
- Source: FR 6.11.3 (Acknowledgment Types)

## PDA-05: Configure acknowledgment due dates
- Role: Company Admin
- Story: As a Company Admin, I want to configure acknowledgment due dates using fixed, relative, hire-based, or periodic renewal rules, so that deadlines fit each policy's compliance needs.
- Priority: High
- Source: FR 6.11.4 (Due Date Configuration)

## PDA-06: Automated reminders at SLA milestones
- Role: Employee (User)
- Story: As an Employee (User), I want to receive automated reminders as my acknowledgment deadline approaches, so that I do not miss a required sign-off.
- Priority: Medium
- Source: FR 6.11.5 (Reminders and Escalations)

## PDA-07: Escalation for overdue acknowledgments
- Role: Company Admin
- Story: As a Company Admin, I want overdue acknowledgments to trigger escalation workflows based on policy criticality, so that non-compliance is surfaced and acted upon.
- Priority: Medium
- Source: FR 6.11.5 (Reminders and Escalations — escalation)

## PDA-08: Trigger re-acknowledgment
- Role: Company Admin
- Story: As a Company Admin, I want the system to require re-acknowledgment when relevant changes occur, so that employees always confirm the current version of the policy.
- Priority: High
- Source: FR 6.11.6 (Re-Acknowledgment)

## PDA-09: Employee policy inbox and review
- Role: Employee (User)
- Story: As an Employee (User), I want a policy inbox showing my pending acknowledgments with a review interface, so that I can read and act on policies assigned to me.
- Priority: High
- Source: FR 6.11.7 (Employee Self-Service)

## PDA-10: Acknowledgment confirmation with receipt
- Role: Employee (User)
- Story: As an Employee (User), I want to confirm my acknowledgment and receive a receipt, so that I have proof I completed the required sign-off.
- Priority: High
- Source: FR 6.11.7 (Employee Self-Service — confirmation with receipt)

## PDA-11: Compliance reporting and audit trail
- Role: Company Admin
- Story: As a Company Admin, I want acknowledgment status, pending/overdue reports, and a compliance dashboard with long-term audit retention, so that I can monitor and evidence policy compliance.
- Priority: High
- Source: FR 6.11.8 (Reporting)

## PDA-12: Integration with lifecycle, workflow, and tasks
- Role: Platform Admin
- Story: As a Platform Admin, I want policy distribution to integrate with employee lifecycle, the workflow engine, and the task/checklist module, so that acknowledgments are automated and coordinated with other processes.
- Priority: Medium
- Source: FR 6.11.9 (Integration)

## PDA-13: Distribute policies across companies in a group
- Role: Group Company Admin
- Story: As a Group Company Admin, I want to distribute policies and monitor acknowledgment across the multiple companies in my group, so that shared or regulatory policies are enforced consistently group-wide.
- Priority: Medium
- Source: FR 6.11.1 / FR 6.11.8 (Distribution Scope across companies; consolidated reporting)

## PDA-14: Portfolio-wide policy compliance oversight
- Role: Portfolio Admin
- Story: As a Portfolio Admin, I want a portfolio-level compliance dashboard and audit visibility across all group companies in my portfolio, so that I can evidence and enforce policy compliance at the highest tenant level.
- Priority: Medium
- Source: FR 6.11.8 (Reporting — portfolio-level compliance dashboard and audit)

## PDA-15: Read-only distribution and proxy acknowledgment for non-users
- Role: Employee (Non-User)
- Story: As an Employee (Non-User) without self-service access, I want policies distributed to me as read-only or acknowledged on my behalf by an admin, so that non-portal staff are still covered by policy compliance.
- Priority: Medium
- Source: FR 6.11.3 / FR 6.11.7 (Acknowledgment Types; Self-Service coverage for non-users)

## PDA-16: Configure reminder SLA thresholds and escalation policies
- Role: Platform Admin
- Story: As a Platform Admin, I want to configure the reminder milestones and escalation workflows tied to policy criticality, so that reminder and escalation behavior is standardized and enforceable across the platform.
- Priority: Medium
- Source: FR 6.11.5 (Reminders and Escalations — configuration)

## PDA-17: Bitemporal acknowledgment data model with tenant isolation
- Role: Platform Admin
- Story: As a Platform Admin, I want acknowledgment assignments and events persisted in a tenant-scoped bitemporal data model, so that every acknowledgment is uniquely tracked, historically reconstructable, and isolated per tenant.
- Priority: High
- Source: FR 6.11.6, FR 6.11.8 (L1 data model, bitemporal history, RLS, retention)

## PDA-18: Governed notification and receipt templates
- Role: Company Admin
- Story: As a Company Admin, I want reminder, escalation, and acknowledgment-receipt content driven by per-tenant governed templates, so that messaging is consistent, branded, and changeable without code.
- Priority: Medium
- Source: FR 6.11.5, FR 6.11.7 (L2 config — notification and receipt templates)

## PDA-19: Re-acknowledgment trigger decision table
- Role: Platform Admin
- Story: As a Platform Admin, I want the events that force re-acknowledgment defined in a versioned decision table, so that compliance rules can be governed and changed without code.
- Priority: Medium
- Source: FR 6.11.6 (L2 config — re-acknowledgment decision table)

## PDA-20: Engine-driven audience resolution and event-triggered distribution
- Role: Company Admin
- Story: As a Company Admin, I want the rules and workflow engines to resolve audiences and execute event-triggered distributions, so that targeting and automation behave consistently from shared runtime logic.
- Priority: Medium
- Source: FR 6.11.1, FR 6.11.2, FR 6.11.5 (L3 engines — rules and workflow evaluation)

## PDA-21: Distribution management console and status grid
- Role: Company Admin
- Story: As a Company Admin, I want a metadata-driven console listing distributions and per-recipient acknowledgment status with search and filtering, so that I can manage and monitor distributions from the UI.
- Priority: Medium
- Source: FR 6.11.7, FR 6.11.8 (L4 presentation — metadata-driven admin console/grid)
