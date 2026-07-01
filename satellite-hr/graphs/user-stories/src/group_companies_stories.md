# Group Companies — User Stories

## GRP-01: Define a group-company relationship
- Role: Group Company Admin
- Story: As a Group Company Admin, I want to define a group-company relationship that links multiple related companies (subsidiaries, sister concerns, or affiliated entities), so that related legal entities can be represented and managed together in the platform.
- Priority: High
- Source: FR 6.3.1 (definition of group-company relationships with multiple related companies)

## GRP-02: Enable shared administration across related companies
- Role: Group Company Admin
- Story: As a Group Company Admin, I want to enable shared administrative scenarios across the related companies in a group, so that administration can be handled centrally for affiliated entities.
- Priority: High
- Source: FR 6.3.2 (shared administrative scenarios; subject to explicit authorization and auditability)

## GRP-03: Share locations across related companies
- Role: Group Company Admin
- Story: As a Group Company Admin, I want to share locations across related companies within the group, so that affiliated entities can reuse common physical locations without duplicating them.
- Priority: Medium
- Source: FR 6.3.2 (shared locations across related companies; subject to explicit authorization and auditability)

## GRP-04: Require explicit authorization for shared scenarios
- Role: Group Company Admin
- Story: As a Group Company Admin, I want shared administration and shared locations to require explicit authorization, so that cross-company sharing never happens implicitly or by default.
- Priority: High
- Source: FR 6.3.2 (subject to explicit authorization)

## GRP-05: Maintain auditability of shared scenarios
- Role: Group Company Admin
- Story: As a Group Company Admin, I want all shared administrative and shared-location activity to be auditable, so that cross-company actions can be traced and reviewed for accountability.
- Priority: High
- Source: FR 6.3.2 (auditability)

## GRP-06: Enable consolidated reporting and cross-company directory search
- Role: Group Company Admin
- Story: As a Group Company Admin, I want consolidated reporting and cross-company directory search across linked companies, so that I can view unified information spanning the related entities.
- Priority: High
- Source: FR 6.3.3 (consolidated reporting and cross-company directory search prerequisites)

## GRP-07: Grant explicit group-level roles for cross-company access
- Role: Group Company Admin
- Story: As a Group Company Admin, I want to grant explicit group-level roles to users, so that only appropriately privileged users can access cross-company reporting and directory features.
- Priority: High
- Source: FR 6.3.3 (users granted explicit group-level roles)

## GRP-08: Enforce security constraints on cross-company access
- Role: Platform Admin
- Story: As a Platform Admin, I want the system to enforce row-level security filters and maintain an audit trail for all cross-company access, so that group-company data access remains scoped and traceable.
- Priority: High
- Source: FR 6.3.3 (row-level security filters; audit trail for all cross-company access)

## GRP-09: Establish and govern group-company constructs across the portfolio
- Role: Portfolio Admin
- Story: As a Portfolio Admin, I want to establish which companies in my portfolio are linked into group-company constructs, so that related-entity relationships are governed at the portfolio level before shared scenarios are enabled.
- Priority: High
- Source: FR 6.3.1 (definition of group-company relationships); FR 6.3.2 (subject to explicit authorization)

## GRP-10: Participate in group-company shared scenarios as a member company
- Role: Company Admin
- Story: As a Company Admin of a member company, I want to see and consent to the shared administration and shared locations that apply to my company within a group-company construct, so that I retain visibility and control over cross-company access affecting my company.
- Priority: Medium
- Source: FR 6.3.2 (shared administrative scenarios and shared locations across related companies; explicit authorization and auditability)

## GRP-11: Search the cross-company directory within authorized scope
- Role: Employee (User)
- Story: As an Employee (User) with an explicit group-level role, I want to search the directory across the linked companies in my group, so that I can find colleagues in related entities without seeing data outside my authorization.
- Priority: Medium
- Source: FR 6.3.3 (cross-company directory search; explicit group-level roles; row-level security; audit trail)

## GRP-12: Maintain effective-dated group-company membership with history and integrity
- Role: Group Company Admin
- Story: As a Group Company Admin, I want group-company memberships to be persisted as effective-dated, tenant-scoped records with full history, so that when companies join or leave a group over time the relationship remains accurate and auditable at any point in time.
- Priority: Medium
- Source: FR 6.3.1 (L1 domain and data: effective-dated, tenant-scoped membership records with history and integrity constraints)

## GRP-13: Govern cross-company access and shared-scenario settings as versioned config
- Role: Portfolio Admin
- Story: As a Portfolio Admin, I want the cross-company access enablement, shared-administration, and shared-location authorizations to be governed as versioned, effective-dated configuration, so that these settings can be changed without code and their history is preserved.
- Priority: Medium
- Source: FR 6.3.3 (L2 config: cross-company access enablement as governed, versioned, effective-dated configuration); FR 6.3.2 (L2 config: shared-scenario authorizations)

