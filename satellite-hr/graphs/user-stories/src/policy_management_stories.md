# Policy Management — User Stories

## POL-01: Create and maintain HR and business policies
- Role: Company Admin
- Story: As a Company Admin, I want to create and maintain HR and business policies, so that the organization has a documented, authoritative set of policies to govern operations.
- Priority: High
- Source: FR 6.10.1 (creation and maintenance of HR and business policies)

## POL-02: Assign policies by organizational scope
- Role: Company Admin
- Story: As a Company Admin, I want to assign policies based on company, jurisdiction, location, department, group, and employment type, so that each policy applies only to the intended population.
- Priority: High
- Source: FR 6.10.1 (assignable by company, jurisdiction, location, department, group, employment type)

## POL-03: Assign policies by jurisdiction
- Role: Company Admin
- Story: As a Company Admin, I want to assign policies by jurisdiction, so that legal and regulatory requirements specific to each jurisdiction are correctly enforced.
- Priority: Medium
- Source: FR 6.10.1 (jurisdiction-based assignment)

## POL-04: Version policies
- Role: Company Admin
- Story: As a Company Admin, I want policies to support versioning, so that I can update policy content over time while preserving a history of prior versions.
- Priority: High
- Source: FR 6.10.2 (versioning)

## POL-05: Apply effective dating to policies
- Role: Company Admin
- Story: As a Company Admin, I want to set effective dates on policy versions, so that a policy takes effect at the correct time and superseded versions are applied only for their valid periods.
- Priority: High
- Source: FR 6.10.2 (effective dating)

## POL-06: Differentiate applicability for employees and contractors
- Role: Company Admin
- Story: As a Company Admin, I want policies to have different applicability for employees and contractors, so that each worker type is governed by the rules appropriate to their engagement.
- Priority: Medium
- Source: FR 6.10.2 (different applicability for employees and contractors)

## POL-07: Integrate policies with operational modules
- Role: Company Admin
- Story: As a Company Admin, I want policies to integrate with the leave, attendance, onboarding, probation, performance, exit, and asset management modules, so that policy rules are consistently enforced across HR processes.
- Priority: High
- Source: FR 6.10.3 (integration with leave, attendance, onboarding, probation, performance, exit, asset management)

## POL-08: Role-controlled policy maintenance
- Role: Platform Admin
- Story: As a Platform Admin, I want policy maintenance to be role controlled, so that only authorized roles can create or modify policies.
- Priority: High
- Source: FR 6.10.4 (role-controlled maintenance)

## POL-09: Role-controlled policy visibility
- Role: Employee (User)
- Story: As an Employee (User), I want to see only the policies applicable to my role and scope, so that I view relevant policies without exposure to unrelated or restricted policies.
- Priority: Medium
- Source: FR 6.10.4 (role-controlled visibility)

## POL-10: Oversee policies across group companies
- Role: Portfolio Admin
- Story: As a Portfolio Admin, I want to view and govern policies across the group companies in my portfolio, so that policy standards are consistent and compliant across the whole portfolio.
- Priority: Medium
- Source: FR 6.10.1, FR 6.10.4 (company-scoped assignment; role-controlled maintenance)

## POL-11: Maintain policies for group companies
- Role: Group Company Admin
- Story: As a Group Company Admin, I want to create and maintain policies applicable to the companies within my group, so that group-level standards are enforced while respecting each company's scope.
- Priority: Medium
- Source: FR 6.10.1, FR 6.10.4 (group-based assignment; role-controlled maintenance)

## POL-12: Governance of non-user workers by applicable policies
- Role: Employee (Non-User)
- Story: As an Employee (Non-User), I want the policies scoped to my company, jurisdiction, location, department, group, and employment type to apply to me even though I have no system login, so that I am governed by the correct rules through HR-managed processes.
- Priority: Low
- Source: FR 6.10.1, FR 6.10.2, FR 6.10.4 (scoped applicability; employee/contractor differentiation; role control)

## POL-13: Assign policies by employment type
- Role: Company Admin
- Story: As a Company Admin, I want to assign policies specifically by employment type, so that full-time, part-time, contractor, and other engagement types receive the rules appropriate to them.
- Priority: Medium
- Source: FR 6.10.1 (employment-type assignment), FR 6.10.2 (employee/contractor differentiation)

## POL-14: Persist policies as effective-dated tenant-scoped records
- Role: Platform Admin
- Story: As a Platform Admin, I want policies and their versions persisted as effective-dated, tenant-scoped records with full history, so that every policy state is auditable and isolated per tenant.
- Priority: High
- Source: FR 6.10.2 (L1 domain/data: effective-dated bitemporal history), FR 6.10.1

## POL-15: Enforce policy data integrity and non-overlapping periods
- Role: Platform Admin
- Story: As a Platform Admin, I want the data model to enforce uniqueness and non-overlapping effective periods for policy versions, so that policy applicability is always deterministic and free of conflicting records.
- Priority: High
- Source: FR 6.10.2 (L1 data integrity: non-overlapping versions), FR 6.10.1

## POL-16: Govern policy applicability as versioned configuration
- Role: Company Admin
- Story: As a Company Admin, I want policy applicability rules maintained as governed, versioned configuration that the platform engines read, so that I can change who a policy applies to without code changes.
- Priority: High
- Source: FR 6.10.1, FR 6.10.2 (L2 config: versioned, effective-dated governed metadata)

## POL-17: Resolve applicable policy via rules engine precedence
- Role: Company Admin
- Story: As a Company Admin, I want the shared rules engine to deterministically resolve which policy applies when multiple scoped policies overlap, so that the most specific applicable policy is selected consistently.
- Priority: High
- Source: FR 6.10.1 (L3 rules engine: deterministic applicability resolution), FR 6.10.2

## POL-18: Notify affected population on policy changes
- Role: Employee (User)
- Story: As an Employee (User), I want to be notified when a policy applicable to me is published or becomes effective, so that I am aware of the rules that govern me.
- Priority: Medium
- Source: FR 6.10.2, FR 6.10.4 (L3 notification engine: policy change alerts)

## POL-19: Author policies via metadata-driven authoring screen
- Role: Company Admin
- Story: As a Company Admin, I want a metadata-driven policy authoring screen with a dynamic scoping form, so that I can create and scope policies through a guided self-service UI.
- Priority: Medium
- Source: FR 6.10.1 (L4 presentation: authoring UI), FR 6.10.4

## POL-20: Browse and search applicable policies in a self-service library
- Role: Employee (User)
- Story: As an Employee (User), I want a self-service policy library where I can browse and search the policies applicable to me, so that I can quickly find the rules relevant to my work.
- Priority: Medium
- Source: FR 6.10.4 (L4 presentation: self-service policy library, search/navigation)
