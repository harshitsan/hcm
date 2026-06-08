# Candidate — User Stories
> A Candidate is a prospective hire managed inside the Talent Acquisition module *before* conversion to an employee (BRD §5.8, §6.13). They are not a User, an Employee, or a Contractor — they have no access to company HR data. Their authority is limited entirely to their own candidacy, and what they care about most is getting through the hiring pipeline cleanly: a tracked application, scheduled interviews, and a clear offer they can accept or decline.

## Scope & access
- **Authority level: self (own candidacy only).** A Candidate exists as a record in one company's Talent Acquisition pipeline against a specific job requisition. They are explicitly distinct from User, Employee, and Contractor (BRD §1, §5.10, §7.1).
- **What a Candidate CAN do (within their own candidacy):**
  - Be sourced into / added to the talent pool against a job requisition (BRD §6.13.2).
  - Have an application and resume kept on file as Candidate-scoped documents/attachments (BRD §6.13.2, §6.22.1).
  - Track their own application status as it moves through screening, interviews, reference checks, and offer (BRD §6.13.2, §6.13.6).
  - Participate in interviews scheduled via calendar integration (BRD §6.13.3).
  - Provide reference contacts and supporting documents for reference checks (BRD §6.13.4).
  - Receive an offer (configurable offer letter) electronically and accept or decline it (BRD §6.13.5).
  - Accept or decline their offer; **on acceptance, the system/HR workflow** hands the candidacy to onboarding — the company-specific Employee record is created by that downstream system/HR step, **not by the candidate** (BRD §6.13.7, §6.15.1).
- **What a Candidate CANNOT do (boundaries):**
  - Access any employee directory, org chart, leave, attendance, payroll, policies, or any other company HR data — they are not a User and hold no company role (BRD §6.21, §7.1, FS §7.2).
  - View or act on other candidates, requisitions, scorecards, or internal evaluation notes — interview scorecards and panel feedback are internal to recruiters/panel (BRD §6.13.3).
  - Cross tenant boundaries: a Candidate record is scoped to exactly one company; nothing they do is visible to or shared with any other company (BRD §7.15, FS §7.2).
  - Self-provision a login with HR privileges, create requisitions, or change their own pipeline status — status is owned by recruiters/hiring managers (BRD §6.13.1, §6.13.6).
  - Use external job-board apply, e-signature, or AI matching — see Notes & Phase 2 (BRD §3.3).

## User stories

### Sourcing & application (Talent Acquisition — Talent Pool)
- **US-CAND-01** — As a candidate, I want to be added to the talent pool against a specific job requisition, so that my interest in a defined role is captured and tracked. (BRD §6.13.2)
- **US-CAND-02** — As a candidate, I want to submit my application details for a requisition, so that the hiring team has the information needed to evaluate me. (BRD §6.13.2)
- **US-CAND-03** — As a candidate, I want my resume stored on file against my candidacy, so that recruiters and the panel can review it throughout the process. (BRD §6.13.2, §6.22.1)
  - **Acceptance criteria:**
    - Given I submit a resume in a supported format (PDF, DOC/DOCX) within the 2 MB limit, when it is uploaded, then it is stored as a Candidate-scoped document with metadata (name, upload date, uploaded by) and attached to my candidacy. (BRD §6.22.2, §6.22.3)
    - Given my resume is on file, when a recruiter or panel member with rights views my candidacy, then they can open it, but no user from any other company can access it. (BRD §6.22.4, §7.15)
    - Given a file exceeds 2 MB or is an unsupported format, when I attempt to upload, then the upload is rejected with a clear validation message. (BRD §6.22.2)
- **US-CAND-04** — As a candidate, I want to upload supporting documents (certificates, IDs, portfolio) to my candidacy, so that I can provide everything the role requires in one place. (BRD §6.22.1)
- **US-CAND-05** — As a candidate, I want confirmation that my application was received, so that I know I am in the pipeline and not lost. (BRD §6.27.2)

### Application status tracking
- **US-CAND-06** — As a candidate, I want to see the current status of my application (e.g., applied, screening, interview, reference check, offer), so that I always know where I stand. (BRD §6.13.2, §6.13.6)
  - **Acceptance criteria:**
    - Given my candidacy advances through a hiring-workflow stage, when the recruiter updates the stage, then my visible status reflects the new stage. (BRD §6.13.6)
    - Given I view my status, when I look at the record, then I see only my own application and never any other candidate's status or internal scorecards. (BRD §6.13.3, §7.15)
    - Given my application is rejected, when the decision is recorded, then I am notified of the outcome and my record is retained per the rejected-candidate retention policy (1 year). (BRD §8.7.1, §6.27.2)
