# Announcements — User Stories

## ANN-01: Publish an announcement
- Role: Company Admin
- Story: As a Company Admin, I want to compose and publish organizational announcements targeted to a defined audience, so that relevant employees receive important messages through the system.
- Priority: High
- Source: FR 6.14.1

## ANN-02: Target announcements by company and jurisdiction
- Role: Company Admin
- Story: As a Company Admin, I want to target announcements by company and jurisdiction, so that messages reach only the legal and organizational entities they apply to.
- Priority: High
- Source: FR 6.14.1

## ANN-03: Target announcements by location and department
- Role: Company Admin
- Story: As a Company Admin, I want to target announcements by location and department, so that site- or team-specific messages reach the right people.
- Priority: High
- Source: FR 6.14.1

## ANN-04: Target announcements by group and workforce type
- Role: Company Admin
- Story: As a Company Admin, I want to target announcements by group and workforce type, so that messages relevant to specific employee cohorts (e.g. contractors vs. full-time) reach only those groups.
- Priority: Medium
- Source: FR 6.14.1

## ANN-05: Schedule an announcement for future publishing
- Role: Company Admin
- Story: As a Company Admin, I want to schedule an announcement to be published at a future date and time, so that messages go live at the right moment without manual intervention.
- Priority: Medium
- Source: FR 6.14.2

## ANN-06: Set an expiry for an announcement
- Role: Company Admin
- Story: As a Company Admin, I want to set an expiry date/time on an announcement, so that outdated messages are automatically removed from view.
- Priority: Medium
- Source: FR 6.14.2

## ANN-07: View relevant announcements as an employee
- Role: Employee (User)
- Story: As an Employee (User), I want to view the announcements relevant to me, so that I stay informed about organizational messages that apply to my context.
- Priority: High
- Source: FR 6.14.3

## ANN-08: Restrict announcement visibility to users with system access
- Role: Platform Admin
- Story: As a Platform Admin, I want the platform to expose announcements only to employees who have system access, so that messages are delivered securely to authenticated recipients.
- Priority: Medium
- Source: FR 6.14.3

## ANN-09: Publish platform-wide announcements across all companies
- Role: Platform Admin
- Story: As a Platform Admin, I want to publish announcements that span every company on the platform, so that global operational or policy messages reach all relevant employees regardless of company boundaries.
- Priority: Medium
- Source: FR 6.14.1

## ANN-10: Publish announcements across a portfolio
- Role: Portfolio Admin
- Story: As a Portfolio Admin, I want to publish announcements scoped to the companies within my portfolio, so that portfolio-level communications reach the right organizations without leaking to unrelated companies.
- Priority: Medium
- Source: FR 6.14.1

## ANN-11: Publish announcements across a group of companies
- Role: Group Company Admin
- Story: As a Group Company Admin, I want to publish announcements to companies within my group, so that group-wide messages reach all member companies while staying within my authorization boundary.
- Priority: Medium
- Source: FR 6.14.1

## ANN-12: Combine multiple targeting dimensions for precise audiences
- Role: Company Admin
- Story: As a Company Admin, I want to combine any of the six targeting dimensions (company, jurisdiction, location, department, group, workforce type) in a single announcement, so that I can reach a precisely defined audience.
- Priority: High
- Source: FR 6.14.1

## ANN-13: Non-user employees are excluded from in-system announcements
- Role: Employee (Non-User)
- Story: As an Employee (Non-User), I want the system to correctly recognize that I have no system access, so that announcements meant for system users are not exposed to me and I am not expected to retrieve them in-app.
- Priority: Low
- Source: FR 6.14.3

## ANN-14: Persist announcements with targeting and lifecycle in the canonical data model
- Role: Platform Admin
- Story: As a Platform Admin, I want each announcement stored as a canonical record capturing its content, its six targeting selectors, and its publish/expiry timestamps, so that the platform has a single durable source of truth for every message.
- Priority: High
- Source: FR 6.14.1, FR 6.14.2 (L1 data)

## ANN-15: Enforce tenant-scoped storage and isolation for announcements
- Role: Platform Admin
- Story: As a Platform Admin, I want announcement records to be tenant-scoped with row-level security, so that no announcement or its audience data can leak across company or tenant boundaries at the data layer.
- Priority: High
- Source: FR 6.14.1 (L1 RLS)

## ANN-16: Model publish and expiry as an effective-dated window with history
- Role: Platform Admin
- Story: As a Platform Admin, I want an announcement's schedule and expiry to define an effective-dated visibility window and every change retained as history, so that who-could-see-what-when is reconstructable.
- Priority: Medium
- Source: FR 6.14.2 (L1 effective-dating)

## ANN-17: Resolve targeting selectors from per-tenant governed org config
- Role: Company Admin
- Story: As a Company Admin, I want the announcement targeting selectors populated from the tenant's governed organization configuration, so that audiences reference current governed values without code changes.
- Priority: Medium
- Source: FR 6.14.1 (L2 config)

## ANN-18: Govern the Announcements module via per-tenant effective-dated config
- Role: Platform Admin
- Story: As a Platform Admin, I want the Announcements module enabled and governed per tenant through versioned, effective-dated configuration, so that its availability and behavior can be changed without code.
- Priority: Low
- Source: FR 6.14.1 (L2 config)

## ANN-19: Resolve reachable audience via the shared rules and matching engine
- Role: Platform Admin
- Story: As a Platform Admin, I want the shared rules engine to evaluate an announcement's targeting selectors against each employee's attributes, so that audience resolution is consistent, centralized, and reusable across modules.
- Priority: High
- Source: FR 6.14.1 (L3 engine)

## ANN-20: Automate publish and expiry transitions via the scheduling engine
- Role: Platform Admin
- Story: As a Platform Admin, I want the shared scheduling runtime to drive announcement publish and expiry state transitions, so that messages go live and retire automatically without manual action.
- Priority: Medium
- Source: FR 6.14.2 (L3 engine)

## ANN-21: Deliver and render announcements through the notification and template engine
- Role: Platform Admin
- Story: As a Platform Admin, I want announcements delivered and rendered through the shared notification/template engine to system-access recipients, so that rendering and delivery reuse the platform's generic runtime rather than module-specific code.
- Priority: Medium
- Source: FR 6.14.3 (L3 engine)

## ANN-22: Compose announcements through a metadata-driven authoring form
- Role: Company Admin
- Story: As a Company Admin, I want a metadata-driven compose screen with an audience picker plus scheduling and expiry controls, so that I can author and target announcements through a guided UI.
- Priority: Medium
- Source: FR 6.14.1 (L4 presentation)

## ANN-23: Browse relevant announcements in a self-service feed
- Role: Employee (User)
- Story: As an Employee (User), I want a self-service announcements feed where I can browse, search, and open messages relevant to me, so that I can consume communications through an easy UX.
- Priority: Medium
- Source: FR 6.14.3 (L4 presentation)
