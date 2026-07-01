# Talent Acquisition — User Stories

## TA-01: Create job requisitions
- Role: Company Admin
- Story: As a Company Admin, I want to create job requisitions capturing full role details, so that open positions are formally captured and can move through the hiring pipeline.
- Priority: High
- Source: FR 6.13.1 (Job Requisitions — creation)

## TA-02: Requisition approval workflow
- Role: Company Admin
- Story: As a Company Admin, I want to review and approve or reject submitted job requisitions through a defined approval workflow, so that only authorized positions proceed to sourcing.
- Priority: High
- Source: FR 6.13.1 (Job Requisitions — approval workflows)

## TA-03: Track requisition status
- Role: Company Admin
- Story: As a Company Admin, I want to track the status of each job requisition across the pipeline, so that I always know where every open position stands.
- Priority: Medium
- Source: FR 6.13.1 (Job Requisitions — status tracking)

## TA-04: Assign requisitions to recruiters and hiring managers
- Role: Company Admin
- Story: As a Company Admin, I want to assign each requisition to a recruiter and a hiring manager, so that ownership of every hiring effort is clearly defined.
- Priority: Medium
- Source: FR 6.13.1 (Job Requisitions — assignment to recruiters and hiring managers)

## TA-05: Source and manage candidates in the talent pool
- Role: Company Admin
- Story: As a Company Admin, I want to source candidates into a talent pool, so that potential applicants are captured and available for open requisitions.
- Priority: High
- Source: FR 6.13.2 (Talent Pool Management — candidate sourcing)

## TA-06: Track candidate applications and resumes
- Role: Company Admin
- Story: As a Company Admin, I want to track candidate applications, store resumes, and update application status, so that I can manage each applicant's progress against a requisition.
- Priority: High
- Source: FR 6.13.2 (Talent Pool Management — application tracking, resume storage, status tracking)

## TA-07: Define interview panels
- Role: Company Admin
- Story: As a Company Admin, I want to define interview panels for a requisition, so that the right evaluators are assigned to assess candidates.
- Priority: Medium
- Source: FR 6.13.3 (Interview Management — interview panel definition)

## TA-08: Schedule interviews with calendar integration
- Role: Company Admin
- Story: As a Company Admin, I want to schedule interviews with calendar integration, so that candidates and panel members have coordinated interview times.
- Priority: Medium
- Source: FR 6.13.3 (Interview Management — scheduling with calendar integration)

## TA-09: Evaluate candidates with structured scorecards
- Role: Employee (User)
- Story: As an Employee (User) serving on an interview panel, I want to record evaluations using structured scorecards with configured criteria, so that candidate assessments are consistent and comparable.
- Priority: Medium
- Source: FR 6.13.3 (Interview Management — structured scorecards with configurable evaluation criteria)

## TA-10: Track reference checks
- Role: Company Admin
- Story: As a Company Admin, I want to track and document reference feedback for candidates, so that reference outcomes are recorded as part of the hiring decision.
- Priority: Medium
- Source: FR 6.13.4 (Reference Checks — tracking and documentation of reference feedback)

## TA-11: Generate offers from templates and route for approval
- Role: Company Admin
- Story: As a Company Admin, I want to generate offer letters from configurable templates and route them through approval, so that offers are consistent and authorized before distribution.
- Priority: High
- Source: FR 6.13.5 (Offer Management — configurable templates, approval workflows)

## TA-12: Receive offers electronically and record response
- Role: Employee (User)
- Story: As an Employee (User) who is a candidate, I want to receive an offer electronically and accept or reject it, so that my hiring decision is recorded promptly.
- Priority: High
- Source: FR 6.13.5 (Offer Management — acceptance/rejection tracking, electronic distribution)

## TA-13: Run end-to-end hiring workflow
- Role: Company Admin
- Story: As a Company Admin, I want a comprehensive hiring workflow that carries a candidate from requisition through sourcing, screening, interviews, reference checks, and offer, so that hiring progresses in an orderly, trackable sequence.
- Priority: High
- Source: FR 6.13.6 (Hiring Workflows — end-to-end requisition to offer)

## TA-14: Convert accepted candidate to employee with onboarding handoff
- Role: Company Admin
- Story: As a Company Admin, I want to convert a candidate who accepts an offer into an employee with a seamless handoff to onboarding, so that hiring flows into onboarding without re-entering data.
- Priority: High
- Source: FR 6.13.7 (Candidate Conversion — seamless handoff to onboarding); FR 6.13.6 (Hiring Workflows — conversion to employee)

## TA-15: Configure offer letter templates
- Role: Company Admin
- Story: As a Company Admin, I want to configure and maintain offer letter templates, so that offers are generated consistently with the correct content and merge fields.
- Priority: Medium
- Source: FR 6.13.5 (Offer Management — configurable offer letter templates)

## TA-16: Configure interview scorecard evaluation criteria
- Role: Company Admin
- Story: As a Company Admin, I want to configure the scorecard evaluation criteria, so that interview assessments are standardized and comparable across candidates.
- Priority: Medium
- Source: FR 6.13.3 (Interview Management — configurable evaluation criteria)

## TA-17: Screen candidates and make hiring recommendations as hiring manager
- Role: Employee (User)
- Story: As an Employee (User) acting as the hiring manager, I want to review applicants, resumes, and panel feedback for my requisitions, so that I can screen candidates and make informed hiring decisions.
- Priority: Medium
- Source: FR 6.13.1, FR 6.13.6 (Hiring Workflows — screening; hiring manager assignment)