- **US-CAND-07** — As a candidate, I want to be notified by email when my status changes, so that I do not have to keep checking manually. (BRD §6.27.2)
- **US-CAND-08** — As a candidate, I want a clear outcome if I am not selected, so that I have closure and understand the process ended. (BRD §6.13.6, §6.27.2)

### Interview scheduling & participation
- **US-CAND-09** — As a candidate, I want to receive interview invitations with date, time, and joining details, so that I can attend the right interview at the right time. (BRD §6.13.3)
  - **Acceptance criteria:**
    - Given the recruiter schedules an interview with calendar integration, when the slot is set, then I receive an email invitation containing the date, time, and interview details. (BRD §6.13.3, §6.27.2)
    - Given an interview is rescheduled, when the change is saved, then I receive an updated invitation and my prior slot is superseded. (BRD §6.13.3, §6.27.2)
- **US-CAND-10** — As a candidate, I want to confirm or indicate availability for a proposed interview slot, so that interviews are arranged at a workable time. (BRD §6.13.3)
- **US-CAND-11** — As a candidate, I want to participate in scheduled interviews with the panel, so that I can demonstrate my suitability for the role. (BRD §6.13.3)
- **US-CAND-12** — As a candidate, I want reminders ahead of a scheduled interview, so that I do not miss it. (BRD §6.27.2, §6.27.3)

### Reference checks
- **US-CAND-13** — As a candidate, I want to provide reference contact details when requested, so that the hiring team can complete reference checks. (BRD §6.13.4)
- **US-CAND-14** — As a candidate, I want to upload any documents needed to support reference checks, so that verification can proceed without delay. (BRD §6.13.4, §6.22.1)
- **US-CAND-15** — As a candidate, I want assurance that reference feedback collected about me is restricted to authorized hiring staff, so that my information is handled confidentially. (BRD §6.13.4, §6.22.4)

### Offer (receive, review, accept/decline)
- **US-CAND-16** — As a candidate, I want to receive my offer letter electronically, so that I can review the role and terms without waiting for paper. (BRD §6.13.5)
  - **Acceptance criteria:**
    - Given the hiring team completes the offer approval workflow, when the offer is distributed, then I receive the generated offer letter (from a configurable template) via electronic distribution. (BRD §6.13.5)
    - Given I receive the offer, when I open it, then I can view its full content as a document on my candidacy. (BRD §6.13.5, §6.22.1)
- **US-CAND-17** — As a candidate, I want to review the offer details before responding, so that I can make an informed decision. (BRD §6.13.5)
- **US-CAND-18** — As a candidate, I want to accept my offer, so that I can confirm I am joining and move toward onboarding. (BRD §6.13.5, §6.13.7)
  - **Acceptance criteria:**
    - Given I have a pending offer, when I accept it, then my acceptance is recorded with a timestamp and the offer status changes to Accepted. (BRD §6.13.5)
    - Given I accept the offer, when acceptance is recorded, then the system triggers a seamless handoff to the onboarding module. (BRD §6.13.7, §6.15.1)
    - Given my acceptance is recorded, when the HR/system conversion runs (a downstream system action, not a candidate action), then an Employee record is created for me while my candidacy is preserved as the source record. (BRD §6.13.7, §6.9.1, §7.4)
- **US-CAND-19** — As a candidate, I want to decline my offer, so that I can opt out cleanly if the role is not right for me. (BRD §6.13.5)
  - **Acceptance criteria:**
    - Given I have a pending offer, when I decline it, then the offer status changes to Declined and the hiring team is notified. (BRD §6.13.5, §6.27.2)
    - Given I decline, when the decision is recorded, then no Employee record is created and no onboarding is initiated for me. (BRD §6.13.7)
- **US-CAND-20** — As a candidate, I want confirmation once my acceptance or decline is recorded, so that I know my response was received. (BRD §6.27.2)

### Conversion & handoff to onboarding
- **US-CAND-21** — As a candidate, I want my application and documents carried forward into onboarding when I accept, so that I do not have to re-submit information I already provided. (BRD §6.13.7, §6.15.1)
  - **Acceptance criteria:**
    - Given my offer is accepted, when conversion completes, then my on-file documents (resume, supporting files) are available to the onboarding process for the new Employee record. (BRD §6.13.7, §6.22.1)
    - Given conversion creates my Employee record, when onboarding begins, then the mandatory onboarding stage "Offer Acceptance" is already satisfied. (BRD §6.15.1)
- **US-CAND-22** — As a candidate, I want confirmation that my onboarding has started once I accept, so that I know the next steps are underway. *(Company-side onboarding setup — document verification, asset assignment, induction — is owned by HR; see Company HR Admin US-HR-29.)* (BRD §6.15.1)
- **US-CAND-23** — As a candidate, I want my candidacy record retained appropriately after the process ends, so that data handling follows policy whether I am hired, rejected, or go inactive. (BRD §8.7.1)

