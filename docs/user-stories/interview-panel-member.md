# Interview Panel Member — User Stories
> A colleague (typically an employee or hiring stakeholder) pulled into hiring to evaluate specific candidates. Their authority is narrow and assignment-scoped: they only see and act on the interviews and candidates they have been assigned to, schedule and conduct those interviews, and submit structured scorecards. They care most about a clear list of what they owe the hiring team, just enough candidate context to interview well, and a fast, fair way to record feedback.

## Scope & access
- **Authority level: self / assignment-scoped only.** A panel member acts within a single company context at a time and only on candidates and interviews explicitly assigned to them. They are not a recruiter, hiring manager, or HR admin (BRD §5.9).
- **What they CAN do:**
  - Receive and accept panel-membership and interview assignments for specific candidates (BRD §6.13.3).
  - Schedule, reschedule, and confirm their assigned interviews using calendar integration (BRD §6.13.3).
  - View the limited candidate information needed for the interview — resume/profile, the position and requisition context, prior-stage notes shared with them (BRD §6.13.2, §6.22).
  - Conduct the interview and submit a structured scorecard against the configurable evaluation criteria defined for the requisition/stage (BRD §6.13.3).
  - Provide and track reference-check feedback when assigned to do so (BRD §6.13.4).
  - See pending interview tasks, assignments, and acknowledgements in a unified inbox (BRD §6.27; Roadmap §5.2 "Home and My Inbox").
- **What they CANNOT do (explicit boundaries):**
  - Cannot create, approve, or manage job requisitions, or assign other panel members (recruiter/hiring-manager scope, BRD §6.13.1) — not in the FS RBAC matrix as an admin role (FS §7.1).
  - Cannot make, approve, or distribute offers, or convert a candidate to an employee (BRD §6.13.5–6.13.7).
  - Cannot view candidates, requisitions, or hiring data outside their own assignments; cannot browse the full talent pool (BRD §6.13.2).
  - Cannot access employee master data, leave/attendance, payroll, or company administration (User ≠ Employee ≠ Contractor; BRD §1, §7.1).
  - Cannot act across companies or switch into companies they are not authorized for; all access respects tenant isolation and is audited (BRD §7.15; FS §7.2).
  - Cannot edit scorecard criteria, alter another panelist's feedback, or change a candidate's stage/decision; respects candidate-data privacy controls (BRD §6.21.5, §6.29).

## User stories

### Inbox, assignments & panel membership (BRD §6.13.3, §6.27)
- **US-PANEL-01** — As an Interview Panel Member, I want to see all my pending interview tasks and assignments in one inbox, so that I know exactly what the hiring team needs from me without hunting through menus. (BRD §6.27; Roadmap §5.2)
  - **Acceptance criteria:**
    - Given I am assigned to interview a candidate, when I open Home / My Inbox, then I see the task with candidate name, position, interview stage, and any due date or SLA timer.
    - Given a task is overdue, when I view the inbox, then the item is visibly flagged (e.g., overdue badge).
    - Given a candidate or interview is not assigned to me, when I view my inbox, then it never appears.
- **US-PANEL-02** — As an Interview Panel Member, I want to be notified by email (and in-app where enabled) when I am added to a panel or assigned an interview, so that I can act promptly. (BRD §6.27.2)
  - **Acceptance criteria:**
    - Given a recruiter adds me to a candidate's panel, when the assignment is saved, then I receive an email notification referencing the candidate and position.
    - Given I have set notification preferences, when an assignment is created, then delivery respects my channel preferences (email always on).
- **US-PANEL-03** — As an Interview Panel Member, I want to acknowledge or accept an interview assignment, so that the recruiter knows I have seen it and will participate. (BRD §6.13.3, §6.25)
- **US-PANEL-04** — As an Interview Panel Member, I want to decline or flag a conflict on an assignment with a reason, so that the recruiter can reassign without delaying the candidate. (BRD §6.13.3, §6.25.5)
- **US-PANEL-05** — As an Interview Panel Member, I want to see which company context an assignment belongs to, so that I never act on the wrong tenant's candidate. (BRD §7.15; FS §7.2)
  - **Acceptance criteria:**
    - Given I am authorized in more than one company, when I open an assignment, then the active company is clearly displayed.
    - Given I attempt to open an assignment outside my authorized company, when the request is made, then access is denied and the attempt is audited (FS §7.2).

### Interview scheduling & calendar (BRD §6.13.3)
- **US-PANEL-06** — As an Interview Panel Member, I want to schedule an assigned interview using calendar integration, so that the candidate and I get a confirmed time without back-and-forth email. (BRD §6.13.3)
  - **Acceptance criteria:**
    - Given I have an assigned interview, when I pick a time slot, then a calendar invite/event is created for the interview.
    - Given a slot conflicts with an existing event, when I attempt to schedule, then I am warned of the conflict before confirming.
