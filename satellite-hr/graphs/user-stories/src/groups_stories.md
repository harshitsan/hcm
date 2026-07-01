# Groups — User Stories

## GRP-01: Create global groups
- Role: Platform Admin
- Story: As a Platform Admin, I want to create global groups that are available across the entire platform, so that I can define standardized groupings that apply to all tenants for policy, eligibility, and security purposes.
- Priority: High
- Source: FR 6.6.1 (global groups created by HRMS Administrator)

## GRP-02: Create company-specific groups
- Role: Company Admin
- Story: As a Company Admin, I want to create groups scoped to my own company, so that I can group my company's employees and users independently of other tenants.
- Priority: High
- Source: FR 6.6.1 (company-specific groups)

## GRP-08: Create groups shared across companies in a group company
- Role: Group Company Admin
- Story: As a Group Company Admin, I want to create groups that span the companies within my group company, so that I can define groupings shared across the member companies I administer.
- Priority: Medium
- Source: FR 6.6.1 (global vs company-specific groups; group-company scope)

## GRP-03: Build hierarchical parent-child group structures
- Role: Company Admin
- Story: As a Company Admin, I want to arrange groups into parent-child hierarchies, so that I can model organizational and policy groupings that reflect nested relationships.
- Priority: Medium
- Source: FR 6.6.2 (hierarchical parent-child structures)

## GRP-04: Support n-level group nesting
- Role: Company Admin
- Story: As a Company Admin, I want group hierarchies to support unlimited (n-level) nesting, so that I can represent deep organizational structures without depth restrictions.
- Priority: Medium
- Source: FR 6.6.2 (n-level nesting)

## GRP-09: Edit and delete groups and reparent hierarchies
- Role: Company Admin
- Story: As a Company Admin, I want to rename, move, and delete groups, so that I can maintain the group structure as the organization changes.
- Priority: Medium
- Source: FR 6.6.1, FR 6.6.2, FR 6.6.4 (group lifecycle within scope)

## GRP-05: Assign employees to multiple groups
- Role: Company Admin
- Story: As a Company Admin, I want to assign an employee to more than one group, so that a single employee can be covered by multiple groupings simultaneously.
- Priority: High
- Source: FR 6.6.3 (employees may belong to multiple groups)

## GRP-10: Include non-user employees in groups
- Role: Employee (Non-User)
- Story: As a Company Admin, I want non-user employees (those without login accounts) to be assignable to groups, so that policy and eligibility groupings cover the entire workforce, not only employees who log in.
- Priority: Medium
- Source: FR 6.6.3 (employees may belong to multiple groups)

## GRP-06: Associate users with groups
- Role: Company Admin
- Story: As a Company Admin, I want to associate users with groups where required, so that group-based security and access can be applied to users, not only employees.
- Priority: Medium
- Source: FR 6.6.3 (users may be associated with groups where required)

## GRP-11: View my own group memberships
- Role: Employee (User)
- Story: As an Employee (User), I want to view the groups I belong to, so that I can understand which groupings and policies apply to me.
- Priority: Low
- Source: FR 6.6.3 (employees may belong to multiple groups)

## GRP-07: Use groups as policy applicability criteria
- Role: Company Admin
- Story: As a Company Admin, I want to select groups as applicability criteria when defining policies, so that policies apply to the members of the chosen groups.
- Priority: High
- Source: FR 6.6.4 (groups available as policy applicability criteria)

## GRP-12: Govern group usage and scope across the portfolio
- Role: Portfolio Admin
- Story: As a Portfolio Admin, I want visibility and governance over how global and company groups are used across the companies in my portfolio, so that grouping remains consistent for policy, eligibility, and security.
- Priority: Medium
- Source: FR 6.6.1, FR 6.6.4 (group scope and policy applicability governance)

## GRP-13: Preserve effective-dated group membership history
- Role: Company Admin
- Story: As a Company Admin, I want group memberships to be effective-dated and their history retained, so that policies and eligibility can be evaluated correctly as of any point in time.
- Priority: Medium
- Source: FR 6.6.3 (L1 domain/data; effective-dated membership history)

## GRP-14: Enforce tenant-scoped isolation for groups
- Role: Platform Admin
- Story: As a Platform Admin, I want group data to be tenant-scoped and isolated at the persistence layer, so that company-specific groups and memberships never leak across tenants while global groups remain readable everywhere.
- Priority: High
- Source: FR 6.6.1, FR 6.6.3 (L1 domain/data; tenant-scoped RLS and integrity)

## GRP-15: Manage groups as governed versioned config consumed by engines
- Role: Portfolio Admin
- Story: As a Portfolio Admin, I want group definitions and hierarchies to be governed, versioned, effective-dated configuration that the shared engines read, so that grouping changes take effect without code and remain auditable.
- Priority: Medium
- Source: FR 6.6.4 (L2 config/metadata; groups as versioned governed config)

## GRP-16: Resolve group-based applicability through the rules engine
- Role: Employee (User)
- Story: As an Employee (User), I want the rules engine to correctly resolve my group memberships (including nested groups) when it evaluates policy applicability, so that the right policies apply to me automatically.
- Priority: High
- Source: FR 6.6.4 (L3 engine; rules/eligibility resolution of group membership)

## GRP-17: Manage groups through a tree-based self-service screen
- Role: Company Admin
- Story: As a Company Admin, I want a metadata-driven screen to navigate, search, and edit the group hierarchy and memberships, so that I can maintain groups efficiently without technical help.
- Priority: Medium
- Source: FR 6.6.2 (L4 presentation; group hierarchy and membership management UI)
