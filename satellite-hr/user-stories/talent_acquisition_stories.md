# Talent Acquisition — User Stories

_Derived from SatelliteHR Phase I BRD — module "Talent Acquisition". 13 user stories._

---

## TA-01: Create job requisitions

**User story:** As a Company/HR Admin, I want to create job requisitions with role details, so that open positions are formally captured and can move through the hiring pipeline.

**Acceptance criteria:**
- Given I have hiring permissions, when I create a new requisition, then the system saves it with its position details and an initial status.
- Given a requisition is saved, when I view the requisition list, then the new requisition appears with its current status.

**Priority:** High
**Source:** FR 6.13.1 (Job Requisitions — creation)

---

## TA-02: Requisition approval workflow

**User story:** As a Manager, I want to review and approve or reject submitted job requisitions, so that only authorized positions proceed to sourcing.

**Acceptance criteria:**
- Given a requisition is submitted for approval, when it reaches me as approver, then I can approve or reject it.
- Given I act on a requisition, when the decision is recorded, then the requisition status updates to reflect the outcome.

**Priority:** High
**Source:** FR 6.13.1 (Job Requisitions — approval workflows)

---

## TA-03: Track requisition status

**User story:** As a Company/HR Admin, I want to track the status of each job requisition, so that I always know where every open position stands in the pipeline.

**Acceptance criteria:**
- Given active requisitions exist, when I open the requisition dashboard, then each requisition shows its current status.
- Given a requisition progresses, when its stage changes, then the status is updated accordingly.

**Priority:** Medium
**Source:** FR 6.13.1 (Job Requisitions — status tracking)

---

## TA-04: Assign requisitions to recruiters and hiring managers

**User story:** As a Company/HR Admin, I want to assign requisitions to recruiters and hiring managers, so that ownership of each hiring effort is clearly defined.

**Acceptance criteria:**
- Given a requisition, when I assign a recruiter and hiring manager, then the assignment is saved against the requisition.
- Given an assignment exists, when the assignee views their workload, then the assigned requisition appears for them.

**Priority:** Medium
**Source:** FR 6.13.1 (Job Requisitions — assignment to recruiters and hiring managers)

---

## TA-05: Source and manage candidates in the talent pool

**User story:** As a Company/HR Admin, I want to source candidates into a talent pool, so that potential applicants are captured and available for open requisitions.

**Acceptance criteria:**
- Given I am sourcing candidates, when I add a candidate to the talent pool, then the candidate record is stored and retrievable.
- Given candidates exist in the pool, when I search the pool, then I can find matching candidates.

**Priority:** High
**Source:** FR 6.13.2 (Talent Pool Management — candidate sourcing)

---

## TA-06: Track candidate applications and resumes

**User story:** As a Company/HR Admin, I want to track candidate applications, store resumes, and update application status, so that I can manage each applicant's progress against a requisition.

**Acceptance criteria:**
- Given a candidate applies, when I record the application, then the application is linked to the candidate with the resume stored.
- Given an application is in progress, when I update its status, then the new status is reflected in the application tracking view.

**Priority:** High
**Source:** FR 6.13.2 (Talent Pool Management — application tracking, resume storage, status tracking)

---

## TA-07: Define interview panels

**User story:** As a Company/HR Admin, I want to define interview panels for a requisition, so that the right evaluators are assigned to assess candidates.

**Acceptance criteria:**
- Given a requisition needs interviews, when I define an interview panel, then the selected panel members are saved for that hiring process.
- Given a panel is defined, when scheduling an interview, then panel members are available to be selected.

**Priority:** Medium
**Source:** FR 6.13.3 (Interview Management — interview panel definition)

---

## TA-08: Schedule interviews with calendar integration

**User story:** As a Company/HR Admin, I want to schedule interviews with calendar integration, so that candidates and panel members have coordinated interview times.

**Acceptance criteria:**
- Given a panel and candidate are ready, when I schedule an interview, then the interview is booked and reflected via calendar integration.
- Given an interview is scheduled, when panel members check their calendar, then the interview appears at the scheduled time.

**Priority:** Medium
**Source:** FR 6.13.3 (Interview Management — scheduling with calendar integration)

---

## TA-09: Evaluate candidates with structured scorecards

**User story:** As an Interview Panel Member, I want to record evaluations using structured scorecards with configurable criteria, so that candidate assessments are consistent and comparable.

**Acceptance criteria:**
- Given I am on an interview panel, when I complete a scorecard, then my evaluation is captured against the configured criteria.
- Given evaluation criteria need to change, when an admin configures the scorecard criteria, then subsequent interviews use the updated criteria.

**Priority:** Medium
**Source:** FR 6.13.3 (Interview Management — structured scorecards with configurable evaluation criteria)

---

## TA-10: Track reference checks

**User story:** As a Company/HR Admin, I want to track and document reference feedback for candidates, so that reference outcomes are recorded as part of the hiring decision.

**Acceptance criteria:**
- Given a candidate is in the hiring process, when I record reference feedback, then the feedback is documented against the candidate.
- Given reference checks are recorded, when I review the candidate, then the reference feedback is visible.

**Priority:** Medium
**Source:** FR 6.13.4 (Reference Checks — tracking and documentation of reference feedback)

---

## TA-11: Manage offers with templates and approvals

**User story:** As a Company/HR Admin, I want to generate offer letters from configurable templates and route them through approval, so that offers are consistent and authorized before distribution.

**Acceptance criteria:**
- Given a candidate is selected, when I generate an offer from a configurable template, then the offer letter is produced using that template.
- Given an offer requires approval, when it is submitted, then it follows the approval workflow before it can be sent.

**Priority:** High
**Source:** FR 6.13.5 (Offer Management — configurable templates, approval workflows)

---

## TA-12: Distribute offers and track candidate response

**User story:** As a Candidate, I want to receive an offer electronically and accept or reject it, so that my hiring decision is recorded promptly.

**Acceptance criteria:**
- Given an approved offer, when it is distributed electronically, then I receive the offer.
- Given I respond to the offer, when I accept or reject it, then the acceptance/rejection is tracked in the system.

**Priority:** High
**Source:** FR 6.13.5 (Offer Management — acceptance/rejection tracking, electronic distribution)

---

## TA-13: Run end-to-end hiring workflow and convert candidate to employee

**User story:** As a Company/HR Admin, I want a comprehensive hiring workflow that carries a candidate from requisition through offer and hands off to onboarding on conversion, so that hiring flows seamlessly into employee onboarding.

**Acceptance criteria:**
- Given a hiring effort, when a candidate moves through requisition, sourcing, screening, interviews, reference checks, and offer, then the workflow tracks each stage in sequence.
- Given a candidate accepts an offer, when they are converted to an employee, then their information is handed off to the onboarding module without re-entry.

**Priority:** High
**Source:** FR 6.13.6, 6.13.7 (Hiring Workflows; Candidate Conversion — handoff to onboarding)

---