- **US-PANEL-07** — As an Interview Panel Member, I want to view my availability when proposing times, so that I only offer slots I can actually attend. (BRD §6.13.3)
- **US-PANEL-08** — As an Interview Panel Member, I want to reschedule or cancel an assigned interview with a reason, so that changes stay coordinated and recorded. (BRD §6.13.3, §6.29)
  - **Acceptance criteria:**
    - Given a scheduled interview, when I reschedule it, then the candidate and recruiter are notified and the calendar event is updated.
    - Given I cancel or reschedule, when the change is saved, then the action, actor, and timestamp are written to the audit trail.
- **US-PANEL-09** — As an Interview Panel Member, I want to receive reminders before a scheduled interview, so that I don't miss or arrive unprepared. (BRD §6.27.2)
- **US-PANEL-10** — As an Interview Panel Member, I want to confirm attendance for a scheduled interview, so that the recruiter knows the panel is ready to proceed. (BRD §6.13.3)

### Candidate context for the interview (BRD §6.13.2, §6.22)
- **US-PANEL-11** — As an Interview Panel Member, I want to view the assigned candidate's profile and application details, so that I have the context needed to interview them well. (BRD §6.13.2)
  - **Acceptance criteria:**
    - Given I am assigned to a candidate, when I open their profile, then I see name, the position/requisition being interviewed for, and application status relevant to my stage.
    - Given a candidate is not assigned to me, when I search or navigate, then I cannot view their record (BRD §6.13.2).
- **US-PANEL-12** — As an Interview Panel Member, I want to open the candidate's resume and attached documents, so that I can review their background before the interview. (BRD §6.22.1)
  - **Acceptance criteria:**
    - Given an assigned candidate has an attached resume, when I open documents, then I can view files I am permitted to see based on role and privacy policy (BRD §6.22.3, §6.21.5).
    - Given a document is restricted, when I attempt to open it, then access is denied per role-based access controls.
- **US-PANEL-13** — As an Interview Panel Member, I want to see the position and requisition context (department, location, role expectations), so that my evaluation is aligned to what the role requires. (BRD §6.8, §6.13.1)
- **US-PANEL-14** — As an Interview Panel Member, I want to see only the prior-stage notes that have been shared with me, so that I have helpful context without breaching candidate-data privacy. (BRD §6.13.3, §6.21.5)
  - **Acceptance criteria:**
    - Given prior interviewers' feedback exists, when I view the candidate, then I only see notes explicitly shared with my role/stage.
    - Given unshared evaluations exist, when I view the candidate, then those evaluations are not visible to me.
- **US-PANEL-15** — As an Interview Panel Member, I want sensitive candidate fields to be masked or excluded from my view, so that I only see what is relevant to interviewing. (BRD §6.21.5, §8.6)

### Conducting interviews & structured scorecards (BRD §6.13.3)
- **US-PANEL-16** — As an Interview Panel Member, I want to open the structured scorecard for my assigned interview, so that I evaluate against the criteria the hiring team defined. (BRD §6.13.3)
  - **Acceptance criteria:**
    - Given my interview has a configured scorecard, when I open it, then I see the evaluation criteria defined for that requisition/stage.
    - Given I am not the assigned interviewer, when I attempt to open the scorecard, then access is denied.
- **US-PANEL-17** — As an Interview Panel Member, I want to score each evaluation criterion using the configured scale, so that my feedback is consistent and comparable across candidates. (BRD §6.13.3)
  - **Acceptance criteria:**
    - Given the scorecard defines criteria with a rating scale, when I submit, then each required criterion must have a rating or the system blocks submission.
    - Given I provide ratings, when I save a draft, then my partial scorecard is preserved for me to complete later.
- **US-PANEL-18** — As an Interview Panel Member, I want to add written comments and an overall recommendation, so that I can justify my ratings beyond the numbers. (BRD §6.13.3)
- **US-PANEL-19** — As an Interview Panel Member, I want to submit my completed scorecard, so that the recruiter and hiring manager can use it in the decision. (BRD §6.13.3, §6.13.6)
  - **Acceptance criteria:**
    - Given a completed scorecard, when I submit it, then it is recorded against the candidate and my pending task is cleared from the inbox.
    - Given I have submitted, when I view my scorecard, then it is read-only to me afterward (edits require an authorized reopen).
    - Given the scorecard is submitted, when it is saved, then the submission is captured in the audit trail with actor and timestamp (BRD §6.29).
- **US-PANEL-20** — As an Interview Panel Member, I want to save a scorecard as a draft and return to finish it, so that I can capture notes during the interview and complete them afterward. (BRD §6.13.3)
- **US-PANEL-21** — As an Interview Panel Member, I want to see only my own scorecard and not edit other panelists' evaluations, so that each panelist's independent judgment is preserved. (BRD §6.13.3, §6.29)
- **US-PANEL-22** — As an Interview Panel Member, I want the scorecard criteria to reflect the configuration set for the role, so that I am never evaluating against the wrong rubric. (BRD §6.13.3, §6.26)

