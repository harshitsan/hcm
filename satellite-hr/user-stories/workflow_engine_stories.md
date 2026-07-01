# Workflow Engine — User Stories

_Derived from SatelliteHR Phase I BRD — module "Workflow Engine". 12 user stories._

---

## WFE-01: Configure company-level workflows

**User story:** As a Company/HR Admin, I want to configure workflows at the company level, so that approval processes reflect my organization's specific requirements.

**Acceptance criteria:**
- Given I have workflow administration rights, when I create or edit a workflow, then it is scoped to my company and applied to matching transactions.
- Given a configured workflow, when a relevant transaction is initiated, then the workflow executes according to its definition.

**Priority:** High
**Source:** FR 6.25.1 (Capabilities)

---

## WFE-02: Conditional routing by organizational and transaction attributes

**User story:** As a Company/HR Admin, I want conditional routing based on company, jurisdiction, location, department, group, and transaction type, so that each request is routed to the correct approvers for its context.

**Acceptance criteria:**
- Given I define routing conditions, when a transaction matches attributes such as jurisdiction, location, department, group, or transaction type, then it is routed along the matching path.
- Given a transaction that matches no specific condition, when it is processed, then it follows the default routing path.

**Priority:** High
**Source:** FR 6.25.1 (Capabilities — conditional routing)

---

## WFE-03: Sequential approvals

**User story:** As a Company/HR Admin, I want to configure sequential approval chains, so that requests are approved one step after another in a defined order.

**Acceptance criteria:**
- Given a sequential workflow, when the first approver approves, then the request advances to the next approver in order.
- Given any approver in the sequence rejects, when the decision is recorded, then the workflow stops and downstream approvers are not engaged.

**Priority:** High
**Source:** FR 6.25.2 (Approval Patterns — sequential)

---

## WFE-04: Parallel approvals with any-one-can-approve

**User story:** As a Company/HR Admin, I want to configure parallel approvals where any one approver can approve, so that requests are cleared quickly when a single authorized decision suffices.

**Acceptance criteria:**
- Given a parallel any-one-can-approve step, when any one approver approves, then the step is considered complete.
- Given multiple approvers are notified in parallel, when one approves, then the request advances without waiting for the others.

**Priority:** High
**Source:** FR 6.25.2 (Approval Patterns — parallel any-one)

---

## WFE-05: Parallel approvals with all-must-approve

**User story:** As a Company/HR Admin, I want to configure parallel approvals where all approvers must approve, so that requests requiring full consensus are handled correctly.

**Acceptance criteria:**
- Given a parallel all-must-approve step, when all designated approvers have approved, then the step is complete.
- Given at least one required approver has not approved, when the step status is evaluated, then it remains pending.

**Priority:** High
**Source:** FR 6.25.2 (Approval Patterns — parallel all-must)

---

## WFE-06: Mixed approval patterns

**User story:** As a Company/HR Admin, I want to combine sequential and parallel approval patterns in a single workflow, so that complex approval processes can be modeled accurately.

**Acceptance criteria:**
- Given a workflow with mixed patterns, when it executes, then sequential and parallel stages are evaluated according to their configured rules.
- Given a stage completes, when the next stage is a different pattern, then the workflow transitions correctly to that pattern's evaluation.

**Priority:** Medium
**Source:** FR 6.25.2 (Approval Patterns — mixed)

---

## WFE-07: Manager and role escalation

**User story:** As a Company/HR Admin, I want to configure manager escalation and role escalation, so that stalled approvals are redirected to the appropriate authority.

**Acceptance criteria:**
- Given a manager escalation is configured, when the escalation condition is met, then the request is escalated to the approver's manager.
- Given a role escalation is configured, when the escalation condition is met, then the request is escalated to the designated role.

**Priority:** High
**Source:** FR 6.25.3 (Escalation Strategies — manager, role)

---

## WFE-08: Time-based reassignment and multi-level escalation

**User story:** As a Company/HR Admin, I want time-based reassignment and multi-level escalation, so that requests do not stall when an approver is unavailable.

**Acceptance criteria:**
- Given a time-based reassignment rule, when the configured time elapses without action, then the request is reassigned automatically.
- Given a multi-level escalation is configured, when one escalation level does not act, then the request escalates to the next level.

**Priority:** High
**Source:** FR 6.25.3 (Escalation Strategies — time-based reassignment, multi-level)

---

## WFE-09: Configure SLAs with business hours

**User story:** As a Company/HR Admin, I want to configure SLAs based on business hours, so that approval timeframes reflect actual working time rather than calendar time.

**Acceptance criteria:**
- Given an SLA is defined with business hours, when SLA elapsed time is calculated, then only business hours are counted.
- Given a request is pending, when I view it, then its SLA target and remaining time are shown.

**Priority:** High
**Source:** FR 6.25.4 (SLA Management — configurable SLAs, business hours)

---

## WFE-10: SLA reminders and escalation thresholds

**User story:** As an Approver, I want reminder notifications at 50% and 75% of SLA and escalation at 100%, so that I act in time and overdue requests are escalated.

**Acceptance criteria:**
- Given a pending request, when SLA consumption reaches 50% and 75%, then reminder notifications are sent to the approver.
- Given a pending request, when SLA consumption reaches 100%, then the request is escalated per the configured escalation strategy.

**Priority:** High
**Source:** FR 6.25.4 (SLA Management — reminders at 50%/75%, escalation at 100%)

---

## WFE-11: Real-time SLA tracking

**User story:** As a Manager, I want real-time SLA tracking, so that I can monitor pending approvals and identify requests at risk of breach.

**Acceptance criteria:**
- Given active requests, when I view SLA status, then current elapsed and remaining SLA time are shown in real time.
- Given a request approaching or exceeding its SLA, when I view tracking, then its at-risk or breached state is clearly indicated.

**Priority:** Medium
**Source:** FR 6.25.4 (SLA Management — real-time SLA tracking)

---

## WFE-12: Complete workflow audit trail

**User story:** As a Company/HR Admin, I want a complete audit trail of actions, approvals, escalations, and routing decisions, so that every workflow outcome is traceable and defensible.

**Acceptance criteria:**
- Given any workflow activity, when an action, approval, escalation, or routing decision occurs, then it is recorded in the audit trail with relevant details.
- Given I need to review a request, when I open its audit trail, then I can see the full chronological history of its processing.

**Priority:** High
**Source:** FR 6.25.5 (Audit)

---
