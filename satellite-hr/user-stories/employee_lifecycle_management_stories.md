# Employee Lifecycle Management — User Stories

_Derived from SatelliteHR Phase I BRD — module "Employee Lifecycle Management". 12 user stories._

---

## ELM-01: Task-driven onboarding workflow

**User story:** As a Company/HR Admin, I want to run new hires through a task-driven onboarding workflow with mandatory stages, so that every joiner completes a consistent, complete onboarding process.

**Acceptance criteria:**
- Given a newly hired employee, when onboarding is initiated, then a task-driven workflow is created with the mandatory stages: Offer Acceptance, Document Submission, Document Verification, Asset Assignment, and Induction Completion.
- Given the onboarding workflow, when a mandatory stage is incomplete, then the workflow cannot be marked as fully complete.
- Given the detailed task specifications, when configuring onboarding tasks, then they follow the task checklist definitions referenced in the Task Checklist BRD.

**Priority:** High
**Source:** FR 6.15.1 (Onboarding)

---

## ELM-02: Offer acceptance and document submission stages

**User story:** As an Employee (new hire), I want to accept my offer and submit my documents through the onboarding workflow, so that my joining formalities are captured digitally.

**Acceptance criteria:**
- Given an initiated onboarding, when I complete the Offer Acceptance stage, then the workflow advances to Document Submission.
- Given the Document Submission stage, when I upload the required documents, then they are recorded against my onboarding tasks for verification.

**Priority:** High
**Source:** FR 6.15.1 (Onboarding — Offer Acceptance, Document Submission)

---

## ELM-03: Document verification and asset assignment

**User story:** As a Company/HR Admin, I want to verify submitted documents and assign assets during onboarding, so that the new hire is compliant and equipped before induction.

**Acceptance criteria:**
- Given submitted documents, when I review them in the Document Verification stage, then I can mark them verified or request corrections.
- Given verified documents, when I complete the Asset Assignment stage, then assets are recorded as assigned to the employee.
- Given both stages complete, when the workflow proceeds, then Induction Completion becomes available.

**Priority:** High
**Source:** FR 6.15.1 (Onboarding — Document Verification, Asset Assignment)

---

## ELM-04: Induction completion

**User story:** As a Company/HR Admin, I want to track induction completion as the final onboarding stage, so that a new hire is formally considered fully onboarded.

**Acceptance criteria:**
- Given all prior onboarding stages are complete, when the Induction Completion stage is finished, then the onboarding workflow is marked complete.
- Given an incomplete induction, when reporting on onboarding status, then the employee appears as still onboarding.

**Priority:** Medium
**Source:** FR 6.15.1 (Onboarding — Induction Completion)

---

## ELM-05: Probation confirmation decision workflow

**User story:** As a Manager, I want to evaluate an employee against probation criteria and record a confirmation decision, so that probation outcomes are handled consistently.

**Acceptance criteria:**
- Given an employee on probation, when the confirmation workflow is initiated, then evaluation criteria are presented for assessment.
- Given a completed evaluation, when I submit a decision, then I can select an outcome of Confirm, Extend, or Initiate Separation.

**Priority:** High
**Source:** FR 6.15.2 (Probation Confirmation)

---

## ELM-06: Probation approval hierarchy

**User story:** As a Company/HR Admin, I want probation confirmation decisions to route through the approval hierarchy of Manager, Department Head, and HR, so that outcomes are properly authorized.

**Acceptance criteria:**
- Given a probation decision, when it is submitted, then it routes for approval in the order Manager → Department Head → HR.
- Given a required approver has not acted, when checking the decision status, then the decision remains pending and unapplied.
- Given all approvals are granted, when the workflow completes, then the selected outcome (Confirm, Extend, or Initiate Separation) takes effect.

**Priority:** High
**Source:** FR 6.15.2 (Probation Confirmation — approval hierarchy)

---

## ELM-07: Employee transfers across department, location, and company

**User story:** As a Company/HR Admin, I want to initiate inter-department, inter-location, and inter-company transfers with approval workflows, so that employee moves are governed and authorized.

**Acceptance criteria:**
- Given a transfer request, when I select the transfer type, then inter-department, inter-location, and inter-company options are supported.
- Given a transfer request, when it is submitted, then it routes through the applicable approval workflow before taking effect.

**Priority:** High
**Source:** FR 6.15.3 (Transfers)

---

## ELM-08: Transfer effective dating

**User story:** As a Company/HR Admin, I want to set an effective date for a transfer, so that the change applies at the correct point in time.

**Acceptance criteria:**
- Given an approved transfer, when I specify an effective date, then the transfer takes effect on that date.
- Given a future-dated transfer, when the effective date has not been reached, then the employee's current assignment remains unchanged.

**Priority:** Medium
**Source:** FR 6.15.3 (Transfers — effective dating)

---

## ELM-09: Transfer downstream impact assessment

**User story:** As a Company/HR Admin, I want a downstream impact assessment when transferring an employee, so that assets, leave balances, and policies are correctly adjusted.

**Acceptance criteria:**
- Given a transfer in progress, when the impact assessment runs, then it surfaces impacts on assets, leave balances, and policies.
- Given identified impacts, when the transfer is completed, then affected assets, leave balances, and policies are reconciled to the new assignment.

**Priority:** Medium
**Source:** FR 6.15.3 (Transfers — downstream impact assessment)

---

## ELM-10: Exit request, approval, and notice period handling

**User story:** As an Employee, I want to raise an exit request that follows an approval workflow with notice period handling, so that my separation is processed correctly.

**Acceptance criteria:**
- Given I want to leave, when I submit an exit request, then it routes through the exit approval workflow.
- Given an approved exit, when notice period rules apply, then the notice period is captured and tracked against my exit.

**Priority:** High
**Source:** FR 6.15.4 (Exit Management — request/approval, notice period)

---

## ELM-11: Parallel clearance and exit completion tracking

**User story:** As a Company/HR Admin, I want a parallel-by-function clearance workflow with exit completion tracking, so that all departments sign off and the exit is fully closed.

**Acceptance criteria:**
- Given an approved exit, when clearance is initiated, then clearance tasks are issued in parallel across the relevant functions.
- Given clearance in progress, when checking exit status, then completion is tracked per function and overall.
- Given all functional clearances are complete, when the exit is finalized, then exit completion is recorded.

**Priority:** High
**Source:** FR 6.15.4 (Exit Management — clearance workflow, exit completion tracking)

---

## ELM-12: Configurable, auditable, and reportable lifecycle workflows

**User story:** As a Company/HR Admin, I want all lifecycle workflows to be configurable, auditable, and reportable, so that I can tailor processes, evidence compliance, and analyze outcomes.

**Acceptance criteria:**
- Given a lifecycle workflow (onboarding, probation, transfer, exit), when I configure its stages and rules, then the changes apply to subsequent workflow instances.
- Given any lifecycle action, when it is performed, then it is recorded in an audit trail.
- Given lifecycle data, when I run reports, then onboarding, probation, transfer, and exit activity is reportable.

**Priority:** Medium
**Source:** FR 6.15.5 (Configurable, auditable, and reportable workflows)