## TA-18: Convert candidate to a non-user employee record
- Role: Company Admin
- Story: As a Company Admin, I want to convert a hired candidate into an Employee (Non-User) record when they will not have system access, so that their employment data is captured for onboarding and HR without provisioning a login.
- Priority: Low
- Source: FR 6.13.7 (Candidate Conversion — conversion to employee record)

## TA-19: Standardize talent acquisition policies across group companies
- Role: Group Company Admin
- Story: As a Group Company Admin, I want to define standardized requisition approval rules, offer templates, and evaluation criteria across the group's companies, so that hiring practices are consistent and governed centrally.
- Priority: Medium
- Source: FR 6.13.1, FR 6.13.3, FR 6.13.5 (governance across group companies)

## TA-20: Oversee hiring activity across the portfolio
- Role: Portfolio Admin
- Story: As a Portfolio Admin, I want cross-company visibility into talent acquisition activity and metrics, so that I can oversee hiring performance across the portfolio of companies I manage.
- Priority: Medium
- Source: FR 6.13.1, FR 6.13.6 (portfolio-level oversight and reporting)

## TA-21: Provision and configure the Talent Acquisition module
- Role: Platform Admin
- Story: As a Platform Admin, I want to enable and configure the Talent Acquisition module and its integrations for tenants, so that companies can run hiring workflows with the required capabilities available.
- Priority: Medium
- Source: FR 6.13 (module provisioning; calendar and onboarding integration enablement)

## TA-22: Maintain effective-dated history of requisition and candidate records
- Role: Company Admin
- Story: As a Company Admin, I want every requisition, candidate, application, and offer record to retain a complete effective-dated history, so that I can reconstruct the state of any hiring artifact as of any point in time.
- Priority: Medium
- Source: FR 6.13.1, FR 6.13.2 (L1 domain/data — bitemporal history & audit)

## TA-23: Enforce tenant-scoped isolation of talent acquisition data
- Role: Platform Admin
- Story: As a Platform Admin, I want all requisition, candidate, resume, and offer data to be strictly tenant-scoped with row-level security, so that no company can access another tenant's hiring data.
- Priority: High
- Source: FR 6.13 (L1 domain/data — tenant-scoped storage & RLS)

## TA-24: Enforce uniqueness and referential integrity across hiring records
- Role: Company Admin
- Story: As a Company Admin, I want the data model to enforce uniqueness and referential integrity across requisitions, candidates, applications, and offers, so that hiring data stays consistent and free of orphaned or duplicate records.
- Priority: Medium
- Source: FR 6.13.2 (L1 domain/data — uniqueness/integrity constraints)

## TA-25: Configure requisition and offer approver graphs
- Role: Company Admin
- Story: As a Company Admin, I want to configure the approver graph and routing rules for requisition and offer approvals as governed metadata, so that approval routing can change without code changes.
- Priority: High
- Source: FR 6.13.1, FR 6.13.5 (L2 config — approver graphs / decision tables)

## TA-26: Define custom fields for requisitions and candidates
- Role: Company Admin
- Story: As a Company Admin, I want to define custom/UDF field schemas for requisitions, candidates, and applications, so that we can capture tenant-specific hiring data without code changes.
- Priority: Medium
- Source: FR 6.13.1, FR 6.13.2 (L2 config — UDF/custom-field schemas)

## TA-27: Workflow engine executes configured hiring and approval workflows
- Role: Company Admin
- Story: As a Company Admin, I want the shared workflow engine to execute the configured hiring and approval workflows, so that routing, stage transitions, and escalations behave exactly as defined in config.
- Priority: High
- Source: FR 6.13.1, FR 6.13.6 (L3 engine — Workflow/Approval)

## TA-28: Rules engine evaluates hiring stage-gating and eligibility
- Role: Company Admin
- Story: As a Company Admin, I want the shared rules engine to evaluate stage-gating and eligibility decision tables, so that candidates only advance when configured conditions are met.
- Priority: Medium
- Source: FR 6.13.6 (L3 engine — Rules/decision tables)

## TA-29: Notification engine sends hiring event notifications from templates
- Role: Company Admin
- Story: As a Company Admin, I want the shared notification engine to send templated notifications on hiring events, so that candidates, recruiters, hiring managers, and approvers are kept informed automatically.
- Priority: Medium
- Source: FR 6.13.1, FR 6.13.5 (L3 engine — Notification/Template)

## TA-30: Dynamic forms engine renders configured hiring forms
- Role: Employee (User)
- Story: As an Employee (User) participating in hiring, I want requisition, application, and scorecard forms to be rendered dynamically from configured field and criteria metadata, so that I always see the correct fields and validations without waiting for a release.
- Priority: Medium
- Source: FR 6.13.3 (L3 engine — Forms/Dynamic-Fields)

## TA-31: Self-service candidate portal to apply and track status
- Role: Employee (User)
- Story: As an Employee (User) acting as a candidate, I want a self-service portal to apply, upload my resume, and track my application status, so that I can manage my candidacy through a clear, guided interface.
- Priority: Medium
- Source: FR 6.13.2, FR 6.13.5 (L4 presentation — self-service UX)

## TA-32: Metadata-driven recruiter pipeline board with search and navigation
- Role: Company Admin
- Story: As a Company Admin, I want a metadata-driven recruiter pipeline board with search, filtering, and navigation across requisitions and candidates, so that I can manage the hiring pipeline efficiently from the SPA.
- Priority: Medium
- Source: FR 6.13.2, FR 6.13.6 (L4 presentation — grids/search/navigation)