## GRP-14: Evaluate cross-company access prerequisites via the Rules engine
- Role: Platform Admin
- Story: As a Platform Admin, I want the shared Rules engine to evaluate the cross-company access prerequisites from configuration as a decision, so that consolidated reporting and directory search are gated consistently by the platform runtime rather than per-feature code.
- Priority: High
- Source: FR 6.3.3 (L3 rules engine: evaluation of consolidated-reporting and directory-search prerequisites)

## GRP-15: Manage group-company constructs through a metadata-driven admin screen
- Role: Group Company Admin
- Story: As a Group Company Admin, I want a metadata-driven screen to create constructs, manage member companies, and configure shared scenarios, so that I can govern group-company relationships through the self-service UI without back-office intervention.
- Priority: Medium
- Source: FR 6.3.1 (L4 presentation: metadata-driven construct management screen); FR 6.3.2 (L4 presentation: shared-scenario configuration UI)

## GRP-16: Create a group-company structure with required attributes and auto-generated code
- Role: Platform Admin
- Story: As a Platform Admin, I want to create a group-company structure capturing its name, type, member companies, and group administrator, so that affiliated legal entities are formally represented with a unique identifier.
- Priority: High
- Source: GROUP-FR-001 (§3.3.1 group company definition); §4.2.4 GroupCompany entity; §8 GROUP_CREATED

## GRP-17: Select the group type from the supported enum
- Role: Platform Admin
- Story: As a Platform Admin, I want to classify each group as Holding, Sister, or JointVenture, so that the relationship semantics between member companies are explicit.
- Priority: Medium
- Source: GROUP-FR-003 (§3.3.1 group types); §4.2.4 (GroupType enum Holding/Sister/JointVenture)

## GRP-18: Require a parent company for Holding structures
- Role: Platform Admin
- Story: As a Platform Admin, I want the parent company to be captured for Holding-type groups, so that the parent-subsidiary hierarchy is unambiguous.
- Priority: Medium
- Source: GROUP-FR-001 (§3.3.1 parent company for holding company structures); §4.2.4 (ParentCompanyId conditional)

## GRP-19: Enforce the one-group-per-company constraint
- Role: Platform Admin
- Story: As a Platform Admin, I want a company to belong to only one group-company structure at a time, so that affiliation relationships remain unambiguous.
- Priority: High
- Source: GROUP-FR-002 (§3.3.1 a company can belong to only one group); §9 GROUP_001

## GRP-20: Restrict group membership to active companies with a minimum of two members
- Role: Platform Admin
- Story: As a Platform Admin, I want only active companies to be added to a group and require at least two members, so that groups represent valid, operational affiliated entities.
- Priority: High
- Source: GROUP-FR-002 (§3.3.1 group companies must be active companies); §4.2.4 (2+ active companies)

## GRP-21: Prevent circular references in group structures
- Role: Platform Admin
- Story: As a Platform Admin, I want the system to block circular ownership references, so that group hierarchies stay acyclic and valid.
- Priority: High
- Source: GROUP-FR-002 (§3.3.1 circular references not allowed: A owns B, B cannot own A); §9 GROUP_002

## GRP-22: Manage member companies of an owned group
- Role: Group Company Admin
- Story: As a Group Company Admin, I want to add and remove member companies within the group I administer, so that I can maintain the group composition without platform intervention.
- Priority: High
- Source: GROUP-FR-001 (§3.3.1 member companies); §4.2.5 GroupCompanyMember junction; §7.1 (Manage Group, Add/Remove Members)

## GRP-23: Share policy templates across group companies without auto-propagation
- Role: Group Company Admin
- Story: As a Group Company Admin, I want to share a policy from one company as a read-only template so each member company can create its own instance, so that standardization is enabled without overriding company-level control.
- Priority: Medium
- Source: GROUP-FR-005 (§3.3.2 shared policy templates: read-only template, per-company instance, no automatic propagation)

## GRP-24: Enforce the shared-location permission matrix
- Role: Group Company Admin
- Story: As a Group Company Admin, I want shared locations to follow a strict owner and referencing-company permission matrix, so that only the owning company controls a location while others reference it with approval.
- Priority: Medium
- Source: GROUP-FR-004 (§3.3.2 shared location permissions matrix)

## GRP-25: Produce consolidated group reporting outputs
- Role: Group Company Admin
- Story: As a Group Company Admin holding the Group Reporting Viewer role, I want consolidated reports across the group, so that I can view aggregated headcount, org structure, and leave/attendance for the affiliated entities.
- Priority: Medium
- Source: GROUP-FR-006 (§3.3.2 consolidated reporting for group companies; Group Reporting Viewer role)

## GRP-26: Restrict group creation and management by role
- Role: Platform Admin
- Story: As a Platform Admin, I want group creation restricted to Platform Admins and group management restricted to the owning Group Company Admin, so that RBAC for group-company structures is enforced.
- Priority: Medium
- Source: §7.1 (Group Company RBAC rows: Create Group, Manage Group, Add/Remove Members)