### Privacy, isolation & communications
- **US-CAND-24** — As a candidate, I want all my candidacy data confined to the single company I applied to, so that my information is never exposed to other tenants on the platform. (BRD §7.15, FS §7.2)
  - **Acceptance criteria:**
    - Given I am a candidate for Company A, when any user from Company B searches or browses, then my record and documents are completely invisible to them. (BRD §7.15, FS §7.2)
    - Given any access to my candidacy occurs, when an authorized recruiter or panel member views it, then the access remains within Company A's tenant boundary. (FS §7.2)
- **US-CAND-25** — As a candidate, I want to receive process communications by email, so that I stay informed at each step without needing a system login. (BRD §6.27.1, §6.27.2)
- **US-CAND-26** — As a candidate, I want assurance that my personal data (IDs, contact details) is stored securely and encrypted, so that my privacy is protected during hiring. (BRD §6.22.4, §8.6.2)
- **US-CAND-27** — As a candidate, I want to know I am not granted access to internal company HR systems during candidacy, so that my role boundary is clear and the company's data stays protected. (BRD §7.1, §5.10)

## Primary journeys

**Journey 1 — From sourced to applied**
1. A recruiter sources me into the talent pool against a specific job requisition. (US-CAND-01)
2. I submit my application details and upload my resume and supporting documents. (US-CAND-02, US-CAND-03, US-CAND-04)
3. I receive an email confirming my application was received and that I am in the pipeline. (US-CAND-05)

**Journey 2 — Interviewing**
1. I receive an interview invitation with date, time, and joining details via email/calendar. (US-CAND-09)
2. I confirm my availability (or the slot is rescheduled and I get an updated invite). (US-CAND-10)
3. I receive a reminder, then attend and participate in the interview with the panel. (US-CAND-11, US-CAND-12)
4. I track my status as it advances through screening, interview, and reference-check stages. (US-CAND-06, US-CAND-07)

**Journey 3 — Reference checks**
1. When requested, I provide reference contact details. (US-CAND-13)
2. I upload any documents needed to support verification. (US-CAND-14)
3. Reference feedback is collected and handled confidentially by authorized hiring staff. (US-CAND-15)

**Journey 4 — Offer, acceptance, and conversion to onboarding**
1. I receive my offer letter electronically and review the terms. (US-CAND-16, US-CAND-17)
2. I accept the offer (or decline it). (US-CAND-18 / US-CAND-19)
3. On acceptance, the system hands me off to onboarding and creates my company-specific Employee record, carrying my documents forward. (US-CAND-21, US-CAND-22)
4. My onboarding begins with the "Offer Acceptance" stage already satisfied; I cease to be a candidate and become an employee. (US-CAND-22)

## Notes & Phase 2
- **Not yet available (out of scope for Phase 1 — do not promise to candidates):**
  - External job-board integrations (LinkedIn, Indeed, Naukri) — candidates cannot apply via external boards; sourcing is internal to the recruiter. (BRD §3.3)
  - Third-party recruitment agency integrations. (BRD §3.3)
  - Resume parsing from external sources — resumes are stored on file but not auto-parsed. (BRD §3.3)
  - AI-powered candidate matching or ranking — no automated suitability scoring of candidates. (BRD §3.3)
  - E-signature for documents/offers — offer acceptance is tracked (accept/decline with timestamp), but signing is not e-signed; distribution is electronic only. (BRD §3.3, §6.13.5)
  - OCR for documents. (BRD §3.3)
- **Phase 2 note on workforce type:** A Candidate may later become a Contractor in models where Vendors and Contractors apply, but contractor management, contractor onboarding/lifecycle, and contractor engagement models are **Phase 2**. Phase 1 conversion targets an Employee record only. (Phase II BRD §1, §6)
- **Cross-cutting dependencies the candidate experience relies on:**
  - **Workflow engine** — drives offer approval routing and the hiring workflow stages the candidate sees as status. (BRD §6.25, §6.13.6)
  - **Notifications & communications** — email is the candidate's primary (login-less) channel for confirmations, interview invites, reminders, and outcomes. (BRD §6.27)
  - **Documents & attachments** — Candidate is an explicitly supported entity for secure, role-scoped, encrypted storage. (BRD §6.22)
  - **Audit & logging** — candidacy actions and any access to the record are auditable within the tenant. (BRD §6.29, FS §7.2)
  - **RBAC & tenant isolation** — the candidate holds no company role and their record is confined to one company; conversion to an Employee record respects the User ≠ Employee ≠ Contractor separation. (BRD §6.12, §7.1, §7.15, FS §7.2)
