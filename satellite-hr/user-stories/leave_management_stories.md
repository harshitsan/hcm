# Leave Management — User Stories

_Derived from SatelliteHR Phase I BRD — module "Leave Management". 11 user stories._

---

## LVE-01: Configure differentiated leave policies

**User story:** As a Company/HR Admin, I want to create leave policies that vary by employee type, group, jurisdiction, company, department, or location, so that leave entitlements reflect the correct rules for each population of employees.

**Acceptance criteria:**
- Given I am creating a leave policy, when I define its scope, then I can differentiate it by employee type, group, jurisdiction, company, department, or location.
- Given multiple policies exist, when an employee matches a policy's scope, then the applicable policy governs their leave.
- Given a policy is configured, when I save it, then it becomes available for assignment without code changes (configurable).

**Priority:** High
**Source:** FR 6.17.1 (configurable leave policies with differentiation)

---

## LVE-02: Define standard leave types

**User story:** As a Company/HR Admin, I want to configure the supported leave types (Privileged/Annual, Casual, Sick/Medical, Maternity, Paternity, Bereavement, Comp-off), so that employees can request leave under the correct category.

**Acceptance criteria:**
- Given I am setting up leave, when I add leave types, then I can configure Privileged/Annual, Casual, Sick/Medical, Maternity, Paternity, Bereavement, and Compensatory-off.
- Given a leave type is configured, when an employee applies for leave, then they can select from the available leave types.

**Priority:** High
**Source:** FR 6.17.2 (Leave Types)

---

## LVE-03: Apply for leave against a balance

**User story:** As an Employee, I want to submit a leave request of a given type for specific dates, so that my time off is recorded and routed for approval.

**Acceptance criteria:**
- Given I have an available balance, when I submit a leave request, then it is created and routed into the approval workflow.
- Given I select a leave type and dates, when I submit, then the request is associated with the correct leave type and my balance.

**Priority:** High
**Source:** FR 6.17.2, FR 6.17.3 (leave requests and workflows)

---

## LVE-04: Sequential and parallel approval workflows

**User story:** As a Company/HR Admin, I want to configure approval workflows with sequential and parallel approval levels, so that leave requests are approved by the right people in the right order.

**Acceptance criteria:**
- Given I am configuring a workflow, when I define approval levels, then I can set them as sequential or parallel.
- Given a leave request is submitted, when it enters the workflow, then it is routed according to the configured levels.
- Given a level is approved or rejected, when the workflow advances, then the next configured step is triggered accordingly.

**Priority:** High
**Source:** FR 6.17.3 (Approval Workflows — sequential and parallel, configurable levels)

---

## LVE-05: Delegate leave approvals

**User story:** As a Manager, I want to delegate my leave approval authority to another approver, so that requests continue to be processed when I am unavailable.

**Acceptance criteria:**
- Given I am a configured approver, when I set up a delegation, then leave approvals route to the delegate.
- Given a delegation is active, when a request awaits my action, then the delegate can approve or reject on my behalf.

**Priority:** Medium
**Source:** FR 6.17.3 (delegation)

---

## LVE-06: SLA-based escalation of approvals

**User story:** As a Company/HR Admin, I want leave approvals to escalate when an SLA is breached, so that pending requests are not stalled indefinitely.

**Acceptance criteria:**
- Given an approval SLA is configured, when an approver does not act within the SLA, then the request is escalated per the configuration.
- Given escalation occurs, when the request is reassigned, then the escalation is recorded in the request history.

**Priority:** Medium
**Source:** FR 6.17.3 (escalation based on SLA)

---

## LVE-07: Administrative override of leave rules and balances

**User story:** As a Company/HR Admin, I want to override any leave rule or balance with a mandatory reason, so that I can handle exceptions while keeping the system consistent.

**Acceptance criteria:**
- Given a leave rule or balance, when I perform an override, then I am required to enter a reason before the override is saved.
- Given no reason is provided, when I attempt to save the override, then the system prevents the action.
- Given an override is applied, when it takes effect, then the affected rule or balance reflects the change.

**Priority:** High
**Source:** FR 6.17.4 (Administrative Override with mandatory reason)

---

## LVE-08: Full audit trail for overrides

**User story:** As a Company/HR Admin, I want every leave override to be captured in a full audit trail, so that exceptional actions are traceable and accountable.

**Acceptance criteria:**
- Given an override is performed, when it is saved, then the audit trail records the actor, reason, timestamp, and the change made.
- Given I review the audit trail, when I open an overridden record, then the override history is visible.

**Priority:** High
**Source:** FR 6.17.4 (full audit trail)

---

## LVE-09: Personal leave calendar for employees

**User story:** As an Employee, I want a personal leave calendar, so that I can see my booked and pending leave at a glance.

**Acceptance criteria:**
- Given I have leave records, when I open my personal calendar, then my approved and pending leave is displayed.

**Priority:** Medium
**Source:** FR 6.17.5 (Leave Calendar Views — personal calendar)

---

## LVE-10: Team and company calendars with coverage metrics

**User story:** As a Manager, I want a team leave calendar, and as an HR Admin a company-wide calendar with coverage metrics, so that we can manage staffing and availability.

**Acceptance criteria:**
- Given I am a manager, when I open the team calendar, then I can see leave for my team members.
- Given I am an HR Admin, when I open the company-wide calendar, then I can see organization-wide leave along with coverage metrics.

**Priority:** Medium
**Source:** FR 6.17.5 (team calendar for managers, company-wide calendar with coverage metrics)

---

## LVE-11: Report on leave balances, rules, and entitlements

**User story:** As a Company/HR Admin, I want to report on leave balances, rules, and entitlements, so that I can analyze leave data and support decision-making and compliance.

**Acceptance criteria:**
- Given leave data exists, when I run a report, then I can view leave balances, rules, and entitlements.
- Given a report is generated, when I filter it, then results reflect the selected scope (e.g., by employee or policy).

**Priority:** Medium
**Source:** FR 6.17.6 (leave balances, rules, and entitlements shall be reportable)
