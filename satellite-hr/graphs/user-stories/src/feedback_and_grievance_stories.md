# Feedback and Grievance — User Stories

## FBG-01: Submit a feedback or grievance entry
- Role: Employee (User)
- Story: As an Employee (User), I want to submit a feedback or grievance-related entry, so that my concern is formally captured and routed for role-based review.
- Priority: High
- Source: FR 6.19.1 (submission of feedback and grievance-related entries with role-based review)

## FBG-02: Role-based review of submitted entries
- Role: Company Admin
- Story: As a Company Admin, I want submitted feedback and grievance entries routed to me for review based on my role, so that the right authorized reviewer handles each entry.
- Priority: High
- Source: FR 6.19.1 (role-based review)

## FBG-03: Restrict access to grievance information
- Role: Company Admin
- Story: As a Company Admin, I want access to grievance-related information restricted to authorized personnel, so that sensitive concerns remain confidential.
- Priority: High
- Source: FR 6.19.2 (access restricted to authorized personnel)

## FBG-04: Track the status of an entry
- Role: Employee (User)
- Story: As an Employee (User), I want to track the status of my submitted feedback or grievance entry, so that I know how it is progressing.
- Priority: Medium
- Source: FR 6.19.3 (status tracking)

## FBG-05: Update status during review
- Role: Company Admin
- Story: As a Company Admin, I want to update the status of a feedback or grievance entry as I review it, so that its progress is accurately reflected.
- Priority: Medium
- Source: FR 6.19.3 (status tracking)

## FBG-06: Maintain an audit trail
- Role: Company Admin
- Story: As a Company Admin, I want the module to maintain an audit trail of feedback and grievance activity, so that actions on each entry are traceable and accountable.
- Priority: Medium
- Source: FR 6.19.3 (auditability)

## FBG-07: Scope module to Phase 1 needs
- Role: Platform Admin
- Story: As a Platform Admin, I want the module scoped to Phase 1 feedback and grievance tracking needs, so that current requirements are met while broader case-management is deferred to a future phase.
- Priority: Low
- Source: FR 6.19.4 (Phase 1 scope; case-management deferred to future phase)

## FBG-08: Submit an entry on behalf of a non-user employee
- Role: Company Admin
- Story: As a Company Admin, I want to submit a feedback or grievance-related entry on behalf of an Employee (Non-User), so that employees without system access can still have their concerns formally captured and reviewed.
- Priority: Medium
- Source: FR 6.19.1 (submission of feedback and grievance-related entries; Employee (Non-User) coverage)

## FBG-09: Scoped review and oversight across group companies
- Role: Group Company Admin
- Story: As a Group Company Admin, I want role-based review and access to feedback and grievance entries limited to the companies within my group, so that oversight respects organizational and confidentiality boundaries.
- Priority: Medium
- Source: FR 6.19.1, FR 6.19.2 (role-based review; access restricted to authorized personnel)

## FBG-10: Portfolio-level access and configuration
- Role: Portfolio Admin
- Story: As a Portfolio Admin, I want authorized, scope-limited access to feedback and grievance tracking across my portfolio, so that I can oversee the process and ensure the module is available and correctly restricted for each company.
- Priority: Low
- Source: FR 6.19.1, FR 6.19.2, FR 6.19.3 (role-based review; access restriction; auditability and status tracking)

## FBG-11: Confidential handling of my grievance
- Role: Employee (User)
- Story: As an Employee (User), I want my grievance-related information handled confidentially and shared only with authorized reviewers, so that I can raise sensitive concerns without exposure.
- Priority: High
- Source: FR 6.19.2 (access restricted to authorized personnel); FR 6.19.3 (status tracking)

## FBG-12: Canonical tenant-scoped data model with status history
- Role: Platform Admin
- Story: As a Platform Admin, I want feedback and grievance entries persisted in a canonical, tenant-scoped data model that retains full status history, so that records are isolated per tenant and their progression is reconstructable over time.
- Priority: Medium
- Source: FR 6.19.2, FR 6.19.3 (L1 domain + data: tenant-scoped persistence, status history, integrity)

## FBG-13: Enable and govern the module per tenant via config
- Role: Company Admin
- Story: As a Company Admin, I want the Feedback and Grievance module governed by per-tenant configuration, so that its availability and scope can be turned on or adjusted for my company without code changes.
- Priority: Low
- Source: FR 6.19.1, FR 6.19.4 (L2 config: per-tenant module toggle, versioned/effective-dated)

## FBG-14: Configure entry categories and submission form schema
- Role: Company Admin
- Story: As a Company Admin, I want to configure the categories and the submission form fields (including custom fields) for feedback and grievance entries, so that captured details match my company's needs without code changes.
- Priority: Low
- Source: FR 6.19.1 (L2 config: category and UDF/field schema definitions)

## FBG-15: Configure reviewer routing and access rules
- Role: Company Admin
- Story: As a Company Admin, I want to configure which roles review which entries and who may access grievance information, so that role-based review and access restriction are driven by governed configuration rather than hard-coded rules.
- Priority: Medium
- Source: FR 6.19.1, FR 6.19.2 (L2 config: approver graph and access rules)

## FBG-16: Workflow engine routes entries per configured graph
- Role: Company Admin
- Story: As a Company Admin, I want the shared workflow engine to route each submitted entry to reviewers according to the configured approver graph, so that role-based review is executed consistently by the engine.
- Priority: High
- Source: FR 6.19.1 (L3 engine: workflow/approval executes configured routing)

## FBG-17: Templated notifications on submission and status change
- Role: Employee (User)
- Story: As an Employee (User), I want the notification engine to send templated notifications when my entry is submitted and when its status changes, so that I and the reviewers stay informed without manual updates.
- Priority: Medium
- Source: FR 6.19.3 (L3 engine: notification/template on status change)

## FBG-18: Dynamic submission form rendered from configured schema
- Role: Employee (User)
- Story: As an Employee (User), I want the submission form to be rendered dynamically from the configured field schema, so that I only see the categories and fields my company has defined.
- Priority: Medium
- Source: FR 6.19.1 (L3 engine: forms/dynamic-fields renders configured schema)

## FBG-19: Reviewer worklist with search and filtering
- Role: Company Admin
- Story: As a Company Admin, I want a metadata-driven worklist screen to search, filter, and open the feedback and grievance entries assigned to me, so that I can efficiently manage my review queue.
- Priority: Medium
- Source: FR 6.19.1, FR 6.19.2, FR 6.19.3 (L4 presentation: worklist grid, search/navigation)