### Reference checks (BRD §6.13.4)
- **US-PANEL-23** — As an Interview Panel Member, I want to see reference-check tasks assigned to me for a candidate, so that I know I am responsible for collecting a reference. (BRD §6.13.4, §6.27)
- **US-PANEL-24** — As an Interview Panel Member, I want to record reference-check feedback in a structured form, so that the outcome is documented and traceable. (BRD §6.13.4)
  - **Acceptance criteria:**
    - Given I am assigned a reference check, when I submit feedback, then it is stored against the candidate and linked to my task.
    - Given the reference check is recorded, when it is saved, then the entry is auditable with actor and timestamp (BRD §6.29).
- **US-PANEL-25** — As an Interview Panel Member, I want to track the status of reference checks I am responsible for (pending, in progress, completed), so that nothing I own is left unfinished. (BRD §6.13.4)
- **US-PANEL-26** — As an Interview Panel Member, I want to attach supporting notes or documents to a reference check, so that the recruiter has the full context. (BRD §6.13.4, §6.22)

### Notifications, privacy & audit (BRD §6.27, §6.29, §8.6)
- **US-PANEL-27** — As an Interview Panel Member, I want to set my notification preferences for interview events, so that I get reminders the way I want them without being overloaded. (BRD §6.27.5)
- **US-PANEL-28** — As an Interview Panel Member, I want my own actions (scheduling, scorecard submission, reference feedback) to be recorded in the audit trail, so that the hiring process is transparent and defensible. (BRD §6.29.2)
  - **Acceptance criteria:**
    - Given I perform any panel action, when it completes, then the audit record captures action type, actor, timestamp, and the candidate/interview affected.
- **US-PANEL-29** — As an Interview Panel Member, I want any attempt to access candidates or interviews outside my assignments to be blocked and logged, so that candidate privacy and tenant isolation are protected. (FS §7.2; BRD §7.15)
- **US-PANEL-30** — As an Interview Panel Member, I want my access to a candidate to end when I am removed from the panel or the candidate is closed out, so that I retain no visibility beyond my active role. (BRD §6.13.3, §8.7)

## Primary journeys

1. **Accept and schedule an assigned interview**
   1. Receive email/in-app notification that I have been added to a candidate's panel.
   2. Open Home / My Inbox and see the new interview task with candidate, position, and stage.
   3. Acknowledge/accept the assignment (or decline with a reason if there is a conflict).
   4. Review my availability and propose a time using calendar integration; resolve any conflict warning.
   5. Confirm the slot; candidate and recruiter are notified and the calendar event is created.

2. **Conduct an interview and submit a scorecard**
   1. Before the interview, open the assigned candidate's profile, resume, and any shared prior-stage notes.
   2. Review the position/requisition context and the configured evaluation criteria.
   3. During the interview, save scorecard notes as a draft.
   4. After the interview, score each required criterion, add comments and an overall recommendation.
   5. Submit the scorecard; the task clears from my inbox and the submission is audited.

3. **Complete an assigned reference check**
   1. See the reference-check task in my inbox for an assigned candidate.
   2. Mark it in progress and contact the reference.
   3. Record structured reference feedback, attaching any supporting notes.
   4. Mark the reference check completed; status and entry are recorded and auditable.

4. **Reschedule when something changes**
   1. Open the scheduled interview from my inbox.
   2. Reschedule or cancel with a mandatory reason.
   3. Candidate and recruiter are notified, the calendar event updates, and the change is written to the audit trail.

## Notes & Phase 2
- **Phase 2 / out of scope for this role:**
  - **Mobile app:** conducting interviews, viewing assignments, and submitting scorecards from a native mobile app with push notifications is Phase 2 (BRD §3.2; Phase II BRD §"Mobile App"). Phase 1 is responsive web only (BRD §6.16.1).
  - **External integrations excluded in Phase 1:** no external job-board sourcing (LinkedIn/Indeed/Naukri), no third-party recruitment-agency integration, no resume parsing from external sources, and no AI candidate matching/ranking (BRD §3.3). E-signature on documents is also out of scope (BRD §3.3).
  - **Contractor hiring panels:** participating in panels for contractor engagements is governed by Phase 2 contractor/vendor scope and roles (Phase II BRD §1, §6.2–6.3); Phase 1 panel work is for employee hiring.
  - Optional in-app / Microsoft Teams / WhatsApp notification channels beyond mandatory email are configurable add-ons (BRD §6.27.1).
- **Cross-cutting dependencies (this role consumes, does not own):**
  - **Workflow engine (BRD §6.25):** routes panel/interview assignments, acknowledgements, reminders, SLAs, and escalations; the panel member is a participant, not a configurator.
  - **Notifications (BRD §6.27):** drives assignment alerts and interview reminders via email (mandatory) and optional channels.
  - **RBAC (BRD §6.12; FS §7.1):** confines the panel member to assigned candidates/interviews and blocks requisition, offer, conversion, and admin actions.
  - **Tenant isolation (BRD §7.15; FS §7.2):** every read/write is scoped to the authorized company; cross-company or unassigned access is denied and logged.
  - **Audit and logging (BRD §6.29):** scheduling, scorecard submission, and reference feedback are recorded with actor, action, and timestamp.
  - **Documents and Attachments (BRD §6.22) and Directory/privacy controls (BRD §6.21.5):** govern what candidate material the panel member may view.
